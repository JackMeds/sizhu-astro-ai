# Search Console checklist

Search Console data is account-scoped, so it cannot be inspected from the repository without the site's Google account. After the Pages deployment is live:

1. Add the `astrocopy.jackmeds.top` Domain property in Google Search Console and complete DNS verification.
2. Submit `https://astrocopy.jackmeds.top/sitemap.xml` once. The sitemap is generated during every web build and contains the stable tool, Agent, guide, language, about and privacy URLs.
3. Use URL Inspection → Request indexing for the homepage, `/bazi/`, `/ziwei/`, `/liuren/`, `/true-solar-time/` and `/agent/`.
4. In Page indexing, distinguish “Discovered – currently not indexed” from “Crawled – currently not indexed”; do not respond by repeatedly changing titles or URLs.
5. Check that each inspected URL reports a self-canonical URL, `index,follow`, and no robots blockage. `robots.txt` explicitly allows `OAI-SearchBot` and all other crawlers.
6. Record impressions, clicks, queries and average position weekly for the six priority URLs. A new or recently rebranded site can take days to weeks to settle, so the first observation window should be 7–14 days.

The repository can verify the public prerequisites, but only the authenticated Search Console account can show indexing state, impressions or request indexing.
