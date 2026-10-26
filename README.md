# 🍪 Cookies & Cia. — Totem de Vendas (PWA)

Totem de autoatendimento para venda de cookies artesanais, com **interface retrô/vintage**, **mobile-first** e instalável como aplicativo (PWA) — funciona até **offline**.

## ✨ Funcionalidades

- **Cardápio ilustrado** com filtros por categoria (Clássicos, Especiais, Doces do Brasil, Bebidas)
- **Sacola** em formato *bottom sheet*, com controle de quantidade e subtotal em tempo real
- **Checkout** com escolha de consumo (retirada no balcão / salão) e pagamento (Dinheiro, Cartão, Pix)
- **Bilhete de pedido** no estilo recibo antigo, com carimbo "PAGO" e código de barras
- **Efeitos retrô**: toldo listrado, letreiro correndo, som de "blip" e vibração no toque
- **PWA completo**: instalável na tela de início, service worker com cache offline
- Sacola **persistente** (localStorage) e botão de **instalação** automático

## 📁 Estrutura

```
projeto/
├── index.html            # Página única do totem (SPA)
├── admin.html            # Painel de pedidos (consulta o banco)
├── css/styles.css        # Estilos retrô mobile-first
├── js/app.js             # Cardápio, sacola, checkout, bilhete
├── js/admin.js           # Painel: lista e estatísticas dos pedidos
├── js/config.js          # URL da API (ou defina no painel admin)
├── manifest.json         # Manifest do PWA
├── sw.js                 # Service worker (cache offline)
├── backend/
│   ├── server.js         # API REST (Express + pg): POST/GET /api/pedidos
│   └── package.json      # Dependências do backend
├── icons/                # Ícones gerados (192, 512, maskable)
├── tools/make-icons.js   # Gerador de ícones (Node puro, sem dependências)
└── render.yaml           # Blueprint do Render: site + API + PostgreSQL
```

## 🗄️ Banco de dados (PostgreSQL no Render)

O Blueprint do Render cria automaticamente os **3 recursos**:

| Recurso | Tipo | Papel |
|---------|------|-------|
| `cookies-cia-totem` | Static Site | PWA (frontend) |
| `cookies-cia-api` | Web Service Node | API REST que grava os pedidos |
| `cookies-db` | PostgreSQL (free) | Tabela `pedidos` (código, nome, modo, pagamento, total, itens, data) |

Fluxo: o totem envia cada pedido via `POST /api/pedidos` → a API grava no banco → o **painel admin** (`/admin.html`) lista os pedidos e mostra faturamento. Se a API estiver fora, o totem avisa no bilhete e o pedido continua válido em modo offline.

> ⚠️ O plano **free** do PostgreSQL do Render expira em ~30 dias — basta recriar o banco (os dados voltam a zerar).

## ▶️ Como rodar

O service worker exige um servidor (funciona em `localhost` ou HTTPS):

```bash
# Frontend + painel admin
python3 -m http.server 8080          # http://localhost:8080

# Backend (precisa de DATABASE_URL apontando para um Postgres)
cd backend && npm install && npm start   # http://localhost:3000/api/health
```

Depois acesse **http://localhost:8080** no navegador (de preferência no celular ou no modo responsivo do DevTools — F12 → 📱).

Para testar o modo offline: DevTools → *Application* → *Service Workers* → marque *Offline* e recarregue.

### Publicando no Render

1. Suba este repositório no GitHub
2. No Render: **New + → Blueprint** → selecione o repositório → o `render.yaml` cria site, API e banco
3. Copie a URL da API (`https://cookies-cia-api.onrender.com`)
4. Abra `/admin.html` no site publicado, cole a URL e clique em **💾 Salvar** (fica no localStorage)
5. Pronto: cada pedido do totem aparece no painel 🎉

## 🎨 Paleta e tipografia

| Cor      | Uso                        |
|----------|----------------------------|
| `#f7ecd7`| Creme de fundo             |
| `#5a3216`| Marrom (títulos/estrutura) |
| `#c9803e`| Caramelo (cookie)          |
| `#e0a63c`| Mostarda (preços/tags)     |
| `#2f6f6a`| Verde-petróleo (detalhes)  |
| `#b4472f`| Vermelho-tomate (CTAs)     |

Fontes: **Alfa Slab One** (display) + **Courier Prime** (texto, ar de recibo).

## 🔧 Regenerar ícones

```bash
node tools/make-icons.js
```
