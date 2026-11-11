"""Cartel animado de la solapa ORQ, hermano del g0n: dice ORQUESTADOR y abajo un nodo central
manda pulsos de luz a sus workers, que se los devuelven. Mismo lenguaje (grilla de caracteres,
colores del tema, 64 cuadros de 920x216) y un ciclo que empalma el último cuadro con el primero.

  python tools/gen_orq.py assets/orq [temas...]
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from gen_g0n import CH, COLS, CW, FRAMES, H, MONO, RAMP, ROWS, W, first, hsh, mix, rgb, themes

TEXT = "ORQUESTADOR"
TEXT_ROWS = 12  # filas 0-11 para las letras; el motivo va en las de abajo
HUB = (COLS // 2, 12)
BUS = 14
NODE = 16
WORKERS = [13, 35, 57, 79, 101]


# Letras de 8x9 celdas con trazo de 2 columnas: a este tamaño una fuente escalada no se lee.
GLYPHS = {
    "O": [".######.", "##....##", "##....##", "##....##", "##....##", "##....##", "##....##", "##....##", ".######."],
    "R": ["#######.", "##....##", "##....##", "##....##", "#######.", "##..##..", "##...##.", "##....##", "##....##"],
    "Q": [".######.", "##....##", "##....##", "##....##", "##....##", "##.##.##", "##..####", "##...##.", ".####.##"],
    "U": ["##....##", "##....##", "##....##", "##....##", "##....##", "##....##", "##....##", "##....##", ".######."],
    "E": ["########", "##......", "##......", "##......", "######..", "##......", "##......", "##......", "########"],
    "S": [".######.", "##....##", "##......", "##......", ".######.", "......##", "......##", "##....##", ".######."],
    "T": ["########", "...##...", "...##...", "...##...", "...##...", "...##...", "...##...", "...##...", "...##..."],
    "A": ["..####..", ".##..##.", "##....##", "##....##", "##....##", "########", "##....##", "##....##", "##....##"],
    "D": ["######..", "##...##.", "##....##", "##....##", "##....##", "##....##", "##....##", "##...##.", "######.."],
}
GW, GAP, TOP = 8, 2, 2


def letter_mask():
    cov = [[0.0] * COLS for _ in range(ROWS)]
    width = len(TEXT) * GW + (len(TEXT) - 1) * GAP
    ox = (COLS - width) // 2
    for i, ch in enumerate(TEXT):
        for gy, row in enumerate(GLYPHS[ch]):
            for gx, bit in enumerate(row):
                if bit == "#":
                    cov[TOP + gy][ox + i * (GW + GAP) + gx] = 1.0
    return cov, ox, ox + width


def path(col):
    """Celdas del hub a un worker: tronco, barra y bajada."""
    hx, hy = HUB
    cells = [(hx, y) for y in range(hy + 1, BUS + 1)]
    step = 1 if col > hx else -1
    cells += [(x, BUS) for x in range(hx + step, col + step, step)] if col != hx else []
    cells.append((col, BUS + 1))
    return cells


def wires():
    """Carácter de reposo de cada celda del motivo."""
    hx, hy = HUB
    out = {(hx, hy + 1): "|"}
    for x in range(WORKERS[0], WORKERS[-1] + 1):
        out[(x, BUS)] = "-"
    for col in WORKERS:
        out[(col, BUS)] = "+"
        out[(col, BUS + 1)] = "|"
    return out


def frame(th, cov, x0, x1, f, mono):
    t = f / FRAMES
    purple, violet, lime, text, dim = (rgb(th[k]) for k in ("purple", "violet", "lime", "text", "dim"))
    cyan = rgb(th["cyan"])
    fill = mix(purple, violet, 0.5)
    scan = int(t * 2 * TEXT_ROWS) % TEXT_ROWS
    sweep = x0 - 12 + t * (x1 - x0 + 24)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def put(c, r, ch, col):
        if ch and ch != " ":
            d.text((c * CW, r * CH), ch, font=mono, fill=col + (255,))

    def inside(r, c):
        return 0 <= r < ROWS and 0 <= c < COLS and cov[r][c] > 0.45

    for r in range(TEXT_ROWS):
        for c in range(COLS):
            v = cov[r][c]
            if v > 0.12:
                edge = v > 0.45 and not (inside(r - 1, c) and inside(r, c - 1))
                shade = 0.7 + 0.3 * (1 - r / TEXT_ROWS)
                light = math.exp(-(((c - sweep) + (r - TEXT_ROWS / 2) * 0.6) / 3.2) ** 2)
                if edge:
                    ch, col = "#", mix(lime, text, light * 0.6)
                else:
                    k = min(len(RAMP) - 1, max(1, int((v * shade + light * 0.3) * (len(RAMP) - 1))))
                    ch, col = RAMP[k], mix(fill, text, light * 0.85)
                if r == scan:
                    col = mix(col, text, 0.35)
                put(c, r, ch, col)
            elif r == scan:
                put(c, r, "=" if hsh(r, c, f) > 0.7 else "-", dim)
            elif hsh(r, c, 3) > 0.975:
                put(c, r, ".", dim)

    # Motivo: cada worker tiene su pulso, desfasado; va (lima), prende el nodo y vuelve (cian) al hub.
    glow = {}
    node = [0.0] * len(WORKERS)
    hub = 0.0
    for i, col in enumerate(WORKERS):
        cells = path(col)
        p = (t + i / len(WORKERS)) % 1.0
        if p < 0.4:
            pos, tone = p / 0.4 * len(cells), lime
        elif p < 0.5:
            pos, tone = None, lime
            node[i] = math.sin((p - 0.4) / 0.1 * math.pi)
        elif p < 0.9:
            pos, tone = (1 - (p - 0.5) / 0.4) * len(cells), cyan
        else:
            pos, tone = None, cyan
            hub = max(hub, math.sin((p - 0.9) / 0.1 * math.pi))
        if pos is None:
            continue
        for q, cell in enumerate(cells):
            g = math.exp(-((q + 0.5 - pos) / 2.2) ** 2)
            if g > glow.get(cell, (0, None))[0]:
                glow[cell] = (g, tone)
    wire = mix(dim, violet, 0.5)
    for (c, r), ch in wires().items():
        g, tone = glow.get((c, r), (0.0, lime))
        if g > 0.55:
            ch = "#" if ch == "+" else "=" if ch == "-" else "#"
        put(c, r, ch, mix(wire, tone, g))
    hx, hy = HUB
    hub_col = mix(lime, text, hub)
    side = mix(mix(purple, text, 0.35), text, hub * 0.6)
    for dx, ch in zip(range(-3, 4), "<<[@]>>" if hub < 0.5 else "<<[#]>>"):
        put(hx + dx, hy, ch, hub_col if dx == 0 else side)
    for i, col in enumerate(WORKERS):
        on = node[i]
        edge = mix(fill, text, on * 0.7)
        put(col - 1, NODE, "(", edge)
        put(col + 1, NODE, ")", edge)
        put(col, NODE, "@" if on > 0.5 else "o", mix(violet, lime, 0.25 + 0.75 * on))
    return img


def main():
    if len(sys.argv) < 2:
        sys.exit("uso: gen_orq.py <salida> [temas...]")
    out = Path(sys.argv[1])
    all_themes = themes()
    mono = ImageFont.truetype(first(MONO), 12)
    cov, x0, x1 = letter_mask()
    for tid in sys.argv[2:] or list(all_themes):
        dest = out / tid
        dest.mkdir(parents=True, exist_ok=True)
        for f in range(FRAMES):
            img = frame(all_themes[tid], cov, x0, x1, f, mono)
            img.quantize(48, method=Image.Quantize.FASTOCTREE).save(dest / f"{f:02d}.png", optimize=True)
        print(tid, dest)


if __name__ == "__main__":
    main()
