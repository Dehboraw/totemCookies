/* ============================================================
   Cookies & Cia. — API de pedidos (Express + PostgreSQL)
   Endpoints:
     GET  /api/health          → status da API e do banco
     POST /api/pedidos         → registra um pedido
     GET  /api/pedidos         → lista os pedidos (?limit=100)
     GET  /api/pedidos/:codigo → busca um pedido pelo código
   ============================================================ */
"use strict";

const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

/* CORS liberado: o PWA (site estático) vive em outro domínio */
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* ---------- Conexão com o PostgreSQL ---------- */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // exigido pelo Render
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id         SERIAL PRIMARY KEY,
      codigo     TEXT NOT NULL,
      nome       TEXT,
      modo       TEXT NOT NULL,
      pagamento  TEXT NOT NULL,
      total      NUMERIC(10,2) NOT NULL,
      itens      JSONB NOT NULL,
      status     TEXT NOT NULL DEFAULT 'recebido',
      criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

/* ---------- Endpoints ---------- */
app.get("/", (req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cookies &amp; Cia. · API</title><style>
body{font-family:monospace;background:#f7ecd7;color:#2b1a0e;max-width:560px;margin:40px auto;padding:0 16px}
h1{color:#5a3216}small{color:#b4472f;letter-spacing:2px;text-transform:uppercase}
li{margin:8px 0}code{background:#fdf6e3;border:1px solid #d9c39a;padding:2px 6px;border-radius:4px}
</style></head><body>
<small>Cookies &amp; Cia. · desde 1985</small>
<h1>⚙️ API de pedidos</h1>
<p>Esta é a API do totem — não tem página aqui na raiz. Endpoints disponíveis:</p>
<ul>
<li><code>GET /api/health</code> — status da API e do banco</li>
<li><code>POST /api/pedidos</code> — registra um pedido</li>
<li><code>GET /api/pedidos</code> — lista os pedidos</li>
<li><code>GET /api/pedidos/:codigo</code> — busca pelo código</li>
</ul>
<p>🍪 O site do totem fica em outro endereço (site estático).</p>
</body></html>`);
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "conectado" });
  } catch (err) {
    res.status(503).json({ ok: false, db: "indisponível", erro: err.message });
  }
});

app.post("/api/pedidos", async (req, res) => {
  const { codigo, nome, modo, pagamento, total, itens } = req.body || {};

  if (!codigo || !modo || !pagamento || !total || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: "Campos obrigatórios: codigo, modo, pagamento, total, itens[]" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO pedidos (codigo, nome, modo, pagamento, total, itens)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [codigo, nome || null, modo, pagamento, total, JSON.stringify(itens)]
    );
    res.status(201).json({ ok: true, pedido: rows[0] });
  } catch (err) {
    console.error("Erro ao inserir pedido:", err);
    res.status(500).json({ erro: "Falha ao registrar o pedido" });
  }
});

app.get("/api/pedidos", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
  try {
    const { rows } = await pool.query(
      `SELECT * FROM pedidos ORDER BY criado_em DESC LIMIT $1`,
      [limit]
    );
    res.json({ total: rows.length, pedidos: rows });
  } catch (err) {
    console.error("Erro ao listar pedidos:", err);
    res.status(500).json({ erro: "Falha ao listar pedidos" });
  }
});

app.get("/api/pedidos/:codigo", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM pedidos WHERE codigo = $1`,
      [req.params.codigo]
    );
    if (rows.length === 0) return res.status(404).json({ erro: "Pedido não encontrado" });
    res.json({ pedido: rows[0] });
  } catch (err) {
    console.error("Erro ao buscar pedido:", err);
    res.status(500).json({ erro: "Falha na consulta" });
  }
});

/* ---------- Inicialização ---------- */
const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ API no ar na porta ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Falha ao preparar o banco:", err.message);
    /* Mesmo sem banco, a API sobe para o health check indicar o problema */
    app.listen(PORT, () => console.log(`⚠️ API no ar, mas SEM banco (porta ${PORT})`));
  });
