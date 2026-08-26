// ============================================================================
// landing-3d.js — Visor WebGL (Three.js) del vehículo de la portada FX.
//
// Módulo ES cargado con importmap. Registra `window.LUXICAR_3D` ANTES de que
// `landing.js` monte la escena (los <script type="module"> se ejecutan antes
// de DOMContentLoaded). landing.js llama `LUXICAR_3D.init({...})` dentro del
// scope cinematográfico; si falla (sin WebGL, modelo ausente, file://), la
// silueta SVG sigue siendo el vehículo — este módulo es una mejora progresiva.
//
// Modelo: "Car Concept" — Eric Chadwick / Darmstadt Graphics Group, CC-BY-4.0
// (Khronos glTF-Sample-Assets). Fichero local: assets/models/car-concept/.
//
// Contrato con landing.js:
//   init({ sticky, model, onReady, onError }) -> { update(pose), dispose() }
//   update({ t, pose: {x,y,rotDeg,scale} | null, vis, carWPx })
//     - pose === null  → escena INTRO: turntable lento en el centro del escenario
//     - pose           → posición en píxeles del escenario (origen top-left),
//                        rotDeg = tangente de la ruta en coords de pantalla,
//                        carWPx = ancho objetivo del coche en píxeles
// ============================================================================
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const FX3D = {
  // Corrige la orientación del modelo si el morro no apunta a +X tras normalizar.
  MODEL_YAW_OFFSET: 0,
  // Vista 3/4 al aparcar en la escena de ficha técnica.
  YAW_PARKING: -28 * Math.PI / 180,
  FOV: 32,
  DISTANCIA: 10,
  DPR_MAX: 1.75,
};

