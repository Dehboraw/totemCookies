/* ============================================================
   Cookies & Cia. — Totem Retrô · lógica da aplicação
   ============================================================ */
"use strict";

/* ---------- Catálogo ---------- */
const PRODUCTS = [
  { id: "classico",   name: "Cookie Clássico",        desc: "Gotas de chocolate meio amargo, borda crocante", price: 8.00,  cat: "classicos",  badge: "MAIS VENDIDO", art: { base: "#c9803e", chip: "#4a2c17", shape: "circle" } },
  { id: "duplo",      name: "Duplo Chocolate",        desc: "Massa de cacau + chunks derretidos por dentro",  price: 9.50,  cat: "classicos",  badge: null,           art: { base: "#6f4423", chip: "#2e1a0c", shape: "chunk" } },
  { id: "aveia",      name: "Aveia & Mel",            desc: "Flocos de aveia e mel puro da fazenda",          price: 7.50,  cat: "classicos",  badge: null,           art: { base: "#d9a86a", chip: "#8a5a28", shape: "flake" } },
  { id: "redvelvet",  name: "Red Velvet",             desc: "Massa aveludada vermelha com gotas brancas",     price: 10.00, cat: "especiais",  badge: "NOVIDADE",     art: { base: "#8e2f2f", chip: "#fdf6e3", shape: "circle" } },
  { id: "macadamia",  name: "Macadâmia Branca",       desc: "Nozes macadâmia e chocolate branco nobre",       price: 11.00, cat: "especiais",  badge: null,           art: { base: "#e3bd88", chip: "#fbf3e0", shape: "chunk" } },
  { id: "amendoim",   name: "Amendoim Retrô",         desc: "Pasta de amendoim com marcas de garfo, à moda antiga", price: 8.50, cat: "especiais", badge: null,      art: { base: "#c98e4a", chip: "#7a4a21", shape: "cross" } },
  { id: "brigadeiro", name: "Cookie Brigadeiro",      desc: "Recheio cremoso de brigadeiro e granulados",     price: 9.00,  cat: "brasil",     badge: "BRASIL",       art: { base: "#5a3216", chip: "#e0a63c", shape: "sprinkle" } },
  { id: "doceleite",  name: "Doce de Leite",          desc: "Coração de doce de leite argentino",             price: 9.00,  cat: "brasil",     badge: null,           art: { base: "#b5713f", chip: "#8a4a1d", shape: "circle" } },
  { id: "coco",       name: "Coco Queimado",          desc: "Coco ralado tostado na chapa antiga",            price: 8.50,  cat: "brasil",     badge: null,           art: { base: "#e8d3ae", chip: "#b08954", shape: "flake" } },
  { id: "leite",      name: "Leite Gelado",           desc: "Garrafinha gelada pra mergulhar o cookie",       price: 6.00,  cat: "bebidas",    badge: "GELADO",       art: { base: "#fdf6e3", chip: "#2f6f6a", shape: "bottle" } },
  { id: "cafe",       name: "Café Coado",             desc: "Passado no coador de pano, quentinho",           price: 5.50,  cat: "bebidas",    badge: null,           art: { base: "#3d2314", chip: "#e0a63c", shape: "cup" } },
];

const CAT_LABEL = { classicos: "Clássicos", especiais: "Especiais", brasil: "Doces do Brasil", bebidas: "Bebidas" };

/* ---------- Estado ---------- */
const state = {
  cart: new Map(),        // id -> quantidade
  category: "todos",
  mode: "retirada",
  pay: "Dinheiro",
};

const brl = (v) => "R$ " + v.toFixed(2).replace(".", ",");

