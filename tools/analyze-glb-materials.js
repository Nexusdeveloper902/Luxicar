// Compare material extensions/features across GLBs
const fs = require('fs');
const path = require('path');
function matInfo(file) {
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  const exts = new Set(json.extensionsUsed || []);
  const matFeatures = {};
  let transparent = 0, transmission = 0, volume = 0, iridescence = 0, clearcoat = 0, sheen = 0, specular = 0, emissive = 0;
  (json.materials || []).forEach(m => {
    if (m.alphaMode === 'BLEND') transparent++;
    if (m.extensions) {
      if (m.extensions.KHR_materials_transmission) transmission++;
      if (m.extensions.KHR_materials_volume) volume++;
      if (m.extensions.KHR_materials_iridescence) iridescence++;
      if (m.extensions.KHR_materials_clearcoat) clearcoat++;
      if (m.extensions.KHR_materials_sheen) sheen++;
      if (m.extensions.KHR_materials_specular) specular++;
    }
    if (m.emissiveFactor && m.emissiveFactor.some(v => v > 0)) emissive++;
  });
  // count nodes/meshes and total verts
  let verts = 0;
  (json.meshes || []).forEach(mm => (mm.primitives || []).forEach(p => {
    if (p.attributes && p.attributes.POSITION != null) verts += json.accessors[p.attributes.POSITION].count;
  }));
  return {
    file: file.split('/').pop(),
    tris: Math.round(verts / 2),
    meshes: (json.meshes || []).length,
    materials: (json.materials || []).length,
    transparent, transmission, volume, iridescence, clearcoat, sheen, specular, emissive,
    exts: [...exts].join(','),
  };
}
process.argv.slice(2).forEach(f => {
  const r = matInfo(f);
  console.log(JSON.stringify(r));
});
