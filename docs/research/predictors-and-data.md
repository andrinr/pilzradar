# Predictor and Swiss data review

Reviewed **2 November 2026** against the current implementation in `src/scoring.js`, `src/weather.js`, `src/data.js` and the bundled-data documentation. This was the investigation and implementation proposal. **Update: canopy, soil texture/depth and MeteoSwiss context are now imported; no new score weights were enabled.** See [implementation and rebuild instructions](../environment-data.md). The initial review inspected metadata through official catalogues and EnviDat’s public API. The subsequent import downloaded the canopy and soil rasters; see the implementation notes linked above.

## Recommended order

1. **Canopy openness:** the public 5 m sky-view-factor raster is the strongest immediately accessible candidate for filling the national structure gap. Keep it separate from Zürich's canopy-cover percentage.
2. **MeteoSwiss daily climate analyses:** evaluate a gridded snapshot alongside the current anchor interpolation, retaining source and quality flags.
3. **Host-tree classes:** request the national dominant-tree dataset and verify redistribution terms and class-level performance. Do not infer measured tree shares from predicted dominant classes.
4. **Soil texture/depth:** reuse the existing soil-source family to add water-retention context, initially as displayed evidence rather than an arbitrary score bonus.
5. **Terrain, habitat classes and nitrogen:** add in stages after testing their incremental value. These represent different ecological processes and spatial supports.

Priorities are engineering judgments based on current coverage gaps, source availability and ecological relevance. They are not measured prediction improvements.

## Dataset shortlist

