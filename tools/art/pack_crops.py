"""Crops runtime art out of the ChatGPT VISUAL MASTER PACK (the visual source
of truth). Nothing here draws: every pixel comes from the pack, only cropped
and (for Manu) downscaled onto the CHAR-001 grid.

usage: python3 tools/art/pack_crops.py /path/to/SAVE_SLOT_02_CHATGPT_VISUAL_MASTER_PACK
needs: Pillow, numpy (dev only; the outputs are committed)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

PACK = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[2] / 'src/assets/pack'
OUT.mkdir(parents=True, exist_ok=True)

# (source, box left/top/right/bottom, output)
CROPS = [
    # Sunset seafront with Cimavilla: world backdrop for reveal / date / ending / save slot.
    ('02_ATMOSPHERE_STYLE/03_TITLE_ATMOSPHERE.png', (0, 500, 712, 941), 'seafront.png'),
    # Luis + Manu on the seawall (FINAL SAVE CONFIRMATION panel): ending polaroid.
    ('03_UI_FLOW/02_GAME_FLOW_COLLAGE.png', (1210, 600, 1466, 900), 'polaroid.png'),
    # DATE PORTALS: only Friday's locked-street art. The route cards use the
    # seafront's sky (dateGate.css) so no date is tied to a place (RC-FIX-03).
    ('03_UI_FLOW/02_GAME_FLOW_COLLAGE.png', (430, 606, 608, 690), 'date-fri.png'),
    # Manu's canon portrait (MASTER CONCEPT SHEET): PLAYER 2 recognition card.
    ('01_PRIMARY_CANON/09_MASTER_CONCEPT_SHEET.png', (543, 41, 773, 324), 'manu-portrait.png'),
    # CLASS SELECT TARGET: PLAYER 1 portrait, class art, header skyline.
    ('03_UI_FLOW/04_CLASS_SELECT_TARGET.png', (26, 168, 462, 602), 'class-player1.png'),
    ('03_UI_FLOW/04_CLASS_SELECT_TARGET.png', (513, 260, 843, 476), 'class-warrior.png'),
    ('03_UI_FLOW/04_CLASS_SELECT_TARGET.png', (892, 260, 1233, 476), 'class-tank.png'),
    ('03_UI_FLOW/04_CLASS_SELECT_TARGET.png', (1274, 260, 1640, 476), 'class-healer.png'),
    ('03_UI_FLOW/04_CLASS_SELECT_TARGET.png', (1070, 0, 1672, 150), 'class-sky.png'),
]

for src, box, name in CROPS:
    Image.open(PACK / src).convert('RGB').crop(box).save(OUT / name, optimize=True)


def manu_sheet():
    """04_MANU_SPRITE_SHEET_ART_TARGET → 3 frames × 4 rows of 40×60, the same
    grid, anchor (20, 57) and figure height (55 px) as CHAR-001 player.png."""
    a = np.array(Image.open(PACK / '04_CHARACTERS/04_MANU_SPRITE_SHEET_ART_TARGET.png').convert('RGBA'))
    rows = [(11, 284), (301, 559), (574, 816), (828, 1071)]  # down, up, faces-left, faces-right
    cols = [(290, 480), (500, 700), (720, 910)]  # idle, step A, step B
    order = [0, 1, 3, 2]  # our rows: down, up, right, left
    out = Image.new('RGBA', (120, 240), (0, 0, 0, 0))
    scale = 55 / 273
    for r, sr in enumerate(order):
        y0, y1 = rows[sr]
        for f, (x0, x1) in enumerate(cols):
            cell = a[y0 : y1 + 1, x0:x1]
            solid = cell[:, :, 3] > 40
            ys = np.where(solid.any(1))[0]
            top, bot = ys.min(), ys.max()
            head = solid[top : top + int((bot - top) * 0.4)]
            hx = np.where(head.any(0))[0]
            cx = (hx.min() + hx.max()) / 2
            crop = Image.fromarray(cell[: bot + 1])
            w, h = round(crop.width * scale), round(crop.height * scale)
            small = np.array(crop.resize((w, h), Image.BOX))
            small[:, :, 3] = np.where(small[:, :, 3] > 110, 255, 0)
            out.alpha_composite(Image.fromarray(small), (f * 40 + 20 - round(cx * scale), r * 60 + 57 - h + 1))
    out.save(OUT / 'manu.png', optimize=True)


manu_sheet()


def randy_sitting():
    """06_RANDY_SPRITE_TARGET: the front sitting frame (bottom row, first),
    its yellow/red matte fringe removed, reduced to 40 px tall (Luis is 55)."""
    a = np.array(Image.open(PACK / '04_CHARACTERS/06_RANDY_SPRITE_TARGET.png').convert('RGBA').crop((40, 848, 188, 1062))).astype(int)
    r, g, b, al = (a[:, :, i] for i in range(4))
    fringe = ((r > 200) & (g > 200) & (b < 80)) | ((r > 180) & (g < 60) & (b < 60))
    a[:, :, 3] = np.where(fringe | (al < 160), 0, 255)
    im = Image.fromarray(a.astype('uint8'))
    small = np.array(im.resize((round(im.width * 40 / im.height), 40), Image.BOX))
    small[:, :, 3] = np.where(small[:, :, 3] > 120, 255, 0)
    Image.fromarray(small).save(OUT / 'randy.png', optimize=True)


randy_sitting()
print('wrote', sorted(p.name for p in OUT.iterdir()))
