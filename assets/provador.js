/* ==========================================================
   Essencial Vision — Provador Virtual
   - Modelos 3D dos óculos gerados com Three.js
   - Rastreamento do rosto com MediaPipe Face Landmarker
   Tudo roda no aparelho do cliente: nenhuma imagem é enviada.
   ========================================================== */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const MP_VERSION = "0.10.14";
const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.mjs`;
const MP_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MP_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/* ---------- Os 3 modelos disponíveis no provador ---------- */
const MODELOS = {
  "ev-401": { estilo: "sem-aro",  material: "metal",   lente: "clara" }, // produto real (Essencial Air)
  "ev-101": { estilo: "redondo",  material: "acetato", lente: "clara" },
  "ev-105": { estilo: "quadrado", material: "acetato", lente: "clara" },
  "ev-201": { estilo: "aviador",  material: "metal",   lente: "sol", corLente: "#33402f" },
};

/* ---------- Elementos da página ---------- */
const $ = (s) => document.querySelector(s);
const stage = $("#tryon-stage");
const video = $("#tryon-video");
const photo = $("#tryon-photo");
const canvas = $("#tryon-canvas");
const statusEl = $("#tryon-status");
const hintEl = $("#tryon-hint");

/* ---------- Cena 3D ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
const key = new THREE.DirectionalLight(0xffffff, 1.2);
key.position.set(0.3, 1, 1);
scene.add(key, new THREE.AmbientLight(0xffffff, 0.35));

// Câmera de exibição (modo vitrine 3D)
const pCam = new THREE.PerspectiveCamera(28, 4 / 3, 1, 5000);
pCam.position.set(150, 60, 330);
const controls = new OrbitControls(pCam, canvas);
controls.target.set(0, 0, -45);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.6;
controls.enablePan = false;
controls.minDistance = 180;
controls.maxDistance = 600;

// Câmera do provador (ortográfica, em pixels da imagem)
const oCam = new THREE.OrthographicCamera(0, 640, 480, 0, -10000, 10000);

// root = posicionado sobre o rosto | model = os óculos | occluder = "cabeça invisível"
const root = new THREE.Group();
root.matrixAutoUpdate = false;
scene.add(root);
let model = new THREE.Group();
root.add(model);

// A cabeça invisível esconde as hastes quando passam por trás do rosto
const occluder = new THREE.Mesh(
  new THREE.SphereGeometry(1, 40, 28),
  new THREE.MeshBasicMaterial({ colorWrite: false })
);
occluder.scale.set(66, 98, 100);
occluder.position.set(0, -18, -108);
occluder.renderOrder = -1;
occluder.visible = false;
root.add(occluder);

/* ---------- Construção dos óculos 3D ---------- */
function lensPoints(estilo, n = 120) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    let x, y;
    if (estilo === "redondo") {
      x = 23 * c; y = 22 * s;
    } else if (estilo === "quadrado") {
      const e = 2 / 5; // superelipse: cantos arredondados
      x = 26 * Math.sign(c) * Math.abs(c) ** e;
      y = 21 * Math.sign(s) * Math.abs(s) ** e;
    } else { // aviador (gota)
      x = 27 * Math.sign(c) * Math.abs(c) ** (s > 0 ? 0.7 : 1);
      y = s > 0 ? 17 * Math.abs(s) ** 0.6 : -25 * Math.abs(s);
      if (s < 0) x -= 5 * Math.abs(s); // ponta da gota puxa para o nariz
    }
    pts.push(new THREE.Vector2(x, y));
  }
  return pts;
}

function offsetPoints(pts, d) {
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const tx = b.x - a.x, ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    return new THREE.Vector2(p.x + (ty / len) * d, p.y - (tx / len) * d);
  });
}

let tortoiseTex;
function tortoiseTexture() {
  if (tortoiseTex) return tortoiseTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#8a5a2b"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 6 + Math.random() * 26;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const dark = Math.random() > 0.35;
    grad.addColorStop(0, dark ? "rgba(40,20,8,.85)" : "rgba(190,130,60,.6)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  tortoiseTex = new THREE.CanvasTexture(c);
  tortoiseTex.colorSpace = THREE.SRGBColorSpace;
  tortoiseTex.wrapS = tortoiseTex.wrapT = THREE.RepeatWrapping;
  tortoiseTex.repeat.set(0.025, 0.025);
  return tortoiseTex;
}

function frameMaterial(corNome, material) {
  const hex = (CORES[corNome] || { frame: "#1c1c1f" }).frame;
  if (material === "metal") return new THREE.MeshStandardMaterial({ color: hex, metalness: 1, roughness: 0.25 });
  if (corNome === "Tartaruga") return new THREE.MeshPhysicalMaterial({ map: tortoiseTexture(), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
  if (corNome === "Transparente") return new THREE.MeshPhysicalMaterial({ color: "#efe8dc", roughness: 0.15, transparent: true, opacity: 0.6, clearcoat: 1 });
  return new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15 });
}

function tube(points, radius, mat, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, closed ? 160 : 48, radius, 12, closed), mat);
}

/* ---------- Essencial Air: armação sem aro (parafusada), medidas reais 53□18 ----------
   Feito a partir das fotos do produto em assets/produtos/.
   Unidades em mm. Lente do lado +x, com o nariz no lado -x. */
function poligonoArredondado(cantos) {
  const s = new THREE.Shape();
  const n = cantos.length;
  const pt = (i) => cantos[(i + n) % n];
  for (let i = 0; i < n; i++) {
    const [x, y, r] = pt(i), [px, py] = pt(i - 1), [nx, ny] = pt(i + 1);
    const d1 = Math.hypot(px - x, py - y), d2 = Math.hypot(nx - x, ny - y);
    const a = { x: x + ((px - x) / d1) * r, y: y + ((py - y) / d1) * r };
    const b = { x: x + ((nx - x) / d2) * r, y: y + ((ny - y) / d2) * r };
    if (i === 0) s.moveTo(a.x, a.y); else s.lineTo(a.x, a.y);
    s.quadraticCurveTo(x, y, b.x, b.y);
  }
  s.closePath();
  return s;
}

function buildSemAro() {
  const g = new THREE.Group();
  const LW = 26.5, LH = 18;          // meia largura e meia altura da lente (53 x 36 mm)
  const PONTE = 9;                  // meia ponte (18 mm)
  const cx = PONTE + LW;            // centro de cada lente
  const outerX = cx + LW;           // borda externa da lente

  const metal = new THREE.MeshStandardMaterial({ color: "#d9dde3", metalness: 0.9, roughness: 0.32 });
  const silicone = new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.5, roughness: 0.15, depthWrite: false });
  const faceLente = new THREE.MeshPhysicalMaterial({
    color: "#dcd8ff", transparent: true, opacity: 0.13, roughness: 0.03, envMapIntensity: 2.6,
    iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [320, 520], // reflexo arroxeado do antirreflexo
    depthWrite: false, side: THREE.DoubleSide,
  });
  const bordaLente = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.85, depthWrite: false }); // borda polida da lente brilha como nas fotos

  // contorno da lente: topo reto, lado externo afunilando um pouco para baixo
  const forma = poligonoArredondado([
    [-LW + 1, -LH + 0.5, 5],   // baixo, lado do nariz
    [LW - 1.2, -LH, 7],        // baixo, lado de fora
    [LW, LH, 3.5],             // cima, lado de fora
    [-LW + 0.5, LH, 3.5],      // cima, lado do nariz
  ]);
  const geoLente = new THREE.ExtrudeGeometry(forma, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2, curveSegments: 24 });
  geoLente.translate(0, 0, -0.8);

  const parafuso = (x, y) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 4, 12), metal);
    p.rotation.x = Math.PI / 2; p.position.set(x, y, 0);
    return p;
  };
  const caixa = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), metal); m.position.set(x, y, z); return m; };

  for (const side of [1, -1]) {
    const lado = new THREE.Group();
    lado.position.x = side * cx;
    lado.scale.x = side;
    const lente = new THREE.Mesh(geoLente, [faceLente, bordaLente]);
    lente.renderOrder = 2;
    lado.add(lente);
    g.add(lado);

    // fixação da ponte na lente (lado do nariz)
    g.add(caixa(3, 4.5, 3.2, side * (PONTE + 2.5), LH - 3, 0));
    g.add(parafuso(side * (PONTE + 2.5), LH - 3));
    // braço e plaqueta de silicone
    g.add(tube([new THREE.Vector3(side * (PONTE + 1.5), LH - 4.5, -1.6), new THREE.Vector3(side * (PONTE + 1), LH - 12, -4), new THREE.Vector3(side * (PONTE - 0.5), LH - 20, -6.5)], 0.45, metal));
    const plaqueta = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), silicone);
    plaqueta.scale.set(2.6, 5, 1.1);
    plaqueta.rotation.y = side * 0.5;
    plaqueta.position.set(side * (PONTE - 1.2), LH - 22, -7.5);
    g.add(plaqueta);

    // fixação da haste na lente (canto de cima, lado de fora)
    const hx = side * (outerX - 1.8);
    g.add(caixa(3.4, 4.5, 3.2, hx, LH - 4.5, 0));
    g.add(parafuso(hx, LH - 4.5));
    g.add(caixa(1.6, 3, 5, side * (outerX + 0.4), LH - 4.5, -3));
    const dobradica = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 4.5, 14), metal);
    dobradica.position.set(side * (outerX + 0.6), LH - 4.5, -6);
    g.add(dobradica);

    // haste: parte achatada perto da dobradiça + arame fino com ponta curvada
    g.add(caixa(1, 3.6, 26, side * (outerX + 1.2), LH - 4.7, -20));
    g.add(tube([
      new THREE.Vector3(side * (outerX + 1.2), LH - 4.7, -32),
      new THREE.Vector3(side * (outerX + 2.5), LH - 5, -70),
      new THREE.Vector3(side * (outerX + 3.5), LH - 6, -100),
      new THREE.Vector3(side * (outerX + 4), LH - 8, -113),
      new THREE.Vector3(side * (outerX + 2.5), LH - 16, -124),
    ], 0.8, metal));
  }

  // ponte: barra fina ligando as lentes por cima
  g.add(tube([new THREE.Vector3(-(PONTE + 3.5), LH - 3, 1), new THREE.Vector3(0, LH - 1.5, 1.4), new THREE.Vector3(PONTE + 3.5, LH - 3, 1)], 0.9, metal));
  return g;
}

function buildGlasses(cfg, corNome) {
  if (cfg.estilo === "sem-aro") return buildSemAro();
  const g = new THREE.Group();
  const metal = cfg.material === "metal";
  const frameMat = frameMaterial(corNome, cfg.material);
  const lensMat = cfg.lente === "sol"
    ? new THREE.MeshPhysicalMaterial({ color: cfg.corLente, transparent: true, opacity: 0.86, roughness: 0.05, metalness: 0.2, envMapIntensity: 2, depthWrite: false, side: THREE.DoubleSide })
    : new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.1, roughness: 0.02, envMapIntensity: 2.5, depthWrite: false, side: THREE.DoubleSide });

  const inner = lensPoints(cfg.estilo);
  const rim = metal ? 1.2 : cfg.estilo === "quadrado" ? 6.5 : 5;
  const minX = Math.min(...inner.map((p) => p.x));
  const maxX = Math.max(...inner.map((p) => p.x));
  const maxY = Math.max(...inner.map((p) => p.y));
  const bridgeHalf = metal ? 9 : 8;
  const cx = bridgeHalf + rim - minX;          // centro de cada lente
  const outerX = cx + maxX + rim;              // borda externa do aro
  const hingeY = maxY * 0.55;

  for (const side of [1, -1]) {
    const lensSide = new THREE.Group();
    lensSide.position.x = side * cx;
    lensSide.scale.x = side; // espelha a lente do outro lado

    if (metal) {
      lensSide.add(tube(inner.map((p) => new THREE.Vector3(p.x, p.y, 0)), rim, frameMat, true));
    } else {
      const shape = new THREE.Shape(offsetPoints(inner, rim));
      shape.holes.push(new THREE.Path(inner));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: true, bevelThickness: 0.9, bevelSize: 0.9, bevelSegments: 3, curveSegments: 64 });
      geo.translate(0, 0, -4);
      lensSide.add(new THREE.Mesh(geo, frameMat));
    }
    const lens = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(inner), 64), lensMat);
    lens.position.z = metal ? 0 : -2;
    lens.renderOrder = 2;
    lensSide.add(lens);
    g.add(lensSide);

    // Dobradiça / ponteira
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(metal ? 3 : 5, metal ? 3 : 7, metal ? 5 : 9), frameMat);
    hinge.position.set(side * (outerX - (metal ? 0.5 : 2.5)), hingeY, metal ? -2 : -6);
    g.add(hinge);

    // Haste
    const ox = side * (outerX - (metal ? 0.5 : 2.5));
    const tp = [
      new THREE.Vector3(ox, hingeY, -6),
      new THREE.Vector3(ox + side * 3, hingeY, -45),
      new THREE.Vector3(ox + side * 5, hingeY - 1, -98),
      new THREE.Vector3(ox + side * 4, hingeY - 9, -115),
      new THREE.Vector3(ox + side * 2, hingeY - 24, -126),
    ];
    const temple = tube(tp, metal ? 1.1 : 2.1, frameMat);
    g.add(temple);
    if (metal) { // ponteira de acetato
      const tipMat = new THREE.MeshPhysicalMaterial({ color: "#1c1c1f", roughness: 0.35, clearcoat: 1 });
      g.add(tube(tp.slice(2), 1.9, tipMat));
      // plaquetas de nariz
      const pad = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.55, roughness: 0.1 }));
      pad.scale.set(2.2, 4.5, 1.2);
      pad.position.set(side * (bridgeHalf + 1.5), -6, -6);
      g.add(pad);
    }
  }

  // Ponte
  const bx = cx + minX;
  g.add(tube([new THREE.Vector3(-bx - 1, 6, metal ? 0 : -2), new THREE.Vector3(0, 10, metal ? 1 : -1.5), new THREE.Vector3(bx + 1, 6, metal ? 0 : -2)], metal ? 1.2 : 2.8, frameMat));
  if (cfg.estilo === "aviador") { // barra dupla do aviador
    g.add(tube([new THREE.Vector3(-cx + 6, maxY + 1.5, 0), new THREE.Vector3(0, maxY + 2.5, 1), new THREE.Vector3(cx - 6, maxY + 1.5, 0)], 1.1, frameMat));
  }
  return g;
}

function disposeGroup(g) {
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) [].concat(o.material).forEach((m) => { if (m.map !== tortoiseTex) m.dispose(); });
  });
}

/* ---------- Estado da interface ---------- */
const state = {
  id: new URLSearchParams(location.search).get("modelo") || "ev-401",
  cor: null,
  tamanho: 1,
  altura: 0,
  mode: "preview", // preview | video | photo
};
if (!MODELOS[state.id]) state.id = "ev-401";

function setModel(id, cor) {
  const p = PRODUTOS.find((x) => x.id === id);
  state.id = id;
  state.cor = cor && p.cores.includes(cor) ? cor : p.cores[0];
  root.remove(model);
  disposeGroup(model);
  model = buildGlasses(MODELOS[id], state.cor);
  model.position.z = 4; // óculos levemente à frente do nariz
  root.add(model);
  renderUI();
}

function renderUI() {
  document.querySelectorAll("[data-modelo]").forEach((b) => b.classList.toggle("active", b.dataset.modelo === state.id));
  const p = PRODUTOS.find((x) => x.id === state.id);
  $("#tryon-nome").textContent = p.nome;
  $("#tryon-cat").textContent = `${CAT_LABEL[p.categoria]} · ${p.formato[0].toUpperCase() + p.formato.slice(1)} · ${p.material}`;
  $("#tryon-preco").innerHTML = `<strong>${brl(p.preco)}</strong>${p.de ? `<del>${brl(p.de)}</del>` : ""}<small>${LOJA.parcelas}x de ${brl(p.preco / LOJA.parcelas)} sem juros</small>`;
  $("#tryon-cor-nome").textContent = state.cor;
  $("#tryon-cores").innerHTML = p.cores.map((c) => `<button data-cor="${c}" class="${c === state.cor ? "active" : ""}" style="background:${CORES[c].frame}" aria-label="${c}" title="${c}"></button>`).join("");
}

/* ---------- Tamanho do palco ---------- */
let srcW = 640, srcH = 480;
function setSource(w, h) {
  srcW = w; srcH = h;
  stage.style.aspectRatio = `${w} / ${h}`;
  stage.style.maxWidth = `calc(78vh * ${w / h})`;
  oCam.left = 0; oCam.right = w; oCam.top = h; oCam.bottom = 0;
  oCam.updateProjectionMatrix();
  resize();
}
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  pCam.aspect = w / h;
  pCam.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);

function setMode(mode) {
  state.mode = mode;
  stage.dataset.mode = mode;
  const live = mode !== "preview";
  occluder.visible = live;
  controls.enabled = !live;
  if (!live) {
    root.matrix.identity();
    root.visible = true;
    hintEl.hidden = true;
    stage.style.aspectRatio = "";
    stage.style.maxWidth = "";
    smooth.ready = false;
  }
  $("#btn-camera").hidden = mode === "video";
  $("#btn-parar").hidden = !live;
  $("#btn-foto").disabled = !live;
  resize();
}

/* ---------- Rastreamento do rosto ---------- */
let landmarker = null;
async function loadLandmarker() {
  if (landmarker) return landmarker;
  status("Carregando o reconhecimento facial…");
  const { FaceLandmarker, FilesetResolver } = await import(MP_URL);
  const files = await FilesetResolver.forVisionTasks(MP_WASM);
  const opts = (delegate) => ({
    baseOptions: { modelAssetPath: MP_MODEL, delegate },
    runningMode: "VIDEO",
    numFaces: 1,
  });
  try { landmarker = await FaceLandmarker.createFromOptions(files, opts("GPU")); }
  catch { landmarker = await FaceLandmarker.createFromOptions(files, opts("CPU")); }
  landmarker._mode = "VIDEO";
  return landmarker;
}
async function ensureMode(m) {
  if (landmarker._mode !== m) { await landmarker.setOptions({ runningMode: m }); landmarker._mode = m; }
}

const smooth = { ready: false, pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: 1 };
let lastLandmarks = null;
const P = (lm, i) => new THREE.Vector3(lm[i].x * srcW, (1 - lm[i].y) * srcH, -lm[i].z * srcW);

function placeOnFace(lm, alpha = 0.55) {
  // Eixos do rosto
  const rOut = P(lm, 33), rIn = P(lm, 133), lIn = P(lm, 362), lOut = P(lm, 263);
  const xAxis = lOut.clone().sub(rOut).normalize();
  const up = P(lm, 10).sub(P(lm, 152));
  const yAxis = up.sub(xAxis.clone().multiplyScalar(up.dot(xAxis))).normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis);

  // Escala: distância entre os cantos externos dos olhos (≈ 84–90 mm)
  const s = (lOut.distanceTo(rOut) / 84) * state.tamanho;

  // Centro entre os olhos, na profundidade da ponte do nariz
  const center = rOut.add(rIn).add(lIn).add(lOut).multiplyScalar(0.25);
  center.z = P(lm, 168).z;
  center.add(yAxis.clone().multiplyScalar(state.altura * s));

  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
  if (!smooth.ready || alpha >= 1) {
    smooth.pos.copy(center); smooth.quat.copy(q); smooth.scale = s; smooth.ready = true;
  } else {
    smooth.pos.lerp(center, alpha); smooth.quat.slerp(q, alpha); smooth.scale += (s - smooth.scale) * alpha;
  }
  root.matrix.compose(smooth.pos, smooth.quat, new THREE.Vector3(smooth.scale, smooth.scale, smooth.scale));
  root.visible = true;
  hintEl.hidden = true;
}

function handleResult(r, alpha) {
  if (r?.faceLandmarks?.length) {
    lastLandmarks = r.faceLandmarks[0];
    placeOnFace(lastLandmarks, alpha);
  } else {
    lastLandmarks = null;
    root.visible = false;
    hintEl.hidden = false;
    smooth.ready = false;
  }
}

/* ---------- Câmera ---------- */
let stream = null;
async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    status("Seu navegador bloqueou a câmera. Abra o site por http://localhost ou https.", true);
    return;
  }
  try {
    $("#btn-camera").disabled = true;
    status("Pedindo permissão da câmera…");
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    video.srcObject = stream;
    await video.play();
    await loadLandmarker();
    await ensureMode("VIDEO");
    photo.hidden = true;
    video.hidden = false;
    setSource(video.videoWidth, video.videoHeight);
    setMode("video");
    status("");
  } catch (e) {
    console.error(e);
    stopCamera();
    status(e.name === "NotAllowedError"
      ? "Permissão da câmera negada. Libere o acesso no cadeado ao lado do endereço do site."
      : "Não foi possível abrir a câmera. Você pode testar enviando uma foto.", true);
  } finally {
    $("#btn-camera").disabled = false;
  }
}
function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
  video.hidden = true;
  photo.hidden = true;
  setMode("preview");
}

/* ---------- Foto enviada ---------- */
async function usePhoto(file) {
  if (!file) return;
  try {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    video.hidden = true;
    status("Analisando a foto…");
    const url = URL.createObjectURL(file);
    photo.src = url;
    await photo.decode();
    photo.hidden = false;
    await loadLandmarker();
    await ensureMode("IMAGE");
    setSource(photo.naturalWidth, photo.naturalHeight);
    setMode("photo");
    handleResult(landmarker.detect(photo), 1);
    status(lastLandmarks ? "" : "Não encontramos um rosto nessa foto. Tente uma foto de frente e bem iluminada.", !lastLandmarks);
  } catch (e) {
    console.error(e);
    status("Não foi possível abrir essa foto.", true);
  }
}

/* ---------- Tirar foto ---------- */
function capture() {
  const c = document.createElement("canvas");
  c.width = srcW; c.height = srcH;
  const g = c.getContext("2d");
  const src = state.mode === "video" ? video : photo;
  renderer.render(scene, oCam);
  g.save();
  if (state.mode === "video") { g.translate(srcW, 0); g.scale(-1, 1); }
  g.drawImage(src, 0, 0, srcW, srcH);
  g.drawImage(canvas, 0, 0, srcW, srcH);
  g.restore();
  // marca da loja
  const p = PRODUTOS.find((x) => x.id === state.id);
  const bh = Math.round(srcH * 0.09);
  g.fillStyle = "rgba(31,42,68,.88)";
  g.fillRect(0, srcH - bh, srcW, bh);
  g.fillStyle = "#f7f3ec";
  g.font = `700 ${Math.round(bh * 0.36)}px Montserrat, Arial, sans-serif`;
  g.textBaseline = "middle";
  g.fillText("ESSENCIAL VISION", bh * 0.4, srcH - bh / 2);
  g.fillStyle = "#d9bf94";
  g.textAlign = "right";
  g.font = `500 ${Math.round(bh * 0.3)}px Montserrat, Arial, sans-serif`;
  g.fillText(`${p.nome} · ${state.cor}`, srcW - bh * 0.4, srcH - bh / 2);
  const a = document.createElement("a");
  a.download = `essencial-vision-${p.nome.toLowerCase()}.png`;
  a.href = c.toDataURL("image/png");
  a.click();
  if (typeof toast === "function") toast("Foto salva! Compartilhe com a gente no Instagram 😉");
}

function status(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.hidden = !msg;
  statusEl.classList.toggle("error", isError);
}

/* ---------- Loop de renderização ---------- */
let lastVideoTime = -1;
function loop() {
  if (state.mode === "video" && landmarker && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    handleResult(landmarker.detectForVideo(video, performance.now()));
  } else if (state.mode === "photo" && lastLandmarks) {
    placeOnFace(lastLandmarks, 1); // reaplica ao mexer nos ajustes
  }
  if (state.mode === "preview") controls.update();
  renderer.render(scene, state.mode === "preview" ? pCam : oCam);
  requestAnimationFrame(loop);
}

/* ---------- Eventos ---------- */
document.addEventListener("click", (e) => {
  const m = e.target.closest("[data-modelo]");
  if (m) { setModel(m.dataset.modelo); history.replaceState(null, "", `?modelo=${m.dataset.modelo}`); }
  const c = e.target.closest("#tryon-cores [data-cor]");
  if (c) setModel(state.id, c.dataset.cor);
});
$("#btn-camera").addEventListener("click", startCamera);
$("#btn-parar").addEventListener("click", stopCamera);
$("#btn-foto").addEventListener("click", capture);
$("#tryon-upload").addEventListener("change", (e) => usePhoto(e.target.files[0]));
$("#tryon-tamanho").addEventListener("input", (e) => (state.tamanho = +e.target.value / 100));
$("#tryon-altura").addEventListener("input", (e) => (state.altura = +e.target.value));
$("#tryon-add").addEventListener("click", () => addToCart(state.id, state.cor));
$("#tryon-wa").addEventListener("click", () => {
  const p = PRODUTOS.find((x) => x.id === state.id);
  window.open(waLink(`Olá! Provei o modelo ${p.nome} (${state.cor}) no provador virtual do site e gostei. Ref. ${p.id.toUpperCase()}.`), "_blank", "noopener");
});

/* ---------- Início ---------- */
setModel(state.id);
setMode("preview");
loop();
