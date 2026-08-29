// ============================================================================
// model3d.js — Catálogo local de modelos 3D.
//
// Cada vehículo de la base de datos apunta (vía MODEL3D_MAP) a un "stage"
// (MODEL3D_STAGES). Cada stage describe un único archivo .glb bundlEado en el
// proyecto en /assets/3d/cars/<stage>.glb más una rotación (`yaw`, grados) que
// orienta el FRENTE del vehículo hacia el encuadre héroe del visor.
//
// Reglas:
//  - Un anuncio usa el modelo exacto de su generación siempre que existe.
//  - Varios anuncios del MISMO modelo base comparten stage.
//  - Cuando no existe un modelo exacto se usa el equivalente visual más
//    cercano (misma generación de carrocería / segmento) y se documenta en
//    MODEL3D_FALLBACK.
//
// Todo el contenido es LOCAL. No se realiza ninguna descarga en runtime.
// ============================================================================

const MODEL3D_STAGES = {
  // --- SUVs / crossovers añadidos en auditoría 2026 ----------------------------------
  "mazda-cx5": { glb: "/assets/3d/cars/mazda-cx5.glb", yaw: 0 }, // CX-5 KF real (antes fallback Tucson)

  // --- Superdeportivos / deportivos -------------------------------------------------
  "lambo-huracan": { glb: "/assets/3d/cars/lambo-huracan.glb", yaw: 0 },
  "lambo-aventador-svj": { glb: "/assets/3d/cars/lambo-aventador-svj.glb", yaw: 0 },
  "lambo-revuelto": { glb: "/assets/3d/cars/lambo-revuelto.glb", yaw: 0 },
  "lambo-urus": { glb: "/assets/3d/cars/lambo-urus.glb", yaw: 0 },
  "ferrari-296": { glb: "/assets/3d/cars/ferrari-296.glb", yaw: 0 },
  "ferrari-f812": { glb: "/assets/3d/cars/ferrari-f812.glb", yaw: 0 },
  "ferrari-roma": { glb: "/assets/3d/cars/ferrari-roma.glb", yaw: 90 },
  "ferrari-sf90": { glb: "/assets/3d/cars/ferrari-sf90.glb", yaw: 0 },
  "mclaren-artura": { glb: "/assets/3d/cars/mclaren-artura.glb", yaw: 0 }, // 2023 (reemplaza al 12C erróneo)
  "mclaren-720s": { glb: "/assets/3d/cars/mclaren-720s.glb", yaw: 0 },
  "audi-rs6": { glb: "/assets/3d/cars/audi-rs6.glb", yaw: 0 }, // Avant C8
  "porsche-911": { glb: "/assets/3d/cars/porsche-911.glb", yaw: 0 }, // 992 (2019+)
  "porsche-cayman": { glb: "/assets/3d/cars/porsche-cayman.glb", yaw: 0 }, // 718 GT4 RS (982)
  "porsche-taycan": { glb: "/assets/3d/cars/porsche-taycan.glb", yaw: 0 },
  "bmw-m4": { glb: "/assets/3d/cars/bmw-m4.glb", yaw: 0 }, // G82
  "bmw-m5": { glb: "/assets/3d/cars/bmw-m5.glb", yaw: 0 }, // F90
  "bmw-i8": { glb: "/assets/3d/cars/bmw-i8.glb", yaw: 0 }, // I12 Coupé 2015 (sustituye al Alpina)
  "audi-r8": { glb: "/assets/3d/cars/audi-r8.glb", yaw: 0 }, // 4S (gen 2)
  "audi-rs7": { glb: "/assets/3d/cars/audi-rs7.glb", yaw: 0 }, // C8
  "toyota-supra": { glb: "/assets/3d/cars/toyota-supra.glb", yaw: 0 }, // A90
  "toyota-land-cruiser": { glb: "/assets/3d/cars/toyota-land-cruiser.glb", yaw: 0 }, // LC300
  "nissan-gtr": { glb: "/assets/3d/cars/nissan-gtr.glb", yaw: 0 }, // R35 facelift
  "nissan-z": { glb: "/assets/3d/cars/nissan-z.glb", yaw: 0 }, // RZ34 Nismo 2024 (reemplazo: el anterior estaba de pie)
  "chevrolet-camaro": { glb: "/assets/3d/cars/chevrolet-camaro.glb", yaw: 0 }, // 6ª gen
  "chevrolet-corvette-z06": { glb: "/assets/3d/cars/chevrolet-corvette-z06.glb", yaw: 0 }, // C8 Z06
  "dodge-challenger": { glb: "/assets/3d/cars/dodge-challenger.glb", yaw: 0 }, // LC
  "dodge-charger": { glb: "/assets/3d/cars/dodge-charger.glb", yaw: 0 }, // LD Hellcat Daytona
  "ford-mustang": { glb: "/assets/3d/cars/ford-mustang.glb", yaw: 0 }, // S650 (2024)
  "ford-gt": { glb: "/assets/3d/cars/ford-gt.glb", yaw: 0 }, // 2ª gen (2017)
  "honda-nsx": { glb: "/assets/3d/cars/honda-nsx.glb", yaw: 0 }, // NC1 (2016+)
  "mazda-mx5": { glb: "/assets/3d/cars/mazda-mx5.glb", yaw: 0 }, // ND
  "aston-martin-vantage": { glb: "/assets/3d/cars/aston-martin-vantage.glb", yaw: 0 },
  "aston-martin-db12": { glb: "/assets/3d/cars/aston-martin-db12.glb", yaw: 180 },

  // --- Berlinas / gran turismo -------------------------------------------------------
  "bmw-i7": { glb: "/assets/3d/cars/bmw-i7.glb", yaw: 0 }, // G70
  "mercedes-s63": { glb: "/assets/3d/cars/mercedes-s63.glb", yaw: 0 }, // W223
  "mercedes-c63": { glb: "/assets/3d/cars/mercedes-c63.glb", yaw: 180 }, // C63 S AMG W205 texturizado (reemplaza W206 sin texturas)
  "mercedes-gt63": { glb: "/assets/3d/cars/mercedes-gt63.glb", yaw: 0 }, // X290 4 puertas (reemplaza fuente de catálogo de piezas)
  "rolls-royce-ghost": { glb: "/assets/3d/cars/rolls-royce-ghost.glb", yaw: 0 },
  "bentley-continental-gt": { glb: "/assets/3d/cars/bentley-continental-gt.glb", yaw: 0 }, // 3ª gen GT Speed
  "lexus-lc500": { glb: "/assets/3d/cars/lexus-lc500.glb", yaw: 0 },
  "tesla-model-s": { glb: "/assets/3d/cars/tesla-model-s.glb", yaw: 0 },
  "tesla-model-3": { glb: "/assets/3d/cars/tesla-model-3.glb", yaw: 180 },
  "audi-etron-gt": { glb: "/assets/3d/cars/audi-etron-gt.glb", yaw: 0 }, // RS e-tron GT (reemplazo texturizado)
  "byd-han-ev": { glb: "/assets/3d/cars/byd-han-ev.glb", yaw: 0 },
  "byd-seal": { glb: "/assets/3d/cars/byd-seal.glb", yaw: 0 },
  "kia-stinger": { glb: "/assets/3d/cars/kia-stinger.glb", yaw: 0 },
  "honda-accord": { glb: "/assets/3d/cars/honda-accord.glb", yaw: 0 },
  "toyota-camry": { glb: "/assets/3d/cars/toyota-camry.glb", yaw: 0 }, // XV70

  // --- SUVs ---------------------------------------------------------------------------
  "audi-sq8": { glb: "/assets/3d/cars/audi-sq8.glb", yaw: 0 },
  "bentley-bentayga": { glb: "/assets/3d/cars/bentley-bentayga.glb", yaw: 0 },
  "porsche-cayenne": { glb: "/assets/3d/cars/porsche-cayenne.glb", yaw: 0 }, // Turbo GT
  "bmw-x5m": { glb: "/assets/3d/cars/bmw-x5m.glb", yaw: 0 }, // G05 Competition
  "mercedes-gle63": { glb: "/assets/3d/cars/mercedes-gle63.glb", yaw: 90 }, // V167 Coupé (fuente orientada a lo largo de X)
  "mercedes-g63": { glb: "/assets/3d/cars/mercedes-g63.glb", yaw: 0 }, // W463
  "jeep-trackhawk": { glb: "/assets/3d/cars/jeep-trackhawk.glb", yaw: 0 },
  "jeep-wrangler": { glb: "/assets/3d/cars/jeep-wrangler.glb", yaw: 0 }, // Rubicon 392
  "chevrolet-tahoe": { glb: "/assets/3d/cars/chevrolet-tahoe.glb", yaw: 0 },
  "rolls-royce-cullinan": { glb: "/assets/3d/cars/rolls-royce-cullinan.glb", yaw: 0 },
  "tesla-model-x": { glb: "/assets/3d/cars/tesla-model-x.glb", yaw: 0 }, // Model X con puertas Falcon (reemplaza malla sin UV)
  "volkswagen-touareg": { glb: "/assets/3d/cars/volkswagen-touareg.glb", yaw: 0 }, // R eHybrid
  "volvo-xc60": { glb: "/assets/3d/cars/volvo-xc60.glb", yaw: 0 },
  "lexus-rx": { glb: "/assets/3d/cars/lexus-rx.glb", yaw: 0 }, // RX500h F Sport
  "hyundai-tucson": { glb: "/assets/3d/cars/hyundai-tucson.glb", yaw: 0 }, // NX4
  "hyundai-veloster": { glb: "/assets/3d/cars/hyundai-veloster.glb", yaw: 90 }, // N (ya no usado como fallback del i30 N)
  "hyundai-ioniq5n": { glb: "/assets/3d/cars/hyundai-ioniq5n.glb", yaw: 0 },
  "kia-ev6": { glb: "/assets/3d/cars/kia-ev6.glb", yaw: 0 },
  "volkswagen-id4": { glb: "/assets/3d/cars/volkswagen-id4.glb", yaw: 0 },
  "nissan-ariya": { glb: "/assets/3d/cars/nissan-ariya.glb", yaw: 0 },
  "subaru-outback": { glb: "/assets/3d/cars/subaru-outback.glb", yaw: 0 },
  "renault-arkana": { glb: "/assets/3d/cars/renault-arkana.glb", yaw: 0 },
  "suzuki-jimny": { glb: "/assets/3d/cars/suzuki-jimny.glb", yaw: 0 }, // JB74

  // --- Pickups ------------------------------------------------------------------------
  "ford-f150-raptor": { glb: "/assets/3d/cars/ford-f150-raptor.glb", yaw: 0 }, // 13ª→14ª gen (2021)
  "ford-bronco-raptor": { glb: "/assets/3d/cars/ford-bronco-raptor.glb", yaw: 180 },
  "chevrolet-silverado": { glb: "/assets/3d/cars/chevrolet-silverado.glb", yaw: 0 },
  "nissan-frontier": { glb: "/assets/3d/cars/nissan-frontier.glb", yaw: 0 },
  "tesla-cybertruck": { glb: "/assets/3d/cars/tesla-cybertruck.glb", yaw: 0 },

  // --- Compactos / hot hatch ----------------------------------------------------------
  "honda-civic-typer": { glb: "/assets/3d/cars/honda-civic-typer.glb", yaw: 0 }, // FL5
  "toyota-gr-corolla": { glb: "/assets/3d/cars/toyota-gr-corolla.glb", yaw: 90 },
  "hyundai-i30n": { glb: "/assets/3d/cars/hyundai-i30n.glb", yaw: 0 }, // i30 N real (antes fallback Veloster N)
  "renault-megane": { glb: "/assets/3d/cars/renault-megane.glb", yaw: 180 }, // RS Trophy
  "peugeot-308": { glb: "/assets/3d/cars/peugeot-308.glb", yaw: 0 },
  "peugeot-508": { glb: "/assets/3d/cars/peugeot-508.glb", yaw: 0 }, // PSE fastback (reemplaza fuente descentrada)
  "volkswagen-golf": { glb: "/assets/3d/cars/volkswagen-golf.glb", yaw: 0 }, // Mk8 Golf R
  "suzuki-swift": { glb: "/assets/3d/cars/suzuki-swift.glb", yaw: 0 }, // ZC33S
  "subaru-wrx": { glb: "/assets/3d/cars/subaru-wrx.glb", yaw: 0 }, // VB
  "honda-integra": { glb: "/assets/3d/cars/honda-integra.glb", yaw: 0 },
  "rivian-r1s": { glb: "/assets/3d/cars/rivian-r1s.glb", yaw: 0 }, // R1S estilizado (reemplaza mesh único sin materiales)
};

