"""RC-FIX-03: minimal patch of the "LA M_URALLA" defect baked into ENV-001.

ENV-001 (background.png, 960×400) is the same framing as the pack's
01_PRIMARY_CANON/01_LA_MURALLA_MASTER_CINEMATIC at scale 0.487, offset
(-10, +1) (found by minimising the mean pixel difference over the sign).
Only the 40×25 box around the broken M is replaced by the canon's pixels,
colour-matched to a ring around the box and feathered by ~1 px. Nothing else
in the background changes.

usage: python3 tools/art/patch_env_sign.py /path/to/SAVE_SLOT_02_CHATGPT_VISUAL_MASTER_PACK
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

PACK = Path(sys.argv[1])
BG = Path(__file__).resolve().parents[2] / 'src/assets/world/muralla/background.png'
SCALE, DX, DY = 0.487, -10, 1
BOX = (453, 52, 493, 77)  # x0, y0, x1, y1 in ENV-001 pixels

env = Image.open(BG).convert('RGBA')
cin = Image.open(PACK / '01_PRIMARY_CANON/01_LA_MURALLA_MASTER_CINEMATIC.png').convert('RGB')
cin = cin.resize((round(cin.width * SCALE), round(cin.height * SCALE)), Image.LANCZOS)
aligned = np.array(cin.crop((DX, DY, DX + env.width, DY + env.height))).astype(float)

rgba = np.array(env)
rgb = rgba[:, :, :3].astype(float)
x0, y0, x1, y1 = BOX
ring = np.zeros(rgb.shape[:2], bool)
ring[y0 - 4 : y1 + 4, x0 - 6 : x1 + 6] = True
ring[y0:y1, x0:x1] = False
gain = (rgb[ring].mean(0) + 1) / (aligned[ring].mean(0) + 1)
patch = np.clip(aligned * gain, 0, 255)

mask = np.zeros(rgb.shape[:2], 'uint8')
mask[y0:y1, x0:x1] = 255
m = np.array(Image.fromarray(mask).filter(ImageFilter.GaussianBlur(1.2))).astype(float)[..., None] / 255
rgba[:, :, :3] = (rgb * (1 - m) + patch * m).round().astype('uint8')
Image.fromarray(rgba).save(BG, optimize=True)
print('patched', BG)
