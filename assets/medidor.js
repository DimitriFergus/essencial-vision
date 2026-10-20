/* ==========================================================
   Essencial Vision — Medidor de DP (distância pupilar)
   Usa a íris como régua: o diâmetro horizontal da íris de um
   adulto é quase constante (~11,7 mm). Com isso convertemos
   pixels em milímetros, sem precisar de cartão ou régua.
   Tudo roda no aparelho do cliente: nenhuma imagem é enviada.
   ========================================================== */

const MP_VERSION = "0.10.14";
const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.mjs`;
const MP_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MP_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const IRIS_MM = 11.7;      // diâmetro médio da íris
const HFOV_DEG = 63;       // campo de visão horizontal típico de câmera frontal (estimativa)
const EYE_ROT_MM = 13;     // distância do centro de rotação do olho até a pupila
const AMOSTRAS = 45;       // medições usadas em cada leitura

const $ = (s) => document.querySelector(s);
const stage = $("#pd-stage");
const video = $("#pd-video");
const photo = $("#pd-photo");
const cv = $("#pd-canvas");
const ctx = cv.getContext("2d");

let landmarker = null;
let stream = null;
let mode = "idle"; // idle | video | photo
let W = 640, H = 480;
let coleta = null;
let ultimoResultado = null;

/* ---------- Geometria ---------- */
const px = (lm, i) => ({ x: lm[i].x * W, y: lm[i].y * H });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function analisar(lm, fotoEstatica = false) {
  const c1 = px(lm, 468), c2 = px(lm, 473);
  const d1 = (dist(px(lm, 469), px(lm, 471)) + dist(px(lm, 470), px(lm, 472))) / 2;
  const d2 = (dist(px(lm, 474), px(lm, 476)) + dist(px(lm, 475), px(lm, 477))) / 2;

  // Descobre qual íris é o olho direito da pessoa (mais perto do ponto 33)
  const canto33 = px(lm, 33);
  let R = { c: c1, d: d1 }, L = { c: c2, d: d2 };
  if (dist(c2, canto33) < dist(c1, canto33)) [R, L] = [L, R];

  const irisPx = (R.d + L.d) / 2;
  const mmPorPx = IRIS_MM / irisPx;
  const dpPx = dist(R.c, L.c);
  const medida = dpPx * mmPorPx;

  // Distância estimada até a câmera
  const f = W / 2 / Math.tan((HFOV_DEG * Math.PI) / 360);
  const distCam = fotoEstatica ? 400 : (f * IRIS_MM) / irisPx; // mm

  // Ao olhar para a câmera os olhos convergem um pouco: compensamos para DP de longe
  const correcao = (2 * EYE_ROT_MM * (medida / 2)) / distCam;
  const longe = medida + correcao;

  // DP monocular: cada pupila até o centro do nariz
  const eixo = { x: (L.c.x - R.c.x) / dpPx, y: (L.c.y - R.c.y) / dpPx };
  const ponte = px(lm, 168);
  const proj = (p) => Math.abs((p.x - ponte.x) * eixo.x + (p.y - ponte.y) * eixo.y);
  const odPx = proj(R.c), oePx = proj(L.c);
  const od = (longe * odPx) / (odPx + oePx);
  const oe = (longe * oePx) / (odPx + oePx);

  // Qualidade da leitura
  const nariz = px(lm, 1), faceD = px(lm, 234), faceE = px(lm, 454);
  const giro = Math.abs(nariz.x - faceD.x) / Math.max(1, Math.abs(faceE.x - nariz.x));
  const incl = Math.abs((Math.atan((L.c.y - R.c.y) / (L.c.x - R.c.x || 1)) * 180) / Math.PI);
  const abertura = (a, b, c, d) => dist(px(lm, a), px(lm, b)) / dist(px(lm, c), px(lm, d));
  const olhos = Math.min(abertura(159, 145, 33, 133), abertura(386, 374, 362, 263));

  const checks = {
    distancia: fotoEstatica || (distCam >= 280 && distCam <= 700),
    reto: giro > 0.78 && giro < 1.28 && incl < 6,
    olhos: olhos > 0.17,
  };
  return { R, L, irisPx, longe, od, oe, distCam, checks, ok: checks.distancia && checks.reto && checks.olhos };
}

/* ---------- Desenho sobre a imagem ---------- */
function desenhar(a) {
  ctx.clearRect(0, 0, W, H);
  if (!a) return;
  const cor = a.ok ? "#3fbf7f" : "#d9bf94";
  const lw = Math.max(2, W / 400);
  ctx.lineWidth = lw;
  ctx.strokeStyle = cor;
  ctx.fillStyle = cor;
  for (const e of [a.R, a.L]) {
    ctx.beginPath(); ctx.arc(e.c.x, e.c.y, e.d / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(e.c.x, e.c.y, lw * 1.4, 0, Math.PI * 2); ctx.fill();
  }
  // linha entre pupilas com marcações
  ctx.setLineDash([lw * 3, lw * 2]);
  ctx.beginPath(); ctx.moveTo(a.R.c.x, a.R.c.y); ctx.lineTo(a.L.c.x, a.L.c.y); ctx.stroke();
  ctx.setLineDash([]);
  for (const e of [a.R, a.L]) {
    ctx.beginPath(); ctx.moveTo(e.c.x, e.c.y - e.d * 0.9); ctx.lineTo(e.c.x, e.c.y - e.d * 0.6); ctx.stroke();
  }
}

/* ---------- Status ao vivo ---------- */
function setCheck(nome, ok, texto) {
  const el = document.querySelector(`[data-check="${nome}"]`);
  if (!el) return;
  el.classList.toggle("ok", !!ok);
  el.classList.toggle("bad", ok === false);
  if (texto) el.querySelector("small").textContent = texto;
}

function atualizarChecks(a) {
  if (!a) {
    setCheck("rosto", false, "Nenhum rosto encontrado");
    setCheck("distancia", null, "—");
    setCheck("reto", null, "—");
    setCheck("olhos", null, "—");
    $("#pd-dica").textContent = "Centralize o rosto na moldura";
    stage.classList.remove("pd-ok");
    return;
  }
  const cm = Math.round(a.distCam / 10);
  setCheck("rosto", true, "Rosto encontrado");
  setCheck("distancia", a.checks.distancia, mode === "photo" ? "Foto" : `≈ ${cm} cm ${a.distCam < 280 ? "· afaste-se" : a.distCam > 700 ? "· aproxime-se" : ""}`);
  setCheck("reto", a.checks.reto, a.checks.reto ? "Rosto de frente" : "Olhe reto para a câmera");
  setCheck("olhos", a.checks.olhos, a.checks.olhos ? "Olhos bem abertos" : "Abra bem os olhos");
  $("#pd-dica").textContent = a.ok ? (coleta ? "Medindo… fique parado(a)" : "Medição concluída ✓") :
    !a.checks.distancia ? (a.distCam < 280 ? "Afaste um pouco o aparelho" : "Aproxime um pouco o aparelho") :
    !a.checks.reto ? "Deixe o rosto reto, olhando para a câmera" : "Abra bem os olhos";
  stage.classList.toggle("pd-ok", a.ok);
}

/* ---------- Coleta e resultado ---------- */
const mediana = (arr) => { const s = [...arr].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const desvio = (arr) => { const m = arr.reduce((s, v) => s + v, 0) / arr.length; return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length); };
const meio = (v) => Math.round(v * 2) / 2; // arredonda para 0,5 mm
const fmt = (v) => meio(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* Medição automática: começa sozinha assim que o rosto está na posição certa
   (distância, rosto reto e olhos abertos) e termina quando a leitura fica estável. */
const VARIACAO_OK = 1.2;   // mm — abaixo disso a leitura é considerada estável
const MAX_TENTATIVAS = 3;  // refaz sozinho se a leitura variar demais
const PAUSA_RESET = 1500;  // ms fora de posição que zeram a coleta
let tentativas = 0;
let ultimoOk = 0;

const novaColeta = () => ({ longe: [], od: [], oe: [] });

function iniciarMedicao() {
  if (mode !== "video") return;
  tentativas = 0;
  coleta = novaColeta();
  $("#pd-resultado").hidden = true;
  $("#btn-medir").hidden = true;
  progresso(null);
}

function progresso(p) {
  $("#pd-progresso").hidden = p === null;
  $("#pd-progresso span").style.width = `${Math.round((p || 0) * 100)}%`;
}

function coletar(a) {
  if (!coleta) return;
  const agora = performance.now();
  if (a?.ok) {
    ultimoOk = agora;
    coleta.longe.push(a.longe); coleta.od.push(a.od); coleta.oe.push(a.oe);
    progresso(coleta.longe.length / AMOSTRAS);
  } else if (coleta.longe.length && agora - ultimoOk > PAUSA_RESET) {
    coleta = novaColeta(); // saiu da posição por muito tempo: recomeça
    progresso(null);
  }
  if (coleta.longe.length < AMOSTRAS) return;

  const r = {
    longe: mediana(coleta.longe), od: mediana(coleta.od), oe: mediana(coleta.oe),
    variacao: desvio(coleta.longe), origem: "câmera",
  };
  tentativas++;
  if (r.variacao >= VARIACAO_OK && tentativas < MAX_TENTATIVAS) {
    coleta = novaColeta(); // leitura instável: mede de novo sem incomodar o cliente
    progresso(0);
    return;
  }
  coleta = null;
  finalizar(r);
}

function finalizar(r, erro, rolar = true) {
  progresso(null);
  $("#btn-medir").hidden = mode !== "video";
  $("#btn-medir").disabled = false;
  $("#btn-medir").textContent = "Medir novamente";
  if (mode === "video") $("#pd-dica").textContent = "Medição concluída ✓";
  if (!r) { status(erro, true); return; }
  status("");
  ultimoResultado = r;
  $("#pd-valor").textContent = fmt(r.longe);
  $("#pd-perto").textContent = fmt(r.longe - 3);
  $("#pd-od").textContent = fmt(r.od);
  $("#pd-oe").textContent = fmt(r.oe);
  const estavel = r.variacao < 1.2;
  $("#pd-precisao").textContent = r.origem === "foto"
    ? "Medida feita por foto: use como referência e, se puder, refaça com a câmera."
    : estavel ? `Leitura estável (variação de ±${fmt(Math.max(0.5, r.variacao))} mm).`
              : "A leitura variou bastante. Recomendamos medir mais uma vez.";
  $("#pd-resultado").hidden = false;
  try { localStorage.setItem("ev_dp", JSON.stringify({ ...r, data: Date.now() })); } catch {}
  if (rolar) setTimeout(() => $("#pd-resultado").scrollIntoView({ behavior: "smooth", block: "center" }), 150);
}

/* ---------- MediaPipe ---------- */
async function carregarModelo() {
  if (landmarker) return landmarker;
  status("Carregando o reconhecimento facial…");
  const { FaceLandmarker, FilesetResolver } = await import(MP_URL);
  const files = await FilesetResolver.forVisionTasks(MP_WASM);
  const opts = (delegate) => ({ baseOptions: { modelAssetPath: MP_MODEL, delegate }, runningMode: "VIDEO", numFaces: 1 });
  try { landmarker = await FaceLandmarker.createFromOptions(files, opts("GPU")); }
  catch { landmarker = await FaceLandmarker.createFromOptions(files, opts("CPU")); }
  landmarker._mode = "VIDEO";
  return landmarker;
}
async function modoModelo(m) {
  if (landmarker._mode !== m) { await landmarker.setOptions({ runningMode: m }); landmarker._mode = m; }
}

function setFonte(w, h) {
  W = w; H = h;
  cv.width = w; cv.height = h;
  stage.style.aspectRatio = `${w} / ${h}`;
  stage.style.maxWidth = `calc(78vh * ${w / h})`;
}

function setModo(m) {
  mode = m;
  stage.dataset.mode = m === "video" ? "video" : m;
  $("#pd-intro").hidden = m !== "idle";
  $("#btn-camera").hidden = m === "video";
  $("#btn-parar").hidden = m === "idle";
  $("#btn-medir").hidden = true; // a medição pela câmera é automática
  $("#pd-dica").hidden = m !== "video";
  if (m === "idle") { ctx.clearRect(0, 0, W, H); stage.style.aspectRatio = ""; stage.style.maxWidth = ""; atualizarChecks(null); }
}

/* ---------- Câmera ---------- */
async function abrirCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    status("Seu navegador bloqueou a câmera. Abra o site por um endereço com cadeado (https).", true);
    return;
  }
  try {
    $("#btn-camera").disabled = true;
    status("Pedindo permissão da câmera…");
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    video.srcObject = stream;
    await video.play();
    await carregarModelo();
    await modoModelo("VIDEO");
    photo.hidden = true;
    video.hidden = false;
    setFonte(video.videoWidth, video.videoHeight);
    setModo("video");
    iniciarMedicao();
    status("");
  } catch (e) {
    console.error(e);
    pararCamera();
    status(e.name === "NotAllowedError"
      ? "Permissão da câmera negada. Libere o acesso no cadeado ao lado do endereço do site."
      : "Não foi possível abrir a câmera. Você pode enviar uma foto de frente.", true);
  } finally {
    $("#btn-camera").disabled = false;
  }
}

function pararCamera() {
  tentativas = 0;
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  coleta = null;
  progresso(null);
  video.srcObject = null;
  video.hidden = true;
  photo.hidden = true;
  setModo("idle");
}

/* ---------- Foto ---------- */
async function usarFoto(file) {
  if (!file) return;
  try {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    video.hidden = true;
    status("Analisando a foto…");
    photo.src = URL.createObjectURL(file);
    await photo.decode();
    photo.hidden = false;
    setFonte(photo.naturalWidth, photo.naturalHeight);
    setModo("photo");
    ctx.clearRect(0, 0, W, H);
    await carregarModelo();
    await modoModelo("IMAGE");
    status("");
    const r = landmarker.detect(photo);
    if (!r.faceLandmarks?.length) {
      desenhar(null); atualizarChecks(null);
      status("Não encontramos um rosto nessa foto. Use uma foto de frente, sem óculos e bem iluminada.", true);
      return;
    }
    const a = analisar(r.faceLandmarks[0], true);
    desenhar(a); atualizarChecks(a);
    if (!a.checks.reto || !a.checks.olhos) {
      status("Na foto o rosto precisa estar de frente e com os olhos abertos. Tente outra foto.", true);
      return;
    }
    finalizar({ longe: a.longe, od: a.od, oe: a.oe, variacao: 0, origem: "foto" });
  } catch (e) {
    console.error(e);
    status("Não foi possível abrir essa foto.", true);
  }
}

function status(msg, erro = false) {
  const el = $("#pd-status");
  el.textContent = msg || "";
  el.hidden = !msg;
  el.classList.toggle("error", erro);
}

/* ---------- Loop ---------- */
let ultimoTempo = -1;
function loop() {
  if (mode === "video" && landmarker && video.readyState >= 2 && video.currentTime !== ultimoTempo) {
    ultimoTempo = video.currentTime;
    const r = landmarker.detectForVideo(video, performance.now());
    const a = r.faceLandmarks?.length ? analisar(r.faceLandmarks[0]) : null;
    desenhar(a);
    atualizarChecks(a);
    coletar(a);
  }
  requestAnimationFrame(loop);
}

/* ---------- Eventos ---------- */
$("#btn-camera").addEventListener("click", abrirCamera);
$("#btn-parar").addEventListener("click", pararCamera);
$("#btn-medir").addEventListener("click", iniciarMedicao);
$("#pd-upload").addEventListener("change", (e) => usarFoto(e.target.files[0]));
$("#pd-wa").addEventListener("click", () => {
  const r = ultimoResultado;
  if (!r) return;
  const msg = `Olá! Medi minha DP pelo site da Essencial Vision:\n\n` +
    `• DP para longe: ${fmt(r.longe)} mm\n• DP para perto: ${fmt(r.longe - 3)} mm\n` +
    `• Olho direito (OD): ${fmt(r.od)} mm\n• Olho esquerdo (OE): ${fmt(r.oe)} mm\n\n` +
    `Medição feita por ${r.origem}. Podem me ajudar com meus óculos?`;
  window.open(waLink(msg), "_blank", "noopener");
});
$("#pd-copiar").addEventListener("click", async () => {
  const r = ultimoResultado;
  if (!r) return;
  const txt = `DP longe ${fmt(r.longe)} mm | DP perto ${fmt(r.longe - 3)} mm | OD ${fmt(r.od)} mm | OE ${fmt(r.oe)} mm`;
  try { await navigator.clipboard.writeText(txt); toast("Medidas copiadas!"); } catch { toast(txt); }
});

/* Mostra a última medição salva neste aparelho */
try {
  const salvo = JSON.parse(localStorage.getItem("ev_dp"));
  if (salvo?.longe) finalizar(salvo, null, false);
} catch {}

setModo("idle");
loop();
