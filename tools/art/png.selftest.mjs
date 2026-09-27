// Self-test for the PNG decoder used by `npm run art:check`.
// Builds PNGs of every colour type / bit depth / filter / interlace mode and
// checks that decodePng returns the expected RGBA. Runs in plain Node.
import { deflateSync } from 'node:zlib';
import { decodePng, encodePng } from './png.mjs';

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

/** Packs one pixel's samples into a scanline buffer. */
function packRow(samples, width, channels, depth) {
  const bits = width * channels * depth;
  const row = Buffer.alloc(Math.ceil(bits / 8));
  let bit = 0;
  for (const v of samples) {
    if (depth === 16) {
      row.writeUInt16BE(v, bit >> 3);
    } else if (depth === 8) {
      row[bit >> 3] = v;
    } else {
      row[bit >> 3] |= v << (8 - depth - (bit & 7));
    }
    bit += depth;
  }
  return row;
}

function filterRows(rows, bpp, filter) {
  const out = [];
  let prev = Buffer.alloc(rows[0]?.length ?? 0);
  rows.forEach((row, y) => {
    const type = filter === 'mixed' ? y % 5 : filter;
    const f = Buffer.alloc(row.length + 1);
    f[0] = type;
    for (let x = 0; x < row.length; x++) {
      const a = x >= bpp ? row[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let p = 0;
      if (type === 1) p = a;
      else if (type === 2) p = b;
      else if (type === 3) p = (a + b) >> 1;
      else if (type === 4) {
        const q = a + b - c;
        const pa = Math.abs(q - a);
        const pb = Math.abs(q - b);
        const pc = Math.abs(q - c);
        p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      f[x + 1] = (row[x] - p) & 255;
    }
    out.push(f);
    prev = row;
  });
  return out;
}

/** samplesAt(x, y) → array of raw samples for that pixel. */
function buildPng({
  width,
  height,
  colorType,
  depth,
  samplesAt,
  interlace = 0,
  filter = 'mixed',
  plte,
  trns,
}) {
  const channels = CHANNELS[colorType];
  const bpp = Math.max(1, (channels * depth) >> 3);
  const image = (x0, y0, dx, dy) => {
    const pw = Math.ceil((width - x0) / dx);
    const ph = Math.ceil((height - y0) / dy);
    if (pw <= 0 || ph <= 0) return [];
    const rows = [];
    for (let y = 0; y < ph; y++) {
      const samples = [];
      for (let x = 0; x < pw; x++) samples.push(...samplesAt(x0 + x * dx, y0 + y * dy));
      rows.push(packRow(samples, pw, channels, depth));
    }
    return filterRows(rows, bpp, filter);
  };
  const passes = interlace
    ? [
        [0, 0, 8, 8],
        [4, 0, 8, 8],
        [0, 4, 4, 8],
        [2, 0, 4, 4],
        [0, 2, 2, 4],
        [1, 0, 2, 2],
        [0, 1, 1, 2],
      ]
    : [[0, 0, 1, 1]];
  const raw = Buffer.concat(passes.flatMap((p) => image(...p)));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = depth;
  ihdr[9] = colorType;
  ihdr[12] = interlace;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    ...(plte ? [chunk('PLTE', plte)] : []),
    ...(trns ? [chunk('tRNS', trns)] : []),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

let failures = 0;
function expectPixels(name, png, width, height, rgbaAt) {
  try {
    const out = decodePng(png);
    if (out.width !== width || out.height !== height)
      throw new Error(`size ${out.width}×${out.height}`);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const want = rgbaAt(x, y);
        const i = (y * width + x) * 4;
        const got = [...out.rgba.subarray(i, i + 4)];
        if (got.some((v, k) => v !== want[k])) {
          throw new Error(`pixel ${x},${y}: got ${got} want ${want}`);
        }
      }
    }
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

const W = 13; // odd sizes exercise partial bytes and Adam7 edge passes
const H = 11;
const v8 = (x, y, k) => (x * 37 + y * 91 + k * 53) & 255;

for (const interlace of [0, 1]) {
  for (const filter of [0, 1, 2, 3, 4, 'mixed']) {
    const tag = `i${interlace}/f${filter}`;
    expectPixels(
      `RGBA8 ${tag}`,
      buildPng({
        width: W,
        height: H,
        colorType: 6,
        depth: 8,
        interlace,
        filter,
        samplesAt: (x, y) => [0, 1, 2, 3].map((k) => v8(x, y, k)),
      }),
      W,
      H,
      (x, y) => [0, 1, 2, 3].map((k) => v8(x, y, k)),
    );
    expectPixels(
      `RGB8 ${tag}`,
      buildPng({
        width: W,
        height: H,
        colorType: 2,
        depth: 8,
        interlace,
        filter,
        samplesAt: (x, y) => [0, 1, 2].map((k) => v8(x, y, k)),
      }),
      W,
      H,
      (x, y) => [...[0, 1, 2].map((k) => v8(x, y, k)), 255],
    );
  }
  const tag = `i${interlace}`;
  // 16-bit RGBA: decoder keeps the high byte
  expectPixels(
    `RGBA16 ${tag}`,
    buildPng({
      width: W,
      height: H,
      colorType: 6,
      depth: 16,
      interlace,
      samplesAt: (x, y) => [0, 1, 2, 3].map((k) => (v8(x, y, k) << 8) | 0x7f),
    }),
    W,
    H,
    (x, y) => [0, 1, 2, 3].map((k) => v8(x, y, k)),
  );
  // grey + alpha
  expectPixels(
    `GA8 ${tag}`,
    buildPng({
      width: W,
      height: H,
      colorType: 4,
      depth: 8,
      interlace,
      samplesAt: (x, y) => [v8(x, y, 0), v8(x, y, 1)],
    }),
    W,
    H,
    (x, y) => [v8(x, y, 0), v8(x, y, 0), v8(x, y, 0), v8(x, y, 1)],
  );
  // low bit-depth greyscale
  for (const depth of [1, 2, 4]) {
    const max = (1 << depth) - 1;
    expectPixels(
      `G${depth} ${tag}`,
      buildPng({
        width: W,
        height: H,
        colorType: 0,
        depth,
        interlace,
        samplesAt: (x, y) => [(x + y) % (max + 1)],
      }),
      W,
      H,
      (x, y) => {
        const g = Math.round((((x + y) % (max + 1)) * 255) / max);
        return [g, g, g, 255];
      },
    );
  }
  // palette with tRNS (4-bit indices)
  const plte = Buffer.from(
    Array.from({ length: 16 }, (_, i) => [i * 16, 255 - i * 16, (i * 40) & 255]).flat(),
  );
  const trns = Buffer.from([0, 128]); // index 0 transparent, 1 half, rest opaque
  expectPixels(
    `P4+tRNS ${tag}`,
    buildPng({
      width: W,
      height: H,
      colorType: 3,
      depth: 4,
      interlace,
      plte,
      trns,
      samplesAt: (x, y) => [(x * 3 + y) % 16],
    }),
    W,
    H,
    (x, y) => {
      const i = (x * 3 + y) % 16;
      return [i * 16, 255 - i * 16, (i * 40) & 255, i === 0 ? 0 : i === 1 ? 128 : 255];
    },
  );
}

// Round-trip with our own encoder, and truncation detection.
const own = encodePng(
  3,
  2,
  new Uint8Array(24).map((_, i) => i * 10),
);
expectPixels('own encoder', own, 3, 2, (x, y) =>
  [0, 1, 2, 3].map((k) => ((y * 3 + x) * 4 + k) * 10),
);
try {
  decodePng(own.subarray(0, own.length - 20));
  failures++;
  console.error('FAIL truncated file was accepted');
} catch {
  // expected: truncated PNGs must be rejected loudly
}

if (failures) {
  console.error(`png selftest: ${failures} failure(s)`);
  process.exit(1);
}
console.log('png selftest: all colour types, depths, filters and interlace modes decode correctly');
