// Verification: catalog consistency after XC90 + R1T removal
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..');

// Load data.js with a scoped eval that tolerates "const SEED ="
const src = fs.readFileSync(path.join(REPO, 'js/data.js'), 'utf8');
const wrapped = '(function(){ ' + src.replace('const SEED =', 'var SEED = ') + '; return SEED; })()';
const SEED = eval(wrapped);

const ids = SEED.vehiculos.map(v => v.id);
console.log('=== CATALOG COUNTS ===');
console.log('vehiculos entries:', SEED.vehiculos.length);
console.log('marcas entries:', SEED.marcas.length);
console.log('sum(marcas.cantidad):', SEED.marcas.reduce((s, m) => s + m.cantidad, 0));
console.log('ordenRelevancia length:', SEED.ordenRelevancia.length);
console.log('duplicates in catalog:', ids.filter((id, i) => ids.indexOf(id) !== i));
console.log('XC90/R1T in catalog:', ids.includes('volvo-xc90-recharge'), ids.includes('rivian-r1t'));

const orphans = SEED.ordenRelevancia.filter(slug => !ids.includes(slug));
console.log('ordenRelevancia orphans (not in catalog):', orphans.length ? orphans : 'none');
const missing = ids.filter(id => !SEED.ordenRelevancia.includes(id));
console.log('catalog ids missing from ordenRelevancia:', missing.length ? missing : 'none');

// Per-brand cantidad vs actual
console.log('\n=== BRAND COUNT AUDIT (marcas.cantidad vs actual) ===');
const byBrand = {};
SEED.vehiculos.forEach(v => { (byBrand[v.marca] = byBrand[v.marca] || []).push(v); });
let brandMismatches = 0;
SEED.marcas.forEach(m => {
  const actual = (byBrand[m.name] || []).length;
  const match = actual === m.cantidad ? 'OK' : 'MISMATCH';
  if (actual !== m.cantidad) brandMismatches++;
  console.log(`${match.padEnd(9)} ${m.name}: declared=${m.cantidad} actual=${actual}`);
});
console.log('brand mismatches:', brandMismatches);

// precioMin/precioMax audit
console.log('\n=== BRAND PRICE RANGE AUDIT ===');
SEED.marcas.forEach(m => {
  const list = byBrand[m.name] || [];
  if (!list.length) return;
  const min = Math.min(...list.map(v => v.precio));
  const max = Math.max(...list.map(v => v.precio));
  const ok = min === m.precioMin && max === m.precioMax;
  if (!ok) console.log(`MISMATCH ${m.name}: declared min/max=${m.precioMin}/${m.precioMax} actual=${min}/${max}`);
});
console.log('price range audit done');

// marca imagen audit
console.log('\n=== BRAND IMAGE AUDIT ===');
SEED.marcas.forEach(m => {
  if (!fs.existsSync(path.join(REPO, 'assets', m.imagen))) console.log('MISSING IMAGE:', m.name, m.imagen);
});
console.log('brand images ok');

// vehicle images audit
console.log('\n=== VEHICLE IMAGE AUDIT ===');
let missingImgs = 0;
SEED.vehiculos.forEach(v => {
  (v.imagenes || []).forEach(img => {
    if (!fs.existsSync(path.join(REPO, 'assets', img))) { missingImgs++; console.log('MISSING:', v.id, img); }
  });
});
console.log('missing vehicle images:', missingImgs);

// 3D stage audit: every catalog id must resolve to a stage or fallback
console.log('\n=== 3D STAGE AUDIT ===');
const m3src = fs.readFileSync(path.join(REPO, 'js/model3d.js'), 'utf8');
// crude extraction of MODEL3D_STAGES keys and MODEL3D_MAP entries
const stageKeys = [...m3src.matchAll(/^\s{2}"([a-z0-9-]+)":\s*\{\s*glb:/gm)].map(m => m[1]);
console.log('MODEL3D_STAGES count:', stageKeys.length);
const mapMatches = [...m3src.matchAll(/^\s{2}"([a-z0-9-]+)":\s*"([a-z0-9-]+)",?$/gm)];
console.log('MODEL3D_MAP entries:', mapMatches.length);
const mapKeys = mapMatches.map(m => m[1]);
const stageSet = new Set(stageKeys);
const badMapTargets = mapMatches.filter(m => !stageSet.has(m[2]));
console.log('MAP entries pointing to missing stage:', badMapTargets.length ? badMapTargets.map(m => m[1] + '->' + m[2]) : 'none');

// every stage glb file exists?
console.log('\n=== GLB FILE AUDIT ===');
let missingGlbs = 0;
stageKeys.forEach(k => {
  const glb = '/assets/3d/cars/' + k + '.glb';
  if (!fs.existsSync(path.join(REPO, glb.slice(1)))) { missingGlbs++; console.log('MISSING GLB for stage:', k); }
});
console.log('missing stage GLBs:', missingGlbs);

// orphan GLBs (files without a stage)?
const glbFiles = fs.readdirSync(path.join(REPO, 'assets/3d/cars')).filter(f => f.endsWith('.glb'));
const orphanGlbs = glbFiles.filter(f => !stageSet.has(f.replace('.glb', '')));
console.log('GLB files on disk:', glbFiles.length, '| orphan GLBs (no stage):', orphanGlbs.length ? orphanGlbs : 'none');

// catalog ids without any 3D resolution (stage direct or via map)
const resolvable = id => stageSet.has(id) || mapKeys.includes(id);
const no3d = ids.filter(id => !resolvable(id));
console.log('catalog ids with NO 3D stage/mapping:', no3d.length ? no3d : 'none');

// orders / favorites / reviews referencing removed slugs
console.log('\n=== SEED DATA REFERENCE AUDIT ===');
const removed = ['volvo-xc90-recharge', 'rivian-r1t'];
let orderRefs = 0;
(SEED.pedidos || []).forEach(p => (p.items || []).forEach(it => {
  if (removed.includes(it.vehicleSlug)) orderRefs++;
  if (!ids.includes(it.vehicleSlug)) console.log('ORDER', p.number, 'references unknown slug:', it.vehicleSlug);
}));
console.log('order items referencing removed vehicles:', orderRefs);
Object.entries(SEED.favoritosPorUsuario || SEED.favoritos || {}).forEach(([user, slugs]) => {
  const bad = slugs.filter(s => !ids.includes(s));
  if (bad.length) console.log('FAVORITES', user, 'unknown slugs:', bad);
});
console.log('favorites audit done');

console.log('\n=== EXPECTED PUBLIC COUNT ===');
console.log('public vehicle count =', ids.length, '(should be what UI shows everywhere)');
