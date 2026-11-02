# Species evidence and accuracy review — 2 November 2026

The catalogue contains 22 species: 20 experimental forest profiles and two observation-only entries. These are experimental habitat indices, not calibrated probabilities, confirmed occurrences, or validated fruiting forecasts. More species do not establish greater accuracy. Source descriptions support habitat associations; they do not validate the shared moisture/terrain curves, numeric weights, temperature bands, or Swiss seasonal thresholds.

## Additions

| Species | Supported association | Source and limits |
| --- | --- | --- |
| Boletus reticulatus | Broadleaf hosts | [Beugelsdijk et al., 2008](https://repository.naturalis.nl/pub/532229/PERS2008020001001.pdf). Coarse broadleaf suitability is a modeling approximation, not evidence every broadleaf tree is a host. |
| Boletus aereus | Broadleaf woodland, particularly oak/chestnut | [Université de Rouen](https://smartchampi.univ-rouen.fr/sites/smartchampi.univ-rouen.fr/files/atoms/files/boletus_aereus_juin2021.pdf). Chestnut and warmth thresholds are not mapped/scored. |
| Boletus pinophilus | Mainly pine, with rare spruce association | [Beugelsdijk et al., 2008](https://repository.naturalis.nl/pub/532229/PERS2008020001001.pdf). Uses pine share only; rare alternative hosts are not represented. Missing pine is unknown, not zero. |
| Suillus granulatus | Mainly two-needle pines | [University of Oslo, Gro Gulden](https://www.nhm2.uio.no/botanisk/bot-mus/sopp/fakta/fakt-28.htm). June–October is a Norwegian observation window, used provisionally; exceptional hosts and regional differences remain unmodeled. |
| Suillus bovinus | Pine association | [NMV, Coolia 43/2](https://www.mycologen.nl/cooliasleutels/Coolia_43-2.pdf). The exact local season, substrate and response curves are not configured. |
| Lactarius salmonicolor | Fir association | [Micosylva project handbook](https://micosylva.pfcyl.es/sites/default/files/documentos/final_sylviculture_et_champignon_2015.pdf). Requires mapped fir; general conifer cover is insufficient. |
| Laccaria amethystina | Both broadleaf and conifer woodland | [Norfolk Wildlife Trust](https://www.norfolkwildlifetrust.org.uk/wildlife-explorer/amethyst-deceiver). August–November is a UK guide window, not Swiss calibration. Leaf litter unavailable. |
| Russula vesca | Both broadleaf and conifer partners | [NMV forest monitoring](https://www.mycologen.nl/onderzoek/meetnet/bospaddenstoelen/typische-soorten/). July–October is a Dutch window, not Swiss calibration. |

New profiles use `null` for unsupported temperature bands and canopy categories. Season is also null where no reviewed window is configured. Null factors receive zero weight and are disclosed as omitted. Broadleaf/conifer coefficients of 0/1 are categorical habitat approximations, not measured effect sizes. Specialist host scores use mapped tree shares; where those shares are absent, the model cannot establish host suitability. A warning remains visible outside the collapsed details.

The original eleven profiles retain provisional settings. They have **not** become validated through this review. The original shared moisture and slope functions are generic hypotheses and may be unsuitable for particular species or regions. Similar evidence-limited profiles may produce identical scores; we do not introduce artificial differences just to differentiate colours. Scores between species with different available factors should not be read as comparable probabilities.

## What would establish accuracy?

1. Obtain licensed Swiss observations, including survey effort or credible non-detections; presence-only records alone cannot establish absence or collection probability.
2. Use location/time blocks for held-out evaluation; avoid leakage between adjacent cells and repeated records.
3. Compare with season-only and habitat-only baselines. Report species sample sizes, ranking performance, and uncertainty by region and elevation.
4. Fit coefficients only on training observations. Validate probability calibration only with data supporting that interpretation.
5. Have a Swiss mycologist review the ecological assumptions and language before promoting a profile from experimental status.

[WSL SwissFungi](https://www.wsl.ch/de/services-produkte/swissfungi/) is a potential source of Swiss distribution/ecology evidence; no observations or expert endorsements were imported in this change. [Sato et al., 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC3507881/) supports studying differing functional groups and climate relationships, not the current numerical weights.

## Observation catalogue additions

The catalogue now has **22 entries**, of which **20** have experimental forest habitat models.

- **Amanita muscaria (fly agaric / Fliegenpilz)** has a broad woodland association profile without invented temperature, canopy or season settings. Its documented host range is wider than the available named-tree fields, so this is a coarse woodland approximation. [Woodland Trust ecology](https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/fungi-and-lichens/fly-agaric/); [CDC poisoning report](https://www.cdc.gov/mmwr/volumes/68/wr/mm6821a4.htm). It is explicitly labelled poisonous.
- **Psilocybe semilanceata** and **Psilocybe cyanescens** are observation-only entries. They can be recorded in the notebook but do not receive heatmaps, rankings or scores. The first needs grassland coverage ([Naturalis](https://mushrooms.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/taxon.php?id=100290)); the second needs substrate data missing from the map ([NDFF substrate observations](https://www.verspreidingsatlas.nl/biodiversiteit/habitat-distribution.aspx?soortnummer=10119060)). A forest proxy would be misleading.

`mapping: false` is the explicit observation-only contract. The shared scorer returns `value: null`, zero completeness and no factors, so the API cannot accidentally return a forest suitability estimate either. This catalogue does not provide identification, preparation, dosing or consumption guidance.
