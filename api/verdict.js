/**
 * Epistamate /api/verdict
 * Serverless Groq proxy for the Scholarly Source Check "Check claim" feature.
 * Key stays server-side. Rate limited by IP. Same provider as /api/research
 * (Groq, free tier) — consolidated to avoid running two LLM backends.
 *
 * Single-fragment classification only: one claim + one paper title/abstract,
 * returns one of six verdict labels with a short grounded reasoning.
 *
 * Contact: epistamate@proton.me
 */

// ─── JSON extraction ────────────────────────────────────────────────────────
function extractJSON(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Empty response');

  let s = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/im, '')
    .trim();

  try { return JSON.parse(s); } catch (_) {}

  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a !== -1 && b > a) {
    try { return JSON.parse(s.slice(a, b + 1)); } catch (_) {}
  }

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

// ─── Rate limiter (separate bucket from /api/research — different endpoint, own limits) ──
const rlStore = new Map();
const RL_WINDOW = 60_000; // 1 minute
const RL_MAX    = 10;     // single-fragment classification is cheap; allow more per minute than full research runs

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

// ─── Verdict schema ──────────────────────────────────────────────────────────
const VALID_VERDICTS = ['supports', 'partial', 'overstated', 'contradicts', 'misrepresented', 'unverifiable'];

const SYSTEM_PROMPT = `You are a citation verification assistant. You will be given a claim and the title/abstract of an academic paper. Your job is to assess whether the paper's abstract supports the claim, and to what degree.

You are working from an ABSTRACT ONLY, not the full text of the paper. Be conservative: abstracts often summarize findings without full nuance, and you cannot verify methodology, sample size details, or caveats that may only appear in the full text.

Respond ONLY with a raw valid JSON object. No markdown, no backticks, no preamble. Your entire response must start with { and end with }.

Schema:
{
  "verdict": "supports" | "partial" | "overstated" | "contradicts" | "misrepresented" | "unverifiable",
  "reasoning": "one or two sentences, citing specific language from the abstract where possible"
}

Verdict definitions:
- "supports": the abstract directly supports the claim as stated
- "partial": the abstract supports a narrower or more qualified version of the claim
- "overstated": the claim goes further than what the abstract supports (e.g. claim asserts causation, abstract shows correlation; claim is general, abstract is a single narrow study)
- "contradicts": the abstract's findings run counter to the claim
- "misrepresented": the claim distorts or inverts what the abstract actually says
- "unverifiable": the abstract does not address the claim's specific subject matter at all

Never invent or assume information not present in the title or abstract provided.`;

// ─── Groq call (with fallback, same pattern as /api/research) ───────────────
// Primary is the smaller/faster model — single-fragment classification doesn't
// need the larger model's capacity. Fallback to the larger model on failure
// for a different failure mode than the primary (capacity/quirk diversity).
const PRIMARY_MODEL  = 'openai/gpt-oss-20b';
const FALLBACK_MODEL = 'openai/gpt-oss-120b';

async function callGroq(model, userMessage) {
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_completion_tokens: 400, // small — single verdict + short reasoning only
      response_format: { type: 'json_object' },
      include_reasoning: false, // gpt-oss models: reasoning_format unsupported, this is the documented JSON-mode control
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS — same allowed origins as /api/research
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
  const { claim, source } = req.body || {};
  const claimText = String(claim || '').trim();
  const title = String(source?.title || '').trim();
  const abstract = String(source?.abstract || '').trim();

  if (!claimText || claimText.length < 5) {
    return res.status(400).json({ error: 'A claim is required.' });
  }
  if (!abstract || abstract.length < 20) {
    return res.status(200).json({ verdict: 'unverifiable', reasoning: 'No abstract available to check against.' });
  }

  const claimTrunc = claimText.slice(0, 1000);
  const abstractTrunc = abstract.slice(0, 3000);
  const titleTrunc = title.slice(0, 300);

  const userMessage = `CLAIM:\n${claimTrunc}\n\nPAPER TITLE:\n${titleTrunc || '(title not available)'}\n\nPAPER ABSTRACT:\n${abstractTrunc}`;

  try {
    let groqRes = await callGroq(PRIMARY_MODEL, userMessage);
    let usedModel = PRIMARY_MODEL;

    if (!groqRes.ok && groqRes.status !== 429) {
      const firstErrText = await groqRes.text().catch(() => '');
      console.error('Groq verdict primary model error', PRIMARY_MODEL, groqRes.status, firstErrText.slice(0, 300));
      groqRes = await callGroq(FALLBACK_MODEL, userMessage);
      usedModel = FALLBACK_MODEL;
    }

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      console.error('Groq verdict error', usedModel, groqRes.status, errText.slice(0, 300));
      // Fail soft — this is a non-critical enhancement feature, not core functionality
      return res.status(200).json({ verdict: 'unverifiable', reasoning: 'Verdict service temporarily unavailable.' });
    }

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      parsed = extractJSON(raw);
    } catch (err) {
      console.error('Verdict parse error:', err.message, '| raw[:200]:', raw.slice(0, 200));
      return res.status(200).json({ verdict: 'unverifiable', reasoning: 'Could not parse verdict response.' });
    }

    if (!VALID_VERDICTS.includes(parsed.verdict)) {
      return res.status(200).json({ verdict: 'unverifiable', reasoning: 'Verdict classification failed validation.' });
    }

    return res.status(200).json({
      verdict: parsed.verdict,
      reasoning: String(parsed.reasoning || '').slice(0, 500),
      _engine_model: usedModel,
    });

  } catch (err) {
    console.error('Verdict handler error:', err.message);
    return res.status(200).json({ verdict: 'unverifiable', reasoning: 'Verdict service error.' });
  }
}
