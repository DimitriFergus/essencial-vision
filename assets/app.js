/* ==========================================================
   Essencial Vision Ótica — scripts do site
   ========================================================== */

/* ---------- Configuração da loja (edite aqui) ---------- */
const LOJA = {
  nome: "Essencial Vision Ótica",
  whatsapp: "5585991438421",            // só números, com DDI 55
  whatsappTexto: "(85) 99143-8421",
  instagram: "oticaessencialvision",
  email: "contato@essencialvision.com.br", // exemplo — trocar pelo e-mail real
  endereco: "Endereço da loja — a definir", // trocar pelo endereço real
  parcelas: 10,
};

/* ---------- Ícones ---------- */
const ICON = {
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5z"/><path d="M14.5 6.5L17 4l3 3-2.5 2.5"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
};

/* ---------- Logo (recriação vetorial do monograma EV) ---------- */
function logoMark(cls = "brand__mark") {
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">
    <text x="16" y="72" font-family="Cormorant Garamond, Georgia, serif" font-size="74" font-weight="600" fill="#1f2a44">E</text>
    <text x="44" y="86" font-family="Cormorant Garamond, Georgia, serif" font-size="60" font-weight="500" fill="#1f2a44">V</text>
    <path d="M30 50 Q55 30 82 50 Q55 70 30 50 Z" fill="#fff" stroke="#1f2a44" stroke-width="2.4"/>
    <circle cx="56" cy="50" r="8.5" fill="#2c3a5c"/>
    <circle cx="56" cy="50" r="4" fill="#141c30"/>
    <circle cx="58.5" cy="47.5" r="1.6" fill="#fff"/>
    <path d="M26 44 Q56 18 88 42" fill="none" stroke="#b08a55" stroke-width="2.6" stroke-linecap="round"/>
  </svg>`;
}

function logoFull(dark = false) {
  const main = dark ? "#f7f3ec" : "#1f2a44";
  return `<svg class="logo-full" viewBox="0 0 240 200" role="img" aria-label="Essencial Vision Ótica">
    <g transform="translate(70 0) scale(1)">${logoMark("").replace(/#1f2a44/g, main).replace('<svg class="" viewBox="0 0 100 100" aria-hidden="true">', "").replace("</svg>", "")}</g>
    <text x="120" y="132" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="30" font-weight="700" letter-spacing="4" fill="${main}">ESSENCIAL</text>
    <text x="120" y="160" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="20" letter-spacing="10" fill="#b08a55">VISION</text>
    <line x1="66" y1="173" x2="92" y2="173" stroke="#b08a55"/><line x1="148" y1="173" x2="174" y2="173" stroke="#b08a55"/>
    <text x="120" y="176" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="9" letter-spacing="4" fill="${main}">ÓTICA</text>
    <text x="120" y="194" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="7" letter-spacing="2.5" fill="${main}" opacity=".8">ENXERGAR BEM, VIVER MELHOR</text>
  </svg>`;
}

/* ---------- Ilustração de óculos por formato ---------- */
const LENS_SHAPES = {
  redondo:    '<circle cx="55" cy="42" r="29"/>',
  oval:       '<ellipse cx="55" cy="42" rx="34" ry="24"/>',
  quadrado:   '<rect x="22" y="14" width="66" height="54" rx="10"/>',
  retangular: '<rect x="18" y="22" width="72" height="40" rx="9"/>',
  aviador:    '<path d="M22 22 Q22 14 34 14 L80 14 Q91 14 89 26 Q85 60 58 68 Q28 72 23 46 Z"/>',
  gatinho:    '<path d="M14 14 Q48 20 86 22 Q93 24 89 40 Q83 64 56 64 Q30 64 25 44 Q22 28 14 14 Z"/>',
  hexagonal:  '<polygon points="24,42 39.5,15 70.5,15 86,42 70.5,69 39.5,69"/>',
  clubmaster: '<path d="M20 20 L88 20 Q90 20 89 30 Q85 64 56 66 Q26 66 22 40 Z"/>',
};

function glassesSVG(shape = "redondo", frame = "#1f2a44", lens = "#9fb3c8", lensOpacity = 0.25) {
  const s = LENS_SHAPES[shape] || LENS_SHAPES.redondo;
  const club = shape === "clubmaster"
    ? `<path d="M18 21 L90 21" stroke="${frame}" stroke-width="9" stroke-linecap="round"/><path d="M110 21 L182 21" stroke="${frame}" stroke-width="9" stroke-linecap="round"/>`
    : "";
  return `<svg class="glasses" viewBox="0 -4 200 84" aria-hidden="true">
    <g fill="${lens}" fill-opacity="${lensOpacity}" stroke="${frame}" stroke-width="5" stroke-linejoin="round">
      ${s}
      <g transform="translate(200 0) scale(-1 1)">${s}</g>
    </g>
    <path d="M86 32 Q100 22 114 32" fill="none" stroke="${frame}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M20 26 L4 22" stroke="${frame}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M180 26 L196 22" stroke="${frame}" stroke-width="4.5" stroke-linecap="round"/>
    ${club}
    <path d="M38 28 Q44 22 52 22" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
    <path d="M138 28 Q144 22 152 22" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

/* ---------- Catálogo de exemplo (modelos e preços fictícios) ---------- */
const CORES = {
  "Preto":        { frame: "#1c1c1f" },
  "Azul-marinho": { frame: "#1f2a44" },
  "Dourado":      { frame: "#b08a55" },
  "Tartaruga":    { frame: "#6b4423" },
  "Prata":        { frame: "#9aa1ad" },
  "Vinho":        { frame: "#6e2233" },
  "Rosé":         { frame: "#c98b8b" },
  "Transparente": { frame: "#c9c2b5" },
  "Verde":        { frame: "#3f5e4a" },
  "Azul":         { frame: "#3a74c4" },
  "Rosa":         { frame: "#e07aa6" },
  "Vermelho":     { frame: "#c0392b" },
};

const PRODUTOS = [
  // Óculos de grau
  { id: "ev-101", nome: "Aurora",     categoria: "grau", formato: "redondo",    material: "Acetato",       cores: ["Tartaruga", "Preto", "Transparente"], preco: 289.9, de: null,  tag: "Novo",       tamanho: "49□20 145", desc: "Armação redonda em acetato com acabamento polido. Leve e atemporal, combina com rostos quadrados e de traços marcantes." },
  { id: "ev-102", nome: "Lumière",    categoria: "grau", formato: "gatinho",    material: "Acetato",       cores: ["Vinho", "Preto", "Rosé"],            preco: 329.9, de: 389.9, tag: "Oferta",     tamanho: "52□17 140", desc: "Gatinho sofisticado com cantos levemente elevados. Valoriza o olhar e traz um toque retrô elegante." },
  { id: "ev-103", nome: "Ônix",       categoria: "grau", formato: "retangular", material: "Metal + acetato", cores: ["Preto", "Azul-marinho"],           preco: 259.9, de: null,  tag: null,         tamanho: "54□18 145", desc: "Retangular de linhas retas, ideal para o dia a dia profissional. Hastes flexíveis e plaquetas reguláveis." },
  { id: "ev-104", nome: "Sereno",     categoria: "grau", formato: "oval",       material: "TR-90",         cores: ["Transparente", "Azul-marinho", "Rosé"], preco: 219.9, de: null, tag: null,      tamanho: "50□19 140", desc: "Oval ultraleve em TR-90, material resistente e flexível. Conforto para usar o dia inteiro." },
  { id: "ev-105", nome: "Atlas",      categoria: "grau", formato: "quadrado",   material: "Acetato",       cores: ["Preto", "Tartaruga", "Verde"],       preco: 349.9, de: null,  tag: "Mais vendido", tamanho: "53□19 145", desc: "Quadrado encorpado com personalidade. Perfeito para rostos redondos e ovais." },
  { id: "ev-106", nome: "Hexa",       categoria: "grau", formato: "hexagonal",  material: "Metal",         cores: ["Dourado", "Prata", "Preto"],         preco: 379.9, de: null,  tag: "Novo",       tamanho: "51□20 145", desc: "Hexagonal em metal fino, tendência que une o geométrico ao minimalista." },
  { id: "ev-107", nome: "Clássico",   categoria: "grau", formato: "clubmaster", material: "Acetato + metal", cores: ["Tartaruga", "Preto"],              preco: 299.9, de: 349.9, tag: "Oferta",     tamanho: "51□21 145", desc: "Estilo clubmaster com sobrancelha marcada. Um clássico que nunca sai de moda." },
  { id: "ev-108", nome: "Pluma",      categoria: "grau", formato: "redondo",    material: "Titânio",       cores: ["Dourado", "Prata"],                  preco: 489.9, de: null,  tag: "Premium",    tamanho: "48□21 145", desc: "Titânio puro: leveza extrema, hipoalergênico e muito resistente. Para quem busca o máximo conforto." },

  // Óculos de sol
  { id: "ev-201", nome: "Riviera",    categoria: "sol",  formato: "aviador",    material: "Metal",         cores: ["Dourado", "Prata", "Preto"],         preco: 319.9, de: null,  tag: "Mais vendido", lente: "#3d4a3a", tamanho: "58□14 140", desc: "Aviador clássico com lentes polarizadas e proteção UV400. Indispensável para o sol do Ceará." },
  { id: "ev-202", nome: "Capri",      categoria: "sol",  formato: "gatinho",    material: "Acetato",       cores: ["Preto", "Tartaruga", "Vinho"],       preco: 279.9, de: 329.9, tag: "Oferta",   lente: "#2b2420", tamanho: "54□17 140", desc: "Gatinho marcante com lentes degradê e proteção UV400. Glamour em qualquer ocasião." },
  { id: "ev-203", nome: "Malibu",     categoria: "sol",  formato: "quadrado",   material: "Acetato",       cores: ["Preto", "Transparente", "Verde"],   preco: 249.9, de: null,  tag: null,         lente: "#2e2e33", tamanho: "54□18 145", desc: "Quadrado oversized com lentes polarizadas. Estilo despojado para o fim de semana." },
  { id: "ev-204", nome: "Solaris",    categoria: "sol",  formato: "redondo",    material: "Metal",         cores: ["Dourado", "Prata"],                  preco: 229.9, de: null,  tag: "Novo",       lente: "#5a3d22", tamanho: "50□20 140", desc: "Redondo em metal com lentes marrom. Leve, delicado e cheio de estilo." },
  { id: "ev-205", nome: "Monaco",     categoria: "sol",  formato: "retangular", material: "TR-90",         cores: ["Preto", "Azul-marinho"],             preco: 199.9, de: null,  tag: null,         lente: "#1f2a44", tamanho: "57□16 140", desc: "Retangular esportivo em TR-90, flexível e resistente. Ótimo para atividades ao ar livre." },

  // Infantil
  { id: "ev-301", nome: "Pipoca",     categoria: "infantil", formato: "redondo",  material: "Silicone flexível", cores: ["Azul", "Rosa", "Verde"],      preco: 169.9, de: null,  tag: "Novo",       tamanho: "44□16 125", desc: "Armação infantil em silicone flexível, praticamente inquebrável. Ponteiras macias para não machucar." },
  { id: "ev-302", nome: "Arco-íris",  categoria: "infantil", formato: "oval",     material: "TR-90",         cores: ["Rosa", "Azul", "Vermelho"],         preco: 149.9, de: 179.9, tag: "Oferta",   tamanho: "45□15 125", desc: "Leve e colorido, feito para acompanhar a rotina agitada das crianças." },
  { id: "ev-303", nome: "Aventura",   categoria: "infantil", formato: "quadrado", material: "TR-90",         cores: ["Azul", "Preto", "Verde"],           preco: 159.9, de: null,  tag: null,         tamanho: "46□16 130", desc: "Quadrado resistente para pequenos aventureiros. Acompanha cordão de segurança." },
];

// Modelos disponíveis no provador virtual (provador.html)
const PROVADOR_IDS = ["ev-101", "ev-105", "ev-201"];

const CAT_LABEL = { grau: "Óculos de grau", sol: "Óculos de sol", infantil: "Infantil" };

/* ---------- Utilidades ---------- */
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const waLink = (msg) => `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(msg)}`;

function productArt(p, corNome) {
  const cor = CORES[corNome || p.cores[0]] || CORES.Preto;
  const isSol = p.categoria === "sol";
  return glassesSVG(p.formato, cor.frame, isSol ? (p.lente || "#2e2e33") : "#9fb3c8", isSol ? 0.85 : 0.22);
}

function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- Layout compartilhado (topo + rodapé) ---------- */
const PAGES = [
  { href: "index.html",    label: "Início" },
  { href: "catalogo.html", label: "Óculos" },
  { href: "provador.html", label: "Provador virtual" },
  { href: "lentes.html",   label: "Lentes & Serviços" },
  { href: "sobre.html",    label: "Sobre nós" },
  { href: "contato.html",  label: "Contato" },
];

function renderLayout() {
  const current = location.pathname.split("/").pop() || "index.html";
  const nav = PAGES.map((p) => `<a href="${p.href}" class="${p.href === current ? "active" : ""}">${p.label}</a>`).join("");

  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML = `
      <div class="topbar">Parcele em até <strong>${LOJA.parcelas}x sem juros</strong> · Ajustes e manutenção gratuitos na loja</div>
      <header class="header">
        <div class="container header__inner">
          <a href="index.html" class="brand" aria-label="Essencial Vision Ótica — início">
            ${logoMark()}
            <span class="brand__text"><span class="brand__name">ESSENCIAL</span><span class="brand__sub">VISION</span></span>
          </a>
          <nav class="nav" id="nav" aria-label="Principal">${nav}</nav>
          <div class="header__actions">
            <button class="icon-btn" id="open-cart" aria-label="Abrir sacola">${ICON.bag}<span class="cart-count" data-count="0">0</span></button>
            <button class="icon-btn menu-toggle" id="menu-toggle" aria-label="Abrir menu" aria-expanded="false">${ICON.menu}</button>
          </div>
        </div>
      </header>`;
    $("#menu-toggle").addEventListener("click", (e) => {
      const open = $("#nav").classList.toggle("open");
      e.currentTarget.setAttribute("aria-expanded", open);
      e.currentTarget.innerHTML = open ? ICON.close : ICON.menu;
    });
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer__grid">
            <div>
              <a href="index.html" class="brand">${logoMark()}<span class="brand__text"><span class="brand__name">ESSENCIAL</span><span class="brand__sub">VISION</span></span></a>
              <p style="margin-top:16px;max-width:300px">Enxergar bem, viver melhor. Armações para todos os estilos e atendimento consultivo do exame à entrega.</p>
              <div class="socials">
                <a href="https://instagram.com/${LOJA.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.instagram}</a>
                <a href="${waLink("Olá! Vim pelo site da Essencial Vision.")}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.whatsapp}</a>
              </div>
            </div>
            <div>
              <h4>Navegue</h4>
              <ul>${PAGES.map((p) => `<li><a href="${p.href}">${p.label}</a></li>`).join("")}</ul>
            </div>
            <div>
              <h4>Produtos</h4>
              <ul>
                <li><a href="catalogo.html?cat=grau">Óculos de grau</a></li>
                <li><a href="catalogo.html?cat=sol">Óculos de sol</a></li>
                <li><a href="catalogo.html?cat=infantil">Infantil</a></li>
                <li><a href="lentes.html">Lentes</a></li>
              </ul>
            </div>
            <div>
              <h4>Atendimento</h4>
              <ul>
                <li><a href="${waLink("Olá! Gostaria de mais informações.")}" target="_blank" rel="noopener">${LOJA.whatsappTexto}</a></li>
                <li>Seg a Sex · 8h às 18h</li>
                <li>Sábado · 8h às 13h</li>
                <li>${LOJA.endereco}</li>
              </ul>
            </div>
          </div>
          <div class="footer__bottom">
            <span>© ${new Date().getFullYear()} ${LOJA.nome}. Todos os direitos reservados.</span>
            <span>Preços e modelos meramente ilustrativos.</span>
          </div>
        </div>
      </footer>
      <a class="wa-float" href="${waLink("Olá! Vim pelo site da Essencial Vision e gostaria de atendimento.")}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">${ICON.whatsapp}</a>`;
  }
}

/* ---------- Sacola ---------- */
const CART_KEY = "ev_sacola";
function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } }
function saveCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch {} updateCartUI(); }

function addToCart(id, cor) {
  const p = PRODUTOS.find((x) => x.id === id);
  if (!p) return;
  cor = cor || p.cores[0];
  const cart = getCart();
  const item = cart.find((i) => i.id === id && i.cor === cor);
  if (item) item.qtd++; else cart.push({ id, cor, qtd: 1 });
  saveCart(cart);
  toast(`${p.nome} (${cor}) adicionado à sacola`);
}

function renderDrawer() {
  if ($("#drawer")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <div class="drawer-overlay" id="drawer-overlay"></div>
    <aside class="drawer" id="drawer" aria-label="Sacola" aria-hidden="true">
      <div class="drawer__head"><h3>Sua sacola</h3><button class="icon-btn" id="close-cart" aria-label="Fechar">${ICON.close}</button></div>
      <div class="drawer__items" id="cart-items"></div>
      <div class="drawer__foot" id="cart-foot"></div>
    </aside>`);
  const close = () => { $("#drawer").classList.remove("open"); $("#drawer-overlay").classList.remove("open"); $("#drawer").setAttribute("aria-hidden", "true"); };
  $("#close-cart").addEventListener("click", close);
  $("#drawer-overlay").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  $("#cart-items").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const cart = getCart();
    const i = +b.dataset.i;
    if (b.dataset.act === "plus") cart[i].qtd++;
    if (b.dataset.act === "minus") cart[i].qtd = Math.max(1, cart[i].qtd - 1);
    if (b.dataset.act === "remove") cart.splice(i, 1);
    saveCart(cart);
  });
}

