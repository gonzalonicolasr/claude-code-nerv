import math
import random
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 920, 216
COLS, ROWS = 115, 18
CW, CH = W // COLS, H // ROWS
FRAMES = 64
RAMP = " .:-=+*#%@"
TEXT = "g0n"
SERIF = [
    "/usr/share/fonts/noto-cjk/NotoSerifCJK-Black.ttc",
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Black.ttc",
]
MONO = [
    "/usr/share/fonts/TTF/JetBrainsMono-Bold.ttf",
    "/usr/share/fonts/TTF/JetBrainsMonoNerdFont-Bold.ttf",
    "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf",
]


def first(paths):
    for p in paths:
        if Path(p).exists():
            return p
    sys.exit("no encuentro la fuente: " + ", ".join(paths))


def themes():
    src = (ROOT / "hooks" / "register.ts").read_text()
    out = {}
    for tid, body in re.findall(r"^\s+(\w+): \{ label: '[^']*', (.*?) \},?$", src, re.M):
        out[tid] = {k: v for k, v in re.findall(r"(\w+): '(#[0-9a-fA-F]{6})'", body)}
    return out


def rgb(h):
    return tuple(int(h[i : i + 2], 16) for i in (1, 3, 5))


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def hsh(*v):
    x = math.sin(sum(n * k for n, k in zip(v, (127.1, 311.7, 74.7, 19.3)))) * 43758.5453
    return x - math.floor(x)


def letter_mask():
    font_path = first(SERIF)
    big = 400
    font = ImageFont.truetype(font_path, big)
    box = font.getbbox(TEXT)
    tw, th = box[2] - box[0], box[3] - box[1]
    canvas = Image.new("L", (tw + 20, th + 20), 0)
    ImageDraw.Draw(canvas).text((10 - box[0], 10 - box[1]), TEXT, font=font, fill=255)
    target_w = round(COLS * 0.42)
    target_h = ROWS - 2
    sx = target_w / canvas.width
    sy = target_h / canvas.height
    gw, gh = max(1, round(canvas.width * sx)), max(1, round(canvas.height * sy))
    fine = canvas.resize((gw * 4, gh * 4), Image.LANCZOS)
    cov = [[0.0] * COLS for _ in range(ROWS)]
    ox, oy = (COLS - gw) // 2, (ROWS - gh) // 2
    px = fine.load()
    for gy in range(gh):
        for gx in range(gw):
            s = 0
            for yy in range(4):
                for xx in range(4):
                    s += px[gx * 4 + xx, gy * 4 + yy]
            cov[oy + gy][ox + gx] = s / (16 * 255)
    return cov, ox, ox + gw


def frame(th, cov, x0, x1, f, mono):
    t = f / FRAMES
    purple, violet, lime, text, dim = (rgb(th[k]) for k in ("purple", "violet", "lime", "text", "dim"))
    cyan, orange, pink = (rgb(th[k]) for k in ("cyan", "orange", "pink"))
    fill = mix(purple, violet, 0.5)
    glitch = f % 32 in (21, 22, 23) or f in (50, 51)
    rnd = random.Random(f * 7919)
    shift = {}
    tint = {}
    if glitch:
        for _ in range(rnd.randint(2, 4)):
            r = rnd.randrange(ROWS)
            shift[r] = rnd.choice((-4, -3, -2, -1, 1, 2, 3, 4))
            tint[r] = rnd.choice((cyan, orange))
    scan = int(t * 2 * ROWS) % ROWS
    sweep = x0 - 12 + ((t * 1.5) % 1.0) * (x1 - x0 + 24)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def inside(r, c):
        return 0 <= r < ROWS and 0 <= c < COLS and cov[r][c] > 0.45

    for r in range(ROWS):
        dx = shift.get(r, 0)
        for c in range(COLS):
            sc = c - dx
            v = cov[r][sc] if 0 <= sc < COLS else 0.0
            ch, col = None, None
            if v > 0.12:
                edge = v > 0.45 and not (inside(r - 1, sc) and inside(r, sc - 1))
                shade = 0.55 + 0.45 * (1 - r / ROWS)
                light = math.exp(-(((sc - sweep) + (r - ROWS / 2) * 0.6) / 3.2) ** 2)
                if edge:
                    ch = "#" if hsh(r, sc, f // 4) > 0.35 else "+"
                    col = mix(lime, text, light * 0.6)
                else:
                    k = min(len(RAMP) - 1, max(1, int((v * shade + light * 0.3) * (len(RAMP) - 1))))
                    ch = RAMP[k]
                    col = mix(fill, text, light * 0.85)
                if r == scan:
                    col = mix(col, text, 0.35)
                if r in tint:
                    col = mix(col, tint[r], 0.7)
            elif r == scan:
                ch = "=" if hsh(r, c, f) > 0.7 else "-"
                col = dim
            elif hsh(r, c, 3) > 0.975 and hsh(r, c, f // 6) > 0.3:
                ch = "."
                col = dim
            if glitch and rnd.random() < 0.012:
                ch = rnd.choice("*@%+")
                col = pink
            if ch and ch != " ":
                d.text((c * CW, r * CH), ch, font=mono, fill=col + (255,))
    return img


def main():
    if len(sys.argv) < 2:
        sys.exit("uso: gen_g0n.py <salida> [temas...]")
    out = Path(sys.argv[1])
    all_themes = themes()
    pick = sys.argv[2:] or list(all_themes)
    mono = ImageFont.truetype(first(MONO), 12)
    cov, x0, x1 = letter_mask()
    for tid in pick:
        th = all_themes[tid]
        dest = out / tid
        dest.mkdir(parents=True, exist_ok=True)
        for f in range(FRAMES):
            img = frame(th, cov, x0, x1, f, mono)
            img.quantize(48, method=Image.Quantize.FASTOCTREE).save(dest / f"{f:02d}.png", optimize=True)
        print(tid, dest)


if __name__ == "__main__":
    main()
