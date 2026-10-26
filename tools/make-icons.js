/**
 * Gerador de ícones PNG do PWA (sem dependências externas).
 * Desenha um cookie pixel a pixel em um buffer RGBA e codifica PNG manualmente.
 * Uso: node tools/make-icons.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

/* ---------- Codificador PNG ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // profundidade
  ihdr[9] = 6;   // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtro: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------- Desenho ---------- */
function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function blend(dst, src, a) {
  return [
    Math.round(dst[0] * (1 - a) + src[0] * a),
    Math.round(dst[1] * (1 - a) + src[1] * a),
    Math.round(dst[2] * (1 - a) + src[2] * a),
  ];
}

function drawIcon(size, maskable) {
  const buf = Buffer.alloc(size * size * 4);
  const W = size;
  const put = (x, y, rgb, a = 1) => {
    const i = (y * W + x) * 4;
    const prev = [buf[i], buf[i + 1], buf[i + 2]];
    const out = blend(prev, rgb, a);
    buf[i] = out[0]; buf[i + 1] = out[1]; buf[i + 2] = out[2];
    buf[i + 3] = Math.max(buf[i + 3], Math.round(a * 255));
  };
  const disc = (cx, cy, r, rgb) => {
    for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++)
      for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) {
        if (x < 0 || y < 0 || x >= W || y >= W) continue;
        const d = Math.hypot(x + .5 - cx, y + .5 - cy);
        const a = Math.max(0, Math.min(1, r - d + 1));
        if (a > 0) put(x, y, rgb, a);
      }
  };
  const ring = (cx, cy, r, w, rgb, angleFilter = null) => {
    for (let y = Math.floor(cy - r - w - 2); y <= cy + r + w + 2; y++)
      for (let x = Math.floor(cx - r - w - 2); x <= cx + r + w + 2; x++) {
        if (x < 0 || y < 0 || x >= W || y >= W) continue;
        const d = Math.hypot(x + .5 - cx, y + .5 - cy);
        if (d <= r + w / 2 && d >= r - w / 2) {
          if (angleFilter && !angleFilter(x + .5 - cx, y + .5 - cy)) continue;
          put(x, y, rgb);
        }
      }
  };

  const cream = hex("#f7ecd7"), base = hex("#c9803e"), dark = hex("#4a2c17"),
        edge = hex("#a05f27"), shine = hex("#f0c58a"), choco = hex("#3d2314");

  // fundo
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) put(x, y, cream);

  const cx = W / 2, cy = W / 2;
  const R = maskable ? W * 0.30 : W * 0.36;

  // sombra
  disc(cx, cy + W * 0.03, R, [190, 150, 100]);
  // corpo do cookie
  disc(cx, cy, R, base);
  ring(cx, cy, R - W * 0.012, W * 0.012, edge);
  // brilho: arco curto no quadrante superior esquerdo, dentro do cookie
  ring(cx, cy, R * 0.82, W * 0.022, shine,
    (dx, dy) => dx < -R * 0.15 && dy < -R * 0.15);

  // gotas de chocolate (dentro do disco, evitando a borda)
  const chips = [
    [-.38, -.38, .075], [.3, -.46, .06], [.44, .18, .07], [-.3, .32, .06],
    [.02, -.05, .05], [.08, .5, .06], [-.52, .02, .05], [.42, -.22, .045],
    [-.12, .55, .05],
  ];
  chips.forEach(([dx, dy, r]) => disc(cx + dx * R, cy + dy * R, r * W * 0.5, dark));
  // contorno escuro externo (fininho)
  ring(cx, cy, R, W * 0.008, choco);

  return encodePNG(W, W, buf);
}

const outDir = path.join(__dirname, "..", "icons");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "icon-192.png"), drawIcon(192, false));
fs.writeFileSync(path.join(outDir, "icon-512.png"), drawIcon(512, false));
fs.writeFileSync(path.join(outDir, "maskable-512.png"), drawIcon(512, true));
console.log("Ícones gerados em", outDir);