function openCart() {
  $("#drawer").classList.add("open");
  $("#drawer-overlay").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
}

function updateCartUI() {
  const cart = getCart();
  const count = cart.reduce((s, i) => s + i.qtd, 0);
  $$(".cart-count").forEach((el) => { el.textContent = count; el.dataset.count = count; });
  const box = $("#cart-items");
  if (!box) return;
  if (!cart.length) {
    box.innerHTML = `<div class="drawer__empty">Sua sacola está vazia.<br><br><a class="btn btn--outline" href="catalogo.html">Ver óculos</a></div>`;
    $("#cart-foot").innerHTML = "";
    return;
  }
  let total = 0;
  box.innerHTML = cart.map((it, i) => {
    const p = PRODUTOS.find((x) => x.id === it.id);
    if (!p) return "";
    total += p.preco * it.qtd;
    return `<div class="cart-item">
      <div class="cart-item__img">${productArt(p, it.cor)}</div>
      <div><h4>${p.nome}</h4><p>${CAT_LABEL[p.categoria]} · ${it.cor}</p>
        <div class="qty"><button data-act="minus" data-i="${i}" aria-label="Diminuir">−</button><span>${it.qtd}</span><button data-act="plus" data-i="${i}" aria-label="Aumentar">+</button></div>
      </div>
      <div style="text-align:right"><strong>${brl(p.preco * it.qtd)}</strong><br><button class="remove" data-act="remove" data-i="${i}">Remover</button></div>
    </div>`;
  }).join("");
  const msg = "Olá! Tenho interesse nestes óculos do site:\n\n" +
    cart.map((it) => { const p = PRODUTOS.find((x) => x.id === it.id); return p ? `• ${it.qtd}x ${p.nome} (${it.cor}) — ${brl(p.preco * it.qtd)}` : ""; }).join("\n") +
    `\n\nTotal: ${brl(total)}\n\nPodem me ajudar a finalizar?`;
  $("#cart-foot").innerHTML = `
    <div class="drawer__total"><span>Total</span><strong>${brl(total)}</strong></div>
    <small>ou ${LOJA.parcelas}x de ${brl(total / LOJA.parcelas)} sem juros · lentes cotadas à parte</small>
    <a class="btn btn--primary btn--block" href="${waLink(msg)}" target="_blank" rel="noopener">${ICON.whatsapp} Finalizar pelo WhatsApp</a>`;
}