// vehicle id -> stage. Un anuncio puede reusar el stage de otro si comparte
// el modelo base (misma generación); las aproximaciones se documentan en
// MODEL3D_FALLBACK.
const MODEL3D_MAP = {
  "aston-martin-db12": "aston-martin-db12",
  "aston-martin-vantage": "aston-martin-vantage",
  "bmw-m4-competition": "bmw-m4",
  "chevrolet-corvette-z06": "chevrolet-corvette-z06",
  "hyundai-i30n": "hyundai-i30n",
  "jeep-wrangler-rubicon": "jeep-wrangler",
  "kia-ev6-gt": "kia-ev6",
  "kia-stinger-gt": "kia-stinger",
  "lamborghini-huracan-evo": "lambo-huracan",
  "mercedes-s63-amg": "mercedes-s63",
  "nissan-z-nismo": "nissan-z",
  "suzuki-swift-sport": "suzuki-swift",
  "tesla-model-s-plaid": "tesla-model-s",
  "audi-etron-gt": "audi-etron-gt",
  "audi-r8-v10": "audi-r8",
  "audi-rs6-avant": "audi-rs6",
  "audi-rs7-sportback": "audi-rs7",
  "audi-sq8": "audi-sq8",
  "bentley-bentayga": "bentley-bentayga",
  "bentley-continental-gt": "bentley-continental-gt",
  "bmw-i7": "bmw-i7",
  "bmw-i8": "bmw-i8",
  "bmw-m5-cs": "bmw-m5",
  "bmw-x5m-competition": "bmw-x5m",
  "byd-han-ev": "byd-han-ev",
  "byd-seal": "byd-seal",
  "chevrolet-camaro-zl1": "chevrolet-camaro",
  "chevrolet-silverado-zr2": "chevrolet-silverado",
  "chevrolet-tahoe-rst": "chevrolet-tahoe",
  "dodge-demon-170": "dodge-challenger",
  "dodge-charger-hellcat": "dodge-charger",
  "ferrari-296-gtb": "ferrari-296",
  "ferrari-812-competizione": "ferrari-f812",
  "ferrari-roma": "ferrari-roma",
  "ferrari-sf90-stradale": "ferrari-sf90",
  "ford-bronco-raptor": "ford-bronco-raptor",
  "ford-f150-raptor-r": "ford-f150-raptor",
  "ford-gt": "ford-gt",
  "ford-mustang-gt": "ford-mustang",
  "honda-accord": "honda-accord",
  "honda-civic-type-r": "honda-civic-typer",
  "honda-integra-types": "honda-integra",
  "honda-nsx-types": "honda-nsx",
  "hyundai-ioniq5n": "hyundai-ioniq5n",
  "jeep-grand-cherokee-trackhawk": "jeep-trackhawk",
  "lamborghini-aventador-svj": "lambo-aventador-svj",
  "lamborghini-revuelto": "lambo-revuelto",
  "lamborghini-urus-performante": "lambo-urus",
  "lexus-lc500": "lexus-lc500",
  "lexus-rx-fsport": "lexus-rx",
  "mazda-cx5": "mazda-cx5",
  "mazda-mx5-miata": "mazda-mx5",
  "mclaren-750s": "mclaren-720s",
  "mclaren-artura": "mclaren-artura",
  "mercedes-amg-gle63": "mercedes-gle63",
  "mercedes-amg-gt-63": "mercedes-gt63",
  "mercedes-c63-amg": "mercedes-c63",
  "mercedes-g63-amg": "mercedes-g63",
  "nissan-ariya": "nissan-ariya",
  "nissan-frontier": "nissan-frontier",
  "nissan-gtr-nismo": "nissan-gtr",
  "peugeot-308-gt": "peugeot-308",
  "peugeot-508-peugeot-sport": "peugeot-508",
  "porsche-718-cayman-gt4": "porsche-cayman",
  "porsche-911-carrera": "porsche-911",
  "porsche-cayenne-turbogt": "porsche-cayenne",
  "porsche-taycan-turbos": "porsche-taycan",
  "renault-arkana": "renault-arkana",
  "renault-megane-rs": "renault-megane",
  "rivian-r1s": "rivian-r1s",
  "rolls-royce-cullinan": "rolls-royce-cullinan",
  "rolls-royce-ghost": "rolls-royce-ghost",
  "subaru-outback": "subaru-outback",
  "subaru-wrx-sti": "subaru-wrx",
  "suzuki-jimny": "suzuki-jimny",
  "tesla-cybertruck": "tesla-cybertruck",
  "tesla-model-3-performance": "tesla-model-3",
  "tesla-model-x-plaid": "tesla-model-x",
  "toyota-camry-trd": "toyota-camry",
  "toyota-gr-corolla": "toyota-gr-corolla",
  "toyota-gr-supra": "toyota-supra",
  "toyota-land-cruiser": "toyota-land-cruiser",
  "volkswagen-golf-r": "volkswagen-golf",
  "volkswagen-id4": "volkswagen-id4",
  "volkswagen-touareg": "volkswagen-touareg",
  "volvo-xc60": "volvo-xc60",
};