/* ---------- Arte SVG dos produtos ---------- */
function cookieSVG(art) {
  const { base, chip, shape } = art;

  if (shape === "bottle") {
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="86" rx="30" ry="7" fill="#3d2314" opacity=".18"/>
      <rect x="42" y="12" width="16" height="12" rx="3" fill="#2f6f6a"/>
      <path d="M40 24 h20 v10 c8 6 12 14 12 24 v22 a6 6 0 0 1 -6 6 H34 a6 6 0 0 1 -6 -6 V58 c0-10 4-18 12-24 Z" fill="#bfe3e0" stroke="#2f6f6a" stroke-width="3"/>
      <rect x="34" y="58" width="32" height="16" rx="4" fill="#fdf6e3" stroke="#2f6f6a" stroke-width="2"/>
      <text x="50" y="70" text-anchor="middle" font-size="8" font-weight="bold" fill="#2f6f6a" font-family="monospace">LEITE</text>
    </svg>`;
  }
  if (shape === "cup") {
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="86" rx="28" ry="7" fill="#3d2314" opacity=".18"/>
      <path d="M22 34 h52 v22 a22 22 0 0 1 -22 22 h-8 a22 22 0 0 1 -22 -22 Z" fill="#3d2314" stroke="#2b1a0e" stroke-width="3"/>
      <path d="M74 38 h8 a8 8 0 0 1 0 16 h-8" fill="none" stroke="#2b1a0e" stroke-width="3"/>
      <ellipse cx="48" cy="34" rx="24" ry="6" fill="#c9803e"/>
      <path d="M40 24 q8-6 16 0" stroke="#fdf6e3" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="72" r="4" fill="${chip}"/>
    </svg>`;
  }

  /* chips conforme o formato */
  const spots = [ [34,36],[60,30],[68,54],[38,60],[52,44],[46,72],[64,70] ];
  let deco = "";
  spots.forEach(([x, y], i) => {
    if (shape === "flake") {
      deco += `<rect x="${x-4}" y="${y-2}" width="9" height="4" rx="2" fill="${chip}" transform="rotate(${i*33} ${x} ${y})"/>`;
    } else if (shape === "chunk") {
      deco += `<rect x="${x-5}" y="${y-5}" width="10" height="10" rx="2" fill="${chip}" transform="rotate(${i*24} ${x} ${y})"/>`;
    } else if (shape === "cross") {
      deco += `<path d="M${x-7} ${y} h14 M${x} ${y-7} v14" stroke="${chip}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
    } else if (shape === "sprinkle") {
      const colors = ["#e0a63c","#b4472f","#2f6f6a","#fdf6e3"];
      deco += `<rect x="${x-4}" y="${y-2}" width="9" height="4" rx="2" fill="${colors[i%4]}" transform="rotate(${i*47} ${x} ${y})"/>`;
    } else {
      deco += `<circle cx="${x}" cy="${y}" r="5" fill="${chip}"/>`;
    }
  });

  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="50" cy="84" rx="36" ry="8" fill="#3d2314" opacity=".18"/>
    <circle cx="50" cy="48" r="38" fill="${base}" stroke="rgba(61,35,20,.4)" stroke-width="3"/>
    <circle cx="50" cy="48" r="38" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2" stroke-dasharray="4 7"/>
    ${deco}
  </svg>`;
}

/* ---------- Elementos ---------- */
const $ = (sel) => document.querySelector(sel);
const grid = $("#grid");
const chips = $("#chips");
const bottombar = $("#bottombar");
const barItems = $("#bar-items");
const barPrice = $("#bar-price");
const barTotal = document.querySelector(".bar-total");
const cartSheet = $("#cart-sheet");
const cartBackdrop = $("#cart-backdrop");
const cartBody = $("#cart-body");
const cartSubtotal = $("#cart-subtotal");
const toast = $("#toast");
const screenCheckout = $("#screen-checkout");
const screenReceipt = $("#screen-receipt");
const installBanner = $("#install-banner");

/* ---------- Render do cardápio ---------- */
function renderMenu() {
  const list = PRODUCTS.filter(p => state.category === "todos" || p.cat === state.category);
  grid.innerHTML = list.map(p => `
    <article class="card">
      <div class="card-art">
        ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ""}
        ${cookieSVG(p.art)}
      </div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="card-desc">${p.desc}${p.cat === "bebidas" ? "" : ""}</p>
        <div class="card-row">
          <span class="price-tag">${brl(p.price)}</span>
          <button class="btn-add" data-add="${p.id}" aria-label="Adicionar ${p.name} à sacola">+ Adicionar</button>
        </div>
      </div>
    </article>
  `).join("");
}

/* ---------- Lógica da sacola ---------- */
function cartCount() {
  let n = 0;
  state.cart.forEach(q => n += q);
  return n;
}

function cartTotal() {
  let t = 0;
  state.cart.forEach((q, id) => {
    const p = PRODUCTS.find(p => p.id === id);
    if (p) t += p.price * q;
  });
  return t;
}

function saveCart() {
  try {
    localStorage.setItem("cookies-cart", JSON.stringify([...state.cart]));
  } catch (_) {}
}

function loadCart() {
  try {
    const raw = localStorage.getItem("cookies-cart");
    if (raw) state.cart = new Map(JSON.parse(raw).filter(([id]) => PRODUCTS.some(p => p.id === id)));
  } catch (_) {}
}

function addToCart(id, silent = false) {
  state.cart.set(id, (state.cart.get(id) || 0) + 1);
  saveCart();
  renderBar();
  if (!silent) {
    const p = PRODUCTS.find(p => p.id === id);
    showToast(`🍪 ${p.name} na sacola!`);
    blip(660);
    vibrate(25);
  }
}

function setQty(id, qty) {
  if (qty <= 0) state.cart.delete(id);
  else state.cart.set(id, qty);
  saveCart();
  renderBar();
  renderCart();
}

function renderBar() {
  const n = cartCount();
  const t = cartTotal();
  barItems.textContent = n === 1 ? "1 item" : `${n} itens`;
  barPrice.textContent = brl(t);
  barTotal.classList.remove("bump");
  void barTotal.offsetWidth; // reinicia a animação
  barTotal.classList.add("bump");
}

function renderCart() {
  if (state.cart.size === 0) {
    cartBody.innerHTML = `
      <div class="cart-empty">
        <span class="big">🗞️</span>
        <p><strong>Sua sacola está vazia!</strong><br>
        Volte ao cardápio e escolha seus cookies quentinhos.</p>
      </div>`;
    cartSubtotal.textContent = brl(0);
    return;
  }

  cartBody.innerHTML = [...state.cart].map(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    return `
    <div class="cart-item">
      <span class="cart-art">${cookieSVG(p.art)}</span>
      <div class="cart-item-info">
        <h4>${p.name}</h4>
        <small>${CAT_LABEL[p.cat] || ""} · ${brl(p.price)} un.</small>
      </div>
      <div class="qty" aria-label="Quantidade de ${p.name}">
        <button data-dec="${id}" aria-label="Diminuir">−</button>
        <span>${qty}</span>
        <button data-inc="${id}" aria-label="Aumentar">+</button>
      </div>
      <span class="cart-item-price">${brl(p.price * qty)}</span>
    </div>`;
  }).join("");

  cartSubtotal.textContent = brl(cartTotal());
}

/* ---------- Abrir / fechar sacola ---------- */
function openCart() {
  renderCart();
  cartSheet.hidden = false;
  cartBackdrop.hidden = false;
  blip(520);
}

function closeCart() {
  cartSheet.hidden = true;
  cartBackdrop.hidden = true;
}

/* ---------- Checkout ---------- */
function renderSummary() {
  const rows = [...state.cart].map(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    return `<div class="summary-row"><span>${qty}× ${p.name}</span><span>${brl(p.price * qty)}</span></div>`;
  }).join("");

  const modeLabel = state.mode === "retirada" ? "Retirada no balcão" : "Consumir no salão";
  const n = cartCount();

  $("#checkout-summary").innerHTML = `
    ${rows}
    <div class="summary-row"><span>Consumo</span><span>${modeLabel}</span></div>
    <div class="summary-row"><span>Pagamento</span><span>${state.pay}</span></div>
    <div class="summary-row total"><span>Total (${n} ${n === 1 ? "item" : "itens"})</span><strong>${brl(cartTotal())}</strong></div>
  `;
}

function openCheckout() {
  if (state.cart.size === 0) { showToast("🛍️ Adicione cookies primeiro!"); return; }
  closeCart();
  renderSummary();
  screenCheckout.hidden = false;
  blip(700);
}

function finishOrder() {
  const name = ($("#input-name").value || "").trim();
  const total = cartTotal();
  const n = cartCount();
  const orderCode = "A-" + String(Math.floor(100 + Math.random() * 900));
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR") + " · " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  $("#ticket-number").textContent = `PEDIDO #${orderCode}`;
  $("#ticket-items").innerHTML = [...state.cart].map(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    return `<div><span>${qty}× ${p.name}</span><span>${brl(p.price * qty)}</span></div>`;
  }).join("");
  $("#ticket-total").textContent = brl(total);
  $("#ticket-info").innerHTML =
    `${state.mode === "retirada" ? "🏪 Retirada no balcão" : "🪑 Consumir no salão"}<br>` +
    `💳 ${state.pay} · 📅 ${dateStr}` +
    (name ? `<br>🙋 ${name}` : "");

  screenCheckout.hidden = true;
  screenReceipt.hidden = false;
  state.cart.clear();
  saveCart();
  renderBar();
  renderCart();
  vibrate([60, 60, 120]);
  blip(880); setTimeout(() => blip(1180), 160);
  showToast(`✅ Pedido #${orderCode} confirmado!`);
}

