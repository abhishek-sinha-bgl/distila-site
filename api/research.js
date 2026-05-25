/**
 * Epistamate /api/research
 * Serverless Groq proxy. Key stays server-side. Rate limited by IP.
 *
 * Contact: epistamate@proton.me
 */

// ─── Score recomputation ─────────────────────────────────────────────────────
// The LLM is asked to produce both confidence_score and score_breakdown, but
// frequently returns values that don't match. This function recomputes
// confidence_score deterministically from the breakdown so the formula
// displayed in the UI is always the authoritative source of truth.
//
// Formula: base(40) + source_tier_bonus + consensus_bonus + socratic_bonus
//          + status_adjustment + recency_decay + sufficiency_penalty
// Clamped to [5, 95].

const SCORE_BOUNDS = { min: 5, max: 95 };

// Allowed ranges per component — clamp LLM values that drift out of spec
const COMPONENT_BOUNDS = {
  base:               { min: 40,  max: 40  }, // always 40, non-negotiable
  source_tier_bonus:  { min: 0,   max: 20  },
  consensus_bonus:    { min: 0,   max: 15  },
  socratic_bonus:     { min: -10, max: 10  }, // negative if challenge failed
  status_adjustment:  { min: -20, max: 10  },
  recency_decay:      { min: -10, max: 0   },
  sufficiency_penalty:{ min: -8,  max: 0   },
};

function clampComponent(key, val) {
  const b = COMPONENT_BOUNDS[key];
  if (!b) return 0;
  const n = typeof val === 'number' && isFinite(val) ? val : 0;
  return Math.max(b.min, Math.min(b.max, Math.round(n)));
}

function recomputeScore(claim) {
  const sb = claim.score_breakdown || {};

  // Enforce base = 40 always
  const base               = 40;
  const source_tier_bonus  = clampComponent('source_tier_bonus',   sb.source_tier_bonus);
  const consensus_bonus    = clampComponent('consensus_bonus',      sb.consensus_bonus);
  const status_adjustment  = clampComponent('status_adjustment',    sb.status_adjustment);
  const recency_decay      = clampComponent('recency_decay',        sb.recency_decay);
  const sufficiency_penalty= clampComponent('sufficiency_penalty',  sb.sufficiency_penalty);

  // socratic_bonus: if the claim didn't survive challenge, force to 0 or negative
  let socratic_bonus = clampComponent('socratic_bonus', sb.socratic_bonus);
  if (claim.survived_challenge === false && socratic_bonus > 0) socratic_bonus = 0;

  const computed = base
    + source_tier_bonus
    + consensus_bonus
    + socratic_bonus
    + status_adjustment
    + recency_decay
    + sufficiency_penalty;

  const confidence_score = Math.max(
    SCORE_BOUNDS.min,
    Math.min(SCORE_BOUNDS.max, computed)
  );

  return {
    confidence_score,
    score_breakdown: {
      base,
      source_tier_bonus,
      consensus_bonus,
      socratic_bonus,
      status_adjustment,
      recency_decay,
      sufficiency_penalty,
    },
  };
}

function normaliseClaims(claims) {
  return claims.map(claim => {
    const { confidence_score, score_breakdown } = recomputeScore(claim);

    // Also derive status from recomputed score if LLM status seems misaligned
    // (keep LLM status — it's qualitative — but at least log the gap)
    return {
      ...claim,
      confidence_score,
      score_breakdown,
    };
  });
}

// ─── JSON extraction ────────────────────────────────────────────────────────
// Handles: clean JSON, markdown fences, preamble text, trailing text.
function extractJSON(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Empty response');

  // Strip common markdown fences
  let s = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/im, '')
    .trim();

  // Try direct parse (ideal path)
  try { return JSON.parse(s); } catch (_) {}

  // Find first { … last } and try that slice
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a !== -1 && b > a) {
    try { return JSON.parse(s.slice(a, b + 1)); } catch (_) {}
  }

  // Walk forward to find a balanced object
  if (a !== -1) {
    let depth = 0, inStr = false, esc = false;
    for (let i = a; i < s.length; i++) {
      const c = s[i];
      if (esc)        { esc = false; continue; }
      if (c === '\\') { esc = true;  continue; }
      if (c === '"')  { inStr = !inStr; continue; }
      if (inStr)      continue;
      if (c === '{')  depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(s.slice(a, i + 1)); } catch (_) {}
        }
      }
    }
  }

  throw new Error('No valid JSON object found in model response');
}

// ─── Rate limiter ────────────────────────────────────────────────────────────
const rlStore = new Map();
const RL_WINDOW = 60_000; // 1 minute
const RL_MAX    = 5;      // requests per IP per window

function checkRL(ip) {
  const now = Date.now();
  const e   = rlStore.get(ip);
  if (!e || now - e.t > RL_WINDOW) {
    rlStore.set(ip, { t: now, n: 1 });
    return { ok: true };
  }
  if (e.n >= RL_MAX) {
    return { ok: false, wait: Math.ceil((RL_WINDOW - (now - e.t)) / 1000) };
  }
  e.n++;
  return { ok: true };
}

