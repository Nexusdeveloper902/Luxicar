// Analyze GLB geometry complexity (vertices, primitives, materials, extensions)
const fs = require('fs');
const path = require('path');

function analyze(file) {
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  let verts = 0, prims = 0, tris = 0;
  const accessor = i => json.accessors[i];
  (json.meshes || []).forEach(m => {
    (m.primitives || []).forEach(p => {
      prims++;
      if (p.attributes && p.attributes.POSITION != null) {
        const acc = accessor(p.attributes.POSITION);
        verts += acc.count;
        if (p.indices != null) tris += Math.floor(accessor(p.indices).count / 3);
        else tris += Math.floor(acc.count / 3);
      }
    });
  });
  return {
    file: path.basename(file),
    sizeMB: +(buf.length / 1048576).toFixed(1),
    meshes: (json.meshes || []).length,
    prims,
    verts,
    tris,
    materials: (json.materials || []).length,
    images: (json.images || []).length,
    extensions: Object.keys(json.extensionsUsed || {}),
    hasDraco: (json.extensionsRequired || []).includes('KHR_draco_mesh_compression'),
    hasMeshopt: (json.extensionsRequired || []).includes('EXT_meshopt_compression'),
  };
}

const targets = process.argv.slice(2);
if (targets.length) {
  targets.forEach(f => console.log(JSON.stringify(analyze(f), null, 0)));
} else {
  // compare all car GLBs sorted by triangle count
  const dir = path.resolve(__dirname, '..', 'assets/3d/cars');
  const rows = fs.readdirSync(dir).filter(f => f.endsWith('.glb'))
    .map(f => analyze(path.join(dir, f)))
    .sort((a, b) => b.tris - a.tris);
  console.log('TOP 12 HEAVIEST BY TRIANGLES:');
  rows.slice(0, 12).forEach(r =>
    console.log(`${r.file.padEnd(34)} ${String(r.tris).padStart(9)} tris ${String(r.verts).padStart(9)} verts ${String(r.prims).padStart(4)} prims ${String(r.sizeMB).padStart(6)} MB tex:${r.images} ${r.hasMeshopt ? 'meshopt' : r.hasDraco ? 'draco' : 'uncompressed'}`));
}
