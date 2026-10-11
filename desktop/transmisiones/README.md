# NERV · Transmisiones

Cartel de escritorio estilo Evangelion que aparece cada tanto en Omarchy
publicitando sitios (por defecto cortexmem.com, atenty.com.ar y
gonzalorocca.com), con la misma animación que MISSION COMPLETE.

| Pieza | Dónde queda instalada |
|---|---|
| `plugin/` — panel QML del shell de Omarchy | `~/.config/omarchy/plugins/gon.nerv-ads/` |
| `bin/nerv-ads` — dispara un cartel (`next`, `<id>`, `reset`, `close`) | `~/.local/bin/` |
| `web/` — configuración local en http://127.0.0.1:7777 | `~/.local/share/nerv-ads/web/` |
| `systemd/` — timer de rotación y servicio de la web | `~/.config/systemd/user/` |
| `applications/` — lanzador "NERV Transmisiones" | `~/.local/share/applications/` |
| `config.example.json` — sitios, intervalo, duración y monitor | `~/.config/nerv-ads/config.json` |

Instalar o actualizar: `./install.sh`. No pisa la config ni las imágenes
que ya tengas. Después de cambiar el QML hace falta `omarchy-restart-shell`.

En el cartel: arrastrar lo mueve (la posición queda en
`~/.local/state/nerv-ads/pos.json`), click abre el sitio, click derecho lo
cierra y pasar el mouse pausa la cuenta regresiva.
