// 產生擴充功能圖示（16 / 48 / 128 px）。
// 純 Node 實作，不需要任何影像套件：直接算出像素後用 zlib 編成 PNG。
// 圖案：海洋藍圓角方塊 + 白色日曆 + 打勾。
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZES = [16, 48, 128];
const OUT_DIR = path.join(__dirname, '..', 'src', 'icons');

// ---------- PNG 編碼 ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- 向量形狀（座標皆為 0~1 的比例） ----------
function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const BG = [11, 83, 148];        // 海洋藍
const HEADER = [19, 120, 200];   // 日曆上緣
const WHITE = [255, 255, 255];
const CHECK = [31, 158, 84];     // 打勾綠

function colorAt(x, y) {
  // 背景圓角方塊
  if (!inRoundedRect(x, y, 0.02, 0.02, 0.98, 0.98, 0.2)) return null;
  // 日曆本體
  const inBody = inRoundedRect(x, y, 0.18, 0.24, 0.82, 0.84, 0.08);
  if (!inBody) return BG;
  // 打勾
  const w = 0.075;
  if (
    distToSegment(x, y, 0.34, 0.58, 0.46, 0.70) < w ||
    distToSegment(x, y, 0.46, 0.70, 0.68, 0.46) < w
  ) return CHECK;
  // 上緣色帶
  if (y < 0.40) return HEADER;
  return WHITE;
}

function render(size) {
  const SS = 4; // 超取樣，讓邊緣平滑
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          const c = colorAt(x, y);
          if (c) { r += c[0]; g += c[1]; b += c[2]; a += 255; }
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      const cov = a / n;
      buf[i] = cov ? Math.round(r / (a / 255)) : 0;
      buf[i + 1] = cov ? Math.round(g / (a / 255)) : 0;
      buf[i + 2] = cov ? Math.round(b / (a / 255)) : 0;
      buf[i + 3] = Math.round(cov);
    }
  }
  return buf;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const file = path.join(OUT_DIR, `icon${size}.png`);
  fs.writeFileSync(file, encodePNG(size, render(size)));
  console.log('icon:', path.relative(process.cwd(), file));
}
