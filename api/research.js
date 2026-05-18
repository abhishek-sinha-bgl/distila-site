/**
 * Distilapp — /api/research
 * Serverless proxy for Groq API. Key stays server-side.
 * Rate limited per IP to prevent abuse.
 */

// In-memory rate limit store (resets on cold start — good enough for demo)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX = 5;               // max 5 requests per IP per minute

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { windowStart: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetIn = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
    return { allowed: false, resetIn };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// Clean up old entries occasionally to prevent memory growth
function pruneStore() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(ip);
    }
  }
}

export default async function handler(req, res) {
  // CORS — only allow requests from our own domain
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://distila-site.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';

  pruneStore();
  const rl = checkRateLimit(ip);

  if (!rl.allowed) {
    return res.status(429).json({
      error: `Too many requests. Please wait ${rl.resetIn} seconds before trying again.`,
      code: 'RATE_LIMITED'
    });
  }

  // Validate request body
  const { question, domain } = req.body || {};

  if (!question || typeof question !== 'string' || question.trim().length < 5) {
    return res.status(400).json({ error: 'A research question is required.' });
  }

  if (question.length > 500) {
    return res.status(400).json({ error: 'Question too long. Please keep it under 500 characters.' });
  }

  const domainLabels = {
    general:    'general professional research',
    policy:     'policy and think tank research',
    consulting: 'strategy consulting',
    regulatory: 'regulatory and compliance research',
  };
  const domainLabel = domainLabels[domain] || domainLabels.general;

  const prompt = `You are simulating the Distilapp DCBR (Domain-Configurable Bidirectional Reasoning) Engine.

Research question: "${question.trim()}"
Domain context: ${domainLabel}

Run the full DCBR pipeline and return a JSON object ONLY. No preamble, no markdown fences, no explanation outside the JSON.

{
  "scan_summary": "2-3 sentence topic map and initial framing of the question",
  "claims": [
    {
      "id": "C1",
      "text": "The claim as a concise declarative statement (1-2 sentences)",
      "type": "empirical|mechanistic|normative|predictive",
      "status": "VERIFIED|CONTESTED|WEAK|UNVERIFIED",
      "confidence_score": <integer 5-95>,
      "source_tier": "Tier 1|Tier 2|Tier 3",
      "provider_count": <integer 1-4>,
      "evidence_age_months": <integer 1-60>,
      "survived_challenge": <true|false>,
      "score_breakdown": {
        "base": 40,
        "source_tier_bonus": <integer 0-20>,
        "consensus_bonus": <integer 0-15>,
        "socratic_bonus": <0 or 10>,
        "status_adjustment": <integer -20 to 10>,
        "recency_decay": <integer -10 to 0>,
        "sufficiency_penalty": <0 or -8>
      },
      "evidence_summary": "2-3 sentences on what evidence supports or undermines this claim",
      "adversarial_challenge": "The strongest counterargument or complicating factor for this claim",
      "challenge_outcome": "How the claim fared — survived with caveats / weakened / contested by contrary evidence"
    }
  ],
  "gaps": [
    {
      "id": "G1",
      "question": "A specific thing that is not yet known but matters for this research question",
      "importance": "HIGH|MEDIUM|LOW",
      "why_it_matters": "1-2 sentences explaining the significance of this gap"
    }
  ],
  "brief_summary": "2-3 paragraph analytical synthesis covering only verified and contested findings. Honest about uncertainty. No unsupported assertions.",
  "key_findings": [
    {
      "claim_id": "C1",
      "finding": "One-sentence summary of this finding for the brief",
      "confidence": <integer, same as claim confidence_score>
    }
  ],
  "decision_log": {
    "verified_count": <integer>,
    "contested_count": <integer>,
    "weak_count": <integer>,
    "gap_count": <integer>,
    "snr": <float 0.0-1.0>,
    "session_note": "One sentence characterising the evidential quality of this session"
  }
}

Rules:
- Generate exactly 4-5 claims
- Confidence scores must vary realistically: range from ~18 to ~72, never all similar
- Include at least one CONTESTED or WEAK claim
- Include exactly 2-3 gaps
- The adversarial_challenge must be substantive and specific, not generic
- score_breakdown values must sum approximately to confidence_score
- Return ONLY the JSON object, nothing else`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.4,
        max_tokens: 2048,
        messages: [
          {
            role: 'system',
            content: 'You are a structured research engine. You output only valid JSON with no preamble, no explanation, and no markdown formatting. Every response is a single JSON object.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API error:', groqRes.status, errText);

      if (groqRes.status === 429) {
        return res.status(429).json({
          error: 'The demo is experiencing high demand right now. Please try again in a moment.',
          code: 'UPSTREAM_RATE_LIMITED'
        });
      }

      return res.status(502).json({
        error: 'Research engine temporarily unavailable. Please try again.',
        code: 'UPSTREAM_ERROR'
      });
    }

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content || '';

    // Strip any accidental markdown fences
    const clean = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr.message, '\nRaw:', raw.slice(0, 300));
      return res.status(502).json({
        error: 'The engine returned an unexpected format. Please try a different question.',
        code: 'PARSE_ERROR'
      });
    }

    // Basic shape validation
    if (!parsed.claims || !Array.isArray(parsed.claims) || parsed.claims.length === 0) {
      return res.status(502).json({
        error: 'The engine could not extract claims for this question. Please try rephrasing.',
        code: 'INVALID_RESPONSE'
      });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Serverless function error:', err.message);
    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again.',
      code: 'SERVER_ERROR'
    });
  }
}