function pruneRL() {
  const now = Date.now();
  for (const [k, v] of rlStore) {
    if (now - v.t > RL_WINDOW * 2) rlStore.delete(k);
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || '';
  const allowed = [
    'https://epistamate.com',
    'https://www.epistamate.com',
    'https://distila-site.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
          || req.headers['x-real-ip']
          || req.socket?.remoteAddress
          || 'unknown';
  pruneRL();
  const rl = checkRL(ip);
  if (!rl.ok) {
    return res.status(429).json({
      error: `Too many requests. Please wait ${rl.wait} seconds before trying again.`,
      code: 'RATE_LIMITED',
    });
  }

  // Validate input
  const { question, domain } = req.body || {};
  if (!question || typeof question !== 'string' || question.trim().length < 5) {
    return res.status(400).json({ error: 'A research question is required.' });
  }
  if (question.length > 500) {
    return res.status(400).json({ error: 'Question too long — please keep it under 500 characters.' });
  }

  const domainMap = {
    general:    'general professional research',
    policy:     'policy and think tank research',
    consulting: 'strategy consulting',
    regulatory: 'regulatory and compliance research',
  };
  const domainLabel = domainMap[domain] || domainMap.general;

  // Build prompt
  const schemaDesc = [
    'Return a JSON object with exactly these keys:',
    '',
    'scan_summary: string (2-3 sentences on topic framing)',
    '',
    'claims: array of 4-5 objects, each with:',
    '  id (C1..C5), text (1-2 sentence claim), type (empirical|mechanistic|normative|predictive),',
    '  status (VERIFIED|CONTESTED|WEAK|UNVERIFIED), confidence_score (integer 5-95),',
    '  source_tier (Tier 1|Tier 2|Tier 3), provider_count (1-4), evidence_age_months (1-60),',
    '  survived_challenge (true|false),',
    '  score_breakdown: { base:40, source_tier_bonus:0-20, consensus_bonus:0-15,',
    '    socratic_bonus:0 or 10 (set to 0 if survived_challenge is false),',
    '    status_adjustment:-20 to 10, recency_decay:-10 to 0,',
    '    sufficiency_penalty:0 or -8 },',
    '  evidence_summary (2-3 sentences), adversarial_challenge (specific counterargument),',
    '  challenge_outcome (how the claim fared)',
    '',
    'gaps: array of 2-3 objects, each with:',
    '  id (G1..G3), question (what is not known), importance (HIGH|MEDIUM|LOW), why_it_matters (1-2 sentences)',
    '',
    'brief_summary: string (2-3 paragraphs, verified/contested findings only, honest about uncertainty)',
    '',
    'key_findings: array matching claims, each with: claim_id, finding (1 sentence), confidence (integer)',
    '',
    'decision_log: object with: verified_count, contested_count, weak_count, gap_count,',
    '  snr (float 0-1), session_note (1 sentence on evidential quality)',
  ].join('\n');

  const rules = [
    'Confidence scores must vary realistically — range roughly 18-72, never all similar.',
    'Include at least one CONTESTED or WEAK claim.',
    'score_breakdown components MUST sum exactly to confidence_score. Double-check your arithmetic before returning.',
    'If survived_challenge is false, socratic_bonus must be 0.',
    'adversarial_challenge must be specific and substantive, not generic.',
  ].join(' ');

  const userMsg = [
    'Research question: "' + question.trim() + '"',
    'Domain: ' + domainLabel,
    '',
    schemaDesc,
    '',
    'Rules: ' + rules,
  ].join('\n');

  // Call Groq
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a structured research engine. Output ONLY a raw valid JSON object. No markdown, no backticks, no code fences, no preamble, no explanation. Your entire response must start with { and end with } and be parseable by JSON.parse().',
          },
          {
            role: 'user',
            content: userMsg,
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      console.error('Groq error', groqRes.status, errText.slice(0, 200));
      if (groqRes.status === 429) {
        return res.status(429).json({
          error: 'The demo is experiencing high demand. Please try again in a moment.',
          code: 'UPSTREAM_RATE_LIMITED',
        });
      }
      return res.status(502).json({
        error: 'Research engine temporarily unavailable. Please try again.',
        code: 'UPSTREAM_ERROR',
      });
    }

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      parsed = extractJSON(raw);
    } catch (err) {
      console.error('Parse error:', err.message, '| raw[:300]:', raw.slice(0, 300));
      return res.status(502).json({
        error: 'The engine returned an unexpected format. Please try a different question.',
        code: 'PARSE_ERROR',
      });
    }

    if (!Array.isArray(parsed.claims) || parsed.claims.length === 0) {
      return res.status(502).json({
        error: 'The engine could not extract claims for this question. Please try rephrasing.',
        code: 'INVALID_RESPONSE',
      });
    }

    // ── Post-process: recompute scores from breakdown (source of truth) ──────
    parsed.claims = normaliseClaims(parsed.claims);

    // Recompute decision_log counts from normalised claims to keep them consistent
    if (parsed.decision_log) {
      parsed.decision_log.verified_count  = parsed.claims.filter(c => c.status === 'VERIFIED').length;
      parsed.decision_log.contested_count = parsed.claims.filter(c => c.status === 'CONTESTED').length;
      parsed.decision_log.weak_count      = parsed.claims.filter(c => c.status === 'WEAK' || c.status === 'UNVERIFIED').length;
      const total = parsed.claims.length;
      const strong = parsed.decision_log.verified_count + parsed.decision_log.contested_count;
      parsed.decision_log.snr = total > 0 ? parseFloat((strong / total).toFixed(2)) : 0;
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again.',
      code: 'SERVER_ERROR',
    });
  }
}
