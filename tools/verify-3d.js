// Deep 3D audit: MODEL3D_FALLBACK refs, yaw sanity, GLB integrity (magic/JSON/meshes/materials)
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..');

const src = fs.readFileSync(path.join(REPO, 'js/data.js'), 'utf8');
const SEED = eval('(function(){ ' + src.replace('const SEED =', 'var SEED = ') + '; return SEED; })()');
const ids = SEED.vehiculos.map(v => v.id);
const idsSet = new Set(ids);

const m3 = fs.readFileSync(path.join(REPO, 'js/model3d.js'), 'utf8');

// Extract stage keys + glb paths + yaw
const stageRe = /^\s{2}"([a-z0-9-]+)":\s*\{\s*glb:\s*"([^"]+)",\s*yaw:\s*(-?\d+)\s*\}/gm;
const stages = {};
let m;
while ((m = stageRe.exec(m3)) !== null) stages[m[1]] = { glb: m[2], yaw: parseInt(m[3]) };

// Extract MAP entries
const mapRe = /^\s{2}"([a-z0-9-]+)":\s*"([a-z0-9-]+)",?$/gm;
const map = {};
while ((m = mapRe.exec(m3)) !== null) map[m[1]] = m[2];

// Extract FALLBACK entries (key: "description string")
const fbRe = /^\s{2}"([a-z0-9-]+)":\s*"([^"]*(?:"[^"]*)*)"?,?\s*$/gm;
const fallback = {};
while ((m = fbRe.exec(m3)) !== null) {
  const key = m[1];
  // skip if it's a stage (glb pattern) or a map entry (pure slug value)
  if (stages[key]) continue;
  if (map[key] && /^[a-z0-9-]+$/.test(map[key]) && key !== m[2]) continue;
  if (m[2].length > 10 && !/^[a-z0-9-]+$/.test(m[2])) fallback[key] = m[2];
}

console.log('=== PARSE SUMMARY ===');
console.log('stages:', Object.keys(stages).length, '| map entries:', Object.keys(map).length, '| fallback entries:', Object.keys(fallback).length);

// 1. MAP keys must be catalog ids; values must be stages
console.log('\n=== MAP AUDIT ===');
let badMapKey = 0, badMapVal = 0;
Object.entries(map).forEach(([k, v]) => {
  if (!idsSet.has(k)) { badMapKey++; console.log('MAP key not in catalog:', k); }
  if (!stages[v]) { badMapVal++; console.log('MAP value not a stage:', k, '->', v); }
});
console.log('bad map keys:', badMapKey, '| bad map targets:', badMapVal);

// 2. FALLBACK keys must be catalog ids
console.log('\n=== FALLBACK AUDIT ===');
let badFb = 0;
Object.keys(fallback).forEach(k => {
  if (!idsSet.has(k)) { badFb++; console.log('FALLBACK key not in catalog:', k); }
});
console.log('bad fallback keys:', badFb);

// 3. Stage keys that are NOT catalog ids and NOT referenced by any map -> dead stages
console.log('\n=== DEAD STAGE AUDIT ===');
const mapValues = new Set(Object.values(map));
let dead = 0;
Object.keys(stages).forEach(k => {
  if (!idsSet.has(k) && !mapValues.has(k)) { dead++; console.log('DEAD stage (no ad uses it):', k); }
});
console.log('dead stages:', dead);

// 4. Yaw sanity: only 0/90/180/270 expected
console.log('\n=== YAW AUDIT ===');
const yawVals = {};
Object.values(stages).forEach(s => { yawVals[s.yaw] = (yawVals[s.yaw] || 0) + 1; });
console.log('yaw distribution:', JSON.stringify(yawVals));

// 5. GLB integrity: magic bytes, version, JSON chunk parses, has meshes & materials & textures
console.log('\n=== GLB INTEGRITY AUDIT ===');
function parseGLB(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 20) return { error: 'too small' };
  if (buf.toString('ascii', 0, 4) !== 'glTF') return { error: 'bad magic' };
  const version = buf.readUInt32LE(4);
  const jsonLen = buf.readUInt32LE(12);
  if (jsonLen <= 0 || 20 + jsonLen > buf.length) return { error: 'bad json chunk length' };
  let json;
  try {
    json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  } catch (e) { return { error: 'json parse fail' }; }
  const meshes = (json.meshes || []).length;
  const mats = (json.materials || []).length;
  const texs = (json.images || []).length;
  const verts = (json.meshes || []).reduce((s, mm) => s + (mm.primitives || []).reduce((ss, p) => ss + (p.attributes && p.attributes.POSITION != null ? 1 : 0), 0), 0);
  return { version, meshes, mats, texs, prims: verts, size: buf.length };
}
let glbIssues = 0, noTex = [];
Object.entries(stages).forEach(([k, s]) => {
  const file = path.join(REPO, s.glb.replace(/^\//, ''));
  if (!fs.existsSync(file)) { glbIssues++; console.log('MISSING GLB:', k, s.glb); return; }
  const r = parseGLB(file);
  if (r.error) { glbIssues++; console.log('BROKEN GLB:', k, r.error); return; }
  if (r.meshes === 0) { glbIssues++; console.log('NO MESHES:', k); }
  if (r.mats === 0) { glbIssues++; console.log('NO MATERIALS:', k); }
  if (r.texs === 0) noTex.push(k);
});
console.log('GLB issues:', glbIssues);
console.log('GLBs with zero embedded images (vertex-color/unlit risk):', noTex.length ? noTex.join(', ') : 'none');

// 6. Every catalog id resolves through modelo3DPara() equivalent: id in stages OR map
console.log('\n=== COVERAGE ===');
const covered = ids.filter(id => stages[id] || map[id]);
console.log('catalog ids with direct stage or map:', covered.length, '/', ids.length);

// 7. CREDITS.md mentions each stage
console.log('\n=== CREDITS AUDIT ===');
const credits = fs.readFileSync(path.join(REPO, 'assets/3d/CREDITS.md'), 'utf8');
let missingCredits = 0;
Object.keys(stages).forEach(k => {
  if (!credits.includes(k)) { missingCredits++; console.log('Stage without CREDITS entry:', k); }
});
console.log('stages missing credits:', missingCredits);

console.log('\n=== DONE ===');
