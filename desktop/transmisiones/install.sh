#!/usr/bin/env bash
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)

install -Dm644 -t "$HOME/.config/omarchy/plugins/gon.nerv-ads" "$here"/plugin/*
install -Dm755 "$here/bin/nerv-ads" "$HOME/.local/bin/nerv-ads"
install -Dm644 -t "$HOME/.local/share/nerv-ads/web" "$here"/web/*
install -Dm644 -t "$HOME/.config/systemd/user" "$here"/systemd/*

mkdir -p "$HOME/.config/nerv-ads/img"
[[ -f $HOME/.config/nerv-ads/config.json ]] || install -Dm644 "$here/config.example.json" "$HOME/.config/nerv-ads/config.json"
for n in cortex atenty gonza; do
  [[ -f $HOME/.config/nerv-ads/img/$n.png ]] || cp "$here/plugin/$n.png" "$HOME/.config/nerv-ads/img/"
done

install -Dm644 "$here/plugin/icon.png" "$HOME/.local/share/icons/hicolor/256x256/apps/nerv-transmisiones.png"
sed "s|@HOME@|$HOME|g" "$here/applications/nerv-transmisiones.desktop" > "$HOME/.local/share/applications/NERV Transmisiones.desktop"

systemctl --user daemon-reload
systemctl --user enable --now nerv-ads-web.service nerv-ads.timer
omarchy plugin enable gon.nerv-ads || true
echo "NERV Transmisiones instalado: abrilo desde el lanzador o en http://127.0.0.1:7777"
