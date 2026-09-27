"""RC-FIX-04: splits the flattened ENV-001 into the La Muralla layer contract.

    ENV        architecture, ground, light, interiors  -> background.png
    WORLD      terrace (diners, tables, chairs, umbrellas, waitress),
               planters, tree trunk, bench + reader + bike, pedestrians,
               and the occ* furniture                    -> world*.png, occ*.png
    FOREGROUND (FG-001) canopy leaves and the out-of-focus near bushes
                                                         -> foreground.png

Every pixel of ENV-001 belongs to exactly one layer (binary masks), so
ENV + WORLD + FG composited at their original positions reproduce ENV-001
pixel for pixel. Nothing is drawn: each layer is a mask over ChatGPT's pixels.
Where WORLD/FG pixels leave ENV, the hole is filled by a smooth average
of the surrounding ENV pixels; it is never visible at runtime (the layer is
always drawn on top) and only avoids a transparent hole in the ENV file.

Also writes murallaFull.png (the flattened image) for CITY CARDS and the
DESYNC night backdrop, which show La Muralla as a picture, not a scene.

Order: patch_env_sign.py -> node tools/art/occluders.mjs -> this script.
usage: python3 tools/art/layers.py   (needs Pillow + numpy; outputs committed)
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'tools/art/source/env-001-full.png'
DIR = ROOT / 'src/assets/world/muralla'
MANIFEST = DIR / 'manifest.json'
OCC = ROOT / 'src/game/world/maps/muralla.occluders.json'
PLACEMENTS = ROOT / 'src/game/world/maps/muralla.world.json'

# WORLD pieces: outline (world px, traced on ENV-001) + depth-sort baseline.
WORLD = [
    {
        # Diners, tables, chairs, umbrellas (canopies + poles), waitress and
        # the planter by the steps. PLAYER 1 never stands above y=297.
        'id': 'worldTerrace',
        'baseY': 297,
        'outlines': [
            [(260, 176), (260, 170), (365, 134), (372, 134), (459, 168), (459, 177)],
            [(508, 178), (508, 172), (595, 141), (601, 141), (687, 172), (687, 179)],
            [(362, 176), (369, 176), (369, 200), (362, 200)],
            [(594, 178), (601, 178), (601, 200), (594, 200)],
            [
                (226, 236), (232, 205), (265, 200), (300, 198), (330, 203), (365, 198),
                (462, 198), (478, 180), (484, 169), (500, 167), (508, 180), (512, 195),
                (530, 195), (640, 198), (655, 183), (670, 177), (690, 182), (700, 176),
                (730, 178), (738, 200), (740, 250), (722, 252), (722, 298), (220, 298),
                (222, 250),
            ],
        ],
    },
    {
        'id': 'worldPlanters',
        'baseY': 252,
        'outlines': [[(146, 253), (145, 200), (160, 171), (185, 159), (215, 164), (240, 169), (258, 185), (258, 253)]],
    },
    {
        'id': 'worldTree',
        'baseY': 250,
        'outlines': [[(22, 252), (28, 200), (24, 125), (70, 112), (118, 118), (110, 190), (104, 252)]],
    },
    {
        # Bench with the reader and the parked bike.
        'id': 'worldBench',
        'baseY': 332,
        'outlines': [
            [
                (728, 336), (727, 262), (742, 256), (792, 254), (800, 214), (815, 204),
                (836, 209), (846, 243), (862, 238), (892, 244), (936, 258), (947, 285),
                (946, 338),
            ]
        ],
    },
    {
        'id': 'worldWalkerWest',
        'baseY': 240,
        'outlines': [[(8, 241), (10, 160), (25, 149), (49, 157), (53, 241)]],
    },
    {
        'id': 'worldWalkersEast',
        'baseY': 240,
        'outlines': [
            [(842, 249), (848, 159), (862, 151), (881, 159), (896, 190), (891, 249)],
            [(909, 251), (915, 169), (930, 159), (949, 169), (953, 251)],
        ],
    },
]

# FG-001: foliage nearest to the camera. PLAYER 1 can walk into the bottom
# bushes' edge (their leaves then cover his feet, as the depth implies).
FOREGROUND = [
    # Tree canopy (above any head PLAYER 1 can reach) and the top-right leaves.
    [(0, 0), (345, 0), (345, 44), (300, 62), (262, 56), (232, 40), (214, 47), (180, 44), (168, 70), (140, 90), (120, 116), (70, 110), (0, 124)],
    [(868, 0), (960, 0), (960, 96), (930, 80), (900, 42), (872, 20)],
    # Out-of-focus bushes, bottom left and right.
    [
        (0, 232), (40, 244), (80, 268), (110, 289), (140, 304), (180, 317), (210, 324),
        (260, 330), (300, 335), (330, 345), (360, 360), (390, 380), (410, 400), (0, 400),
    ],
    [(960, 228), (947, 250), (949, 285), (947, 339), (900, 346), (880, 342), (860, 352), (830, 364), (800, 382), (790, 400), (960, 400)],
]


def poly_mask(outlines, size):
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    for o in outlines:
        d.polygon(o, fill=255)
    return np.array(m) > 0


def box_blur(a, r):
    """Float box blur of radius r along both axes (edge-clamped)."""
    for axis in (0, 1):
        n = a.shape[axis]
        pad = [(0, 0)] * a.ndim
        pad[axis] = (r + 1, r)
        c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis)
        hi = np.take(c, np.arange(2 * r + 1, n + 2 * r + 1), axis=axis)
        lo = np.take(c, np.arange(0, n), axis=axis)
        a = (hi - lo) / (2 * r + 1)
    return a


def fill_holes(rgb, hole):
    """Fill `hole` with a smooth normalised average of the surrounding known
    pixels (three box passes ~ Gaussian; coarser only where finer is empty)."""
    known = (~hole).astype(float)
    out = rgb.astype(float).copy()
    todo = hole.copy()
    for r in (4, 10, 24, 60, 160):
        w, num = known, rgb.astype(float) * known[..., None]
        for _ in range(3):
            w, num = box_blur(w, r), box_blur(num, r)
        ok = todo & (w > 1e-3)
        out[ok] = num[ok] / w[ok][:, None]
        todo &= ~ok
    return out


full = np.array(Image.open(SRC).convert('RGBA'))
H, W = full.shape[:2]
label = np.zeros((H, W), 'int16')  # 0 = ENV

# The existing occluders (exact alpha of occ*.png, cut by occluders.mjs) win,
# then FG-001, then the WORLD pieces; ENV keeps the rest.
manifest = json.loads(MANIFEST.read_text())
occ = np.zeros((H, W), bool)
# Where two occluder outlines overlap, the nearer one (larger ground y) keeps
# the pixel and it is cleared from the other, so nothing is drawn twice.
for o in sorted(json.loads(OCC.read_text()), key=lambda o: -o['y']):
    info = manifest['sprites'][o['id']]
    rgba = np.array(Image.open(DIR / info['file']).convert('RGBA'))
    x0, y0 = o['x'] - info['anchorX'], o['y'] - info['anchorY']
    taken = occ[y0 : y0 + rgba.shape[0], x0 : x0 + rgba.shape[1]]
    dup = (rgba[:, :, 3] > 0) & taken
    if dup.any():
        rgba[dup] = 0
        Image.fromarray(rgba).save(DIR / info['file'], optimize=True)
        print(f"occluder: {o['id']} gives {int(dup.sum())} overlapping px to a nearer occluder")
    occ[y0 : y0 + rgba.shape[0], x0 : x0 + rgba.shape[1]] |= rgba[:, :, 3] > 0
label[occ] = 1000
fg = poly_mask(FOREGROUND, (W, H)) & ~occ
# Over the façade (x > 140) the canopy is sparse: only leaf/branch pixels go
# to FG-001; the stone between the leaves stays in ENV.
r, g, b = (full[:, :, c].astype(float) for c in range(3))
leafish = (b < 0.62 * g) | (g >= 0.92 * r) | (r + g + b < 180)
canopy = poly_mask(FOREGROUND[:2], (W, H))
xs = np.arange(W)[None, :].repeat(H, 0)
fg &= ~(canopy & (xs > 140) & ~leafish)
label[fg] = -1
placements = []
for i, piece in enumerate(WORLD, start=1):
    m = poly_mask(piece['outlines'], (W, H)) & (label == 0)
    label[m] = i
    ys, xs = np.where(m)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    rgba = np.zeros((y1 - y0, x1 - x0, 4), 'uint8')
    rgba[m[y0:y1, x0:x1]] = full[y0:y1, x0:x1][m[y0:y1, x0:x1]]
    Image.fromarray(rgba).save(DIR / f"{piece['id']}.png", optimize=True)
    manifest['sprites'][piece['id']] = {
        'file': f"{piece['id']}.png", 'status': 'final', 'transparent': True,
        'width': int(x1 - x0), 'height': int(y1 - y0),
        'frameWidth': int(x1 - x0), 'frameHeight': int(y1 - y0),
        # Anchor on the ground line (baseY) so depth sort and the no-walk-through
        # probe work as for the occluders; pixels may extend below it.
        'frames': 1, 'rows': 1, 'anchorX': 0, 'anchorY': int(min(piece['baseY'], y1) - y0),
    }
    placements.append({'id': piece['id'], 'x': int(x0), 'y': int(min(piece['baseY'], y1))})
    print(f"world: {piece['id']} {x1 - x0}x{y1 - y0} ({int(m.sum())} px) base y={piece['baseY']}")

fg_rgba = np.zeros_like(full)
fg_rgba[fg] = full[fg]
Image.fromarray(fg_rgba).save(DIR / 'foreground.png', optimize=True)
manifest['sprites']['foreground'].update(status='final', transparent=True)
print(f'fg-001: {int(fg.sum())} px')

env = full.copy()
hole = label != 0
env[:, :, :3] = np.clip(fill_holes(full[:, :, :3], hole), 0, 255).round().astype('uint8')
env[~hole] = full[~hole]
env[:, :, 3] = 255
Image.fromarray(env).save(DIR / 'background.png', optimize=True)
Image.fromarray(full).save(DIR / 'murallaFull.png', optimize=True)
manifest['sprites']['murallaFull'] = {**manifest['sprites']['background'], 'file': 'murallaFull.png'}
print(f'env: {int((~hole).sum())} px kept, {int(hole.sum())} px moved to WORLD/FG')

MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
PLACEMENTS.write_text(json.dumps(placements, indent=2) + '\n')
