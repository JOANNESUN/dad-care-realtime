// Renders the home-screen icons as PNGs. No image library is available on this
// machine, so the mark is drawn from its geometry and the PNG is assembled with
// zlib. Coordinates below are in a 1280x1280 design space and scaled to size.
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const BG = [0x21, 0x70, 0xf5];
const FG = [255, 255, 255];

const D = 1280;                 // design-space size
// Home-screen icons are masked by the OS (iOS squircle, Android maskable), so
// the art is drawn full-bleed and the mark is pulled in to survive the crop.
const MARK = 0.94;

const circles = [{ x: 424, y: 484, r: 158 }];

// Thick round-capped strokes, given as point chains plus a width.
const strokes = [
  { pts: [[735, 428], [832, 600], [1035, 268]], w: 118 },   // the check
  { pts: quad([248, 842], [640, 872], [1040, 842]), w: 200 },   // the mouth
];

// Three points -> a smooth quadratic arc. Joining two straight segments left a
// visible kink at the midpoint of the mouth at icon sizes.
function quad(a, mid, b) {
  const cx = 2 * mid[0] - (a[0] + b[0]) / 2;
  const cy = 2 * mid[1] - (a[1] + b[1]) / 2;
  const out = [];
  const STEPS = 24;
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS, u = 1 - t;
    out.push([
      u * u * a[0] + 2 * u * t * cx + t * t * b[0],
      u * u * a[1] + 2 * u * t * cy + t * t * b[1],
    ]);
  }
  return out;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// A chain of points is drawn as overlapping capsules, which gives round caps
// and round joins for free.
function inStroke(px, py, stroke) {
  const half = stroke.w / 2;
  for (let i = 0; i < stroke.pts.length - 1; i++) {
    const [ax, ay] = stroke.pts[i];
    const [bx, by] = stroke.pts[i + 1];
    if (distToSegment(px, py, ax, ay, bx, by) <= half) return true;
  }
  return false;
}

function inMark(px, py) {
  for (const c of circles) {
    if (Math.hypot(px - c.x, py - c.y) <= c.r) return true;
  }
  for (const s of strokes) {
    if (inStroke(px, py, s)) return true;
  }
  return false;
}

function render(size) {
  const SS = 4; // supersample factor, for edges that are not jagged
  const px = Buffer.alloc(size * size * 3);

  for (let py = 0; py < size; py++) {
    for (let pxi = 0; pxi < size; pxi++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          // Pixel centre -> design space, about the middle, shrunk by MARK.
          const dx = ((pxi + (sx + 0.5) / SS) / size - 0.5) * D / MARK + D / 2;
          const dy = ((py + (sy + 0.5) / SS) / size - 0.5) * D / MARK + D / 2;
          if (inMark(dx, dy)) hits++;
        }
      }
      const a = hits / (SS * SS);
      const o = (py * size + pxi) * 3;
      for (let c = 0; c < 3; c++) {
        px[o + c] = Math.round(BG[c] * (1 - a) + FG[c] * a);
      }
    }
  }
  return px;
}

function png(size, rgb) {
  const raw = Buffer.alloc(size * (size * 3 + 1)); // scanlines, filter byte 0
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    rgb.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

let TABLE = null;
function crc32(buf) {
  if (!TABLE) {
    TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABLE[n] = c;
    }
  }
  let c = -1;
  for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
for (const [name, size] of [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
]) {
  fs.writeFileSync(path.join(out, name), png(size, render(size)));
  console.log("wrote", name, size);
}
