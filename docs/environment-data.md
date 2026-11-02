# Environmental context

Three of the four recommended source families are imported. The fourth, national dominant host trees, requires access from its authors. No source access request has been sent.

| Dataset | Integration | Limits |
| --- | --- | --- |
| WSL sky view, 5 m | Summer and winter forest-weighted 50 m means; valid-pixel coverage | Hemispheric openness, not vertical canopy cover. NFI VHM 2024 version; actual acquisition years vary. |
| WSL forest soil, 25 m | Clay/sand at 0–5 cm, minimum expected soil depth, and original 90% prediction intervals | Sampled at each 50 m context-cell centre. Predictions, not measurements; NoData retained. |
| MeteoSwiss daily grids, 1 km | 14-day rain, 7-day mean temperature and relative sunshine; preliminary snapshot through **2026-10-31** | Latest complete common day available at import. Each field preserves its own grid; all days required at each pixel. Relative sunshine is %, not hours. The rainfall product’s effective spatial information is regional (roughly 20–30 km), not a new observation every kilometre. Rain uses the source daily-period convention. |
| WSL dominant trees, 10 m | Access status and source link only | Public catalogue offers only a preview. Missing national host species stay unknown. |

Open **Score details → Environmental context** on a selected forest cell. These inputs are **context only, with zero score weight**. Existing pH weighting and Open-Meteo scoring remain unchanged. Adding a numerical relationship needs species-relevant evidence and held-out validation; openness must not be substituted for crown cover or soil texture treated as measured moisture. A 500 m overview selection samples one 50 m context cell at its centre, not an area average of the overview polygon.

## Static delivery and performance

- 1,085 spatial context tiles, **59.3 MB gzip total**, largest **138 kB**; fetched only when a user expands context for a selected cell. No national raster is downloaded by the browser.
- One **215 kB gzip** climate bundle, also fetched on demand and cached. Source dates remain visible; snapshots older than four days carry an age warning. No browser request to MeteoSwiss or EnviDat.
- Twelve little-endian unsigned 16-bit channels per 128×128 tile, 0.1-unit scaling and 65535 NoData. Climate uses signed 16-bit channels with −32768 NoData, allowing negative temperatures.
- The decoded spatial cache is capped at eight tiles. Source script previews and binary static builds use the existing loaders/workers. Nothing enters the map's zoom, ranking, or scoring loops.
- Source raw rasters and archives are kept in ignored `.cache/environment` (about 2.1 GB of downloads); they are excluded from `_site`.

## Rebuild

From the repository root, with the existing national `.cache/tlm3d-forest25.tif` mask (see `scripts/build_detailed_habitat.py`):

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/requirements.txt
npm run data:environment
npm run data:climate -- --end 2026-11-01
PYTHONPYCACHEPREFIX=.cache/pycompile .venv/bin/python scripts/validate_environment.py
npm run build:static
SHROOMS_VERIFY_STATIC=1 node --test tests/worker.test.cjs tests/environment.test.cjs
```

`data:climate` defaults to yesterday and searches back up to six additional days for a common published item. It refuses incomplete day windows rather than silently summing fewer days. Successful output replaces the snapshot; a download/validation failure retains the previous bundle. Refresh before publishing or rerun this preparation command regularly in a deployment pipeline; static hosting itself does not refresh it. It never fabricates today's conditions from old data.

Source-file hashes, resource URLs, units, grids, depth and sampling definitions travel with the bundles. Attribution and derivative licensing are in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Application code remains MIT; environmental WSL derivative bundles retain CC BY-SA 4.0.

## Verification

`tests/environment.test.cjs` checks grid boundaries, byte order, signed temperature, missing pixels, complete day windows, physical ranges, soil prediction intervals, retry/cache behavior, server allowlists and no scoring coupling. `scripts/validate_environment.py` independently compares 20 distributed packed cells against the native canopy/soil rasters and verifies that incomplete climate windows remain missing. Tests run without network; raw-source validation is a separate preparation check.

Before promoting climate into scoring, compare matched dates/periods against the current weather, test freshness and fallback behavior, then run the spatial/temporal evaluation in [the research review](research/predictors-and-data.md#validation-gate). Host-tree import additionally needs the actual raster, class/NoData/applicability definitions and verified redistribution conditions. No preview-image classification or fabricated confidence is used.

MeteoSwiss [RprelimD product documentation](https://www.meteoswiss.admin.ch/dam/jcr:86ca15d3-2b56-4753-84fb-135e40d6a5a1/ProdDoc_RprelimD.pdf) explains the 06:00–06:00 UTC precipitation day, preliminary quality, and regional effective resolution.
