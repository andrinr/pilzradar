# Publication task list

Purpose: compare experimental mushroom habitat across Switzerland, inspect species-specific evidence and uncertainty, and record observations privately on the device. Scores are habitat estimates, not validated probabilities, identification advice, or permission to collect.

## Work for this release
- [x] Move bundled data decoding and JSON parsing off the main thread; keep file previews supported.
- [x] Serve compact binary gzip datasets on static hosts and keep downloads scoped to the viewport.
- [x] Improve LOD overview rendering and cancel obsolete detail work while navigating; retain native forest coverage up close.
- [x] Make mobile controls, map, notebook and details usable without horizontal scrolling.
- [x] Make data coverage, weather freshness, privacy and collecting limitations easy to find.
- [x] Provide repeatable private S3 + CloudFront deployment instructions and cache rules.
- [x] Run model/rendering/static checks and inspect desktop/mobile previews.

## Publication decisions
- Domain, AWS account/region and contact address must be supplied before a production deployment.
- Do not publish precise saved locations. Local notebook export is the backup mechanism.
- Preserve source attribution; fetch only documented public sources and disclose missing inputs instead of inventing detail.
- Retain English, German, French, Italian and Romansh. New interface copy needs the same coverage.
- Browser geolocation requires HTTPS. External maps and weather may fail; bundled habitat must remain usable.

## Follow-up data work
- Refresh existing source snapshots through the preparation scripts, with provenance and dates.
- Seek better host-tree/canopy data outside Zürich; current national coverage does not justify invented precision.
- Validate ecological weights against consented observations before claiming calibrated probabilities.

## Verification notes (2 November 2026)
- 64 behavior checks passed across the main run and the listener-enabled server rerun; two binary-worker/release checks also passed.
- Existing geometry, species, language, privacy, notebook and model checks retained.
- Static bundle: 6,600 datasets, 456,880,276 compressed bytes versus 609,524,777 envelope bytes (25% smaller).
- Current weather fetched for all 161 configured anchors. Forest/tree/terrain snapshots retain their documented source dates.
- Mobile viewport inspected at 390 × 844. Device performance and real CloudFront headers still need production smoke testing.
- No AWS resources created or deployment performed. Operator/contact details and domain remain publication prerequisites.
- Mobile zoom check reached 50 m detail with 5,309 visible forest shapes and no browser console errors. This is a correctness check, not a phone frame-rate benchmark.
