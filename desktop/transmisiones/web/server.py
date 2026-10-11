#!/usr/bin/env python3
import base64
import json
import os
import re
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "127.0.0.1"
PORT = int(os.environ.get("NERV_ADS_PORT", "7777"))
HERE = Path(__file__).resolve().parent
CONFIG_DIR = Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config")) / "nerv-ads"
CONFIG = CONFIG_DIR / "config.json"
IMG = CONFIG_DIR / "img"
STATE = Path(os.environ.get("XDG_STATE_HOME", Path.home() / ".local/state")) / "nerv-ads"
UNITS = Path.home() / ".config/systemd/user"
DROPIN = UNITS / "nerv-ads.timer.d" / "interval.conf"
SCRIPT = str(Path.home() / ".local/bin/nerv-ads")
ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,31}$")
COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
TEXT_FIELDS = {"kanji": 8, "name": 40, "tag": 80, "url": 200, "label": 60}


def load():
    return json.loads(CONFIG.read_text())


def systemctl(*args):
    return subprocess.run(["systemctl", "--user", *args], capture_output=True, text=True, timeout=15)


def clean(cfg):
    out = {
        "enabled": bool(cfg.get("enabled", True)),
        "interval_min": max(1, min(240, int(cfg.get("interval_min", 10)))),
        "duration_s": max(4, min(60, int(cfg.get("duration_s", 12)))),
        "screen": str(cfg.get("screen", "DP-1"))[:32],
        "sites": [],
    }
    seen = set()
    for s in cfg.get("sites", []):
        sid = str(s.get("id", "")).strip().lower()
        if not ID.match(sid) or sid in seen:
            raise ValueError(f"id inválido o repetido: {sid!r}")
        seen.add(sid)
        site = {"id": sid, "enabled": bool(s.get("enabled", True))}
        for k, n in TEXT_FIELDS.items():
            site[k] = str(s.get(k, ""))[:n]
        if not site["url"].startswith(("https://", "http://")):
            raise ValueError(f"la URL de {sid} tiene que empezar con https://")
        for k in ("accent", "spark"):
            v = str(s.get(k, "#ff3b2f"))
            if not COLOR.match(v):
                raise ValueError(f"color inválido en {sid}: {v}")
            site[k] = v
        art = Path(str(s.get("art", ""))).name
        site["art"] = art if (IMG / art).is_file() else ""
        out["sites"].append(site)
    return out


def apply_timer(cfg):
    DROPIN.parent.mkdir(parents=True, exist_ok=True)
    want = f"[Timer]\nOnUnitActiveSec=\nOnUnitActiveSec={cfg['interval_min']}min\n"
    changed = not DROPIN.exists() or DROPIN.read_text() != want
    if changed:
        DROPIN.write_text(want)
        systemctl("daemon-reload")
    active = systemctl("is-active", "nerv-ads.timer").stdout.strip() == "active"
    if cfg["enabled"] and (changed or not active):
        systemctl("enable", "nerv-ads.timer")
        systemctl("restart", "nerv-ads.timer")
    if not cfg["enabled"] and active:
        systemctl("stop", "nerv-ads.timer")


def monitors():
    try:
        out = subprocess.run(["hyprctl", "monitors", "-j"], capture_output=True, text=True, timeout=5).stdout
        return [{"name": m["name"], "desc": m.get("description", ""), "w": m["width"], "h": m["height"]} for m in json.loads(out)]
    except (OSError, ValueError, subprocess.SubprocessError):
        return []


def next_run():
    r = systemctl("show", "nerv-ads.timer", "-p", "NextElapseUSecMonotonic", "-p", "ActiveState")
    return dict(line.split("=", 1) for line in r.stdout.splitlines() if "=" in line)


class Handler(BaseHTTPRequestHandler):
    server_version = "nerv-ads"

    def log_message(self, *a):
        pass

    def send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def body(self):
        n = int(self.headers.get("Content-Length", 0))
        if n > 12 * 1024 * 1024:
            raise ValueError("archivo demasiado grande")
        return json.loads(self.rfile.read(n) or b"{}")

    def local(self):
        host = (self.headers.get("Host") or "").split(":")[0]
        origin = self.headers.get("Origin")
        return host in ("127.0.0.1", "localhost") and (not origin or re.match(r"^http://(127\.0\.0\.1|localhost):\d+$", origin))

    def do_GET(self):
        if not self.local():
            return self.send(403, {"error": "solo local"})
        path = self.path.split("?")[0]
        if path in ("/", "/index.html"):
            return self.send(200, (HERE / "index.html").read_bytes(), "text/html; charset=utf-8")
        if path == "/api/config":
            return self.send(200, {"config": load(), "monitors": monitors(), "timer": next_run(), "pos": (STATE / "pos.json").exists()})
        if path.startswith("/img/"):
            f = IMG / Path(path[5:]).name
            if f.is_file():
                return self.send(200, f.read_bytes(), "image/png")
        return self.send(404, {"error": "no existe"})

    def do_POST(self):
        if not self.local():
            return self.send(403, {"error": "solo local"})
        path = self.path.split("?")[0]
        try:
            data = self.body()
            if path == "/api/config":
                cfg = clean(data)
                tmp = CONFIG.with_suffix(".tmp")
                tmp.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n")
                os.replace(tmp, CONFIG)
                apply_timer(cfg)
                return self.send(200, {"ok": True, "config": cfg, "timer": next_run()})
            if path == "/api/test":
                sid = str(data.get("id", ""))
                if not ID.match(sid):
                    raise ValueError("id inválido")
                r = subprocess.run([SCRIPT, sid], capture_output=True, text=True, timeout=10)
                return self.send(200 if r.returncode == 0 else 400, {"ok": r.returncode == 0, "out": (r.stdout + r.stderr).strip()})
            if path == "/api/reset-pos":
                subprocess.run([SCRIPT, "reset"], timeout=5)
                return self.send(200, {"ok": True})
            if path == "/api/image":
                sid = str(data.get("id", ""))
                if not ID.match(sid):
                    raise ValueError("id inválido")
                raw = base64.b64decode(str(data.get("data", "")).split(",", 1)[-1])
                IMG.mkdir(parents=True, exist_ok=True)
                src = IMG / f".{sid}-upload"
                src.write_bytes(raw)
                dst = IMG / f"{sid}.png"
                r = subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-vf", "scale=192:192:force_original_aspect_ratio=increase,crop=192:192", "-frames:v", "1", str(dst)], capture_output=True, text=True, timeout=30)
                src.unlink(missing_ok=True)
                if r.returncode != 0:
                    raise ValueError("no pude leer la imagen")
                return self.send(200, {"ok": True, "art": dst.name})
        except (ValueError, TypeError, KeyError, json.JSONDecodeError) as e:
            return self.send(400, {"error": str(e)})
        except subprocess.SubprocessError as e:
            return self.send(500, {"error": str(e)})
        return self.send(404, {"error": "no existe"})


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
