# Performance work and repeatable benchmarks

## CPU baseline (2 November 2026)

Run from the repository root, using Node 24+:

```sh
npm run bench -- benchmarks/current.json
BENCH_ITERATIONS=10 npm run bench -- benchmarks/current.json
```

The fixture uses all **85,969 national cells**, **137 weather anchors**, the checked-in weather snapshot, and a fixed September date. It measures interpolation, three species, ranking, contrast calculation and 1 km summaries. The output records CPU, Node version, every sample, median and p95. With five samples, p95 is simply the slowest sample. Node VM timing is not a browser FPS measurement. Compare on the same machine with the same inputs; do not turn absolute timings into a CI gate across different runner hardware.

Raw results: [before](../benchmarks/before.json), [after](../benchmarks/after.json).

| Operation | Original median | Compact median | Reduction |
| --- | ---: | ---: | ---: |
| Porcini scoring | 401 ms | 250 ms | 38% |
| Chanterelle scoring | 407 ms | 261 ms | 36% |
| Salmon milkcap scoring | 220 ms | 121 ms | 45% |

These compact results avoid allocating detailed factor objects and calculating contribution multipliers for every cell. The detailed explanation is computed only for the selected cell or an opened summary. Tests compare compact and detailed outputs across all 19 profiles, real sampled cells, wet/dry/missing inputs and missing hosts. The numerical model remains the shared reference. Float32 output holds the integer scores exactly and preserves NaN for unavailable calculations.

## Browser scenarios

Build `npm run build:static`, serve `_site/` over HTTP, and open `/?bench=1&cold=1&lang=en#explore`. The `cold=1` diagnostic bypasses the browser cache for bundled datasets. It does not simulate a remote CDN, slow network or uncached third-party basemap tiles. Remove `cold=1` for warm-cache runs. Diagnostics appear at the bottom of the page and are neither persisted nor transmitted.

Record the report after each of these actions:

1. Fresh navigation and the first complete national overview.
2. Switch Porcini → Chanterelle → Porcini; repeat at least ten times.
3. Jump to Zürich; zoom through 1 km overview, 500 m overview and 50 m detail.
4. Pan east/west repeatedly across dataset boundaries; repeat the path warm.
5. Change species in detailed view and inspect a clicked cell's factor breakdown.
6. Repeat at a phone viewport and on a physical phone; repeat with workers/OffscreenCanvas unavailable to check fallback behavior.

`workerScore` is worker computation time. `recompute` includes worker wait and UI commit; it is not a main-thread blocking measurement. `mainCommit` measures that commit. `overviewReady` and `detailReady` are measured from the last navigation/scoring action to readiness events; overlapping requests can create multiple samples. The Long Tasks API is browser-dependent. A rolling frame percentile includes idle frames and must not be reported as sustained interaction FPS. Save raw results and the exact build before comparing.

The staged browser observations in [browser-stages.json](../benchmarks/browser-stages.json) exposed a 1,131 ms UI task during species redraw. Offscreen painting removed that particular stall; subsequent observations still showed work worth optimizing. They are single local observations, not a universal speedup claim.

## Architecture and bounds

- Binary gzip datasets are decoded in a worker on static hosts.
- National weather interpolation and score batches run in a separate worker. Six species result arrays are cached (roughly 4 MiB for national score and stable-order arrays), invalidated when weather or date changes. Results transfer as compact buffers. Stable integer bucket ranking replaces comparison sorting for the national view.
- Overview geometry and Path2D painting run on OffscreenCanvas when supported. Geometry/projection caches are bounded; style updates reuse group membership and send new colours. Main-thread fallback yields between drawing batches.
- Geometry remains scoped to the viewport and zoom level. Detailed local scores and forest masks retain their source precision.
- Browsers without workers use cooperative batches; file previews remain supported. No cross-origin isolation or special server execution is required.
- `npm run build:static` fingerprints worker dependencies and datasets. Serve `.json.gz` as binary payloads without Content-Encoding; see [AWS deployment](aws-static.md).

## WebAssembly and WebGPU

Neither is required by this release. The profiled stalls involved repeated object allocation, weather/scoring passes and canvas drawing on the UI thread. Those costs are addressed by caching, compact results and offscreen workers. A GPU implementation would also need a geometry representation and correctness checks; it would not remove DOM updates or data-transfer costs. Any future WASM/WebGPU prototype should be benchmarked against this reference with transfer/setup costs included and identical score/geometry checks before becoming a default.

Remaining work includes controlled physical-phone measurements, remote CloudFront/network tests, memory profiling during long cross-country browsing, and more CPU/GPU traces for dense local rendering. This report does not claim optimal performance on every device.

The full suite passed 68 tests before the final ranking optimization; the ranking change has its own stable-order regression test. The release assertion runs separately against the binary static build.

## Final browser observations

Raw reports: [uncached bundled-data navigation](../benchmarks/browser-cold.json), [ten species switches](../benchmarks/browser-switches.json), [dense local view](../benchmarks/browser-detail.json), [phone-sized viewport](../benchmarks/browser-mobile.json).

- Interactive map: **523 ms** in the recorded uncached local dataset navigation. Weather recomputation completed after another 439 ms, with the map already initialized.
- First Chanterelle switch: **92 ms**. Nine subsequent cached switches: **51 ms median**, **69 ms maximum**. These include score delivery and UI commit; worker overview painting can finish afterward.
- Dense 50 m view: **7,642 shapes** loaded. The recorded initial detail readiness was **717 ms**; a species change during panning took **112 ms**, with a 32 ms UI commit.
- At 390 × 844 on the same desktop CPU, the newly selected Amethyst profile took **220 ms**, with 69 ms in the worker and 48 ms in the UI commit. No horizontal overflow or console errors were observed.

Long tasks have not been eliminated: startup still included approximately 100 ms tasks, and some cached switches slightly exceeded 50 ms. These are local observations on an Apple M5 Max, not physical-phone or CDN benchmarks. The reports include idle time; use action samples and task durations, not elapsed page time or idle frame percentiles, for comparisons.

## Persistent static-data cache

The binary static build stores validated gzip dataset blobs in worker-side IndexedDB (`shrooms-map-cache`), bounded to 64 MiB and 512 entries with least-recently-used eviction. Cache keys include the complete versioned URL, so a changed release cannot return old datasets. A dataset-version change currently invalidates reuse across the release, including otherwise unchanged files. Notebook localStorage is independent and never touched.

Denied/unavailable/quota-limited storage falls back to network loading. Corrupt cached payloads are removed and fetched again. Writes happen after the decoded data is posted to the UI. `?bench=1&cold=1` bypasses this cache and requests an HTTP cache reload. Browser eviction can remove cached data; this is an optimization, not guaranteed offline support (online basemap tiles are not included). Source-envelope/development previews retain ordinary HTTP caching; this persistent cache applies to the binary static release.

Run `npm ci` before tests. `tests/tile-cache.test.cjs` exercises real IndexedDB request semantics with the development-only fake-indexeddb package, covering persistence, version isolation, byte/entry bounds, LRU behavior, failure fallback, corruption recovery and benchmark bypass. No production dependencies were added.