/* ---------- Card de produto ---------- */
function productCard(p) {
  const tagCls = p.tag === "Oferta" ? "tag tag--sale" : p.tag === "Premium" || p.tag === "Mais vendido" ? "tag tag--gold" : "tag";
  return `<article class="product reveal">
    <div class="product__img" data-view="${p.id}" role="button" tabindex="0" aria-label="Ver detalhes de ${p.nome}">
      ${p.tag ? `<span class="${tagCls}">${p.tag}</span>` : ""}
      ${PROVADOR_IDS.includes(p.id) ? `<a class="tag tag--3d" href="provador.html?modelo=${p.id}" title="Provar no rosto">Provar 3D</a>` : ""}
      ${productArt(p)}
    </div>
    <div class="product__body">
      <span class="product__cat">${CAT_LABEL[p.categoria]}</span>
      <h3 class="product__name">${p.nome}</h3>
      <span class="product__meta">${p.formato[0].toUpperCase() + p.formato.slice(1)} · ${p.material}</span>
      <div class="swatches">${p.cores.map((c) => `<span class="swatch" title="${c}" style="background:${CORES[c].frame}"></span>`).join("")}</div>
      <div class="price">
        <strong>${brl(p.preco)}</strong>${p.de ? `<del>${brl(p.de)}</del>` : ""}
        <small>${LOJA.parcelas}x de ${brl(p.preco / LOJA.parcelas)} sem juros</small>
      </div>
      <div class="product__actions">
        <button class="btn btn--outline" data-view="${p.id}">Detalhes</button>
        <button class="btn btn--primary" data-add="${p.id}">Adicionar</button>
      </div>
    </div>
  </article>`;
}

