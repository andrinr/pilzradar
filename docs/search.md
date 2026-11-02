# Search visibility

The build emits five language directories, each with `mushrooms.html` and 22 species pages under `species/`. These are fully rendered HTML without client-side rendering or map datasets (the deployed site can include optional aggregate analytics). Content comes from the reviewed species catalogue and existing translations; numerical model settings are not presented as established ecology. Observation-only entries do not claim a suitability map. The map footer links to the catalogue in the selected language, and species links open the matching map profile.

Explicit `.html` paths work with private S3 REST origins without directory-index rewrites. Each reference page has a self-canonical, reciprocal `hreflang` links (de/fr/it/rm/en and English x-default), a description, Open Graph metadata and WebPage JSON-LD. No review ratings, medical/identification claims or fake expertise markup are generated. The map's query variants canonicalize to the root app; the reference translations remain independently canonical.

## Release origin

`SHROOMS_SITE_URL=https://your-live-domain.example npm run build:static` overrides the canonical origin. Otherwise `deployment/aws.json` supplies the verified live URL. Do not switch to a pending or unvalidated domain. Builds without either configuration still generate the reference pages and allow crawling, but omit absolute canonical/sitemap metadata. Rebuild and publish all HTML, robots.txt and sitemap.xml when changing domains, then permanently redirect the old canonical domain if supported.

`robots.txt` allows crawling and advertises `sitemap.xml`. The sitemap contains the map and 115 reference URLs, with no map-state query combinations or invented modification dates. `tests/search-pages.test.cjs` checks all local links, translated content, metadata, language reciprocity, observation-only disclaimers and size limits. Run it locally as part of `npm test`.

## Google Search Console — operator step

Once the final domain resolves over HTTPS:

1. Sign in to https://search.google.com/search-console/ with the Google account that should own the property.
2. Add a **Domain property** for `pilzradar.ch`. Copy Google's exact `google-site-verification=…` TXT record into the existing Infomaniak DNS zone. Keep the record after verification. No token is invented or stored in this repository.
3. Submit `https://www.pilzradar.ch/sitemap.xml` only after this is the verified deployment origin and those pages return HTTP 200.
4. Inspect a German and French species URL with **URL Inspection → Test live URL**. Confirm rendered text, canonical and crawl access. Request indexing for representative pages; submission does not guarantee indexing or rankings.
5. Monitor the Pages and Core Web Vitals reports. A new or low-traffic site may have insufficient field data.

The operator signed in and approved DNS ownership verification on 2026-11-02. Google confirmed the `pilzradar.ch` Domain property. The verification TXT record stays in Infomaniak; no Google Analytics was enabled.

## Performance validation

Reference pages use system fonts and a small local stylesheet, without map scripts, webfonts or geodata fetches. Optional aggregate analytics are described in [analytics.md](analytics.md). The build tests cap each HTML page at 16 KB. Run mobile PageSpeed Insights on the public map and a guide page after each major release, retaining lab results and distinguishing them from field Core Web Vitals. A fast HTTP response or clean responsive screenshot alone is not a Core Web Vitals pass. Test map pan/zoom separately: scores and geodata affect interaction performance while search readers need none of them.

Official references: [Google multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites), [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [CloudFront directory index behavior](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DefaultRootObject.html).

## Published verification — 2026-11-02

All 116 sitemap URLs were fetched from the deployed CDN and matched the release bytes, with HTTP 200 and HTML content types. Robots and sitemap match the build. Main assets, ten real datasets, security/cache headers and blocked direct S3 access also passed. Browser checks covered German mobile layout, French translation, language switching, and a guide link selecting chanterelle on the map.

[Recorded mobile lab results](../benchmarks/pagespeed-20261102.json): the German chanterelle guide scored 100 in Performance, Accessibility, Best Practices and SEO, with 0.8 s LCP, zero blocking time and zero layout shift. The map scored 72/95/96/100 respectively, with 1.7 s LCP and about 1.53 s blocking time. The main outstanding performance target is map startup work; this release does not claim a perfect map performance score. Neither page had sufficient field data for Core Web Vitals. Search Console and final-domain status were updated after this audit, as recorded below.

## Search Console activation — 2026-11-02

After explicit operator approval, the actual Google verification TXT record was published to the existing Infomaniak zone. Google confirmed ownership for the operator's personal account. All canonical/sitemap URLs were rebuilt and published with `https://www.pilzradar.ch/` as origin. Production checks passed for the new origin, all 116 public pages and existing datasets. Google processed the sitemap without errors and reported 116 discovered pages; discovery is not a guarantee that they are indexed.

No Google Analytics account, tag, cookie, event collection or Search Console/Analytics integration was added. Search Console reports Google Search impressions/clicks/queries/position, not all visits or on-site behavior. Initial reports are still processing. The bare domain's Infomaniak HTTPS forwarding remains a separate unresolved certificate issue; use the verified `www` URL.

Link previews use static Open Graph and large-image Twitter Card tags on the homepage and every reference page. `social-preview.png` is a public 1200×630 PNG derived from the site's vector mushroom artwork (`docs/media/link-preview.svg`); no map coordinates or saved places are embedded. Titles and descriptions on reference pages follow the page language. Query-string variants of the map share one general preview because static hosting does not render query-specific HTML. Share a language/species reference URL for a localized species preview. Platforms cache unfurls, so an existing conversation may retain an older card until that platform refreshes it. The release checks verify public image bytes as well as page metadata; this cannot guarantee identical crops in every messaging app.
