# Automotive manufacturing Article 02: website review branch

**Date:** 13 November 2026  
**Status:** prepared in `preview/automotive-manufacturing-article02-2026-11-13`; **not merged into main and not live on the Epistamate website**.

## Included in this preview

- New static HTML article: `blog/industry-insights/automotive/ai-automotive-manufacturing.html`, converted from the final source-checked manuscript v0.6.
- Automotive landing: two equally weighted image-top cards in publication order, side by side on desktop and stacked on mobile. No repeated Article 01 feature/list.
- Industry Insights parent: both article links.
- Insights index: both articles in the Industry Insights sidebar, the new article at the front of the collection, and 24 article entries.
- Archive: 24 entries with the new article.
- Article 01: original text, canonical and OG retained, with a series navigation link to Article 02.
- Sitemap: Article 02 URL and updated series dates.

## Image review

- Original R&D image: `assets/articles/automotive-industry-feature.webp`, not changed.
- New manufacturing cover in the branch: `assets/articles/automotive-manufacturing-assembly.webp`. It is a **compressed, low-resolution review copy** of an AI-generated assembly scene; it contains a partly assembled graphite-silver vehicle with robotic arms, dark blue-grey lighting and muted cyan accents. The original high-resolution generation is preserved in the conversation at `/mnt/data/futuristic_automotive_assembly_line.png`. **Replace review image with full-resolution, optimised WebP before production publication**, ideally 1120×630 or better for the OG image. This review copy is only 280×158 pixels.
- Article 01 car faces left; Article 02 car faces right. The opposing orientations are intentional in a side-by-side pairing rather than using a horizontally flipped photograph. Evaluate actual card crops before merging.

## Checks performed

- Article title, canonical, OG image URL, JSON-LD BlogPosting date (2026-11-13), author and series membership.
- HTML article text has eight substantive H2 sections including four accessible FAQ items, matching the first article's FAQ style.
- Direct links from both article pages to their companion and automotive series.
- Two cards, two sidebar links, 24 main-index and archive entries, corrected article count and sitemap article URL.
- Production-source numeric checks: Magna device removals vs faulty vehicles, Bosch 2021 reported pilot savings, Apollo startup ML plus Bedrock-assisted APC control and operator oversight, defect-warning retrospective thresholds, BMW classical OR, CIRP simulated planning, Xiaomi and DeepMind PoCs and Figure's trial.
- Source links are inline static HTML, article body contains **no** promotional table or illustration.

## Still required before merging

- Swap low-res image for optimised high-res asset and check its actual desktop/mobile crop.
- Browser visual/keyboard review at narrow and wide breakpoints (the source-level checks are not a live browser acceptance).
- Final approval of publication copy and site deployment.

Do not automatically merge or deploy.