/* ---------- Modal de produto ---------- */
function renderModal() {
  if ($("#modal")) return;
  document.body.insertAdjacentHTML("beforeend", `<div class="modal" id="modal" role="dialog" aria-modal="true"><div class="modal__box" id="modal-box"></div></div>`);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}
function closeModal() { const m = $("#modal"); if (m) m.classList.remove("open"); }

function openProduct(id) {
  const p = PRODUTOS.find((x) => x.id === id);
  if (!p) return;
  let cor = p.cores[0];
  const box = $("#modal-box");
  const draw = () => {
    box.innerHTML = `
      <button class="modal__close" aria-label="Fechar">${ICON.close}</button>
      <div class="modal__img">${productArt(p, cor)}</div>
      <div class="modal__body">
        <span class="product__cat">${CAT_LABEL[p.categoria]} · Ref. ${p.id.toUpperCase()}</span>
        <h3>${p.nome}</h3>
        <div class="price" style="padding-top:6px"><strong>${brl(p.preco)}</strong>${p.de ? `<del>${brl(p.de)}</del>` : ""}<small>${LOJA.parcelas}x de ${brl(p.preco / LOJA.parcelas)} sem juros</small></div>
        <p style="color:var(--muted);margin-top:14px;font-size:.93rem">${p.desc}</p>
        <p style="margin-top:18px;font-size:.82rem;font-weight:600">Cor: <span style="color:var(--gold-600)">${cor}</span></p>
        <div class="color-pick">${p.cores.map((c) => `<button data-cor="${c}" class="${c === cor ? "active" : ""}" style="background:${CORES[c].frame}" aria-label="${c}"></button>`).join("")}</div>
        <ul class="specs">
          <li><span>Formato</span><span>${p.formato[0].toUpperCase() + p.formato.slice(1)}</span></li>
          <li><span>Material</span><span>${p.material}</span></li>
          <li><span>Medidas</span><span>${p.tamanho}</span></li>
          <li><span>${p.categoria === "sol" ? "Proteção" : "Lentes"}</span><span>${p.categoria === "sol" ? "UV400" : "Sob medida (cotadas à parte)"}</span></li>
        </ul>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn--primary" id="modal-add" style="flex:1">${ICON.bag} Adicionar à sacola</button>
          ${PROVADOR_IDS.includes(p.id) ? `<a class="btn btn--gold" style="flex-basis:100%" href="provador.html?modelo=${p.id}">${ICON.eye} Provar no meu rosto (3D)</a>` : ""}
          <a class="btn btn--outline" style="flex:1" target="_blank" rel="noopener" href="${waLink(`Olá! Tenho interesse no modelo ${p.nome} (${cor}) — Ref. ${p.id.toUpperCase()}.`)}">Tirar dúvidas</a>
        </div>
      </div>`;
    $(".modal__close", box).onclick = closeModal;
    $$(".color-pick button", box).forEach((b) => (b.onclick = () => { cor = b.dataset.cor; draw(); }));
    $("#modal-add", box).onclick = () => { addToCart(p.id, cor); closeModal(); };
  };
  draw();
  $("#modal").classList.add("open");
}

