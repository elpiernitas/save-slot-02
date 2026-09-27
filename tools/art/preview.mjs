// Dev helper: writes a PNG so art can be inspected quickly.
import { writeFileSync } from 'node:fs';
import { encodePng } from './png.mjs';
export function writePreview(path, canvas, scale = 1) {
  if (scale === 1) return writeFileSync(path, encodePng(canvas.w, canvas.h, canvas.data));
  const w = canvas.w * scale,
    h = canvas.h * scale;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = (Math.floor(y / scale) * canvas.w + Math.floor(x / scale)) * 4;
      out.set(canvas.data.subarray(s, s + 4), (y * w + x) * 4);
    }
  writeFileSync(path, encodePng(w, h, out));
}
