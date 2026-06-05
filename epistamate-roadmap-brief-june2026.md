# Epistamate — Architecture & Roadmap Brief
**Date:** June 2026  
**Purpose:** SOTA-informed roadmap input for Codex/ChatGPT architecture sessions  
**Context:** This document is written for use in Codex missions and ChatGPT architecture conversations. It assumes familiarity with the Epistamate DCBR architecture (see Zenodo: 10.5281/zenodo.19204972). Each item includes a rationale grounded in published 2026 research, a clear statement of what Epistamate currently does or does not do, and a recommended direction. Items are grouped by priority tier.

---

## System Context Summary (for LLM orientation)

Epistamate is a Windows desktop research intelligence tool (Tauri/Rust frontend, Vercel-hosted API backend using Groq/llama-3.1-8b-instant). Its core claim is a six-property architecture no existing practitioner-facing tool currently combines:

1. **Typed claim extraction** — claims are categorised by type before scoring
2. **Formula-computed confidence** — score derived from source tier, cross-provider consensus, adversarial outcome, recency, sufficiency — decoupled from LLM self-report
3. **Source credibility tier system** — structured heuristic assigning Tier 1–4 to sources
4. **Mandatory adversarial challenge stage** — claims are challenged before acceptance
5. **Typed gap tracking** — evidence gaps are first-class outputs, not side notes
6. **Cross-session compounding** — evidential state persists and builds across sessions

The current implementation is early access. The SQLite-backed knowledge graph, single-pass adversarial challenge, and heuristic source tier assignment are known architectural gaps. This document identifies SOTA-grounded improvements to each, plus new capabilities warranted by the current research environment.

---

## Tier 1 — High Impact, Architecturally Ready Now

### 1.1 Structured Disagreement Scoring in the Adversarial Challenge Stage

**Current state:** The adversarial challenge stage runs a single-pass challenge and produces a binary or scalar outcome. The confidence formula consumes the challenge outcome but cannot distinguish between strong disagreement (well-argued counter-evidence) and weak disagreement (generic hedging).

**SOTA basis:** DiscoUQ (arXiv:2603.20975, March 2026, Temple University) introduces structured disagreement analysis for multi-agent ensembles. Rather than majority voting, it extracts linguistic features from inter-agent disagreement — evidence overlap, argument strength, divergence depth — and geometric features from embedding space. DiscoUQ-LLM achieves AUROC 0.802 vs 0.791 for the best baseline, with substantially better calibration (ECE 0.036 vs 0.098). Crucially, it produces the largest gains in the "weak disagreement" tier where vote-counting fails — which is exactly the tier most relevant to contested research claims.

**Recommended direction:** Extend the adversarial challenge stage from single-pass scalar output to structured disagreement extraction. The adversarial agent should produce a structured record: (a) argument strength score, (b) evidence overlap with the original claim, (c) divergence depth (surface/methodological/foundational). The confidence formula should weight these dimensions separately rather than consuming a single challenge outcome. This is a prompt engineering and output schema change, not a model change. Compatible with current Groq/llama backend.

**Reference:** DiscoUQ: arXiv:2603.20975

---

### 1.2 Uncertainty Signal Propagation — From Claim to Score to Output

**Current state:** The confidence formula produces a score. That score is displayed to the user. There is no mechanism for the score to carry forward an uncertainty band, or for uncertainty to accumulate across a multi-claim research session.

**SOTA basis:** Two 2026 papers frame this as a systems problem, not a scoring problem. "Uncertainty Quantification in LLM Agents" (arXiv:2602.05073, February 2026) identifies four challenges specific to agentic UQ: estimator selection, heterogeneous entity uncertainty, modeling uncertainty dynamics in interactive systems, and absence of fine-grained benchmarks. The key finding for Epistamate: UQ research has centred on single-turn QA but agent UQ must track uncertainty across turns and across entity types — exactly the cross-session compounding Epistamate claims as a differentiator.