function crearVisor(opts) {
  const sticky = opts.sticky;
  const canvas = document.createElement("canvas");
  canvas.className = "fx-canvas-3d";
  canvas.setAttribute("aria-hidden", "true");
  sticky.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, FX3D.DPR_MAX));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FX3D.FOV, 1, 0.1, 60);
  camera.position.set(0, 0, FX3D.DISTANCIA);

  // Entorno de estudio para los materiales PBR (clearcoat, transmisión).
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  // Luz clave con sombra suave + relleno hemisférico sutil.
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 7, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.bias = -0.0004;
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x0a0a0c, 0.35));

  // Suelo receptor de sombra (invisible salvo la sombra).
  const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ opacity: 0.42 })
  );
  suelo.rotation.x = -Math.PI / 2;
  suelo.receiveShadow = true;
  scene.add(suelo);

  // Estado
  let stageW = 1, stageH = 1;
  let carRoot = null;       // grupo externo: posición + yaw
  let carInner = null;      // grupo interno: centrado + escala normalizada
  let longitudModelo = 1;   // longitud del modelo en unidades de mundo (sin escala)
  let ruedas = [];
  let listo = false;
  let pose = null;          // última pose recibida de landing.js
  let vis = 1;
  let carWPx = 340;
  let yawActual = 0;
  let disposed = false;
  let raf = 0;
  let escenaVisible = true;
  let prevMs = 0;
  let turntable = 0;        // ángulo acumulado del turntable del intro
  const puntero = { x: 0, y: 0, tx: 0, ty: 0 };

  function medir() {
    stageW = sticky.clientWidth || 1;
    stageH = sticky.clientHeight || 1;
    renderer.setSize(stageW, stageH, false);
    camera.aspect = stageW / stageH;
    camera.updateProjectionMatrix();
  }
  medir();
  const ro = new ResizeObserver(medir);
  ro.observe(sticky);

  // px del escenario -> mundo (plano z = 0 visto desde la cámara)
  function visH() { return 2 * FX3D.DISTANCIA * Math.tan(THREE.MathUtils.degToRad(FX3D.FOV) / 2); }
  function pxAMundo(xPx, yPx) {
    const h = visH();
    return [(xPx / stageW - 0.5) * h * (stageW / stageH), (0.5 - yPx / stageH) * h];
  }

  new GLTFLoader().load(
    opts.model,
    (gltf) => {
      if (disposed) return;
      const src = gltf.scene;
      // Normalizar: centrar en origen, apoyar ruedas en y=0, frente a +X.
      const caja = new THREE.Box3().setFromObject(src);
      const tam = caja.getSize(new THREE.Vector3());
      const centro = caja.getCenter(new THREE.Vector3());
      carInner = new THREE.Group();
      carInner.add(src);
      src.position.set(-centro.x, -caja.min.y, -centro.z);
      // El modelo mide más en Z que en X: el morro sigue +Z → rotar a +X.
      if (tam.z > tam.x) carInner.rotation.y = Math.PI / 2;
      longitudModelo = Math.max(tam.x, tam.z);
      carRoot = new THREE.Group();
      carRoot.add(carInner);
      scene.add(carRoot);

      src.traverse((o) => {
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; }
      });
      ruedas = [];
      ["WheelFrontL", "WheelFrontR", "WheelRearL", "WheelRearR"].forEach((n) => {
        const w = src.getObjectByName(n);
        if (w) ruedas.push(w);
      });

      listo = true;
      if (opts.onReady) opts.onReady();
    },
    undefined,
    (err) => {
      if (opts.onError) opts.onError(err);
    }
  );

  // Parallax de cámara con el puntero (amplitud pequeña, sensación premium).
  function onPointer(ev) {
    puntero.tx = (ev.clientX / window.innerWidth - 0.5) * 2;
    puntero.ty = (ev.clientY / window.innerHeight - 0.5) * 2;
  }
  window.addEventListener("pointermove", onPointer, { passive: true });

  const io = new IntersectionObserver(
    (entries) => { escenaVisible = entries[0] ? entries[0].isIntersecting : true; },
    { threshold: 0 }
  );
  io.observe(sticky);

  function wrapYaw(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function frame(ms) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (!escenaVisible || document.hidden) { prevMs = ms; return; }
    const dt = Math.min(0.05, prevMs ? (ms - prevMs) / 1000 : 0.016);
    prevMs = ms;

    if (listo && carRoot) {
      let xw = 0, yw = -0.35, yawObjetivo, mundoLen;
      const h = visH();
      if (pose === null) {
        // INTRO: turntable lento, coche centrado y grande
        turntable += dt * 0.35;
        yawObjetivo = turntable - Math.PI / 3;
        mundoLen = h * 0.62;
        yw = -h * 0.12;
      } else {
        const [px, py] = [pose.x, pose.y];
        const w = pxAMundo(px, py);
        xw = w[0]; yw = w[1];
        mundoLen = carWPx * pose.scale * (h / stageH);
        yawObjetivo = -pose.rotDeg * Math.PI / 180;
        if (pose.parking) yawObjetivo = FX3D.YAW_PARKING;
      }
      // Giro suavizado (el scrub ya manda; esto solo redondea saltos de 90°)
      const dyaw = wrapYaw(yawObjetivo - yawActual);
      yawActual += dyaw * Math.min(1, dt * 10);
      const s = mundoLen / longitudModelo;
      carRoot.position.set(xw, yw, 0);
      carRoot.rotation.y = yawActual + FX3D.MODEL_YAW_OFFSET;
      carInner.scale.setScalar(s);
      // Flotación sutil
      carInner.position.y = Math.sin(ms / 1400) * 0.012 * mundoLen;
      // Ruedas giran con la marcha (velocidad proporcional al avance de ruta)
      if (pose && pose.ruedasVel) {
        ruedas.forEach((r) => { r.rotation.x += pose.ruedasVel * dt; });
      }
      // El suelo sigue al coche para la sombra
      suelo.position.set(xw, 0, 0);
      canvas.style.opacity = String(vis);
      // Parallax de cámara
      puntero.x += (puntero.tx - puntero.x) * Math.min(1, dt * 4);
      puntero.y += (puntero.ty - puntero.y) * Math.min(1, dt * 4);
      camera.position.set(puntero.x * 0.35, -puntero.y * 0.22, FX3D.DISTANCIA);
      camera.lookAt(xw * 0.4, yw * 0.4, 0);
      renderer.render(scene, camera);
    } else {
      renderer.render(scene, camera);
    }
  }
  raf = requestAnimationFrame(frame);

  return {
    update(p) {
      if (!p) return;
      pose = p.pose === undefined ? pose : p.pose;
      if (p.vis !== undefined) vis = p.vis;
      if (p.carWPx) carWPx = p.carWPx;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      ro.disconnect();
      io.disconnect();
      if (carRoot) {
        carRoot.traverse((o) => {
          if (o.isMesh) {
            o.geometry && o.geometry.dispose();
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m) => m && m.dispose());
          }
        });
      }
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}

// Registro inmediato (los módulos se ejecutan antes de DOMContentLoaded).
window.LUXICAR_3D = {
  init(opts) {
    try {
      return crearVisor(opts);
    } catch (e) {
      if (opts.onError) opts.onError(e);
      return null;
    }
  },
};
window.dispatchEvent(new Event("luxicar-3d-ready"));
