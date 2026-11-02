# Bare-domain redirect

The website remains on private S3 and CloudFront at `https://www.pilzradar.ch/`. Infomaniak Starter hosts only these tiny redirect files for the bare domain, using the free plan included with domain registration.

Upload `.htaccess` and `index.html` to the Starter web root through Web FTP. Do not upload the application or this README there. The Apache rule returns a permanent 301 to the canonical www hostname, preserving paths and query parameters. The ACME challenge path remains available for automatic certificate renewal.

DNS at Infomaniak:

- Apex A: `128.65.195.180`, TTL 300 seconds.
- No apex AAAA: Starter does not provide IPv6.
- No old forwarding TXT values (`1|www.pilzradar.ch`, `p|https`).
- www CNAME: `dml79psi3sb8a.cloudfront.net.`
- Preserve AWS certificate validation CNAMEs, Google verification, email records and DNSSEC configuration.

The Starter certificate covers only `pilzradar.ch`; AWS Certificate Manager handles www. The automatically created Starter www alias was unlinked with **Delete the DNS entries for this domain** disabled. Do not add it back or change the www CNAME: the unused alias caused certificate installation to fail even when unchecked in the certificate form.

Run `npm run check:deployed` after DNS and certificate changes. It verifies TLS without exceptions and checks both HTTP and HTTPS permanent redirects, including deep links and query strings.
