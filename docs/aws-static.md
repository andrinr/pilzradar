# Static deployment on AWS

Build with Node 24 or later:

```sh
npm run build:static
```

Publish only `_site/`. There is no API, database, account service, or secret in this build. Saved places and sightings stay in browser storage; export the notebook before clearing browser data or changing browsers.

## Hosting

Use a private S3 bucket with Block Public Access enabled and a CloudFront distribution using the bucket's **REST origin**, Origin Access Control with signed requests, HTTPS redirects, and `index.html` as the default root object. Restrict the bucket policy to the distribution ARN. Choose your preferred S3 region; CloudFront is a global service. Domain certificates for CloudFront belong in ACM us-east-1. No SPA error rewrite is needed: navigation uses URL queries and hashes.

Official instructions: [CloudFront origin access control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html), [S3 origin HTTPS](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-https-cloudfront-to-s3-origin.html).

## Upload and cache

Set shell variables `SHROOMS_BUCKET` and `SHROOMS_DISTRIBUTION` to your existing resources. These commands update that bucket; review the names first. Upload data before the HTML entry point. Do not use `--delete`: old open tabs can still request a previous release.

```sh
aws s3 sync _site/ "s3://$SHROOMS_BUCKET/" --exclude 'index.html' --exclude '*.json.gz' --cache-control 'public,max-age=3600'
aws s3 sync _site/data/ "s3://$SHROOMS_BUCKET/data/" --exclude '*' --include '*.json.gz' --content-type 'application/octet-stream' --cache-control 'public,max-age=3600'
aws s3 cp _site/index.html "s3://$SHROOMS_BUCKET/index.html" --content-type 'text/html; charset=utf-8' --cache-control 'no-cache'
aws cloudfront create-invalidation --distribution-id "$SHROOMS_DISTRIBUTION" --paths '/*'
```

Important: `.json.gz` files are binary application payloads. **Do not set Content-Encoding: gzip** on them: the worker explicitly decompresses their bytes. Set no CloudFront transformation on `data/*`; normal compression is fine for HTML, CSS and JavaScript. See [CloudFront compression](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/ServingCompressedFiles.html).

The provisioned Free plan uses CachingOptimized with a one-second minimum TTL; invalidate after each release. Configure a response headers policy for `X-Content-Type-Options: nosniff`, Referrer-Policy `strict-origin-when-cross-origin`, and HSTS after HTTPS is working. Do not block geolocation; it is requested only by the location button. A CSP must allow same-origin workers, scripts and data, tile images from wmts.geo.admin.ch and weather requests to api.open-meteo.com. Test it in report-only mode before enforcing.

## Data and operations

`npm run weather:refresh` refreshes the existing public weather anchors. Then rebuild and upload. Run this periodically if fresh bundled weather is needed; browser refresh also remains available. Respect provider terms and quotas; data-source precision is documented in the model section. Do not bulk prefetch third-party map tiles.

Before going public: supply the operator/contact details, review all language versions, confirm attribution and source licenses, test location access over HTTPS, export/import a notebook, and inspect mobile overview/detail views. Monitor AWS costs with a budget alert. Storage, requests, and CDN traffic depend on usage; no fixed price is promised.

The origin and CDN receive routine access metadata such as IP addresses. Map requests go to swisstopo and optional weather requests to Open-Meteo. There is no account service. Optional Cloudflare Web Analytics uses a separate privacy-gated loader; see [analytics.md](analytics.md). Saved coordinates are not sent to this site's operator by the static build.

## Provisioned installation

The approved deployment uses the [resource identifiers](../deployment/aws.json) recorded in the repository. The S3 origin is private in Frankfurt with Block Public Access on, ACLs disabled and SSE-S3 encryption. Its read policy is restricted to the recorded CloudFront distribution. CloudFront is on the Free flat-rate plan, redirects HTTP to HTTPS, enables HTTP/2 and HTTP/3, and uses the AWS-managed SecurityHeadersPolicy. The domain is registered with Infomaniak; current connection status is recorded below.

The $5 monthly AWS budget is an account-wide warning, not an enforced spending cap. Notifications trigger at 85% and 100% actual spend and 100% forecast spend; recipient settings live only in AWS.

On the Free plan, use the managed CachingOptimized policy (minimum TTL one second); custom cache policies require a higher plan. Send `Cache-Control: no-cache` for index.html and `public,max-age=3600` for assets, then invalidate the distribution after a release. The one-second minimum means HTML is not guaranteed to revalidate on every request. Never upgrade the pricing plan automatically.

Verified live on 2026-11-02 at [the public map](https://dml79psi3sb8a.cloudfront.net/). Run `npm run check:deployed` after publishing: it checks release fingerprints, ten real datasets, HTTPS and security/cache headers, and blocked anonymous S3 access against the local `_site/` build. Browser checks also covered mobile layout, species switching, environmental context and 50 m forest detail.

## Custom domain — pending activation, 2026-11-02

Infomaniak lists `pilzradar.ch` through 2027-10-31. The account has a paid TWINT invoice covering the domain and DNS/Privacy options; do not repeat checkout. Renewal Warranty is disabled. Public DNS delegation was not yet visible at the last check, although Infomaniak's authoritative server returned the newly configured records.

Prepared at Infomaniak: `www` CNAME to the existing CloudFront hostname, both ACM validation CNAMEs recorded in `deployment/aws.json`, and a 301 redirect from the bare domain to `https://www.pilzradar.ch`. Root HTTPS forwarding still needs verification; a redirect target using HTTPS does not by itself prove TLS on the redirecting host.

The CloudFront Add domain wizard requested a non-wildcard certificate for both names in us-east-1 and is waiting for DNS validation. The distribution's aliases and TLS certificate have **not** yet been changed. After public delegation works: validate the certificate, complete the wizard, verify both HTTPS names and HTTP redirects, then update the canonical deployment URL. The current CloudFront URL remains the verified live address.

## Domain connection update — 2026-11-02

Public delegation is active and the personal Google account has verified ownership of the Domain property through an additional TXT record. Keep that record in Infomaniak; it is not a tracking script. The existing ACM certificate is issued and attached to CloudFront for both `pilzradar.ch` and `www.pilzradar.ch`. `https://www.pilzradar.ch/` returns HTTP 200 with valid TLS, so it is now the canonical release origin.

The bare domain still points at Infomaniak's forwarding service. Its HTTPS endpoint returned a self-signed certificate during verification; do not bypass the warning or call the bare HTTPS address ready. Resolve root-domain HTTPS before using it in public links. An HTTPS redirect destination alone does not provide a certificate on the source. Existing CloudFront links remain available. No Google Analytics was enabled. Optional Cloudflare aggregate measurement is documented in [analytics.md](analytics.md).
