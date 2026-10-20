/* ==========================================================
   Essencial Vision — Medidor de DP (distância pupilar)

   Como mede:
   - Usa a íris como régua: o diâmetro horizontal da íris de um adulto
     é quase constante (~11,7 mm). Assim convertemos pixels em milímetros.
   - Tira 5 fotos, todas na mesma faixa de distância (~40 cm),
     com a pessoa olhando para um ponto fixo no meio da tela.
   - Cada foto é a mediana de alguns quadros seguidos; a DP final é a
     mediana das 5 fotos.
   - Modo "um olho de cada vez" para quem tem estrabismo: mede o olho
     direito com o esquerdo tapado e depois o contrário.

   Tudo roda no aparelho do cliente: nenhuma imagem é enviada.
   ========================================================== */

const MP_VERSION = "0.10.14";
const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.mjs`;
const MP_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MP_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/* ---------- Parâmetros da medição ---------- */
const IRIS_MM = 11.7;          // diâmetro médio da íris
const HFOV_DEG = 63;           // campo de visão típico de câmera frontal (estimativa)
const EYE_ROT_MM = 13;         // centro de rotação do olho até a pupila
const DIST_ALVO = 400;         // distância recomendada (mm)
const DIST_TOL = 60;           // tolerância: 34 a 46 cm
const DIST_MIN_BARRA = 200, DIST_MAX_BARRA = 700;
const TOTAL_FOTOS = 5;
const QUADROS_POR_FOTO = 5;    // cada foto = mediana de 5 quadros seguidos
const INTERVALO_FOTOS = 700;   // ms entre fotos
const TEMPO_TROCA_OLHO = 5000; // ms para trocar a mão de olho no modo estrabismo
const LIMITE_DESALINHO = 0.09; // diferença de posição das íris que indica olhos desalinhados
const SIM_DESVIO_MM = 4;       // desvio usado na simulação de estrabismo

// Simulação de estrabismo para teste/demonstração: medidor.html?simular=estrabismo
const SIMULAR = new URLSearchParams(location.search).get("simular") === "estrabismo";

/* ---------- Elementos ---------- */
const $ = (s) => document.querySelector(s);
const stage = $("#pd-stage");
const video = $("#pd-video");
const photo = $("#pd-photo");
const cv = $("#pd-canvas");
const ctx = cv.getContext("2d");

/* ---------- Estado ---------- */
let landmarker = null;
let stream = null;
let mode = "idle";           // idle | video | photo | congelado
let W = 640, H = 480;
let med = null;              // medição em andamento
let ultimoResultado = null;

/* ---------- Matemática simples ---------- */
const P = (lm, i) => ({ x: lm[i].x * W, y: lm[i].y * H });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (a, b) => a.x * b.x + a.y * b.y;
const len = (a) => Math.hypot(a.x, a.y);
const dist = (a, b) => len(sub(a, b));
const unit = (a) => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const mediana = (arr) => { const s = [...arr].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const meio = (v) => Math.round(v * 2) / 2;
const fmt = (v) => meio(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* ---------- Análise de um quadro ---------- */
function iris(lm, centro, a, b, c, d) {
  return { c: P(lm, centro), d: (dist(P(lm, a), P(lm, c)) + dist(P(lm, b), P(lm, d))) / 2 };
}

// etapa: "ambos" (normal) | "OD" (mede o olho direito) | "OE" (mede o olho esquerdo)
function analisar(lm, etapa = "ambos", fotoEstatica = false) {
  let A = iris(lm, 468, 469, 470, 471, 472);
  let B = iris(lm, 473, 474, 475, 476, 477);
  // olho direito da pessoa = íris mais perto do canto externo do olho direito (ponto 33)
  const canto33 = P(lm, 33);
  let R = A, L = B;
  if (dist(B.c, canto33) < dist(A.c, canto33)) [R, L] = [L, R];

  // Eixo dos olhos (pelos cantos externos, não pelas íris) e linha média do nariz
  const ax = unit(sub(P(lm, 263), P(lm, 33)));
  const linhaMedia = mid(P(lm, 168), P(lm, 6));

  // Simulação: olho esquerdo desviado para dentro (só no modo normal,
  // porque no modo um-olho-de-cada-vez o olho que mede está olhando reto)
  if (SIMULAR && etapa === "ambos") {
    const desvio = (SIM_DESVIO_MM / IRIS_MM) * L.d;
    L = { c: { x: L.c.x - ax.x * desvio, y: L.c.y - ax.y * desvio }, d: L.d };
  }

  // Escala (mm por pixel) pela íris
  const irisPx = etapa === "OD" ? R.d : etapa === "OE" ? L.d : (R.d + L.d) / 2;
  const mmPx = IRIS_MM / irisPx;
  const f = W / 2 / Math.tan((HFOV_DEG * Math.PI) / 360);
  const distCam = fotoEstatica ? DIST_ALVO : (f * IRIS_MM) / irisPx;

  // DP monocular medida (pupila até a linha média), com compensação de convergência
  const mono = (c) => Math.abs(dot(sub(c, linhaMedia), ax)) * mmPx;
  const corr = (v) => v + (EYE_ROT_MM * v) / distCam;
  const od = corr(mono(R.c));
  const oe = corr(mono(L.c));

  // Posição de cada íris dentro do olho (0 = canto interno, 1 = canto externo)
  const posNoOlho = (c, interno, externo) => {
    const v = sub(P(lm, externo), P(lm, interno));
    return dot(sub(c, P(lm, interno)), v) / dot(v, v);
  };
  const desalinho = Math.abs(posNoOlho(R.c, 133, 33) - posNoOlho(L.c, 362, 263));

  // Qualidade
  const nariz = P(lm, 1), faceD = P(lm, 234), faceE = P(lm, 454);
  const giro = Math.abs(nariz.x - faceD.x) / Math.max(1, Math.abs(faceE.x - nariz.x));
  const incl = Math.abs((Math.atan(ax.y / (ax.x || 1e-6)) * 180) / Math.PI);
  const abertura = (a, b, c, d) => dist(P(lm, a), P(lm, b)) / dist(P(lm, c), P(lm, d));
  const abR = abertura(159, 145, 33, 133), abL = abertura(386, 374, 362, 263);
  const olhosOk = etapa === "OD" ? abR > 0.17 : etapa === "OE" ? abL > 0.17 : Math.min(abR, abL) > 0.17;

  const checks = {
    distancia: fotoEstatica || Math.abs(distCam - DIST_ALVO) <= DIST_TOL,
    reto: giro > 0.78 && giro < 1.28 && incl < 6,
    olhos: olhosOk,
  };
  return { R, L, od, oe, longe: od + oe, distCam, desalinho, checks, etapa, ok: checks.distancia && checks.reto && checks.olhos };
}

/* ---------- Desenho sobre a imagem ---------- */
function desenhar(a) {
  ctx.clearRect(0, 0, W, H);
  if (!a) return;
  const cor = a.ok ? "#3fbf7f" : "#d9bf94";
  const lw = Math.max(2, W / 400);
  ctx.lineWidth = lw;
  const olhos = a.etapa === "OD" ? [a.R] : a.etapa === "OE" ? [a.L] : [a.R, a.L];
  for (const e of olhos) {
    ctx.strokeStyle = cor; ctx.fillStyle = cor;
    ctx.beginPath(); ctx.arc(e.c.x, e.c.y, e.d / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(e.c.x, e.c.y, lw * 1.4, 0, Math.PI * 2); ctx.fill();
  }
  if (olhos.length === 2) {
    ctx.strokeStyle = cor;
    ctx.setLineDash([lw * 3, lw * 2]);
    ctx.beginPath(); ctx.moveTo(a.R.c.x, a.R.c.y); ctx.lineTo(a.L.c.x, a.L.c.y); ctx.stroke();
    ctx.setLineDash([]);
  }
}

/* ---------- Voz (acessibilidade) ---------- */
let ultimaFala = "", ultimaFalaEm = 0;
function falar(texto, urgente = false) {
  if (!$("#pd-voz").checked || !("speechSynthesis" in window) || !texto) return;
  const agora = performance.now();
  if (!urgente && (texto === ultimaFala || agora - ultimaFalaEm < 2800)) return;
  ultimaFala = texto; ultimaFalaEm = agora;
  if (urgente) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto.replace("✓", ""));
  u.lang = "pt-BR"; u.rate = 1.05;
  speechSynthesis.speak(u);
}

/* ---------- Painel "leitura ao vivo" ---------- */
function setCheck(nome, ok, texto) {
  const el = document.querySelector(`[data-check="${nome}"]`);
  el.classList.toggle("ok", ok === true);
  el.classList.toggle("bad", ok === false);
  el.querySelector("small").textContent = texto;
}

function medidorDistancia(d) {
  const pct = (v) => Math.min(100, Math.max(0, ((v - DIST_MIN_BARRA) / (DIST_MAX_BARRA - DIST_MIN_BARRA)) * 100));
  $("#pd-dist-marca").style.left = `${pct(d)}%`;
  $("#pd-dist-txt").textContent = d ? `≈ ${Math.round(d / 10)} cm` : "—";
  $("#pd-dist").classList.toggle("ok", d && Math.abs(d - DIST_ALVO) <= DIST_TOL);
}

function dica(texto) {
  const el = $("#pd-dica");
  if (el.textContent !== texto) el.textContent = texto;
  falar(texto);
}

function atualizarAoVivo(a) {
  if (mode === "congelado") return; // após concluir, os números ficam fixos
  if (!a) {
    setCheck("rosto", false, "Nenhum rosto encontrado");
    setCheck("distancia", null, "—");
    setCheck("reto", null, "—");
    setCheck("olhos", null, "—");
    medidorDistancia(0);
    stage.classList.remove("pd-ok");
    if (mode === "video" && !trocandoOlho()) dica("Centralize o rosto na moldura");
    return;
  }
  const cm = Math.round(a.distCam / 10);
  setCheck("rosto", true, "Rosto encontrado");
  setCheck("distancia", a.checks.distancia, mode === "photo" ? "Foto" :
    a.distCam < DIST_ALVO - DIST_TOL ? `≈ ${cm} cm · afaste-se` : a.distCam > DIST_ALVO + DIST_TOL ? `≈ ${cm} cm · aproxime-se` : `≈ ${cm} cm · ideal`);
  setCheck("reto", a.checks.reto, a.checks.reto ? "Rosto de frente" : "Deixe o rosto reto");
  setCheck("olhos", a.checks.olhos, a.etapa !== "ambos" ? (a.checks.olhos ? "Olho aberto" : "Abra bem o olho") : a.checks.olhos ? "Olhos abertos" : "Abra bem os olhos");
  medidorDistancia(mode === "photo" ? 0 : a.distCam);
  stage.classList.toggle("pd-ok", a.ok);
  if (mode !== "video" || trocandoOlho()) return;
  dica(a.ok ? (med ? "Olhe para o ponto e fique parado(a)" : "Perfeito!") :
    !a.checks.distancia ? (a.distCam < DIST_ALVO - DIST_TOL ? "Afaste um pouco o aparelho" : "Aproxime um pouco o aparelho") :
    !a.checks.reto ? "Deixe o rosto reto, olhando para o ponto" : "Abra bem os olhos");
}

/* ---------- As 5 fotos ---------- */
function etapaAtual() { return med ? med.etapas[med.etapaIdx] : "ambos"; }
function trocandoOlho() { return med && performance.now() < med.pausaAte; }

const NOMES_ETAPA = {
  ambos: { titulo: "Fotos da medição", curto: "" },
  OD: { titulo: "Olho direito", curto: "Medindo o olho DIREITO" },
  OE: { titulo: "Olho esquerdo", curto: "Medindo o olho ESQUERDO" },
};

function montarGradeFotos() {
  const etapa = etapaAtual();
  $("#pd-fotos").hidden = false;
  $("#pd-fotos-titulo").textContent = NOMES_ETAPA[etapa].titulo + (med.etapas.length > 1 ? ` (${med.etapaIdx + 1} de 2)` : "");
  $("#pd-fotos-info").textContent = med.etapas.length > 1 ? "Um olho de cada vez · mediana de 5 fotos por olho" : "A DP final é a mediana das 5 fotos";
  $("#pd-fotos-grid").innerHTML = Array.from({ length: TOTAL_FOTOS }, (_, i) =>
    `<div class="pd-foto" data-i="${i}"><div class="pd-foto__img"><span>${i + 1}</span></div><small>—</small></div>`).join("");
}

function capturarMiniatura() {
  const c = document.createElement("canvas");
  const tw = 240, th = Math.round((240 * H) / W);
  c.width = tw; c.height = th;
  const g = c.getContext("2d");
  g.translate(tw, 0); g.scale(-1, 1); // espelhado, como a pessoa se vê
  g.drawImage(video, 0, 0, tw, th);
  return c.toDataURL("image/jpeg", 0.8);
}

function capturarQuadroInteiro() {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  c.getContext("2d").drawImage(video, 0, 0, W, H);
  return c;
}

function valorDaFoto(f, etapa) {
  return etapa === "OD" ? f.od : etapa === "OE" ? f.oe : f.longe;
}

function tirarFoto(quadros) {
  const etapa = etapaAtual();
  const foto = {
    longe: mediana(quadros.map((q) => q.longe)),
    od: mediana(quadros.map((q) => q.od)),
    oe: mediana(quadros.map((q) => q.oe)),
    distCam: mediana(quadros.map((q) => q.distCam)),
    desalinho: mediana(quadros.map((q) => q.desalinho)),
    analise: quadros[quadros.length - 1],
    quadro: capturarQuadroInteiro(),
    mini: capturarMiniatura(),
  };
  med.fotos.push(foto);
  const i = med.fotos.length - 1;
  const slot = document.querySelector(`.pd-foto[data-i="${i}"]`);
  slot.classList.add("ok");
  slot.querySelector(".pd-foto__img").innerHTML = `<img src="${foto.mini}" alt="Foto ${i + 1}">`;
  slot.querySelector("small").textContent = `${fmt(valorDaFoto(foto, etapa))} mm`;
  $("#pd-flash").classList.remove("on"); void $("#pd-flash").offsetWidth; $("#pd-flash").classList.add("on");
  $("#pd-contador").textContent = `Foto ${med.fotos.length} de ${TOTAL_FOTOS}`;
  falar(`Foto ${med.fotos.length}`, true);
  med.ultimaFotoEm = performance.now();

  if (med.fotos.length < TOTAL_FOTOS) return;

  // Etapa concluída
  med.resultados[etapa] = med.fotos;
  if (med.etapaIdx < med.etapas.length - 1) {
    med.etapaIdx++;
    med.fotos = [];
    if (med) med.quadros = []; // med vira null quando a medição termina
    mostrarTrocaDeOlho();
    montarGradeFotos();
    return;
  }
  concluir();
}

/* ---------- Modo um olho de cada vez ---------- */
function mostrarTrocaDeOlho() {
  const etapa = etapaAtual();
  const tapar = etapa === "OD" ? "ESQUERDO" : "DIREITO";
  const medir = etapa === "OD" ? "direito" : "esquerdo";
  med.pausaAte = performance.now() + TEMPO_TROCA_OLHO;
  $("#pd-aviso").hidden = false;
  $("#pd-aviso").dataset.lado = etapa;
  $("#pd-aviso-titulo").textContent = `Tape o olho ${tapar} com a mão`;
  $("#pd-aviso-texto").textContent = `Com o olho ${medir}, olhe para o ponto dourado. Mantenha os ${Math.round(DIST_ALVO / 10)} cm de distância.`;
  $("#pd-etapa").hidden = false;
  $("#pd-etapa").textContent = NOMES_ETAPA[etapa].curto;
  dica(`Tape o olho ${tapar.toLowerCase()}`);
  falar(`Tape o olho ${tapar.toLowerCase()} com a mão e olhe para o ponto com o olho ${medir}.`, true);
}

function atualizarTrocaDeOlho() {
  if (!med || $("#pd-aviso").hidden) return;
  const resta = med.pausaAte - performance.now();
  if (resta > 0) {
    $("#pd-aviso-tempo").textContent = `Começando em ${Math.ceil(resta / 1000)}…`;
  } else {
    $("#pd-aviso").hidden = true;
  }
}

/* ---------- Fluxo da medição ---------- */
function iniciarMedicao() {
  if (mode !== "video") return;
  const umOlho = $("#pd-estrabismo").checked;
  med = {
    etapas: umOlho ? ["OD", "OE"] : ["ambos"],
    etapaIdx: 0, fotos: [], quadros: [], resultados: {},
    ultimaFotoEm: 0, pausaAte: 0,
  };
  $("#pd-resultado").hidden = true;
  $("#pd-alerta").hidden = true;
  $("#btn-medir").hidden = true;
  $("#pd-contador").hidden = false;
  $("#pd-contador").textContent = `Foto 0 de ${TOTAL_FOTOS}`;
  $("#pd-etapa").hidden = !umOlho;
  $("#pd-leitura-titulo").textContent = "Leitura ao vivo";
  montarGradeFotos();
  if (umOlho) mostrarTrocaDeOlho();
}

function processarQuadro(a) {
  if (!med || trocandoOlho()) return;
  if (!a?.ok) { med.quadros = []; return; } // precisa de quadros seguidos e válidos
  med.quadros.push(a);
  if (med.quadros.length >= QUADROS_POR_FOTO && performance.now() - med.ultimaFotoEm >= INTERVALO_FOTOS) {
    tirarFoto(med.quadros.slice(-QUADROS_POR_FOTO));
    if (med) med.quadros = []; // med vira null quando a medição termina
  }
}

function fotoMaisProximaDaMediana(fotos, etapa, alvo) {
  return fotos.reduce((m, f) => (Math.abs(valorDaFoto(f, etapa) - alvo) < Math.abs(valorDaFoto(m, etapa) - alvo) ? f : m));
}

function concluir() {
  const umOlho = med.etapas.length > 1;
  let r, fotoFinal;
  if (umOlho) {
    const fd = med.resultados.OD, fe = med.resultados.OE;
    const od = mediana(fd.map((f) => f.od)), oe = mediana(fe.map((f) => f.oe));
    const valores = fd.map((f) => f.od).concat(fe.map((f) => f.oe));
    r = {
      longe: od + oe, od, oe, origem: "câmera", modo: "um olho de cada vez",
      variacao: Math.max(Math.max(...fd.map((f) => f.od)) - Math.min(...fd.map((f) => f.od)), Math.max(...fe.map((f) => f.oe)) - Math.min(...fe.map((f) => f.oe))),
      distancia: mediana(fd.concat(fe).map((f) => f.distCam)),
      fotos: valores.length,
    };
    fotoFinal = fotoMaisProximaDaMediana(fe, "OE", oe);
  } else {
    const fotos = med.resultados.ambos;
    const longe = mediana(fotos.map((f) => f.longe));
    r = {
      longe, od: mediana(fotos.map((f) => f.od)), oe: mediana(fotos.map((f) => f.oe)),
      origem: "câmera", modo: "normal",
      variacao: Math.max(...fotos.map((f) => f.longe)) - Math.min(...fotos.map((f) => f.longe)),
      distancia: mediana(fotos.map((f) => f.distCam)),
      desalinhado: mediana(fotos.map((f) => f.desalinho)) > LIMITE_DESALINHO,
      fotos: fotos.length,
    };
    fotoFinal = fotoMaisProximaDaMediana(fotos, "ambos", longe);
  }
  // marca a foto usada como referência
  const etapaFinal = med.etapas[med.etapas.length - 1];
  const fotosFinais = med.resultados[etapaFinal];
  document.querySelector(`.pd-foto[data-i="${fotosFinais.indexOf(fotoFinal)}"]`)?.classList.add("mediana");
  congelar(fotoFinal, r);
  finalizar(r);
}

/* Depois de concluir, a imagem e a leitura ao vivo ficam paradas
   com os valores da medição (não mudam mais). */
function congelar(foto, r) {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
  video.hidden = true;
  photo.src = foto.quadro.toDataURL("image/jpeg", 0.9);
  photo.hidden = false;
  setModo("congelado");
  desenhar({ ...foto.analise, ok: true });
  const umOlho = r.modo !== "normal";
  $("#pd-leitura-titulo").textContent = "Leitura da medição (fixa)";
  setCheck("rosto", true, `${r.fotos} fotos analisadas`);
  setCheck("distancia", true, `≈ ${Math.round(r.distancia / 10)} cm em todas`);
  setCheck("reto", true, "Rosto de frente");
  setCheck("olhos", !r.desalinhado, umOlho ? "Um olho de cada vez" : r.desalinhado ? "Possível desalinhamento" : "Alinhados");
  medidorDistancia(r.distancia);
  $("#pd-contador").textContent = "Medição concluída ✓";
  $("#pd-dica").hidden = false;
  $("#pd-dica").textContent = `Sua DP: ${fmt(r.longe)} mm`;
  med = null;
}

function finalizar(r, rolar = true) {
  $("#btn-medir").hidden = mode !== "congelado";
  ultimoResultado = r;
  $("#pd-valor").textContent = fmt(r.longe);
  $("#pd-perto").textContent = fmt(r.longe - 3);
  $("#pd-od").textContent = fmt(r.od);
  $("#pd-oe").textContent = fmt(r.oe);
  $("#pd-precisao").textContent = r.origem === "foto"
    ? "Medida feita por uma foto: use como referência e, se puder, refaça com a câmera."
    : `${r.modo === "normal" ? "Mediana de 5 fotos" : "Mediana de 5 fotos por olho (um olho de cada vez)"}, todas a ≈ ${Math.round((r.distancia || DIST_ALVO) / 10)} cm. ` +
      (r.variacao <= 2 ? `Leitura estável (as fotos variaram ${fmt(Math.max(0.5, r.variacao))} mm).` : `As fotos variaram ${fmt(r.variacao)} mm: recomendamos medir mais uma vez.`);
  $("#pd-alerta").hidden = !r.desalinhado;
  $("#pd-resultado").hidden = false;
  status("");
  try { localStorage.setItem("ev_dp", JSON.stringify({ ...r, data: Date.now() })); } catch {}
  if (rolar) {
    falar(`Medição concluída. Sua DP é ${fmt(r.longe).replace(",", " vírgula ")} milímetros.`, true);
    if (r.desalinhado) falar("Seus olhos parecem desalinhados. Recomendamos medir um olho de cada vez.");
    setTimeout(() => $("#pd-resultado").scrollIntoView({ behavior: "smooth", block: "center" }), 250);
  }
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

/* ---------- Palco ---------- */
function setFonte(w, h) {
  W = w; H = h;
  cv.width = w; cv.height = h;
  stage.style.aspectRatio = `${w} / ${h}`;
  stage.style.maxWidth = `calc(78vh * ${w / h})`;
}

function setModo(m) {
  mode = m;
  stage.dataset.mode = m;
  $("#pd-intro").hidden = m !== "idle";
  $("#btn-camera").hidden = m === "video" || m === "congelado"; // congelado usa "Medir novamente"
  $("#btn-camera").innerHTML = m === "idle" ? `${ICON.eye} Ativar câmera` : `${ICON.eye} Usar a câmera`;
  $("#btn-parar").hidden = m === "idle";
  $("#btn-medir").hidden = true;
  $("#pd-dica").hidden = m !== "video";
  $("#pd-sim").hidden = !SIMULAR || m === "idle";
  if (m !== "video") { $("#pd-aviso").hidden = true; $("#pd-etapa").hidden = true; }
  if (m === "idle") {
    ctx.clearRect(0, 0, W, H);
    stage.style.aspectRatio = ""; stage.style.maxWidth = "";
    $("#pd-contador").hidden = true;
    $("#pd-fotos").hidden = true;
    $("#pd-leitura-titulo").textContent = "Leitura ao vivo";
    atualizarAoVivo(null);
  }
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
    status("");
    iniciarMedicao();
  } catch (e) {
    console.error(e);
    pararTudo();
    status(e.name === "NotAllowedError"
      ? "Permissão da câmera negada. Libere o acesso no cadeado ao lado do endereço do site."
      : "Não foi possível abrir a câmera. Você pode enviar uma foto de frente.", true);
  } finally {
    $("#btn-camera").disabled = false;
  }
}

function pararTudo() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  med = null;
  video.srcObject = null;
  video.hidden = true;
  photo.hidden = true;
  setModo("idle");
}

/* ---------- Foto enviada (uma foto só, menos precisa) ---------- */
async function usarFoto(file) {
  if (!file) return;
  try {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    med = null;
    video.hidden = true;
    photo.src = URL.createObjectURL(file);
    await photo.decode();
    photo.hidden = false;
    setFonte(photo.naturalWidth, photo.naturalHeight);
    setModo("photo");
    $("#pd-fotos").hidden = true;
    $("#pd-contador").hidden = true;
    ctx.clearRect(0, 0, W, H);
    await carregarModelo();
    await modoModelo("IMAGE");
    status("Analisando a foto…");
    const res = landmarker.detect(photo);
    if (!res.faceLandmarks?.length) {
      atualizarAoVivo(null);
      status("Não encontramos um rosto nessa foto. Use uma foto de frente, sem óculos e bem iluminada.", true);
      return;
    }
    const a = analisar(res.faceLandmarks[0], "ambos", true);
    desenhar(a); atualizarAoVivo(a);
    if (!a.checks.reto || !a.checks.olhos) {
      status("Na foto o rosto precisa estar de frente e com os olhos abertos. Tente outra foto.", true);
      return;
    }
    finalizar({ longe: a.longe, od: a.od, oe: a.oe, variacao: 0, origem: "foto", modo: "normal", desalinhado: a.desalinho > LIMITE_DESALINHO, fotos: 1 });
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
  if (erro) falar(msg, true);
}

/* ---------- Loop ---------- */
let ultimoTempo = -1;
function loop() {
  if (mode === "video" && landmarker && video.readyState >= 2 && video.currentTime !== ultimoTempo) {
    ultimoTempo = video.currentTime;
    const res = landmarker.detectForVideo(video, performance.now());
    const a = res.faceLandmarks?.length ? analisar(res.faceLandmarks[0], etapaAtual()) : null;
    desenhar(a);
    atualizarAoVivo(a);
    atualizarTrocaDeOlho();
    processarQuadro(a);
  }
  requestAnimationFrame(loop);
}

/* ---------- Eventos ---------- */
$("#btn-camera").addEventListener("click", abrirCamera);
$("#btn-medir").addEventListener("click", abrirCamera);
$("#btn-parar").addEventListener("click", pararTudo);
$("#pd-upload").addEventListener("change", (e) => usarFoto(e.target.files[0]));
$("#pd-modo-estrabismo").addEventListener("click", () => {
  $("#pd-estrabismo").checked = true;
  stage.scrollIntoView({ behavior: "smooth", block: "center" });
  abrirCamera();
});
$("#pd-estrabismo").addEventListener("change", () => { if (mode === "video") iniciarMedicao(); });
$("#pd-voz").addEventListener("change", (e) => { if (e.target.checked) falar("Guia por voz ativado.", true); else speechSynthesis?.cancel(); });

$("#pd-wa").addEventListener("click", () => {
  const r = ultimoResultado;
  if (!r) return;
  const msg = `Olá! Medi minha DP pelo site da Essencial Vision:\n\n` +
    `• DP para longe: ${fmt(r.longe)} mm\n• DP para perto: ${fmt(r.longe - 3)} mm\n` +
    `• Olho direito (OD): ${fmt(r.od)} mm\n• Olho esquerdo (OE): ${fmt(r.oe)} mm\n\n` +
    `Medição por ${r.origem}${r.modo && r.modo !== "normal" ? ` (${r.modo})` : ""}${r.desalinhado ? ", com possível desalinhamento dos olhos" : ""}. Podem me ajudar com meus óculos?`;
  window.open(waLink(msg), "_blank", "noopener");
});
$("#pd-copiar").addEventListener("click", async () => {
  const r = ultimoResultado;
  if (!r) return;
  const txt = `DP longe ${fmt(r.longe)} mm | DP perto ${fmt(r.longe - 3)} mm | OD ${fmt(r.od)} mm | OE ${fmt(r.oe)} mm`;
  try { await navigator.clipboard.writeText(txt); toast("Medidas copiadas!"); } catch { toast(txt); }
});

/* ---------- Início ---------- */
// zona verde da barra de distância
$("#pd-dist-zona").style.left = `${((DIST_ALVO - DIST_TOL - DIST_MIN_BARRA) / (DIST_MAX_BARRA - DIST_MIN_BARRA)) * 100}%`;
$("#pd-dist-zona").style.width = `${((2 * DIST_TOL) / (DIST_MAX_BARRA - DIST_MIN_BARRA)) * 100}%`;
if (SIMULAR) {
  $("#pd-sim").textContent = `Simulação de estrabismo (OE ${SIM_DESVIO_MM} mm)`;
}
// mostra a última medição salva neste aparelho
try {
  const salvo = JSON.parse(localStorage.getItem("ev_dp"));
  if (salvo?.longe) finalizar(salvo, false);
} catch {}

setModo("idle");
loop();
