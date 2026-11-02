# Deployment and operations

[Back to Pilzradar](../README.md)

The production site uses a static S3 + CloudFront deployment. Follow [the current AWS instructions](aws-static.md). The server options below are retained for development and future deployments.

## Static deployment and optional servers

Deploy `_site/` to GitHub Pages or another static host after `npm run build:static`. The map and browser notebook work without a backend. Saved spots stay in the current browser and origin; use Export / Import to transfer them. Clearing site data removes them. This build disables API discovery and hides sharing and account-request controls. External map tiles and manual browser weather refresh still work.

## Recommended low-cost Swiss option (checked 14 October 2026)

[Infomaniak VPS Lite](https://www.infomaniak.com/en/hosting/vps-lite) lists a Linux server with **1 vCPU, 2 GB RAM and 20 GB disk for CHF 2.70/month excluding VAT**, paid for 12 months upfront (CHF 32.40/year excluding VAT). This is an unmanaged server: operating system updates and private off-server backups remain our responsibility. There are no included VPS Lite snapshots or availability SLA. This is a launch-size recommendation, not a load-tested capacity guarantee; monitor RAM, disk and response times and upgrade as necessary. Compose limits the application to 1 GB to leave memory for the OS and proxy.

The existing Node 24 application and SQLite run behind Caddy using Docker Compose. Keep a single application instance and persistent storage. The shared weather cache and opt-in research records can remain available; personal notebooks remain local.

For less server maintenance, [Infomaniak managed Node.js hosting](https://www.infomaniak.com/fr/hebergement/hebergement-nodejs) advertises CHF 10.91/month excluding VAT, with 250 GB and HTTPS. Confirm Node 24 and a persistent SQLite path in the selected plan before deploying there; the Docker instructions below target the VPS.

Our static build occupies approximately 597 MiB. Infomaniak's free 10 MB Starter hosting is too small. [Hosttech shared hosting](https://www.hosttech.ch/webhosting/) starts at CHF 6.90/month with 50 GB and can serve the static files; do not assume this PHP-oriented plan runs our Node backend.

### Domain and purchase

Use a `.ch` domain from a Swiss registrar such as [Infomaniak](https://www.infomaniak.com/en/domains). Choose and confirm the domain before purchase; availability and promotion/renewal prices must be checked in checkout. On 14 October 2026 the registrar reported `shrooms.ch` already reserved. The same search reported `shrooms-map.ch` available at CHF 4.64 for the first year, with the ordinary displayed price CHF 9.89, excluding VAT and optional add-ons. Availability is not a reservation; confirm renewal pricing in checkout. Do not configure `shrooms.ch` unless you own it. Hosting and domain are separate purchases. No account, paid server or domain has been provisioned by these scripts.

### Build a portable deployment archive

```sh
npm run check
npm test
npm run release
```

This creates `releases/shrooms-server.tar.gz` from an explicit source/data allowlist. It includes current local changes, even before a Git push, and excludes `.storage`, `.env`, browser records, Git history and developer caches. Upload only this archive to the new server and extract it in an empty application directory. Avoid extracting over a live deployment. Then follow the domain and Docker steps below, skipping the Git clone. Subsequent releases should be extracted into separate release directories; keep the same Compose project name (`docker compose -p shrooms ...`) to preserve named data volumes across directories.

## First deployment

1. Install Docker and Compose using the [official instructions](https://docs.docker.com/engine/install/ubuntu/).
2. Point your domain's A record (and AAAA only if IPv6 works) to the server.
3. Allow inbound TCP 80/443, optional UDP 443, and restricted SSH. Do not expose port 3000.
4. Clone the repository and configure it:

```sh
git clone https://github.com/andrinr/pilzradar.git
cd shrooms
cp .env.example .env
# Edit DOMAIN in .env; use a hostname without https:// or a trailing slash.
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 app proxy
```

Visit `https://YOUR_DOMAIN`. Caddy obtains and renews TLS certificates. `/api/health` reports application health and weather freshness separately; an upstream weather outage should not take the map offline.

Save a test spot in the browser notebook and reload the page. Export a backup and check that importing it does not duplicate the spot. The retired account endpoints return HTTP 410; existing databases remain untouched.

## Configuration

| Setting | Purpose |
| --- | --- |
| `DOMAIN` | Compose/Caddy hostname |
| `OPEN_METEO_API_KEY` | Optional commercial weather key; keep in `.env` |
| `PUBLIC_ORIGIN` | Exact HTTPS origin outside Compose; mandatory in production |
| `STORAGE_DIR` | Database/cache directory; Compose sets `/app/storage` |
| `WEATHER_AUTO_REFRESH=false` | Disable scheduled upstream requests for isolated tests |
| `TRUST_PROXY=true` | Trust the final forwarding address for rate limits; only behind the bundled proxy with port 3000 inaccessible publicly |
| `PORT`, `HOST` | Listener settings outside Compose |

Production cookies are HttpOnly, SameSite=Lax and Secure. Mutations validate the request origin; authenticated mutations also require a session CSRF token. Do not set `TRUST_PROXY=true` on a directly exposed app server.

The [free weather endpoint](https://open-meteo.com/en/pricing) is restricted to non-commercial use. A supplied commercial key switches the backend to the customer endpoint. Updates run every six hours; incomplete responses retain the last snapshot and failures back off for 15 minutes. Weather older than 48 hours is omitted from scores.

## Server backups

These preserve opt-in research submissions, anonymous feature votes and old account data, if present. Treat backups as sensitive because research records contain precise locations. They do not back up browser notebooks; use the notebook’s Export button for those.

Run an online SQLite backup rather than copying the active database file alone:

```sh
docker compose exec -T app node scripts/backup.cjs /app/storage/backups/shrooms.sqlite
mkdir -p backups
docker compose cp app:/app/storage/backups/shrooms.sqlite ./backups/shrooms.sqlite
```

Schedule this daily on the host, retain dated copies, and transfer them to private off-server storage. Restrict access: backups contain account hashes, sessions and private locations. The named volume protects against container replacement, not server loss. Never use `docker compose down -v` for a routine update.

### Restore

First make a backup of the current database. Stop the app before replacing files. The following uses a locally prepared `backups/shrooms.sqlite`:

```sh
docker compose stop app
docker compose run --rm --no-deps --user root -v "$PWD/backups:/restore:ro" app sh -c 'rm -f /app/storage/shrooms.sqlite-wal /app/storage/shrooms.sqlite-shm; cp /restore/shrooms.sqlite /app/storage/shrooms.sqlite; chown node:node /app/storage/shrooms.sqlite; chmod 600 /app/storage/shrooms.sqlite'
docker compose up -d app
```

Use a known-good backup, then verify health and the contribution and feature-request tables. Weather can be rebuilt automatically; it is not required in the database backup. Test restoration on a separate environment before relying on a backup schedule.

## Updates

Back up first, record the current commit, then:

```sh
git pull --ff-only
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 app
```

For rollback, check out the recorded release commit and rebuild. Future schema-changing releases may require restoring the matching backup; do not assume downgrades are compatible. The current schema is SQLite `user_version=1`.

Caddy and Node image tags receive updates on rebuild. Monitor disk space, `/api/health`, weather freshness and backup completion. Rate limits are process-local and reset on restart. Add upstream abuse controls for anonymous submissions if traffic grows. Review and remove research records according to your retention policy; no public read or user withdrawal endpoint is provided.

## Static alternative

`npm run build:static` produces `_site/` for GitHub Pages or any static host. No private data or backend files are included. Accounts are unavailable there. The full backend must run at the site's origin; cross-origin API hosting is deliberately unsupported.