/* Cliques globais em "ver" e "adicionar" */
document.addEventListener("click", (e) => {
  if (e.target.closest("a[href]")) return; // links seguem normalmente
  const add = e.target.closest("[data-add]");
  if (add) { addToCart(add.dataset.add); return; }
  const view = e.target.closest("[data-view]");
  if (view) { openProduct(view.dataset.view); return; }
  if (e.target.closest("#open-cart")) openCart();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.matches?.("[data-view]")) openProduct(e.target.dataset.view);
});

/* ---------- Página: Início ---------- */
function initHome() {
  const el = $("#destaques");
  if (!el) return;
  const ids = ["ev-105", "ev-102", "ev-201", "ev-108"];
  el.innerHTML = ids.map((id) => productCard(PRODUTOS.find((p) => p.id === id))).join("");
}

/* ---------- Página: Catálogo ---------- */
function initCatalog() {
  const grid = $("#catalogo-grid");
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const state = { cat: params.get("cat") || "todos", formato: "todos", max: 500, q: "", ordem: "relevancia" };

  const formatos = [...new Set(PRODUTOS.map((p) => p.formato))];
  $("#f-formato").innerHTML = ["todos", ...formatos].map((f) => `<button class="chip" data-formato="${f}">${f === "todos" ? "Todos" : f[0].toUpperCase() + f.slice(1)}</button>`).join("");

  const sync = () => {
    $$("[data-cat]").forEach((b) => b.classList.toggle("active", b.dataset.cat === state.cat));
    $$("[data-formato]").forEach((b) => b.classList.toggle("active", b.dataset.formato === state.formato));
    $("#f-max-label").textContent = brl(state.max);
  };

  const draw = () => {
    let list = PRODUTOS.filter((p) =>
      (state.cat === "todos" || p.categoria === state.cat) &&
      (state.formato === "todos" || p.formato === state.formato) &&
      p.preco <= state.max &&
      (p.nome + " " + p.material + " " + p.formato + " " + p.cores.join(" ")).toLowerCase().includes(state.q)
    );
    if (state.ordem === "menor") list.sort((a, b) => a.preco - b.preco);
    if (state.ordem === "maior") list.sort((a, b) => b.preco - a.preco);
    if (state.ordem === "nome") list.sort((a, b) => a.nome.localeCompare(b.nome));
    $("#catalogo-count").textContent = `${list.length} ${list.length === 1 ? "modelo encontrado" : "modelos encontrados"}`;
    grid.innerHTML = list.length ? list.map(productCard).join("") : `<div class="empty">Nenhum modelo com esses filtros.<br><br><button class="btn btn--outline" id="clear-filters">Limpar filtros</button></div>`;
    sync();
    observeReveal();
  };

  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cat]");
    if (c) { state.cat = c.dataset.cat; draw(); }
    const f = e.target.closest("[data-formato]");
    if (f) { state.formato = f.dataset.formato; draw(); }
    if (e.target.closest("#clear-filters")) {
      Object.assign(state, { cat: "todos", formato: "todos", max: 500, q: "" });
      $("#f-max").value = 500; $("#f-busca").value = "";
      draw();
    }
  });
  $("#f-max").addEventListener("input", (e) => { state.max = +e.target.value; draw(); });
  $("#f-busca").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); draw(); });
  $("#f-ordem").addEventListener("change", (e) => { state.ordem = e.target.value; draw(); });
  $("#filters-toggle").addEventListener("click", () => $("#filters").classList.toggle("open"));
  draw();
}

