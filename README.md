# Distila Desktop · Preview Builds

> A structured research environment for analysts, founders, policy teams, and operators who need evidence quality-not just faster text generation.

This public repository is **installer-only** for preview builds.
It does **not** include source code.

---

## What Distila Is

Distila is a local-first desktop research intelligence app.
It turns raw prompts, documents, and URLs into a structured evidence workflow:

- extract claims with provenance and confidence
- surface contradictions and unresolved gaps
- iterate with Research Further on weak/conflicted areas
- synthesize decision-ready briefs (short and detailed)
- track knowledge quality over time (SNR, breadth, deltas, token usage)

Distila is not meant to replace human judgment. It is meant to make judgment auditable and faster.

---

## Core Principles

- **Evidence over vibe:** claims are explicit, scored, and reviewable.
- **Iterative quality:** first run is a baseline; quality rises through targeted follow-ups.
- **Human-in-the-loop:** reviewers can validate/discard claims and steer topic intent.
- **Compounding knowledge:** prior claims and topic history can inform later runs.

---

## Who It Is For

- Research analysts and strategy teams building evidence-backed briefs.
- Founders and operators evaluating fast-moving market/technology claims.
- Policy, legal, and risk teams that need explicit claim traceability.
- Independent researchers who want repeatable workflows, not ad-hoc chat logs.

## Who It Is Not For

- One-click "final answer" users who do not plan to review claims.
- Teams expecting guaranteed factual correctness without human review.
- Users needing full offline web search without any configured web/search provider.
- Production-critical enterprise deployments without internal validation/pilot.

---

## Download (Current: Preview 3)

### Windows
- [Distilapp_0.11.1-1_x64_en-US.msi](https://github.com/abhishek-sinha-bgl/distila-site/raw/main/downloads/preview3/Distilapp_0.11.1-1_x64_en-US.msi)
- [Distilapp_0.11.1-1_x64-setup.exe](https://github.com/abhishek-sinha-bgl/distila-site/raw/main/downloads/preview3/Distilapp_0.11.1-1_x64-setup.exe)

### macOS
- Preview 3 macOS installer will be linked here once CI artifact publishing completes.

---

## Quick Start

1. Install Distila and launch.
2. Add at least one LLM provider in `Settings -> Providers`.
3. (Optional) Add web search key in `Settings -> Web & Search`.
4. Create a topic with:
   - title
   - thesis (persistent anchor)
   - scope (default focus filter)
5. Run `Research`.
6. Review Claims / Gaps / Contradictions.
7. Run `Research further` for targeted gap/low-confidence expansion.
8. Publish or export the brief.

---

## Supported Runtime Modes

- Cloud providers (Gemini, Groq, OpenRouter, custom OpenAI-compatible)
- Local provider via Ollama
- Multi-LLM parallel workers

For high-quality full research, cloud frontier models are recommended.
Local-only runs are supported for lighter workflows and fallback.

---

## What's New

### Preview 3 (v0.11.1-1)
- Research quality hardening for iterative runs.
- Cross-topic grounding: relevant validated claims from other topics can be injected as context.
- Token accounting stabilization for topic/session counters.
- Citation hygiene tightened (placeholder/noisy references filtered).
- URL summarize path improved with stronger fallback extraction.
- Better orchestrator/provider fallback under rate limits/network failures.
- Added detailed brief option and quality cues in workflow.

### Preview 2
- First-run sample topic walkthrough.
- Topic intent model: thesis + scope as research anchors.
- UI improvements in right pane (activity, quality, token sections).
- Focus/basic mode refinements and usability fixes.

### Preview 1
- Windows packaging and installer validation baseline.
- Initial local/cloud provider setup and onboarding flow.
- Core research pipeline integrated into desktop preview build.

---

## Release Notes Pattern (for future previews)

For each new preview (Preview 4, 5, ...):

- installers go in `downloads/previewN/`
- this README gets a new section under **What's New**
- links above are updated to point to latest default preview

---

## Notes for Evaluators

- Preview builds are for test/evaluation; behavior can change between drops.
- Existing local data should persist across normal upgrades unless manually reset.
- If a provider is rate-limited, fallback behavior depends on configured providers and availability.

---

## Known Limitations (Preview 3)

- Output quality still depends heavily on model tier and provider health (rate limits/quotas).
- Local small models can support lightweight tasks, but full research quality is better with stronger cloud models.
- Citation quality is improved but still not perfect; reviewers should verify key claims before publication.
- Some long or script-heavy URLs may return thin content even with fallback extraction.
- Multi-provider runs may produce partial results if one or more providers fail mid-run.

---

## Security / IP

This repository is a binary distribution channel only.
No source code is published here.

If you are testing inside an organization and need a private distribution path, contact the project maintainer.
