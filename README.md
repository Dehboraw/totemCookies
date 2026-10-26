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
├── index.html            # Página única (SPA)
├── css/styles.css        # Estilos retrô mobile-first
├── js/app.js             # Cardápio, sacola, checkout, bilhete
├── manifest.json         # Manifest do PWA
├── sw.js                 # Service worker (cache offline)
├── icons/                # Ícones gerados (192, 512, maskable)
└── tools/make-icons.js   # Gerador de ícones (Node puro, sem dependências)
```

## ▶️ Como rodar

O service worker exige um servidor (funciona em `localhost` ou HTTPS):

```bash
# Opção 1 — Python
python3 -m http.server 8080

# Opção 2 — Node
npx serve .
```

Depois acesse **http://localhost:8080** no navegador (de preferência no celular ou no modo responsivo do DevTools — F12 → 📱).

Para testar o modo offline: DevTools → *Application* → *Service Workers* → marque *Offline* e recarregue.

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
