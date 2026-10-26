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