// Auditoría 2026-08 (reparación de activos): se reemplazaron/repararon 16 stages con
// materiales faltantes, geometría explotada u orientación vertical. Los nuevos GLB se
// normalizaron offline (orientación → escala → origen → suelos) antes de integrarse:
// el visor recibe activos ya canónicos y aplica su encuadre estándar.
//
// Auditoría 2026-08 (reemplazo de activos): 10 stages cuyos fallos no eran
// reparables con el pipeline (mallas sin UV/texturas, photoscans unlit, catálogos
// de piezas explotados, fuentes sin licencia CC) se sustituyeron por modelos CC
// re-descargados y re-normalizados offline (inspección de vértices real ->
// orientación -> escala -> origen/suelo -> cirugía de nodos sueltos -> tintado
// puntual de carrocería -> dedup + meshopt). Detalles en assets/3d/CREDITS.md.
//
// Vehículos cuyo stage sigue siendo una aproximación (no el modelo exacto).
// Clave: id de vehículo -> modelo anunciado vs. stage usado y por qué.
// Auditoría 2026-08: se retiraron de esta lista i30 N, CX-5, GLE 63 (cupé), Cullinan,
// Urus, 812, NSX, S63, Taycan, GT-R, M4, M5, Huracán, Camaro y Swift Sport — ahora
// usan el modelo correcto de su generación/versión.
const MODEL3D_FALLBACK = {
  "dodge-demon-170": "Challenger SRT Demon 170 -> Dodge Challenger SRT Hellcat (misma carrocería LD; el Demon añade capó/aero específico)",
  "mclaren-750s": "750S -> McLaren 720S (misma familia; el 750S es el rediseño del 720S)",
  "chevrolet-tahoe-rst": "Tahoe RST 2024 -> Tahoe Z71 Premier 2021 sin distintivos (misma generación; no hay RST civil descargable)",
  "chevrolet-silverado-zr2": "Silverado ZR2 2024 -> Silverado 1500 RST 2020 (misma generación T1; el ZR2 añade deflectores/barras)",
  "toyota-camry-trd": "Camry TRD (XV70) -> Toyota Camry XSE 2021 (misma generación XV70)",
  "honda-accord": "Accord Sport 2024 (11ª gen) -> Honda Accord Mk10 Sport US-spec 2018 (10ª gen; no hay 11ª gen descargable)",
  "tesla-model-3-performance": "Model 3 Performance 2024 (Highland) -> Tesla Model 3 Performance 2023 (pre-Highland; no hay Highland descargable)",
  "suzuki-jimny": "Jimny 2024 -> Suzuki Jimny Sierra 2023 (JB74, misma generación)",
  "subaru-outback": "Outback Wilderness 2024 -> Subaru Outback 2022 (misma generación)",
  "honda-integra-types": "Integra Type S 2024 -> Honda Integra 1.5T 2022 (misma carrocería DE; el Type S ensancha vías y añade aero)",
  "subaru-wrx-sti": "WRX STI 2024 (VB) -> Subaru WRX VB (no existe STI de la generación VB; sedán VB de serie)",
  "aston-martin-db12": "DB12 Coupé 2024 -> DB12 Volante 2024 (misma carrocería DB12 en versión descapotable; los cupés descargables estaban rotos)",
  "ford-bronco-raptor": "Bronco Raptor 2024 -> Ford Bronco 2 puertas 2021 (la ficha es 2 puertas; el Raptor añade vías ensanchadas/kit)",
  "audi-sq8": "Audi SQ8 (mantenido) -> el SQ8 disponible en Sketchfab es flat-shaded; alternativa Q8 RS con export roto",
  "mercedes-c63-amg": "C63 S AMG 2024 (W206 híbrido enchufable) -> Mercedes-Benz C63 S AMG W205 (anterior generación, mismo trim AMG y carrocería; no hay C63 W206 descargable)",
  "rivian-r1s": "Rivian R1S 2024 -> Rivian Electric SUV estilo R1S (no existe R1S descargable; misma familia frontal estadio y carrocería SUV)",
  "peugeot-508-peugeot-sport": "508 PSE 2024 -> Peugeot 508 fastback (niev; color carrocería retintado a gris para casar con la ficha)",
};

// Configuración del visor para un vehículo: { url, yaw } (o null).
function modelo3dConfigDeVehiculo(vehiculoId) {
  const stage = MODEL3D_MAP[vehiculoId];
  if (!stage) return null;
  const def = MODEL3D_STAGES[stage];
  if (!def) return null;
  return { url: def.glb, yaw: def.yaw || 0 };
}

// Retro-compatibilidad: ruta GLB local de un vehículo (o "" si no hay mapping).
function modelo3dDeVehiculo(vehiculoId) {
  const cfg = modelo3dConfigDeVehiculo(vehiculoId);
  return cfg ? cfg.url : "";
}
