/**
 * Generates build/icon.ico with zero image dependencies:
 * rasterizes the app's starburst mark (supersampled), encodes PNGs by hand,
 * and wraps them in an ICO container (PNG-compressed entries, Vista+).
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

// ---- crc32 (for PNG chunks) ----
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

// ---- rasterizer ----
const BG = [26, 26, 25]; // charcoal #1a1a19
const FG = [217, 119, 87]; // coral #d97757

/** Signed coverage test for one sample point, in unit space [-1, 1]. */
function sampleInside(x, y) {
  // Rounded-square background bounds (radius 0.22 corners at ±0.94).
  const half = 0.94;
  const r = 0.24;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  let inBg;
  if (ax > half || ay > half) inBg = false;
  else if (ax <= half - r || ay <= half - r) inBg = true;
  else inBg = (ax - (half - r)) ** 2 + (ay - (half - r)) ** 2 <= r * r;
  if (!inBg) return 0;

  // 8-spike starburst: boundary radius oscillates between inner and outer.
  const dist = Math.hypot(x, y);
  const theta = Math.atan2(y, x);
  const spikes = 8;
  // Triangle wave: 1 at spike centers, 0 between spikes.
  const phase = ((theta * spikes) / (2 * Math.PI)) % 1;
  const tri = 1 - Math.abs(2 * ((phase + 1) % 1) - 1);
  const boundary = 0.18 + (0.68 - 0.18) * Math.pow(tri, 1.6);
  return dist <= boundary ? 2 : 1; // 2 = star, 1 = background
}

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const ss = 4; // supersampling
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bg = 0;
      let star = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const x = ((px + (sx + 0.5) / ss) / size) * 2 - 1;
          const y = ((py + (sy + 0.5) / ss) / size) * 2 - 1;
          const v = sampleInside(x, y);
          if (v >= 1) bg++;
          if (v === 2) star++;
        }
      }
      const total = ss * ss;
      const alpha = bg / total;
      const mix = star / total;
      const i = (py * size + px) * 4;
      rgba[i] = Math.round(BG[0] + (FG[0] - BG[0]) * mix);
      rgba[i + 1] = Math.round(BG[1] + (FG[1] - BG[1]) * mix);
      rgba[i + 2] = Math.round(BG[2] + (FG[2] - BG[2]) * mix);
      rgba[i + 3] = Math.round(alpha * 255);
    }
  }
  return rgba;
}

const sizes = [256, 64, 48, 32, 16];
const pngs = sizes.map((s) => encodePng(s, render(s)));

// ---- ICO container ----
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);

let offset = 6 + 16 * sizes.length;
const entries = [];
for (let i = 0; i < sizes.length; i++) {
  const e = Buffer.alloc(16);
  e[0] = sizes[i] === 256 ? 0 : sizes[i];
  e[1] = sizes[i] === 256 ? 0 : sizes[i];
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // bpp
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  entries.push(e);
}

mkdirSync("build", { recursive: true });
writeFileSync("build/icon.ico", Buffer.concat([header, ...entries, ...pngs]));
writeFileSync("build/icon-256.png", pngs[0]);
console.log(`build/icon.ico written (${sizes.join(", ")} px)`);
