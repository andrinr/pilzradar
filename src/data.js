/* Cited habitat associations; numerical responses remain unvalidated. See docs/species-evidence.md. */
window.SHROOMS_SPECIES = {
  "porcini": {
    "name": "Porcini",
    "local": "Steinpilz",
    "latin": "Boletus edulis",
    "months": [
      7,
      8,
      9,
      10
    ],
    "temp": [
      9,
      19
    ],
    "host": {
      "beech": 1,
      "oak": 0.75,
      "conifer": 0.9,
      "other": 0.5
    },
    "canopy": "closed",
    "note": "Tree partners, a sheltered canopy and moisture after rain.",
    "sources": [
      {
        "title": "First Nature — Boletus edulis",
        "url": "https://www.first-nature.com/fungi/boletus-edulis.php"
      },
      {
        "title": "Polish forest study — Boletus edulis and Imleria badia",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12348591/"
      }
    ],
    "unmapped": [
      "Other soil chemistry"
    ],
    "soil": {
      "acidUntil": 5,
      "fadeUntil": 7,
      "maxShare": 0.03,
      "source": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12348591/"
    }
  },
  "chanterelle": {
    "name": "Chanterelle",
    "local": "Eierschwamm",
    "latin": "Cantharellus cibarius",
    "months": [
      6,
      7,
      8,
      9,
      10
    ],
    "temp": [
      11,
      21
    ],
    "host": {
      "beech": 0.85,
      "oak": 1,
      "conifer": 0.8,
      "other": 0.6
    },
    "canopy": "closed",
    "note": "Broadleaf or mixed forest. Experimental acidity preference included.",
    "sources": [
      {
        "title": "First Nature — Cantharellus cibarius",
        "url": "https://www.first-nature.com/fungi/cantharellus-cibarius.php"
      },
      {
        "title": "European Cantharellus taxonomy and ecology",
        "url": "https://doi.org/10.1007/s13225-016-0376-7"
      }
    ],
    "unmapped": [
      "Other soil chemistry"
    ],
    "soil": {
      "acidUntil": 4.5,
      "fadeUntil": 6.5,
      "maxShare": 0.05,
      "source": "https://doi.org/10.1007/s13225-016-0376-7"
    }
  },
  "horn": {
    "name": "Horn of plenty",
    "local": "Totentrompete",
    "latin": "Craterellus cornucopioides",
    "months": [
      8,
      9,
      10,
      11
    ],
    "temp": [
      8,
      18
    ],
    "host": {
      "beech": 1,
      "oak": 0.95,
      "conifer": 0.15,
      "other": 0.5
    },
    "canopy": "closed",
    "note": "A preference for broadleaf woods, especially beech and oak.",
    "sources": [
      {
        "title": "First Nature — Craterellus cornucopioides",
        "url": "https://www.first-nature.com/fungi/craterellus-cornucopioides.php"
      }
    ],
    "unmapped": [
      "Soil chemistry"
    ]
  },
  "parasol": {
    "name": "Parasol",
    "local": "Riesenschirmling",
    "latin": "Macrolepiota procera",
    "months": [
      7,
      8,
      9,
      10,
      11
    ],
    "temp": [
      11,
      22
    ],
    "host": null,
    "canopy": "open",
    "note": "More open canopy and forest edges. Open grassland is outside this forest map.",
    "sources": [
      {
        "title": "First Nature — Macrolepiota procera",
        "url": "https://www.first-nature.com/fungi/macrolepiota-procera.php"
      }
    ],
    "unmapped": [
      "Open grassland"
    ]
  },
  "bay": {
    "name": "Bay bolete",
    "local": "Maronenröhrling",
    "latin": "Imleria badia",
    "months": [
      7,
      8,
      9,
      10,
      11
    ],
    "temp": [
      8,
      18
    ],
    "host": {
      "beech": 0.7,
      "oak": 0.6,
      "conifer": 1,
      "other": 0.4
    },
    "canopy": "closed",
    "note": "Conifer and mixed woodland. Experimental acidity preference included.",
    "sources": [
      {
        "title": "First Nature — Imleria badia",
        "url": "https://www.first-nature.com/fungi/imleria-badia.php"
      },
      {
        "title": "Polish forest study — Boletus edulis and Imleria badia",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12348591/"
      }
    ],
    "unmapped": [
      "Other soil chemistry"
    ],
    "soil": {
      "acidUntil": 4.5,
      "fadeUntil": 6.5,
      "maxShare": 0.05,
      "source": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12348591/"
    }
  },
  "hedgehog": {
    "name": "Wood hedgehog",
    "local": "Semmelstoppelpilz",
    "latin": "Hydnum repandum",
    "months": [
      8,
      9,
      10,
      11
    ],
    "temp": [
      7,
      17
    ],
    "host": {
      "beech": 1,
      "oak": 0.8,
      "conifer": 0.85,
      "other": 0.7
    },
    "canopy": "closed",
    "note": "Damp broadleaf and mixed woods; moss and leaf litter are not yet mapped.",
    "sources": [
      {
        "title": "First Nature — Hydnum repandum",
        "url": "https://www.first-nature.com/fungi/hydnum-repandum.php"
      }
    ],
    "unmapped": [
      "Moss cover",
      "Leaf litter"
    ]
  },
  "saffron": {
    "name": "Saffron milkcap",
    "local": "Echter Reizker",
    "latin": "Lactarius deliciosus",
    "months": [
      8,
      9,
      10,
      11
    ],
    "temp": [
      8,
      18
    ],
    "host": {
      "beech": 0.05,
      "oak": 0.05,
      "conifer": 0.05,
      "other": 0.05
    },
    "requiredTree": "pine",
    "canopy": "open",
    "note": "Pine partner: uses mapped pine share, not general conifer cover. Soil chemistry is not yet included.",
    "sources": [
      {
        "title": "First Nature — Lactarius deliciosus",
        "url": "https://www.first-nature.com/fungi/lactarius-deliciosus.php"
      }
    ],
    "unmapped": [
      "Soil chemistry"
    ]
  },
  "winter": {
    "name": "Winter chanterelle",
    "local": "Trompetenpfifferling",
    "latin": "Craterellus tubaeformis",
    "months": [
      9,
      10,
      11
    ],
    "temp": [
      5,
      15
    ],
    "host": {
      "beech": 0.5,
      "oak": 0.4,
      "conifer": 1,
      "other": 0.4
    },
    "canopy": "closed",
    "note": "Late-season conifer woodland. Moss and acidic soil are not mapped; the canopy preference is provisional.",
    "unmapped": [
      "Moss cover",
      "Soil acidity"
    ],
    "sources": [
      {
        "title": "First Nature — Cantharellus tubaeformis (synonym)",
        "url": "https://www.first-nature.com/fungi/cantharellus-tubaeformis.php"
      }
    ]
  },
  "slippery": {
    "name": "Slippery jack",
    "local": "Butterpilz",
    "latin": "Suillus luteus",
    "months": [
      7,
      8,
      9,
      10,
      11
    ],
    "temp": [
      8,
      18
    ],
    "host": {
      "beech": 0,
      "oak": 0,
      "conifer": 1,
      "other": 0
    },
    "requiredTree": "pine",
    "canopy": "open",
    "note": "Pine-associated woodland. Uses mapped pine share where available; soil chemistry and tree age are not mapped.",
    "unmapped": [
      "Soil chemistry",
      "Tree age"
    ],
    "sources": [
      {
        "title": "First Nature — Suillus luteus",
        "url": "https://www.first-nature.com/fungi/suillus-luteus.php"
      }
    ]
  },
  "spruce_milkcap": {
    "name": "Spruce milkcap",
    "local": "Fichtenreizker",
    "latin": "Lactarius deterrimus",
    "months": [
      7,
      8,
      9,
      10,
      11
    ],
    "temp": [
      8,
      18
    ],
    "host": {
      "beech": 0,
      "oak": 0,
      "conifer": 1,
      "other": 0
    },
    "requiredTree": "spruce",
    "canopy": "closed",
    "note": "Spruce partner: uses mapped spruce share, not general conifer cover. Soil chemistry is not mapped.",
    "unmapped": [
      "Soil chemistry"
    ],
    "sources": [
      {
        "title": "NDFF — Lactarius deterrimus",
        "url": "https://www.verspreidingsatlas.nl/0069170"
      }
    ]
  },
  "charcoal": {
    "name": "Charcoal burner",
    "local": "Frauentäubling",
    "latin": "Russula cyanoxantha",
    "months": [
      7,
      8,
      9,
      10
    ],
    "temp": [
      10,
      20
    ],
    "host": {
      "beech": 1,
      "oak": 0.95,
      "conifer": 0.25,
      "other": 0.65
    },
    "canopy": "closed",
    "note": "Broadleaf woodland, particularly beech and oak. Soil chemistry and leaf litter are not mapped.",
    "unmapped": [
      "Soil chemistry",
      "Leaf litter"
    ],
    "sources": [
      {
        "title": "NDFF — Russula cyanoxantha habitat observations",
        "url": "https://www.verspreidingsatlas.nl/biodiversiteit/habitat-distribution.aspx?soortnummer=10126300"
      },
      {
        "title": "First Nature — Russula cyanoxantha",
        "url": "https://www.first-nature.com/fungi/russula-cyanoxantha.php"
      }
    ]
  },
  "summer_bolete": {
    "name": "Summer bolete",
    "local": "Sommersteinpilz",
    "latin": "Boletus reticulatus",
    "months": null,
    "temp": null,
    "host": {
      "beech": 1,
      "oak": 1,
      "conifer": 0,
      "other": 1
    },
    "canopy": null,
    "note": "Broadleaf woodland association. Local fruiting thresholds are not validated.",
    "unmapped": [
      "Unvalidated fruiting thresholds",
      "Soil chemistry"
    ],
    "sources": [
      {
        "title": "Ecological evidence — Boletus reticulatus",
        "url": "https://repository.naturalis.nl/pub/532229/PERS2008020001001.pdf"
      }
    ]
  },
  "bronze_bolete": {
    "name": "Bronze bolete",
    "local": "Bronzeröhrling",
    "latin": "Boletus aereus",
    "months": null,
    "temp": null,
    "host": {
      "beech": 1,
      "oak": 1,
      "conifer": 0,
      "other": 1
    },
    "canopy": null,
    "note": "Broadleaf woodland association. Local fruiting thresholds are not validated.",
    "unmapped": [
      "Unvalidated fruiting thresholds",
      "Soil chemistry"
    ],
    "sources": [
      {
        "title": "Ecological evidence — Boletus aereus",
        "url": "https://smartchampi.univ-rouen.fr/sites/smartchampi.univ-rouen.fr/files/atoms/files/boletus_aereus_juin2021.pdf"
      }
    ]
  },
  "pine_bolete": {
    "name": "Pine bolete",
    "local": "Kiefernsteinpilz",
    "latin": "Boletus pinophilus",
    "months": null,
    "temp": null,
    "host": {
      "beech": 0,
      "oak": 0,
      "conifer": 1,
      "other": 0
    },
    "requiredTree": "pine",
    "canopy": null,
    "note": "Mainly pine-associated. Missing pine data is omitted; rare alternative hosts are not modeled.",
    "unmapped": [
      "Unvalidated fruiting thresholds",
      "Soil chemistry"
    ],
    "sources": [
      {
        "title": "Ecological evidence — Boletus pinophilus",
        "url": "https://repository.naturalis.nl/pub/532229/PERS2008020001001.pdf"
      }
    ]
  },
  "granulated_bolete": {
    "name": "Granulated bolete",
    "local": "Körnchenröhrling",
    "latin": "Suillus granulatus",
    "months": [
      6,
      7,
      8,
      9,
      10
    ],
    "temp": null,
    "host": {
      "beech": 0,
      "oak": 0,
      "conifer": 1,
      "other": 0
    },
    "requiredTree": "pine",
    "canopy": null,
    "note": "Mainly pine-associated. Missing pine data is omitted; rare alternative hosts are not modeled.",
    "unmapped": [
      "Unvalidated fruiting thresholds",
      "Soil chemistry"
    ],
    "sources": [
      {
        "title": "Ecological evidence — Suillus granulatus",
        "url": "https://www.nhm2.uio.no/botanisk/bot-mus/sopp/fakta/fakt-28.htm"
      }
    ]
  },
  "bovine_bolete": {
    "name": "Bovine bolete",
    "local": "Kuhröhrling",
    "latin": "Suillus bovinus",
    "months": null,
    "temp": null,
    "host": {
      "beech": 0,
      "oak": 0,
      "conifer": 1,
      "other": 0
    },
    "requiredTree": "pine",
    "canopy": null,
    "note": "Mainly pine-associated. Missing pine data is omitted; rare alternative hosts are not modeled.",
    "unmapped": [
      "Unvalidated fruiting thresholds",
      "Soil chemistry"
    ],
    "sources": [
      {
        "title": "Ecological evidence — Suillus bovinus",
        "url": "https://www.mycologen.nl/cooliasleutels/Coolia_43-2.pdf"
      }
    ]
  },
  "salmon_milkcap": {
    "name": "Salmon milkcap",
    "local": "Lachsreizker",
    "latin": "Lactarius salmonicolor",
    "months": null,
    "temp": null,
    "host": {
      "beech": 0,
      "oak": 0,
      "conifer": 1,
      "other": 0
    },
    "requiredTree": "fir",
    "canopy": null,
    "note": "Fir-associated woodland. Missing fir data is omitted.",
    "unmapped": [
      "Unvalidated fruiting thresholds",
      "Soil chemistry"
    ],
    "sources": [
      {
        "title": "Ecological evidence — Lactarius salmonicolor",
        "url": "https://micosylva.pfcyl.es/sites/default/files/documentos/final_sylviculture_et_champignon_2015.pdf"
      }
    ]
  },
  "amethyst": {
    "name": "Amethyst deceiver",
    "local": "Violetter Lacktrichterling",
    "latin": "Laccaria amethystina",
    "months": [
      8,
      9,
      10,
      11
    ],
    "temp": null,
    "host": {
      "beech": 1,
      "oak": 1,
      "conifer": 1,
      "other": 1
    },
    "canopy": null,
    "note": "Broadleaf and conifer woodland association. Leaf litter is not mapped.",
    "unmapped": [
      "Unvalidated fruiting thresholds",
      "Soil chemistry",
      "Leaf litter"
    ],
    "sources": [
      {
        "title": "Ecological evidence — Laccaria amethystina",
        "url": "https://www.norfolkwildlifetrust.org.uk/wildlife-explorer/amethyst-deceiver"
      }
    ]
  },
  "vesca": {
    "name": "The flirt",
    "local": "Speisetäubling",
    "latin": "Russula vesca",
    "months": [
      7,
      8,
      9,
      10
    ],
    "temp": null,
    "host": {
      "beech": 1,
      "oak": 1,
      "conifer": 1,
      "other": 1
    },
    "canopy": null,
    "note": "Broadleaf and conifer woodland association. Leaf litter is not mapped.",
    "unmapped": [
      "Unvalidated fruiting thresholds",
      "Soil chemistry"
    ],
    "sources": [
      {
        "title": "Ecological evidence — Russula vesca",
        "url": "https://www.mycologen.nl/onderzoek/meetnet/bospaddenstoelen/typische-soorten/"
      }
    ]
  },
  "fly_agaric": {
    "name": "Fly agaric",
    "local": "Fliegenpilz",
    "latin": "Amanita muscaria",
    "months": null,
    "temp": null,
    "host": {
      "beech": 1,
      "oak": 1,
      "conifer": 1,
      "other": 1
    },
    "canopy": null,
    "note": "Woodland with tree partners. Poisonous; observe rather than consume.",
    "unmapped": [
      "Individual host-tree distribution",
      "Unvalidated fruiting thresholds"
    ],
    "sources": [
      {
        "title": "Woodland Trust — Fly agaric ecology",
        "url": "https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/fungi-and-lichens/fly-agaric/"
      },
      {
        "title": "CDC — Amanita muscaria intoxications",
        "url": "https://www.cdc.gov/mmwr/volumes/68/wr/mm6821a4.htm"
      }
    ]
  },
  "liberty_cap": {
    "name": "Liberty cap",
    "local": "Spitzkegeliger Kahlkopf",
    "latin": "Psilocybe semilanceata",
    "mapping": false,
    "months": null,
    "temp": null,
    "host": null,
    "canopy": null,
    "note": "Record sightings in your notebook. Our forest data cannot support a habitat score for this species.",
    "unmapped": [
      "Grassland habitat",
      "Unvalidated fruiting thresholds"
    ],
    "sources": [
      {
        "title": "Habitat evidence — Psilocybe semilanceata",
        "url": "https://mushrooms.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/taxon.php?id=100290"
      }
    ]
  },
  "wavy_cap": {
    "name": "Wavy cap",
    "local": "Blauender Kahlkopf",
    "latin": "Psilocybe cyanescens",
    "mapping": false,
    "months": null,
    "temp": null,
    "host": null,
    "canopy": null,
    "note": "Record sightings in your notebook. Our forest data cannot support a habitat score for this species.",
    "unmapped": [
      "Woodchip substrate",
      "Unvalidated fruiting thresholds"
    ],
    "sources": [
      {
        "title": "Habitat evidence — Psilocybe cyanescens",
        "url": "https://www.verspreidingsatlas.nl/biodiversiteit/habitat-distribution.aspx?soortnummer=10119060"
      }
    ]
  }
};
