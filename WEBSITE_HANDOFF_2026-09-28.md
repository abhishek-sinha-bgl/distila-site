# Epistamate public website durable handoff — 2026-09-28

## Repositories and current state

Public website:

- repo: https://github.com/abhishek-sinha-bgl/distila-site
- production branch: `main`
- current production merge from visual-proof work: `af70150e4da4c4074f861c5cb73d905881fd0bc4`
- repair branch already created and intentionally not merged:
  - `website/fix-example-image-assets-2026-09-28`

Research/product repo:

- repo: https://github.com/codexabhisin/epistamate-control-evidence
- Research Workbench branch: `feature/research-workbench`
- canonical cross-variant branch: `feature/evidence-frontier-state`

Before changing product claims, also read the Research Workbench durable handoff and the canonical positioning/market distinction ledger.

---

## Current website direction

The latest adversarial review showed the site had moved from an architecture-first explanation toward a clearer proof-first structure:

> problem a professional recognises → plain-language product → real controlled proof → lower-friction next step

The public product remains:

> **Epistamate Governed Research Workspace**

Core line:

> **Frontier intelligence. Governed research state. Human authority.**

Do not use **Founder-led** in public copy. The product may currently be a one-person effort, but the website should not frame it that way.

The homepage and Examples page should keep Research, Policy, Regulatory and Consulting as distinct professional paths. Do not let the site default every visitor to the Consulting/Advisory example.

---

## Examples information architecture now implemented

PR #11 changed the public Examples page and persona links.

Current intended Examples tab order/default:

1. **Research** — default
2. **Policy**
3. **Regulatory**
4. **Consulting**

Persona pages deep-link to the matching example rather than all converging on advisory.

Why:

- Claude, Gemini and DeepSeek all independently assumed an advisory/professional-services persona when asked to review the site;
- the previous default Consulting example likely contributed to that;
- Research and Policy need equally strong information scent for human visitors and Google/AI summaries.

Do not revert the default to Consulting unless there is deliberate new evidence for doing so.

---

## Public visual-proof plan

The goal is to show actual governed product state, not decorative mockups.

### Research / citation-integrity proof

Use the controlled document-led run based on a withdrawn industry report.

Observed state captured in the Workbench:

- 27 citations parsed;
- 27 checked;
- 10 reachable;
- 17 failed / blocked;
- route reachability explicitly separated from:
  - citation identity;
  - claim support;
  - substantive validity;
- later analysis used 11 unique preserved source contents after de-duplication.

Best public message:

> **A reachable URL was not allowed to become evidence by default.**

Strong screenshot:

- `image(20260928-151247).png`
- conversation file id at handoff: `file_000000007e208206bb1c8cddd5c0a400`

Public anonymisation:

> **withdrawn public report from a leading consulting firm**

Do not publicly name the consulting firm, imply current public availability, or redistribute the recovered report unless rights are clear.

### Policy proof

EU–India FTA policy experiment, Iteration 2.

Publicly useful states captured:

- research framing / actual decision question;
- 10 planned external targets / 7 acquired / 3 reviewer-deferred / 0 unresolved;
- 27 candidates / 27 admitted;
- finding that FTA benefits remained prospective rather than legally operative;
- first-loss/yield audit;
- Iteration 2 delta;
- deterministic next-research focus.

Best four-image narrative:

1. decision framing;
2. evidence state / explicit incomplete acquisition;
3. legally-operative boundary in findings;
4. **Iteration Delta** — what strengthened, narrowed, reframed or appeared anew.

Iteration-delta screenshot:

- `image(20260928-152124).png`
- conversation file id at handoff: `file_0000000075d881f59c197348ff018709`

Visible delta in the run:

- strengthened 3;
- narrowed / qualified 3;
- reframed 1;
- new findings 3;
- persistent / refined gaps 5;
- new gaps 4.

This is strong evidence of cumulative governed research rather than one-shot report generation.

---

## CRITICAL: current production screenshot assets are malformed

The HTML and content structure from PR #11 are correct, but the binary image upload was wrong.

Broken production assets:

- `assets/examples/research-citation-audit.webp`
- `assets/examples/policy-iteration-delta.webp`

Browser symptom:

- broken-image icon / alt text displayed inside the screenshot frame.

Root cause:

> ChatGPT's short opaque image-handle payload was passed to GitHub `create_blob` as though it were base64 WebP bytes.

The files therefore exist in GitHub but are **not valid WebP images**.

This is **not**:

- a CSS issue;
- a Vercel issue;
- a cache issue;
- an HTML path typo.

### Repair rule

Do not repeat the opaque-handle upload route.

Preferred repair:

1. use the original uploaded PNG bytes through a binary-safe/local/container path;
2. commit them as real PNG files, e.g.
   - `assets/examples/research-citation-audit.png`
   - `assets/examples/policy-iteration-delta.png`;