/* ---------- Toast / som / vibração ---------- */
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

function blip(freq) {
  try {
    const ctx = blip.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (_) {}
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

/* ---------- Eventos ---------- */
chips.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  chips.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
  btn.classList.add("is-active");
  state.category = btn.dataset.cat;
  renderMenu();
  blip(440);
  vibrate(15);
});

grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (btn) addToCart(btn.dataset.add);
});

$("#btn-open-cart").addEventListener("click", openCart);
$("#btn-close-cart").addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);

cartBody.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  if (inc) { setQty(inc.dataset.inc, (state.cart.get(inc.dataset.inc) || 0) + 1); blip(660); vibrate(15); }
  if (dec) { setQty(dec.dataset.dec, (state.cart.get(dec.dataset.dec) || 0) - 1); blip(330); vibrate(15); }
});

$("#btn-checkout").addEventListener("click", openCheckout);
$("#btn-back-checkout").addEventListener("click", () => { screenCheckout.hidden = true; });
$("#btn-confirm").addEventListener("click", finishOrder);
$("#btn-new-order").addEventListener("click", () => {
  screenReceipt.hidden = true;
  $("#input-name").value = "";
  showToast("🍪 Boa escolha! Faça seu pedido.");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

$("#opt-mode").addEventListener("click", (e) => {
  const opt = e.target.closest(".opt");
  if (!opt) return;
  $("#opt-mode").querySelectorAll(".opt").forEach(o => o.classList.remove("is-active"));
  opt.classList.add("is-active");
  state.mode = opt.dataset.value;
  renderSummary();
  blip(520);
});

$("#opt-pay").addEventListener("click", (e) => {
  const opt = e.target.closest(".opt");
  if (!opt) return;
  $("#opt-pay").querySelectorAll(".opt").forEach(o => o.classList.remove("is-active"));
  opt.classList.add("is-active");
  state.pay = opt.dataset.value;
  renderSummary();
  blip(520);
});

/* ESC fecha a sacola */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !cartSheet.hidden) closeCart();
});

/* ---------- Instalação do PWA ---------- */
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBanner.hidden = false;
});
installBanner.addEventListener("click", async () => {
  installBanner.hidden = true;
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  }
});
window.addEventListener("appinstalled", () => { installBanner.hidden = true; });

/* ---------- Service Worker ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

/* ---------- Inicialização ---------- */
loadCart();
renderMenu();
renderBar();
