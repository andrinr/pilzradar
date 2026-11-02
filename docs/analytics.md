# Aggregate analytics

Cloudflare Web Analytics is an optional manual integration; hosting stays on AWS and DNS stays with Infomaniak. The public beacon token belongs in `deployment/analytics.json`, with `enabled: true`. It is a site identifier, not an account API credential. Never put account API keys here. The build rejects an invalid token or a hostname different from the canonical release origin. Disable it and rebuild to remove the integration.

The build adds a small deferred local loader to the map and rendered reference pages. The privacy page itself has no analytics. The loader blocks requests when Do Not Track or Global Privacy Control is enabled, outside the production HTTPS hostname, on previews, and on URLs containing unexpected parameters or fragments. Cloudflare automatic SPA measurement is disabled: changing a species, panning the map and editing the notebook do not generate custom analytics events. No notebook, geolocation or browser storage API is read by our loader. Unit tests cover these boundaries.

This is aggregate traffic/performance measurement, not an anonymous network connection. Cloudflare receives IP and HTTP metadata when its script and beacon are requested. The third-party script can process page URLs, referrers and timing data. Do not put personal data in public page URLs or introduce analytics custom events. Cloudflare states that the analytics service does not use cookies, local storage or visitor fingerprinting. Its current FAQ says query strings are not logged; that does not mean they never reach Cloudflare. Treat the vendor script as an external dependency and review changes periodically.

The five-language privacy page explains the integration. Ad blockers, DNT/GPC and disabled JavaScript make counts incomplete; counts are not unique people. Search Console continues to measure Google search visibility separately. The dashboard may take a few minutes to show new data. Validate the public release and inspect the dashboard after deployment; never fabricate visits by submitting notebook data.

Official references:

- https://developers.cloudflare.com/web-analytics/about/
- https://developers.cloudflare.com/web-analytics/get-started/
- https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/
- https://developers.cloudflare.com/web-analytics/faq/
