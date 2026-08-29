# Herramientas de auditoría (QA)

Scripts Node sin dependencias para verificar la consistencia del catálogo, los
stages 3D y la complejidad de los GLB. Ejecutar desde la raíz del repositorio:

```bash
node tools/verify-catalog.js          # consistencia de datos del catálogo
node tools/verify-3d.js               # stages, mappings, GLB y CREDITS
node tools/analyze-glb.js             # top 12 GLB más pesados (triángulos/MB)
node tools/analyze-glb.js assets/3d/cars/<modelo>.glb   # detalle de un GLB
node tools/analyze-glb-materials.js assets/3d/cars/*.glb  # materiales por GLB
```

## verify-catalog.js

Comprueba que el catálogo sea internamente consistente (la clase de bug donde
la UI anuncia un número de vehículos distinto del real):

- Nº de entradas de `vehiculos` vs suma de `marcas.cantidad` vs longitud de
  `ordenRelevancia` (deben coincidir; sin duplicados)
- `cantidad`/`precioMin`/`precioMax` de cada marca vs valores reales del catálogo
- Todas las imágenes de vehículos y marcas existen en `assets/`
- Pedidos y favoritos no referencian slugs fuera del catálogo

## verify-3d.js

Comprueba la capa 3D:

- Cada entrada de `MODEL3D_MAP` apunta a un stage existente y a un anuncio real
- Cada id del catálogo resuelve stage (directo o vía map) — cobertura 86/86
- Stages muertos (ningún anuncio los usa)
- Integridad de cada GLB: magic bytes, JSON parseable, meshes/materiales
- Cada stage tiene entrada en `assets/3d/CREDITS.md`

## analyze-glb.js / analyze-glb-materials.js

Complejidad geométrica (triángulos, vértices, primitivas, MB, compresión) y
rasgos de materiales (transmisión, clearcoat, alpha blend, nº de mallas).

Guía rápida de presupuesto: los visores WebGL van cómodos por debajo de
~700K triángulos y ~100 mallas por modelo. Modelos por encima (ej. el
Touareg original a 1.83M triángulos) saturan el hilo principal durante la
decodificación en dispositivos modestos y conviene simplificarlos con
[gltf-transform](https://gltf-transform.dev/):

```bash
npx @gltf-transform/cli simplify in.glb out.glb --ratio 0.25 --error 0.001
npx @gltf-transform/cli meshopt out.glb final.glb
```