| Candidate | Verified source and resolution | What it could improve | Access / interpretation / static integration |
| --- | --- | --- | --- |
| **Sky view factor / canopy openness** | [EnviDat, NFI VHM 2024, 5 m](https://www.envidat.ch/metadata/switzerland-wide-maps-of-sky-view-factor-canopy-openness-in-forests-at-5-m-resol) | Local shelter and exposure outside Zürich | API metadata says CC BY; a direct TIFF resource is available. HEAD returned 200, 1,644,884,452 bytes and byte-range support. Aggregate within forest cells offline; retain survey timing. This 180° hemispheric quantity is **not interchangeable with vertical canopy cover**. Outside forests the raster describes terrain effects. |
| **Dominant host-tree species** | [Swiss dominant-tree map, 10 m](https://opendata.swiss/en/dataset/tree-species-map-of-switzerland), DOI [10.16904/ENVIDAT.506](https://doi.org/10.16904/ENVIDAT.506) | Pine/fir/spruce and broadleaf-host information nationally | Fifteen classes, including birch, chestnut and several pine species. Based on 2020 Sentinel-2 and a 2017 forest mask; access by request. Metadata reports spatial cross-validation accuracy 0.759, with independent validation absent. API licence ID is `cc-by-sa`. Predicted-class pixel fractions are not measured stand composition; global accuracy is not a per-pixel confidence score. |
| **Daily rain / temperature / sunshine** | [MeteoSwiss spatial climate analyses, 1 km-scale](https://opendatadocs.meteoswiss.ch/c-climate-data/c3-ground-based-climate-data) | Observationally constrained spatial weather, history and lagged features | NetCDF via public STAC, LV95 for these products. Recent analyses are preliminary and later consolidated; these are statistically estimated grid values, not forest-floor sensors. Redistribution requires source attribution. Precompute daily rolling aggregates into regional bundles; keep Open-Meteo soil-moisture inputs distinct. |
| **Soil texture, depth, density, gravel and organic carbon** | [WSL Swiss forest soil maps](https://envidat.ch/metadata/soil-property-maps-for-the-swiss-forest), DOI [10.16904/envidat.484](https://doi.org/10.16904/envidat.484) | Retention/drainage context and substrate differences | Same source family as our imported 25 m pH. The catalogue exposes estimates and uncertainty resources for multiple properties; inspect each raster's own depth, units, grid and interval before joining. API licence ID `cc-by-sa`. These are predictions; organic carbon is not deadwood, and none of these fields is a direct nitrogen/phosphorus measurement. |
| **Sub-canopy light** | [SwissRad10, 10 m and hourly annual cycle](https://www.envidat.ch/metadata/swissrad10-hourly-light-availability-maps-at-10-m-resolution-over-switzerland), DOI [10.16904/envidat.544](https://doi.org/10.16904/envidat.544) | Exposure/drying context with canopy and terrain | Metadata reports CC0-1.0, leaf-on/leaf-off canopy calculations, sky-view factor and direct-beam transmissivity. These are structural light-availability products, not today's cloud-adjusted sunshine. Start with a few seasonal aggregates; the entire hourly collection is unsuitable as a browser dependency. Avoid counting the same shelter signal again through canopy, aspect and sunshine. |
| **Better terrain** | [swissALTI3D, 0.5 m / 2 m products](https://www.swisstopo.admin.ch/en/height-model-swissalti3d) | More credible local slope, aspect, terrain position and potential wetness | Existing national terrain is a 200 m source. Compute derivatives offline, then summarize at habitat-grid support. Topographic wetness requires hydrological conditioning and is only a proxy: drainage, bedrock and groundwater can break the assumed relationship. Fine terrain does not establish finer weather accuracy. Check source acquisition/quality and product terms. |
| **Nitrogen deposition** | [FOEN official layer metadata, 500 m](https://api3.geo.admin.ch/rest/services/api/MapServer/ch.bafu.luftreinhaltung-stickstoffdeposition/legend?lang=de) | Long-term nutrient-pressure context for ectomycorrhizal communities | Time series includes 1990–2020. It is modeled atmospheric deposition, not soil total N, nitrate concentration, or fertilizer application. FOEN explicitly warns that individual pixels must not be used for individual-site assessment. Treat as regional context first; download/redistribution details need checking at the source. |
| **Habitat classes beyond forests** | [Habitat Map of Switzerland v1.2, 2025](https://opendata.swiss/en/dataset/the-habitat-map-of-switzerland-v1_2-2025), DOI [10.16904/ENVIDAT.723](https://doi.org/10.16904/ENVIDAT.723) | Better scope for forest edges, wetland and grassland associations | Nationwide TypoCH classes, at least level 2 and sometimes level 3. Ground cover and trees/shrubs outside forest are separate datasets. Inspect resource grid, confidence and licence before import; a habitat category does not reveal local management, substrate or fungal presence. This could help the Parasol coverage gap. |
| **Vegetation height / change** | [NFI vegetation-height model](https://opendata.swiss/en/dataset/vegetationshohenmodell-lfi) | Structural context and disturbance screening | Official metadata describes 1 m aerial-image-derived height and rolling updates. Height alone is neither canopy openness, tree age, tree species nor deadwood. Prefer the direct openness product for shelter, and use height/change only for an explicit additional hypothesis. Check retrieval and reuse terms for the selected version. |

The four inspected EnviDat records, resource URLs, integration status and metadata licence IDs are preserved in [datasets.json](datasets.json). A catalogue licence identifier is recorded evidence, not a substitute for checking the actual resource terms at release time. No access request or message to dataset authors has been sent.

## Literature: what the predictors actually support

**Büntgen et al. (2013), Global Change Biology — [10.1111/gcb.12263](https://www.buentgen.com/wp-content/uploads/2013/11/Buentgen_etal.2013_GCB.pdf).** Swiss permanent inventories from 1975–2006 connect climate with fruiting and phenology. The authors report little agreement between mycorrhizal yield and tree growth in that dataset, and discuss moisture-saturated temperate systems. Supports testing temperature, precipitation and seasonal history, with regional interactions. It does not validate our 14-day rain window, seven-day temperature band, or numerical weights.

**Egli et al. (2010), Annals of Forest Science — [10.1051/forest/2010011](https://link.springer.com/article/10.1051/forest/2010011).** A Swiss thinning experiment reported linked changes in tree growth and ectomycorrhizal fruit bodies, with the strongest correspondence involving earlier tree growth. Supports host condition/structure and lag hypotheses. It does not mean denser canopy is always better. Its result and the later Swiss observational result above caution against treating tree growth as a universal predictor.

**Sato, Morimoto & Hattori (2012), PLOS ONE — [10.1371/journal.pone.0049777](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0049777).** Thirty years of a Japanese forest census showed differing climate/phenology relationships among ectomycorrhizal, litter-decomposing and wood-decomposing fungi. Supports separate functional-guild responses and explicit substrate requirements. Japanese relationships are not Swiss coefficients.

**Krah, Büntgen & Bässler (2023), Ecology Letters — [10.1111/ele.14275](https://onlinelibrary.wiley.com/doi/10.1111/ele.14275).** A global fruiting-record analysis links timing and duration with temperature mean and variability. Supports flexible phenology research rather than rigid calendars. The analysis uses broad spatial/biome aggregation, so it cannot validate individual 50 m cell forecasts or our species-specific temperature thresholds.

**Peter, Ayer & Egli (2001), New Phytologist — [10.1046/j.1469-8137.2001.00030.x](https://pubmed.ncbi.nlm.nih.gov/33874626/).** Nitrogen addition in a subalpine spruce stand altered sporocarp production and communities; aboveground and belowground changes differed. This is experimental support for nutrient sensitivity, but the treatment is not equivalent to a 500 m deposition-map value. It does not justify penalizing every fungus equally.

**de Witte et al. (2017), Science of the Total Environment — [Swiss beech-forest nitrogen study](https://www.sciencedirect.com/science/article/abs/pii/S0048969717315450).** The available abstract/conclusions link deposition, pH and base status with ectomycorrhizal community properties. This supports distinct nutrient and acid-base hypotheses. Its root/soil community endpoints are not direct encounter probabilities for individual mushroom fruit bodies. Full text was not independently audited here.

**2020 Mediterranean pine-forest yield study, Agricultural and Forest Meteorology — [10.1016/j.agrformet.2020.108015](https://doi.org/10.1016/j.agrformet.2020.108015).** The accessible abstract reports roles for prior-year NDVI, precipitation and temperature, including economically important mushroom species. Supports testing lagged productivity. It concerns yield in Mediterranean pine forests; the full text was inaccessible during this review, and its reported explanatory performance must not be presented as accuracy for our Swiss map.

**Beugelsdijk et al. (2008), Persoonia — [10.3767/003158508X283692](https://repository.naturalis.nl/pub/532229/PERS2008020001001.pdf).** European Boletus work documents taxonomic/ecological distinctions and the wide host range of B. edulis. Supports host-aware profiles while cautioning against over-separating ecological variants. It supplies no calibrated numerical host-preference weights for our map.

For source-specific soil evidence and limits, retain [SOIL.md](../SOIL.md) and [species-evidence.md](../species-evidence.md). A dataset paper verifies how a predictor was produced; an ecological paper verifies a relationship in a study. Neither alone verifies a useful predictive improvement for this application.

## Audit of the current equations

| Current term | Evidence assessment | Change to evaluate |
| --- | --- | --- |
| Host trees, 20% | Host associations are well motivated; present numerical preferences and national gaps remain uncertain | Distinguish measured composition, predicted dominant class and unknown host. Validate class-specific confidence, not the map-wide accuracy applied to every pixel. |
| Canopy, 10% | Structure matters, but a universal closed-canopy preference is not established | Separate cover, sky view and radiation. Test species/guild interactions; retain omission when no supported response is configured. |
| Moisture, 35% | Water/climate relationships have literature support; the exact formula does not | The 0.12–0.36 soil-water scaling, 60 mm rain target, humidity scaling and 0.5×ET0 adjustment are assumptions. Test lags and precipitation–soil–temperature interactions. Volumetric water content has different meaning across soil textures. |
| Temperature, 15% | Temperature/phenology relationships are supported at multiple scales | Species bands are provisional. Compare flexible seasonal temperature effects and local climate anomalies using held-out observations. |
| Season, 10% | Phenology matters; month windows transferred across countries/elevations are uncertain | Evaluate day-of-year curves with elevation/region interactions. Avoid double counting season and temperature. |
| Terrain, 10% | Current preference for gentle north-facing terrain is a physical moisture-retention hypothesis | Better DEM improves the input, not proof of the sign or weight. A cold high-elevation site may respond differently from a dry lowland site. |
| Soil acidity, capped 3–5% for three profiles | Source and scale are explicit, but the response curves remain provisional | Keep uncertainty and CaCl2 scale; do not infer other nutrients from pH or claim the chosen caps are literature-derived. |
| Sunshine / NDVI / nitrogen | Potentially useful, distinct mechanisms | Keep as context until a species-relevant response is supported and tested. More sunshine or nutrients need not increase fruiting. |

## Static implementation proposal

- Keep raster processing in preparation scripts. Preserve current 50 m score-cell IDs and boundaries; changing an input does not require pretending the score is now 5 m accurate.
- Store source-native statistics with provenance, e.g. `skyView: {mean, p10, p90, coverage, surveyYear}`, `hostClass: {source, classFractions, applicable, referenceYear}`, `soilTexture: {clay, sand, gravel, depth, uncertainty}`. These are proposed schemas, not fields currently served.
- For sky view, compute forest-weighted cell summaries and coverage. Test agreement with independent reference data; do **not** substitute `100 × (1 − skyView)` into the current canopy formula.
- Aggregate daily climate into source-tagged 7/14/28-day rain, temperature and anomaly candidates, with completed-day cutoffs and preliminary/consolidated flags. Freshness and missing-data behavior remain explicit. Evaluate lag windows rather than asserting all of them improve predictions.
- Add a separate low-cost environmental-context bundle first. Promote a feature into scoring only after ablation tests show value. For compactness, quantize only after error analysis and cache decoded viewport chunks. A one-byte added channel costs about 1 MB per million cells before compression; that is an encoding estimate, not a measured release size.
- Retain confidence/coverage at the scale of each source. Show provenance inside existing details rather than adding more map overlays.

## Validation gate

Use licensed, sufficiently precise Swiss observations with dates, identification quality and sampling-effort information where possible. Never treat an unvisited cell as a confirmed absence. Train and evaluate in spatial and temporal blocks, separately by species/region/elevation, against season-only, habitat-only and current-model baselines. Test candidate groups one at a time, check correlated predictors, report uncertainty and calibration where the data permit it, and measure transfer size and frame/interaction costs. Private notebook records remain local unless explicitly shared through an authorized collection mechanism.

## Concrete next tasks

- [x] Prototype canopy-openness extraction on a small Zürich/non-Zürich boundary area; inspect masks, NoData, physical units, survey years and aggregation sensitivity.
- [ ] Request dominant-tree data access and redistribution details when the project owner chooses to contact WSL.
- [x] Build a MeteoSwiss daily-data adapter as context. Matched-day comparison with anchors remains required before replacement.
- [x] Inspect soil texture/depth resources and uncertainty; add contextual summaries before score curves.
- [ ] Obtain suitable observation data and execute the validation gate.

The top-ranked data sources are feasible for static publication after preprocessing. Their scientific promise is stronger than any claim that merely adding layers makes the current heuristic accurate.
