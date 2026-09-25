// Minimal PNG encoder (RGBA, 8-bit, no interlace) using Node's zlib.
import { deflateSync, inflateSync } from 'node:zlib';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** @param {number} width @param {number} height @param {Uint8ClampedArray|Uint8Array} rgba */
export function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(
      raw,
      y * (width * 4 + 1) + 1,
    );
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Reads width/height from a PNG header (for tests). */
export function pngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Undoes the per-row filters of one (sub)image; returns the raw scanlines. */
function unfilter(data, offset, width, height, bpp, bitsPerPixel) {
  const stride = Math.ceil((width * bitsPerPixel) / 8);
  const out = new Uint8Array(stride * height);
  let pos = offset;
  for (let y = 0; y < height; y++) {
    const type = data[pos++];
    const row = y * stride;
    const prev = row - stride;
    for (let x = 0; x < stride; x++) {
      const raw = data[pos++];
      const a = x >= bpp ? out[row + x - bpp] : 0;
      const b = y > 0 ? out[prev + x] : 0;
      const c = y > 0 && x >= bpp ? out[prev + x - bpp] : 0;
      let v;
      if (type === 0) v = raw;
      else if (type === 1) v = raw + a;
      else if (type === 2) v = raw + b;
      else if (type === 3) v = raw + ((a + b) >> 1);
      else if (type === 4) v = raw + paeth(a, b, c);
      else throw new Error(`decodePng: bad filter type ${type}`);
      out[row + x] = v & 255;
    }
  }
  return { rows: out, stride, next: pos };
}

/**
 * Decodes any standard PNG (greyscale, RGB, palette, grey+alpha, RGBA;
 * 1/2/4/8/16-bit; filters 0–4; tRNS; Adam7) to 8-bit RGBA.
 * External art (e.g. exported by other tools) must pass through this.
 */
export function decodePng(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error('decodePng: not a PNG');
  let offset = 8;
  let ihdr = null;
  let palette = null;
  let trns = null;
  let ended = false;
  const parts = [];
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const body = buf.subarray(offset + 8, offset + 8 + length);
    if (body.length !== length) throw new Error(`decodePng: truncated ${type} chunk`);
    if (type === 'IHDR') {
      ihdr = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        depth: body[8],
        colorType: body[9],
        interlace: body[12],
      };
    } else if (type === 'PLTE') palette = body;
    else if (type === 'tRNS') trns = body;
    else if (type === 'IDAT') parts.push(body);
    else if (type === 'IEND') {
      ended = true;
      break;
    }
    offset += length + 12;
  }
  if (!ihdr) throw new Error('decodePng: missing IHDR');
  if (!ended) throw new Error('decodePng: missing IEND (file truncated?)');
  const { width, height, depth, colorType, interlace } = ihdr;
  const channels = CHANNELS[colorType];
  if (!channels) throw new Error(`decodePng: unsupported colour type ${colorType}`);
  if (colorType === 3 && !palette) throw new Error('decodePng: palette image without PLTE');
  const bitsPerPixel = channels * depth;
  const bpp = Math.max(1, bitsPerPixel >> 3);
  const data = inflateSync(Buffer.concat(parts));
  const rgba = new Uint8Array(width * height * 4);
  const maxv = (1 << depth) - 1;

  const sample = (rows, stride, x, y, ch) => {
    const row = y * stride;
    if (depth === 8) return rows[row + x * channels + ch];
    if (depth === 16) return rows[row + (x * channels + ch) * 2]; // high byte
    const bit = (x * channels + ch) * depth;
    return (rows[row + (bit >> 3)] >> (8 - depth - (bit & 7))) & maxv;
  };
  const scale = (v) => (depth >= 8 ? v : Math.round((v * 255) / maxv));

  const put = (rows, stride, sx, sy, dx, dy) => {
    const o = (dy * width + dx) * 4;
    if (colorType === 3) {
      const idx = sample(rows, stride, sx, sy, 0);
      rgba[o] = palette[idx * 3];
      rgba[o + 1] = palette[idx * 3 + 1];
      rgba[o + 2] = palette[idx * 3 + 2];
      rgba[o + 3] = trns && idx < trns.length ? trns[idx] : 255;
      return;
    }
    if (colorType === 0 || colorType === 4) {
      const raw = sample(rows, stride, sx, sy, 0);
      const g = scale(raw);
      rgba[o] = rgba[o + 1] = rgba[o + 2] = g;
      if (colorType === 4) rgba[o + 3] = scale(sample(rows, stride, sx, sy, 1));
      else {
        const key = trns ? trns.readUInt16BE(0) : -1;
        const full = depth === 16 ? (raw << 8) | rows[sy * stride + sx * 2 + 1] : raw;
        rgba[o + 3] = full === key ? 0 : 255;
      }
      return;
    }
    const r = sample(rows, stride, sx, sy, 0);
    const g = sample(rows, stride, sx, sy, 1);
    const b = sample(rows, stride, sx, sy, 2);
    rgba[o] = r;
    rgba[o + 1] = g;
    rgba[o + 2] = b;
    if (colorType === 6) rgba[o + 3] = sample(rows, stride, sx, sy, 3);
    else if (trns && depth === 8) {
      rgba[o + 3] =
        r === trns.readUInt16BE(0) && g === trns.readUInt16BE(2) && b === trns.readUInt16BE(4)
          ? 0
          : 255;
    } else rgba[o + 3] = 255;
  };

  if (interlace === 0) {
    const { rows, stride } = unfilter(data, 0, width, height, bpp, bitsPerPixel);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) put(rows, stride, x, y, x, y);
  } else {
    // Adam7
    const passes = [
      [0, 0, 8, 8],
      [4, 0, 8, 8],
      [0, 4, 4, 8],
      [2, 0, 4, 4],
      [0, 2, 2, 4],
      [1, 0, 2, 2],
      [0, 1, 1, 2],
    ];
    let pos = 0;
    for (const [x0, y0, dx, dy] of passes) {
      const pw = Math.ceil((width - x0) / dx);
      const ph = Math.ceil((height - y0) / dy);
      if (pw <= 0 || ph <= 0) continue;
      const { rows, stride, next } = unfilter(data, pos, pw, ph, bpp, bitsPerPixel);
      pos = next;
      for (let y = 0; y < ph; y++) {
        for (let x = 0; x < pw; x++) put(rows, stride, x, y, x0 + x * dx, y0 + y * dy);
      }
    }
  }
  const hasAlpha = colorType === 4 || colorType === 6 || trns !== null;
  return { width, height, rgba, colorType, depth, hasAlpha };
}
