# Epistamate publication and search metadata standard

Updated: 2026-11-20

## Author identity

Use the same verified author identity for articles written by Abhishek Sinha:
- Name: Abhishek Sinha
- Canonical person @id: https://abhishek-sinha-bgl.github.io/about.html#person
- Personal author page: https://abhishek-sinha-bgl.github.io/about.html
- ORCID: https://orcid.org/0009-0006-1638-9614
- LinkedIn: https://www.linkedin.com/in/abhishek-sinha-bgl

Add the ORCID link discreetly to the visible article byline. In Article/BlogPosting JSON-LD, use an author Person with @id, name, url, sameAs including ORCID, and identifier as the ORCID URL. Do not label ordinary commentary as peer-reviewed scholarly research.

## Per-article checklist

1. Unique descriptive title and accurate summary meta description, grounded in article content.
2. Absolute canonical URL on https://epistamate.com/; use that exact URL for og:url and mainEntityOfPage.
3. Article/BlogPosting JSON-LD with factual headline, author identity, publisher, and accurate publication/update dates; never invent update dates.
4. Visible author byline and ORCID link, accessible link text, and relevant internal links to the Insights hub and genuinely related reading.
5. Include new indexable pages in sitemap.xml; do not include preview, private, redirect or duplicate URLs.
6. Confirm valid JSON-LD, no duplicate canonical tags, correct robots directives, valid internal links and unchanged research claims.
7. Use one reviewed production merge for a batch of site changes, to minimise Vercel production deployments.

## Domain and discovery

The canonical hostname is epistamate.com (without www). Verify www to apex redirect in Vercel domain settings and with an HTTP request; do not assume a canonical tag alone performs a redirect. robots.txt already points to sitemap.xml. Inspect Search Console indexing and query/page performance before rewriting content for SEO. ORCID is an identity and attribution signal, not a guaranteed ranking factor.

## Editorial guardrails

Preserve the distinction between independent research papers deposited on Zenodo and commentary or industry articles. Do not claim external peer review or independent validation without evidence. Do not rewrite article conclusions for keywords or generate new niche articles solely for search rankings.
