/* ============================================================
   Painel de pedidos — consulta a API e exibe os registros
   ============================================================ */
"use strict";

const $ = (sel) => document.querySelector(sel);
const brl = (v) => "R$ " + Number(v).toFixed(2).replace(".", ",");
const API_INPUT = $("#api-url");
const CONN = $("#conn-status");

function apiBase() {
  return (API_INPUT.value.trim() || localStorage.getItem("api-url") || "").replace(/\/+$/, "");
}

API_INPUT.value = localStorage.getItem("api-url") || window.API_URL || "";

/* ---------- Configuração ---------- */
$("#btn-save-api").addEventListener("click", () => {
  localStorage.setItem("api-url", apiInputValue());
  CONN.textContent = "💾 endereço salvo";
  CONN.className = "conn-status ok";
  loadOrders();
});

function apiInputValue() {
  return API_INPUT.value.trim().replace(/\/+$/, "");
}

$("#btn-test-api").addEventListener("click", async () => {
  CONN.textContent = "⏳ testando...";
  CONN.className = "conn-status loading";
  try {
    const r = await fetch(`${apiInputValue()}/api/health`);
    const j = await r.json();
    CONN.textContent = j.ok && j.db === "conectado" ? "✅ conectado ao banco!" : `⚠️ ${j.db}`;
    CONN.className = "conn-status ok";
  } catch (err) {
    CONN.textContent = `❌ falhou: ${err.message}`;
    CONN.className = "conn-status fail";
  }
});

/* ---------- Carga e exibição ---------- */
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function card(p) {
  const itens = (p.itens || []).map(i => `${i.qtd}× ${i.nome}`).join(", ");
  return `
  <article class="order-card">
    <header>
      <span class="order-code">PEDIDO #${p.codigo}</span>
      <span class="order-status">${p.status}</span>
    </header>
    <div class="order-grid">
      <div><small>Cliente</small>${p.nome || "— anonimato 😎"}</div>
      <div><small>Consumo</small>${p.modo === "retirada" ? "🏪 Retirada" : "🪑 Salão"}</div>
      <div><small>Pagamento</small>${p.pagamento}</div>
      <div><small>Data</small>${fmtDate(p.criado_em)}</div>
    </div>
    <footer>
      <span class="order-items">🍪 ${itens}</span>
      <strong>${brl(p.total)}</strong>
    </footer>
  </article>`;
}

async function loadOrders() {
  const box = $("#orders");
  if (!apiBase()) {
    box.innerHTML = `<p class="admin-empty">Configure a URL da API acima para ver os pedidos.</p>`;
    return;
  }
  box.innerHTML = `<p class="admin-empty">⏳ Carregando pedidos...</p>`;
  try {
    const r = await fetch(`${apiBase()}/api/pedidos?limit=50`);
    const j = await r.json();
    $("#stat-count").textContent = j.total;
    $("#stat-revenue").textContent = brl(j.pedidos.reduce((s, p) => s + Number(p.total), 0));
    $("#stat-last").textContent = j.pedidos[0] ? fmtDate(j.pedidos[0].criado_em) : "—";
    box.innerHTML = j.pedidos.length ? j.pedidos.map(card).join("")
      : `<p class="admin-empty">Nenhum pedido ainda — faça o primeiro no totem! 🍪</p>`;
  } catch (err) {
    box.innerHTML = `<p class="admin-empty">❌ Não foi possível carregar: ${err.message}</p>`;
  }
}

$("#btn-refresh").addEventListener("click", loadOrders);
setInterval(loadOrders, 20000); // atualiza a cada 20 s
loadOrders();