/* ---------- Página: Contato (agendamento via WhatsApp) ---------- */
function initContact() {
  const form = $("#form-agendar");
  if (!form) return;
  const data = $("#ag-data");
  data.min = new Date().toISOString().split("T")[0];
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const dataBR = f.get("data") ? f.get("data").split("-").reverse().join("/") : "a combinar";
    const msg = `Olá! Gostaria de agendar um atendimento na Essencial Vision.\n\n` +
      `Nome: ${f.get("nome")}\nTelefone: ${f.get("telefone")}\nServiço: ${f.get("servico")}\n` +
      `Data preferida: ${dataBR}\nPeríodo: ${f.get("periodo")}\n` +
      (f.get("mensagem") ? `Observações: ${f.get("mensagem")}` : "");
    window.open(waLink(msg), "_blank", "noopener");
    $("#form-ok").classList.add("show");
    form.reset();
  });
}

/* ---------- Animação ao rolar ---------- */
let io;
function observeReveal() {
  if (!("IntersectionObserver" in window)) { $$(".reveal").forEach((el) => el.classList.add("in")); return; }
  io = io || new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12 });
  $$(".reveal:not(.in)").forEach((el) => io.observe(el));
}

/* ---------- Inicialização ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderLayout();
  renderDrawer();
  renderModal();
  $$("[data-logo-full]").forEach((n) => (n.innerHTML = logoFull(n.dataset.logoFull === "dark")));
  $$("[data-icon]").forEach((n) => (n.innerHTML = ICON[n.dataset.icon] || ""));
  $$("[data-art]").forEach((n) => {
    const [shape, frame, lens, op] = n.dataset.art.split("|");
    n.innerHTML = glassesSVG(shape, frame, lens, +op);
  });
  $$("[data-wa]").forEach((a) => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener"; });
  initHome();
  initCatalog();
  initContact();
  updateCartUI();
  observeReveal();
});