Separately, "Epistemic Integrity in Large Language Models" (arXiv:2411.06528) shows that internal certainty and linguistic assertiveness diverge in LLMs — a model can produce high-certainty language around a low-certainty answer. This directly undermines the current architecture if the adversarial agent's output is consumed as text rather than structured signal.

**Recommended direction:** Introduce an uncertainty band field alongside the confidence score. The band should widen when: (a) the adversarial challenge produced a high-divergence outcome, (b) source tier is mixed across a claim's supporting evidence, (c) the claim is at the boundary of a gap type (contested vs absent vs outdated). Display as a confidence range rather than a point score. Example: "Score: 61 (range: 48–74)" where the range reflects evidential structure uncertainty, not model confidence. This communicates epistemic humility without removing the score's utility.

**Reference:** arXiv:2602.05073; arXiv:2411.06528

---

### 1.3 Citation Lineage Tracking — Distinguishing Corroboration from Amplification

**Current state:** The source tier system scores individual sources. There is no mechanism to detect whether multiple Tier 2–3 sources are independently generated or all descend from a single Tier 1 original (the amplification cascade problem documented in Epistamate's own article 1).

**SOTA basis:** WWW '26 published a paper on miscitation detection using LLM-augmented text-rich graph learning (arXiv:2603.12290, Wu et al., 2026). The method uses graph neural networks augmented with LLM-extracted semantic features to detect when a citation chain is internally inconsistent — when the citing claim diverges from what the cited source actually contains. A separate study, "The 17% Gap" (arXiv:2601.17431), audited 5,514 citations in 50 AI survey papers and found 17% showed epistemic decay — valid citation chains where meaning shifts across citation generations.

For Epistamate, the relevant capability is narrower than full miscitation detection: it is cascade detection. If Source B cites Source A, and Source C cites Source A via Source B, these three sources are not three independent lines of evidence. They are one.

**Recommended direction:** Add a citation lineage field to the source record schema. During source ingestion, attempt DOI resolution and check OpenAlex/Crossref for the cited references of each source. If Source B's reference list contains Source A, flag B as a downstream citation of A. Propagate this flag into the corroboration count: downstream citations of the same original should not increment the independent-source count in the confidence formula. This is an API-layer change (OpenAlex has a free API) and a schema change, not a model change.

The Semantic Scholar citation graph API is also available and free. It returns citing and cited papers for any paper with a known ID. This can be queried at ingestion time.

**Reference:** arXiv:2603.12290 (WWW '26); arXiv:2601.17431

---

## Tier 2 — Medium Term, Architecturally Significant

### 2.1 Source Tier System — From Heuristic to Empirically Anchored

**Current state:** Source credibility tiers (1–4) are assigned by a structured heuristic based on source type, venue, and publication status. This is acknowledged in the architecture paper and the landscape page as a known gap.

**SOTA basis:** WebTrust (Tsinghua/Chandigarh, 2025) trained on 140,000 articles across 21 domains with 35 reliability labels, achieving MAE 0.09 on credibility prediction. The relevant finding: automated source credibility scoring at the tier level is tractable and measurable. Additionally, "What Is Automated Source Credibility Scoring?" (Sourcely, December 2025) documents a CiteEval-Auto metric that aligns strongly with human judgments, combining academic signals (peer-review status, author credentials, venue reputation) with textual signals (subjectivity, bias, persuasion techniques). Advanced approaches include Vanilla Fine-Tuning of LLMs to generate continuous reliability scores (0.1–1.0) and Iterative Chain of Edits (IterCoE) for scoring with reasoning traces.

**Recommended direction:** Two-phase approach.

*Phase 1 (prompt-level, near-term):* Replace the static tier lookup with a prompt-based scoring call. Given a source's metadata (title, venue, author credentials, publication year, document type), prompt the Groq model to assign a credibility score with a brief reasoning trace. Cache the result against the source fingerprint. This makes tier assignment auditable and contestable without changing the formula.

*Phase 2 (longer term):* Integrate OpenAlex metadata at ingestion time. OpenAlex returns venue h-index, citation counts, open access status, and institutional affiliation for any paper with a DOI. These signals can anchor tier assignment to objective data rather than heuristics. Map h-index ranges and citation velocity to tier bands with documented thresholds.

**Reference:** WebTrust (2025); Sourcely CiteEval-Auto (2025); OpenAlex API (free, open)

---

### 2.2 Calibrated Confidence Bands in the Adversarial Stage — MACI Dual-Dial Pattern

**Current state:** The adversarial challenge is a single-pass, uniform-intensity challenge applied to every claim regardless of its evidential strength or source tier composition.

**SOTA basis:** MACI (Multi-Agent Collaborative Intelligence, arXiv:2510.04488) introduced dual-dial control: an information quality gate that filters evidence by credibility before the adversarial stage, and a behaviour dial that adjusts challenge intensity across debate rounds based on that gate's output. MACI achieves ECE 0.081 vs 0.103 for fixed-stance debate — a 21% calibration improvement — and uses fewer tokens. The key architectural insight: challenge intensity should be a function of source tier, not a constant.

**Recommended direction:** Implement challenge intensity as a function of the source tier distribution of the claim's supporting evidence.

| Source tier profile | Challenge intensity |
|---|---|
| All Tier 1, high consensus | Light challenge (1 round) |
| Mixed Tier 1–2, some consensus | Standard challenge (2 rounds) |
| Tier 2–3 dominant, low consensus | Intensive challenge (3 rounds, explicit counter-evidence required) |
| Single source, any tier | Maximum challenge (adversarial agent must find a counter-source) |

This is a prompt orchestration change. The confidence formula already consumes challenge outcome — the improvement is in making the challenge proportionate so the outcome is more informative.

**Reference:** MACI: arXiv:2510.04488

---

### 2.3 EU AI Act Article 12 — Hardening the Decision Log

**Current state:** The decision log records evidential state at the moment of a logged decision. The architecture paper claims this satisfies EU AI Act Article 12 by construction.

**SOTA basis:** Article 12 enforcement deadline is August 2, 2026 (Annex III provisions). Requirements as clarified in 2026 compliance guidance: logs must be tamper-evident, retained for a minimum of 6 months (24 months for biometric/law enforcement), automatically generated without manual data entry, and must capture sufficient information to identify malfunctions and reconstruct system behaviour in relation to identified risks. The key compliance gap most commonly cited in 2026: AI outputs are logged but individual user attribution is absent — logs record what the system produced but not who directed it and in what evidential context.

A proposed extension to December 2027 via the EU Digital Omnibus package is under trilogue negotiation as of June 2026 but has not become law. Treat August 2, 2026 as operative.

**Recommended direction:** The decision log schema should be extended to explicitly capture:

```
{
  "log_id": "uuid",
  "timestamp_utc": "ISO8601",
  "user_attribution": "session_id or user_id",
  "query": "original research question",
  "claims_at_decision": [
    {
      "claim_text": "...",
      "claim_type": "...",
      "confidence_score": 0.0–1.0,
      "confidence_band": [lower, upper],
      "source_ids": ["..."],
      "source_tiers": [1–4],
      "adversarial_outcome": "sustained|modified|rejected",
      "gap_types_present": ["contested|absent|outdated|methodological"],
      "cascade_flags": ["source_b_descends_from_source_a"]
    }
  ],
  "decision_text": "...",
  "log_hash": "sha256 of content at time of write"
}
```

The `log_hash` field provides tamper-evidence without requiring a blockchain or external service. Log retention should be configurable to 6-month minimum. This schema change makes the decision log a compliance artifact by construction rather than by assertion.

**Reference:** EU AI Act Article 12; arXiv:2601.16909 (verification-first framework)

---

## Tier 3 — Longer Horizon, Architecturally Strategic

### 3.1 Semantic Laundering Detection

**Current state:** The adversarial challenge tests whether a claim holds against counter-evidence. It does not test whether a claim has gained unwarranted epistemic authority by passing through architecturally trusted interfaces in the pipeline — what a 2026 paper calls "semantic laundering."

**SOTA basis:** "Semantic Laundering in AI Agent Architectures" (from the VoltAgent awesome-ai-agent-papers compilation, 2026) formalises how propositions gain unwarranted trust by crossing trusted interfaces — for example, an AI-generated summary that is then retrieved and cited as if it were primary evidence. In Epistamate's domain this is specifically relevant to: AI-generated policy summaries cited as primary sources, AI-assisted literature reviews cited as systematic reviews, and model outputs from other AI tools ingested as sources. Each of these crosses a trust boundary and can appear as a Tier 2–3 source without flagging that its content is itself AI-generated.

**Recommended direction:** Add an AI-origin flag to the source schema. At ingestion, attempt to detect whether a source is itself AI-generated (via metadata, tool watermarks, or stylometric heuristics). AI-origin sources should be assigned a maximum tier of Tier 3, regardless of venue, and their contribution to the confidence formula should be capped. The gap tracker should include an "AI-origin source" gap type. This is not about distrusting AI-generated content categorically — it is about ensuring that AI-generated content does not silently inflate the confidence of claims it supports.

**Reference:** "Semantic Laundering in AI Agent Architectures" (2026); arXiv:2602.05073

---

### 3.2 Epistemic Context Learning — Peer Reliability Profiles Across Sessions

**Current state:** Cross-session compounding persists the knowledge graph. It does not persist information about the reliability of sources encountered in prior sessions — a source that proved misleading in session 3 is evaluated from scratch in session 7.

**SOTA basis:** "Epistemic Context Learning: Building Trust the Right Way in LLM-Based Multi-Agent Systems" (2026, from VoltAgent compilation) introduces peer reliability profiles: agents build interaction histories that record when other agents or sources were trustworthy or misleading, so that uncertainty is modulated by prior reliability rather than treated as constant. Applied to sources rather than agents, this is source reliability memory: if Source X consistently produced claims that failed adversarial challenge in prior sessions, that history should inform its tier assignment in future sessions.

**Recommended direction:** Extend the cross-session knowledge graph to include a source reliability ledger. Each source gets a session-persistent record of: number of times ingested, number of claims sourced from it, number of those claims that survived adversarial challenge, number that were modified or rejected. These stats feed a reliability modifier on top of the static tier assignment. A Tier 2 source with a 40% adversarial survival rate should score differently from a Tier 2 source with an 85% rate, across sessions.

This is a schema extension to the existing SQLite knowledge graph and a modifier in the confidence formula. No new infrastructure required.

**Reference:** "Epistemic Context Learning" (2026); MACI arXiv:2510.04488

---

### 3.3 Knowledge Graph Backend — Migration Path from SQLite

**Current state:** The knowledge graph is SQLite-backed. This is acknowledged as a production scaling limitation.

**SOTA basis:** The GraphRAG ecosystem in 2026 has bifurcated: heavyweight solutions (Microsoft's GraphRAG, requiring $33K+ indexing costs at scale) and a growing set of lighter alternatives (LightRAG, NanoGraphRAG, FastGraphRAG) that achieve comparable multi-hop reasoning at substantially lower cost. LightRAG and FastGraphRAG are both open source, support incremental graph updates, and have been evaluated in practitioner contexts. LinearRAG (accepted at ICLR '26) offers a relation-free graph construction method that reduces indexing cost while preserving query-time reasoning quality.

**Recommended direction:** When scaling beyond SQLite becomes necessary, evaluate LightRAG as the migration target before committing to Microsoft GraphRAG. LightRAG is open source, incrementally updatable (critical for cross-session compounding), and does not require Azure infrastructure. The migration should preserve the existing schema for claims, sources, gaps, and decision logs, adding graph traversal capabilities on top. The source reliability ledger (item 3.2) should be designed with this migration in mind — graph edges between sources and claims are more natural in a graph database than in relational SQLite.

**Reference:** LightRAG (open source); LinearRAG arXiv (ICLR '26); GraphRAG landscape review (Medium, February 2026)

---

## Environment Flags — Things to Track, Not Act On Yet

These are developments that do not require immediate architectural response but should be monitored:

**Agent-to-agent trust protocols (MCP poisoning):** "MCP-ITP: An Automated Framework for Implicit Tool Poisoning in MCP" (2026) shows that poisoned MCP tool metadata can manipulate agents into performing malicious operations through legitimate tools without the poisoned tool being invoked. If Epistamate's pipeline ever ingests from external MCP servers, this is a live attack surface. Currently not relevant to the closed desktop architecture.

**EU Digital Omnibus Article 12 extension:** A proposed extension to December 2027 is under trilogue negotiation as of June 2026. If it passes, the August 2026 compliance deadline for Annex III provisions extends. Do not act on this — treat August 2026 as operative until the extension is law.

**DiscoUQ generalisation:** DiscoUQ's learned features showed near-zero performance degradation across benchmarks. If the structured disagreement approach (item 1.1) is implemented, evaluate whether the DiscoUQ feature set (evidence overlap, argument strength, divergence depth) can be extracted from Epistamate's existing adversarial stage outputs without retraining, using the Groq model as the extractor.

**Cochrane AI tool study results (late 2026):** Cochrane selected Laser AI and Nested Knowledge for their platform study. Results are expected in the latter part of 2026. These will be the first rigorous third-party evaluation of AI evidence synthesis tools against traditional systematic review methods. The results will directly inform whether Epistamate's evidence quality framing needs to be updated or can be used as external validation.

---

## Priority Summary for Codex Mission Planning

| Item | Type | Effort estimate | Dependency |
|---|---|---|---|
| 1.1 Structured disagreement in adversarial stage | Prompt + schema | Low–Medium | None |
| 1.2 Uncertainty band on confidence score | Formula + UI | Low | 1.1 recommended first |
| 1.3 Citation lineage via OpenAlex/Semantic Scholar API | API integration + schema | Medium | None |
| 2.1 Phase 1: Prompt-based tier scoring with reasoning trace | Prompt | Low | None |
| 2.1 Phase 2: OpenAlex metadata anchor for tier assignment | API integration | Medium | Phase 1 |
| 2.2 Challenge intensity as function of source tier | Prompt orchestration | Low–Medium | 2.1 Phase 1 |
| 2.3 Decision log schema hardening (Article 12) | Schema | Low | None |
| 3.1 AI-origin source flagging | Ingestion + schema | Medium | 1.3 |
| 3.2 Source reliability ledger (cross-session) | Schema + formula modifier | Medium | 1.3 |
| 3.3 LightRAG migration path design | Architecture | High | 3.2 |

**Recommended sequencing for next Codex batch:**
1. Item 2.3 first — schema change, low risk, compliance-critical
2. Item 1.1 — prompt and schema change, foundational for 1.2 and 2.2
3. Item 1.3 — OpenAlex API integration, independent, high evidence quality value
4. Item 2.1 Phase 1 — low effort, makes tier assignment auditable
5. Item 1.2 — depends on 1.1, closes the epistemic humility gap in the UI

---

## Key Papers for Reference in Architecture Conversations

| Paper | arXiv / DOI | Relevance |
|---|---|---|
| DiscoUQ | arXiv:2603.20975 | Structured adversarial disagreement scoring |
| UQ in LLM Agents | arXiv:2602.05073 | Agent-level uncertainty propagation framework |
| Epistemic Integrity in LLMs | arXiv:2411.06528 | Internal vs linguistic certainty divergence |
| Miscitation detection | arXiv:2603.12290 (WWW '26) | Citation lineage and cascade detection |
| The 17% Gap | arXiv:2601.17431 | Epistemic decay across citation chains |
| MACI dual-dial | arXiv:2510.04488 | Challenge intensity calibration |
| DebateCV | arXiv:2507.19090 (WWW '26) | Adversarial claim verification architecture |
| Verification-first AI | arXiv:2601.16909 | Proxy-sovereign evaluation; audit artifact generation |
| EpiCaR | arXiv:2601.06786 | Training-level calibration (longer horizon) |
| WebTrust | Tsinghua/Chandigarh 2025 | Automated source credibility scoring at scale |
| EU AI Act Article 12 | August 2026 enforcement | Logging, tamper-evidence, retention requirements |