3. change the HTML references from `.webp` to `.png`;
4. verify the raw deployed asset actually decodes before merge;
5. only then remove the malformed WebP files.

If binary-safe transfer through the GitHub connector cannot be achieved directly, use a local checkout/container to copy the exact uploaded PNG bytes and push the repair branch. Do not fabricate or regenerate screenshots.

Repair branch already exists:

`website/fix-example-image-assets-2026-09-28`

At session end it had no successful content fix yet.

---

## Screenshots already captured in this conversation

Research run, user turn around 42:

- `image(20260928-151247).png` — citation audit
- `image(20260928-151431).png`
- `image(20260928-151502).png`
- `image(20260928-151533).png`
- `image(20260928-151605).png`

Policy run, user turn around 43:

- `image(20260928-151832).png`
- `image(20260928-151907).png`
- `image(20260928-151933).png`
- `image(20260928-152007).png`
- `image(20260928-152031).png`
- `image(20260928-152103).png`
- `image(20260928-152124).png`
- `image(20260928-152139).png`

If a fresh session can see conversation/library files, rediscover them via Files rather than asking the founder to re-upload immediately.

---

## Public proof publication rule

Across all public examples:

- show actual governed state where possible;
- pair screenshots with plain/crawlable text;
- say what experiment was run;
- say what the screenshot shows;
- say what remained unresolved;
- say what the human still had to decide;
- label them as controlled product behaviour / experiments;
- do **not** call them client case studies, client outcomes, comparative accuracy benchmarks or proof of universal superiority.

A screenshot does not expand the authority of the underlying evidence.

Publication rights remain separate from evidentiary use.

---

## Zenodo / publication notes — preserve

The **How it works** page intentionally includes these publication references.

### DCBR Engine paper

- venue: Zenodo
- DOI: `10.5281/zenodo.19204972`
- canonical record: `https://zenodo.org/records/19204972`

### RegWatch paper

- venue: Zenodo
- DOI: `10.5281/zenodo.19301680`
- canonical record: `https://zenodo.org/records/19301680`
- current public description:
  > Published paper on domain-configurable bidirectional reasoning for regulatory intelligence and epistemic infrastructure.

### Defensive disclosure

- publication ID: `IPCOM/000277741`
- IP.com public retrieval changed;
- use the prior-art search plus publication identifier rather than a fragile historical deep link.

Current publication framing:

> **The original thesis is public. The implementation doctrine has become stricter.**

Current explanatory note:

> The DCBR paper, RegWatch paper and defensive disclosure document the architecture and its regulatory-intelligence extension. Direct publication links avoid the fragile redirect/deep-link paths that previously produced blank pages.

Do not remove RegWatch from the publication section again.

### Interpretation rule

The papers document the original architecture/intellectual contribution. Current implementation is canonical for current product claims and may be stricter than the early paper/prototype mechanisms.

In particular, do not reintroduce a universal numeric confidence score or source-independence score into current website copy merely because older architecture/prototype language discussed related mechanisms.

Current implementation language remains:

> **No magic confidence number.**

Evidence posture remains multidimensional and inspectable.

---

## Zenodo technical-note anonymisation rules

If controlled experiment write-ups are published as Zenodo technical notes:

### Withdrawn document-led case

Use:

> **withdrawn public report from a leading consulting firm**

Do not:

- publicly name the firm;
- imply current public availability;
- redistribute the recovered report unless rights are clear.

### Supplier-contract Regulatory case

Use:

> **supplier privacy and security terms from a leading IT services provider**

Do not imply:

- endorsement;
- sponsorship;
- cooperation;
- client relationship.

### Advisory-method case

Use:

> **proprietary advisory methodology**

or:

> **specialist advisory-method experiment**

Do not publicly name GTMAtlas.

### EU–India FTA Policy case

The policy topic itself may be named. Preserve exact procedural/evidence status and do not turn the research into a political recommendation.

---

## Website invariants still to preserve

Do not regress:

- `google4c70a225f6d62de3.html` — preserve byte-for-byte;
- navigation label **Insights**;
- `blog/index.html` and existing Insights archive;
- contact form and `contact-success.html`;
- canonical tags;
- robots/sitemap;
- Vercel config;
- existing downloads/installers;
- public anonymisation rules;
- current product boundary:
  - local-first;
  - single-user current build;
  - localhost Python/SQLite;
  - no claim that team/cloud/enterprise is shipped.

---

## Immediate next task

Do **not** resume general website redesign.

First repair and verify the two screenshot assets on:

`website/fix-example-image-assets-2026-09-28`

Then inspect:

1. homepage controlled-research proof section;
2. `examples.html#research`;
3. `examples.html#policy`;
4. desktop and mobile rendering;
5. raw image URLs.

Only after the images visibly render should the repair be merged to `main`.

After that, pause and let the founder continue external website reviews before another structural rework.
