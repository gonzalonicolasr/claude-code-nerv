const PANE = 'nerv'
const THEMES = {
  eva01: { label: 'EVA-01', purple: '#8b5cf6', violet: '#7b3fb8', lime: '#a3e635', amber: '#f59e0b', orange: '#ff7a1a', red: '#ef4444', pink: '#ff4d6d', cyan: '#22d3ee', text: '#ece2fb', muted: '#8a73ad', dim: '#5b4a75', todo: '#f0c987', ink: '#140c22', deep: '#2e2340', chip: '#241a33', chipDim: '#1c1529', tabBg: '#3a2560', trail: '#1c1526', spark: '#4b2a7a' },
  eva00: { label: 'EVA-00', purple: '#3b82f6', violet: '#60a5fa', lime: '#facc15', amber: '#f59e0b', orange: '#fb923c', red: '#ef4444', pink: '#ff4d6d', cyan: '#7dd3fc', text: '#e5e7eb', muted: '#8b9bb4', dim: '#475569', todo: '#fde68a', ink: '#0b1220', deep: '#1e2a44', chip: '#16213a', chipDim: '#111a2e', tabBg: '#1d3a70', trail: '#101828', spark: '#1e40af' },
  eva02: { label: 'EVA-02', purple: '#ef4444', violet: '#dc2626', lime: '#fbbf24', amber: '#f59e0b', orange: '#f97316', red: '#ef4444', pink: '#ff4d6d', cyan: '#fdba74', text: '#fde8e1', muted: '#b0857a', dim: '#6b3b33', todo: '#fcd34d', ink: '#1a0a08', deep: '#3a1a14', chip: '#2c1410', chipDim: '#22100c', tabBg: '#5a1a14', trail: '#1f0d0a', spark: '#7f1d1d' },
  eva08: { label: 'EVA-08', purple: '#ec4899', violet: '#f472b6', lime: '#22c55e', amber: '#f59e0b', orange: '#fb923c', red: '#ef4444', pink: '#ff4d6d', cyan: '#4ade80', text: '#fce7f3', muted: '#b47e9e', dim: '#6b3a5a', todo: '#f9a8d4', ink: '#1a0a14', deep: '#3a1430', chip: '#2c1224', chipDim: '#220e1c', tabBg: '#5c1846', trail: '#1f0b18', spark: '#86198f' },
  mark06: { label: 'MK.06', purple: '#3b82f6', violet: '#1e3a8a', lime: '#cbd5e1', amber: '#f59e0b', orange: '#94a3b8', red: '#ef4444', pink: '#ff4d6d', cyan: '#93c5fd', text: '#e2e8f0', muted: '#94a3b8', dim: '#475569', todo: '#e2e8f0', ink: '#0a0f1e', deep: '#1e293b', chip: '#172036', chipDim: '#111827', tabBg: '#1e3a8a', trail: '#0f172a', spark: '#1e3a8a' },
}
type ThemeId = keyof typeof THEMES
const THEME_IDS = Object.keys(THEMES) as ThemeId[]
const int = (h: string) => parseInt(h.slice(1), 16)
const rgbOf = (t: (typeof THEMES)[ThemeId]) => ({
  purple: int(t.purple),
  violet: int(t.violet),
  lime: int(t.lime),
  orange: int(t.orange),
  red: int(t.red),
  pink: int(t.pink),
  amber: int(t.amber),
  cyan: int(t.cyan),
  deep: int(t.deep),
  ink: int(t.ink),
  trail: int(t.trail),
  spark: int(t.spark),
  none: 0x01000000,
})
let themeId: ThemeId = 'eva01'
let C = { ...THEMES.eva01 }
let RGB = rgbOf(THEMES.eva01)
const applyTheme = (id: string) => {
  if (!THEME_IDS.includes(id as ThemeId)) return false
  themeId = id as ThemeId
  C = { ...THEMES[themeId] }
  RGB = rgbOf(THEMES[themeId])
  return true
}
const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']
const LONG_TURN_MS = 180000
const BATTERY_AT = 85
const TABS = [
  { id: 'magi', label: 'MAGI', hotkey: '1' },
  { id: 'git', label: 'GIT', hotkey: '2' },
  { id: 'hw', label: 'HW', hotkey: '3' },
  { id: 'live', label: 'EN VIVO', hotkey: '4' },
  { id: 'forge', label: 'FORGE', hotkey: '5' },
  { id: 'nodd', label: 'NODD', hotkey: '6' },
  { id: 'cortex', label: 'CORTEX', hotkey: '7' },
  { id: 'yt', label: 'YOUTUBE', hotkey: '8' },
  { id: 'models', label: 'MODELOS', hotkey: '9' },
  { id: 'edd', label: 'EDD', hotkey: '0' },
]
const PHASES = ['explore', 'plan', 'build', 'veredicto']
const SPIN = ['◐', '◓', '◑', '◒']

let quiet = false
let placedOnce = false
let paneOpen = false
let away = false
let fast: { cancel: () => void }[] = []
let tab = 'magi'
let pinned = ''
let frame = 0
let working = false
let turnStart = 0
let model = ''
let project = ''
let cwdNow = ''
let gitRoot = ''
let branch = ''
let home = ''
let paneId = ''
let sessionId = ''
let usage: any = undefined
let account = ''
let samples: { t: number; pct: number }[] = []
let activity: { tool: string; label: string; start: number } | undefined
let lastProgress = 0
const unverified = new Set<string>()
let lastErr = ''
let errCount = 0
let patternBlue: { tool: string; count: number; text: string } | undefined
const failedCmds = new Set<string>()
let confettiUntil = 0
const tasks = new Map<string, { kind: string; desc: string; start: number; end?: number; status?: string }>()
const agentToUse = new Map<string, string>()
let prs: any[] | undefined
let ws: { days: Record<string, number>; repos: any[]; recent: any[] } | undefined
let wsAt = 0
let wsBusy = false
let prsWide = false
let prError = ''
let ghMe = ''
let commitDays: Record<string, number> = {}
let commitAuthor = ''
let gitInfo: any = { ok: false, upstream: '', ahead: 0, behind: 0, dirty: 0, recent: [] }
const folded = new Set<string>()
let sessionTasks: { id: string; subject: string; status: string; blockedBy: string[] }[] = []
let configDir = ''
let acctMenu = false
let acctNote = ''
const emails: Record<string, string> = {}
const ACCOUNTS = [
  { id: 'personal', conf: '.claude.json', tag: 'PERSONAL' },
  { id: 'priv8', conf: '', tag: 'CPAM' },
]
let health = { ok: true, when: '', text: '' }
let recap: { prompt: string; at: number } | undefined
let hw: any = undefined
let hwBusy = false
const cpuHist: number[] = []
const gpuHist: number[] = []
type LiveCam = { on: boolean; w: number; h: number; fps: number; cpu: number }
type LiveDcMember = { name: string; self: boolean; speaking: boolean; mute: boolean; deaf: boolean; streaming: boolean }
type LiveDc = { ch: string; g: string; n: number; m: LiveDcMember[]; live: boolean; vc: number; v: string[] }
export type LiveChatMsg = { a: string; t: string; ts: number; self: boolean }
let live: {
  cam: LiveCam
  ip: LiveCam & { mode: string; scene: string; blur: boolean; name: string; bat: number; charging: boolean; lens: string; reach: boolean }
  text: string
  discord: boolean
  dc: LiveDc | null | undefined
  chat: LiveChatMsg[] | undefined
  busy: boolean
  n: number
} = {
  cam: { on: false, w: 0, h: 0, fps: 0, cpu: 0 },
  ip: { on: false, w: 0, h: 0, fps: 0, cpu: 0, mode: '', scene: '', blur: false, name: '', bat: -1, charging: false, lens: '', reach: false },
  text: '',
  discord: false,
  dc: undefined,
  chat: undefined,
  busy: false,
  n: 0,
}
let liveText: string | undefined
let liveTextKey = 0
let bodyOffset = 0
let bodyMax = 0
let bodyTab = ''
let lastView = 0
let openDrop = ''
const forgeAccounts: Record<string, boolean> = {}
const cardScroll: Record<string, number> = {}
const cardMax: Record<string, number> = {}
let cardHits: { key: string; top: number; bottom: number }[] = []
let lastContent = 0
let ramTotal = ''
let effort: string | number | undefined
let effortPick: string | undefined
let settingsEffort = ''
let effortFrom = 0
let effortAt = 0
let forge: any = undefined
let nodd: any = undefined
let edd: any = undefined
const eddAnswers: Record<string, string> = {}
let cortex: { stats?: any; recent?: any[]; err?: string; at?: number } = {}
let blue = { ars: 1555, live: false, at: 0 }
type YtItem = { id: string; title: string; ch: string; d: number }
let yt: { results: YtItem[]; queue: YtItem[]; query: string; busy: boolean; err: string; now?: { pos?: number; dur?: number; pause?: boolean; idx: number; vol?: number; title?: string } } = { results: [], queue: [], query: '', busy: false, err: '' }
let runDir = '/tmp'
let ytDraft = ''
let ytVolDraft: string | undefined
let ytVolKey = 0
const ytThumb: Record<string, string> = {}
const ytThumbPath = (id: string) => `${home}/.cache/nerv/yt/${id}.png`
let ytRecent: string[] = []
const ytSock = () => `${runDir}/nerv-yt.sock`
const YT_COOKIES = 'chrome+gnomekeyring:Default'
const YT_FILL = [
  'sock=$1; ck=$2; map=$3; shift 3',
  'for id in "$@"; do',
  '  u=$(yt-dlp --cookies-from-browser "$ck" -f bestaudio/best -g --no-warnings "https://youtu.be/$id" 2>/dev/null | head -1)',
  '  [ -S "$sock" ] || exit 0',
  '  case "$u" in http*) c="{\\"command\\":[\\"loadfile\\",\\"$u\\",\\"append\\"]}" ;; *) c="{\\"command\\":[\\"loadfile\\",\\"https://youtu.be/$id\\",\\"append\\",-1,\\"ytdl=yes\\"]}" ;; esac',
  '  case "$u" in http*) printf "%s\\t%s\\n" "$u" "$id" >> "$map" ;; esac',
  '  printf "%s\\n" "$c" | socat -t 1 - UNIX-CONNECT:"$sock" >/dev/null 2>&1 || exit 0',
  'done',
].join('\n')
const ytState = () => `${runDir}/nerv-yt.json`
const YT_KILL = 'for p in $(pgrep -x mpv) $(pgrep -x bash); do tr "\\0" "\\n" </proc/$p/cmdline 2>/dev/null | grep -qx -e "--input-ipc-server=$1" -e nerv-yt-fill && [ "$p" != $$ ] && kill "$p"; done; true'
let ytStarting = 0
const ytStartFile = () => `${runDir}/nerv-yt.starting`
const ytPend = new Set<string>()
const ytMapPath = () => `${runDir}/nerv-yt.map`
let ytMap: Record<string, string> = {}
let ytItems: Record<string, YtItem> = {}
let ytFilesSize = -1
let ytLegacy: YtItem[] = []
let ytNote = ''
const clockOf = (sec: number) => mmss((sec || 0) * 1000)
let cortexKey = ''
let cortexBusy = false
const CORTEX_URL = 'https://cortexmem.com/api/cortex/mcp'
const CORTEX_TYPES: Record<string, string> = { bug_fix: 'bugs', discovery: 'hallazgos', config: 'config', architecture: 'arquitectura', decision: 'decisiones', lesson: 'lecciones', pattern: 'patrones', preference: 'preferencias', session_summary: 'sesiones', context: 'contexto' }
export type CxEvent = { ts: string; kind: string; ws: string; tool: string; ids: number[]; titles: string[]; types: string[]; projects: string[]; workspaces: string[]; session: string; project: string; prompt: string }
export type CxHit = { id: number; type: string; title: string; project: string; workspace: string }
const CX_VERBS: Record<string, string> = {
  memoria_search: 'buscó',
  memoria_recall: 'recordó',
  memoria_get: 'abrió',
  memoria_hint: 'pidió pistas',
  memoria_context: 'cargó el contexto',
  memoria_recent: 'miró lo reciente',
  memoria_timeline: 'miró la línea de tiempo',
  memoria_projects: 'listó proyectos',
  memoria_stats: 'miró estadísticas',
  memoria_session_find: 'buscó sesiones',
  memoria_pending: 'miró pendientes',
  memoria_pending_done: 'cerró un pendiente',
  memoria_save: 'guardó',
  memoria_update: 'actualizó',
  memoria_session_start: 'abrió sesión',
  memoria_session_end: 'cerró la sesión',
  memoria_feedback: 'dio feedback',
  memoria_project_describe: 'describió el proyecto',
  memoria_save_prompt: 'guardó el pedido',
}
const CX_EMOJI: Record<string, string> = { '🐛': 'bug_fix', '💡': 'discovery', '⚙': 'config', '🏛': 'architecture', '🧭': 'decision', '🎓': 'lesson', '🧩': 'pattern', '⭐': 'preference', '📋': 'session_summary', '🗺': 'context' }
const CX_ROWS = 5
const CX_READS = new Set(['memoria_search', 'memoria_recall', 'memoria_get', 'memoria_hint', 'memoria_context', 'memoria_recent', 'memoria_timeline', 'memoria_session_find', 'memoria_pending', 'memoria_projects', 'memoria_stats'])
const CX_SAVES = new Set(['memoria_save', 'memoria_update'])
const CX_AWK = 'd=$(date +%F); echo "$d"; awk -v k="$1" -v f="$2" -v d="$d" \'NR>=k && (f==0 || index($0,d)) {print NR "\\t" $0} END {print NR}\' "$3"'
let cxLog = { path: '', primed: false, line: 0, size: 0, mtime: 0, day: '', missing: false, busy: false, events: [] as CxEvent[] }
let forgeMissing = false
let forgeDraft = ''
const forgeGroup: Record<string, string> = {}

const now = () => Date.now()
const base = (p: string) => (p || '').split('/').filter(Boolean).at(-1) || p
const clip = (s: string, n: number) => {
  s = String(s ?? '')
  return s.length > n ? s.slice(0, Math.max(0, n - 1)) + '…' : s
}
const took = (ms: number) => {
  const sec = Math.max(0, Math.round(ms / 1000))
  if (sec < 60) return `${sec} s`
  const min = Math.floor(sec / 60)
  return min < 60 ? `${min} min ${sec % 60} s` : `${Math.floor(min / 60)} h ${min % 60} min`
}

const shortPath = (p: unknown) => {
  const s = String(p || '')
  if (cwdNow && s.startsWith(cwdNow + '/')) return s.slice(cwdNow.length + 1)
  return home && s.startsWith(home + '/') ? '~' + s.slice(home.length) : s
}

const oneLine = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim()

const toolHead = (tool: string, input: any) => {
  const i = input && typeof input === 'object' ? input : {}
  const mcp = /^mcp__(.+?)__(.+)$/.exec(tool)
  if (mcp) return { name: `${mcp[1]} · ${mcp[2]}`, arg: oneLine(Object.values(i).find((v) => typeof v === 'string') || '') }
  if (tool === 'Bash') return { name: oneLine(i.description) || 'Bash', arg: oneLine(i.command) }
  if (['Read', 'Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(tool)) return { name: tool, arg: shortPath(i.file_path ?? i.notebook_path) }
  if (tool === 'Grep' || tool === 'Glob') return { name: tool === 'Grep' ? 'Buscar' : 'Glob', arg: oneLine(i.pattern) + (i.path ? ` en ${shortPath(i.path)}` : '') }
  if (tool === 'Agent' || tool === 'Task') return { name: `Agente${i.subagent_type ? ' ' + i.subagent_type : ''}`, arg: oneLine(i.description) }
  if (tool === 'WebFetch' || tool === 'WebSearch') return { name: tool, arg: oneLine(i.url ?? i.query) }
  const first = Object.values(i).find((v) => typeof v === 'string')
  return { name: tool, arg: oneLine(first || '') }
}

const toolGlyph = (p: { isRunning?: boolean; isErrored?: boolean; isInterrupted?: boolean }) =>
  p.isRunning ? { g: SPIN[frame % 4], c: C.lime } : p.isErrored ? { g: '✖', c: C.red } : p.isInterrupted ? { g: '◌', c: C.dim } : { g: '◇', c: C.purple }

const GROUP_WORDS: Record<string, [string, string]> = {
  Read: ['lectura', 'lecturas'],
  Bash: ['comando', 'comandos'],
  Grep: ['búsqueda', 'búsquedas'],
  Glob: ['búsqueda', 'búsquedas'],
  LS: ['listado', 'listados'],
  WebFetch: ['página', 'páginas'],
  WebSearch: ['búsqueda web', 'búsquedas web'],
  ToolSearch: ['tool cargada', 'tools cargadas'],
}

const groupSummary = (calls: readonly any[]) => {
  const counts = new Map<string, number>()
  for (const c of calls) {
    const w = GROUP_WORDS[c.tool]
    const key = w ? w.join('|') : c.tool
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return [...counts].map(([k, n]) => (k.includes('|') ? `${n} ${n === 1 ? k.split('|')[0] : k.split('|')[1]}` : `${n} ${k}`)).join(' · ')
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`
}
const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const missionNotify = (root: string, project: string, took: string, unverified: number, c: { orange: string; amber: string; lime: string }) => {
  const check = unverified
    ? `<font color="${c.amber}"><b>⚠ ${unverified} sin verificar</b></font>`
    : `<font color="${c.lime}">✓ verificado</font>`
  const body = `<b>${escHtml(project)}</b>  ·  <font color="${c.orange}">⏱ ${took}</font>  ·  ${check}`
  return ['notify-send', '-a', 'NERV', '-i', `${root}/assets/mission-complete.png`, 'MISSION COMPLETE', body]
}
export const missionWindow = (project: string, took: string, unverified: number) => [
  'omarchy-shell',
  'shell',
  'summon',
  'gon.nerv-mission',
  JSON.stringify({ project, took, unverified }),
]
const ago = (ms: number) => {
  const m = Math.floor(ms / 60000)
  return m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.floor(m / 60)} h` : `hace ${Math.floor(m / 1440)} d`
}
const heat = (p: number) => (p >= 90 ? C.red : p >= 70 ? C.amber : C.lime)
const energyBar = (p: number, w: number, hue: string, t = now()) => {
  const filled = Math.max(p > 0 ? 1 : 0, Math.min(w, Math.round((p / 100) * w)))
  const base = int(hue)
  const step = Math.floor(t / 70)
  const glint = step % (filled + 4)
  const cells: { ch: number; color: number }[] = []
  for (let i = 0; i < w; i++) {
    if (i < filled) {
      let c = mix(int(C.ink), base, 0.45 + (0.55 * (i + 1)) / filled)
      if (i === glint) c = mix(base, 0xffffff, 0.6)
      else if (i === glint - 1 || i === glint + 1) c = mix(base, 0xffffff, 0.25)
      if (i === filled - 1 && step % 3 === 0) c = mix(c, 0xffffff, 0.35)
      if (p >= 90 && Math.floor(t / 250) % 2 === 0) c = mix(c, int(C.red), 0.4)
      cells.push({ ch: 0x2501, color: c })
    } else cells.push((step + i * 5) % 29 === 0 ? { ch: 0xb7, color: mix(int(C.dim), base, 0.45) } : { ch: 0x2508, color: int(C.dim) })
  }
  return cells
}

const gaugeCells = (p: number, w: number, hue: string) => {
  const bar = energyBar(p, w, hue)
  return glyphs(w, 1, (x) => [bar[x].ch, bar[x].color])
}

let gauges: { key: string; p: number; w: number; hue: string }[] = []

const dots = (p: number, w: number) => {
  const f = Math.max(0, Math.min(w, Math.round((p / 100) * w)))
  return '●'.repeat(f) + '·'.repeat(w - f)
}
const blink = () => Math.floor(frame / 4) % 2 === 0
const tag = (text: string, name: string) => (text.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)) || [])[1]

const label = (e: any) => {
  if (e.tool === 'Bash') return e.description || e.command || 'Bash'
  if (EDIT_TOOLS.includes(e.tool) || e.tool === 'Read') return base(e.file_path || e.notebook_path || '')
  if (e.tool === 'Grep' || e.tool === 'Glob') return e.pattern || ''
  if (e.tool === 'Agent' || e.tool === 'Task') return e.description || ''
  if (e.tool === 'WebFetch') return (e.url || '').replace(/^https?:\/\//, '').split('/')[0]
  if (e.tool === 'WebSearch') return e.query || ''
  return ''
}

const pct = (k: string) => usage?.rateLimits?.find((l: any) => l.kind === k)?.percentUsed

const take = (u: any) => {
  if (!u) return
  usage = u
  const p = pct('five_hour')
  if (typeof p === 'number') {
    samples.push({ t: now(), pct: p })
    samples = samples.filter((s) => now() - s.t < 3600000)
  }
}

const remaining = () => {
  const p = pct('five_hour')
  if (typeof p !== 'number' || samples.length < 2) return undefined
  const first = samples[0]
  const rate = (p - first.pct) / ((now() - first.t) / 60000)
  if (rate <= 0) return undefined
  return ((100 - p) / rate) * 60000
}

const EFFORTS = [
  { id: 'low', name: 'LOW', get hue() { return RGB.cyan } },
  { id: 'medium', name: 'MEDIUM', get hue() { return RGB.lime } },
  { id: 'high', name: 'HIGH', get hue() { return RGB.amber } },
  { id: 'xhigh', name: 'XHIGH', get hue() { return RGB.orange } },
  { id: 'max', name: 'MAX', get hue() { return RGB.red } },
]

const effortLevel = (v = effort) => {
  if (typeof v === 'number') return Math.max(1, Math.min(5, Math.round(Math.log2(Math.max(1024, v) / 1024)) + 1))
  return EFFORTS.findIndex((x) => x.id === v) + 1
}

const effortName = () => (typeof effort === 'number' ? `${Math.round(effort / 1000)}K` : EFFORTS[effortLevel() - 1]?.name || '–')

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0')

const setEffort = (v: string | number | undefined) => {
  if (v === undefined || v === effort) return
  effortFrom = effortShown()
  effortAt = now()
  effort = v
}

const effortShown = () => {
  const k = Math.min(1, (now() - effortAt) / 1100)
  return effortFrom + (effortLevel() - effortFrom) * (1 - (1 - k) ** 3)
}

const battery = () => (usage?.context?.percent ?? 0) >= BATTERY_AT || (pct('five_hour') ?? 0) >= BATTERY_AT

async function ghEnv($: any, cwd: string) {
  const r = await $.process.run(['git', 'remote', 'get-url', 'origin'], { cwd, timeoutMs: 5000 }).catch(() => undefined)
  const url = r?.stdout?.trim() || ''
  if (!url) return undefined
  if (!/github\.com[:/]gonzalonicolasr\//.test(url)) return {}
  const t = await $.process.run(['gh', 'auth', 'token', '--user', 'gonzalonicolasr'], { timeoutMs: 5000 }).catch(() => undefined)
  return t?.exitCode === 0 ? { GH_TOKEN: t.stdout.trim() } : {}
}

const WS_SCAN = [
  'while IFS= read -r r; do',
  '  [ -e "$r/.git" ] || continue',
  '  e=$(git -C "$r" config user.email 2>/dev/null)',
  '  [ -n "$e" ] || continue',
  '  n=${r%/}; n=${n##*/}',
  '  git -C "$r" log --all --since=26.weeks --format="D %H %ad" --date=short --author="$e" 2>/dev/null',
  '  git -C "$r" log --all -3 --since=26.weeks --format="C%x1f$n%x1f%ct%x1f%h%x1f%s%x1f$r" --author="$e" 2>/dev/null',
  "done | awk '/^D /{ if (!seen[$2]++) c[$3]++; next } { print } END { for (d in c) printf \"D\\x1f%d\\x1f%s\\n\", c[d], d }'",
].join('\n')

const WS_STATE = 'while IFS= read -r r; do printf "%s\\x1f%s\\x1f%s\\n" "$r" "$(git -C "$r" rev-parse --abbrev-ref HEAD 2>/dev/null)" "$(git -C "$r" status --porcelain 2>/dev/null | wc -l)"; done'

async function refreshWorkspace($: any) {
  if (wsBusy || !home) return
  wsBusy = true
  try {
    let roots = [`${home}/projects`]
    try {
      const cfg = JSON.parse(String((await $.fs.read(`${home}/.config/nerv/projects.json`).catch(() => '')) || '{}'))
      if (Array.isArray(cfg.roots) && cfg.roots.length) roots = cfg.roots.map((r: string) => String(r).replace(/^~(?=\/|$)/, home))
    } catch {}
    const dirs: string[] = []
    for (const root of roots) for (const d of ((await $.fs.list(root).catch(() => [])) as any[])) if (d.kind === 'dir') dirs.push(`${root}/${d.name}`)
    const r = await $.process.run(['bash', '-c', WS_SCAN], { stdin: dirs.join('\n') + '\n', timeoutMs: 60000 }).catch(() => undefined)
    if (r?.exitCode !== 0) return
    const days: Record<string, number> = {}
    const commits: any[] = []
    const seen = new Set<string>()
    for (const line of String(r.stdout).split('\n')) {
      const f = line.split('\x1f')
      if (f[0] === 'D') days[f[2]] = (days[f[2]] || 0) + Number(f[1])
      else if (f[0] === 'C' && !seen.has(f[3])) {
        seen.add(f[3])
        commits.push({ repo: f[1], ct: Number(f[2]), h: f[3], s: f[4], path: f[5] })
      }
    }
    commits.sort((a, b) => b.ct - a.ct)
    const last = new Map<string, any>()
    for (const c of commits) if (!last.has(c.repo)) last.set(c.repo, c)
    const top = [...last.values()].slice(0, 6)
    const st = await $.process.run(['bash', '-c', WS_STATE], { stdin: top.map((c) => c.path).join('\n') + '\n', timeoutMs: 30000 }).catch(() => undefined)
    const info = new Map<string, string[]>()
    for (const line of String(st?.stdout || '').split('\n')) if (line) info.set(line.split('\x1f')[0], line.split('\x1f'))
    ws = {
      days,
      repos: top.map((c) => ({ name: c.repo, ct: c.ct, branch: info.get(c.path)?.[1] || '?', dirty: Number(info.get(c.path)?.[2] || 0) })),
      recent: commits.slice(0, 8),
    }
    wsAt = now()
    if (!gitInfo.ok) commitDays = ws.days
    $.ui.invalidate('ui.render')
  } finally {
    wsBusy = false
  }
}

async function refreshWidePRs($: any) {
  const who = await $.process.run(['bash', '-c', 'gh auth status 2>&1 | grep -o "account [^ ]*" | cut -d" " -f2 | sort -u'], { timeoutMs: 10000 }).catch(() => undefined)
  const users = String(who?.stdout || '').split('\n').filter(Boolean)
  const all: any[] = []
  for (const u of users) {
    const t = await $.process.run(['gh', 'auth', 'token', '--user', u], { timeoutMs: 5000 }).catch(() => undefined)
    if (t?.exitCode !== 0) continue
    const r = await $.process
      .run(['gh', 'search', 'prs', '--author', '@me', '--state', 'open', '--limit', '15', '--json', 'repository,number,title,url,isDraft'], { env: { GH_TOKEN: t.stdout.trim() }, timeoutMs: 20000 })
      .catch(() => undefined)
    if (r?.exitCode !== 0) continue
    try {
      for (const p of JSON.parse(r.stdout)) all.push({ ...p, repo: p.repository?.name || '' })
    } catch {}
  }
  prs = all
  prsWide = true
  prError = users.length ? '' : 'sin cuentas de gh'
}

async function refreshPRs($: any) {
  const cwd = await $.session.cwd().catch(() => '')
  if (!cwd) return
  const env = await ghEnv($, cwd)
  if (!env) return refreshWidePRs($)
  prsWide = false
  if (!ghMe) {
    const me = await $.process.run(['gh', 'api', 'user', '-q', '.login'], { cwd, env, timeoutMs: 10000 }).catch(() => undefined)
    ghMe = me?.exitCode === 0 ? me.stdout.trim() : ''
  }
  const r = await $.process
    .run(['gh', 'pr', 'list', '--state', 'open', '--limit', '20', '--json', 'number,title,reviewDecision,isDraft,statusCheckRollup,url,author'], { cwd, env, timeoutMs: 20000 })
    .catch((err: any) => ({ exitCode: 1, stdout: '', stderr: String(err) }))
  if (r.exitCode !== 0) prError = clip((r.stderr || 'gh falló').split('\n')[0], 60)
  else
    try {
      prs = JSON.parse(r.stdout)
      prError = ''
    } catch {
      prError = 'respuesta de gh ilegible'
    }
}

// Cuenta de la sesión: personal = ~/.claude directo a Anthropic; priv8 = la misma config pero por
// el CPAM con un modelo priv8/…. Otro config dir (Wibond) u otro prefijo del CPAM: sin menú.
export const acctFor = (o: { configDir: string; home: string; cpam: boolean; model: string }) =>
  o.configDir && o.configDir !== `${o.home}/.claude` ? '' : !o.cpam ? 'personal' : /^priv8\//.test(o.model) ? 'priv8' : ''
// El modelo priv8/ al que se pasa: el mismo Claude de ahora si priv8 lo tiene, si no el mismo
// tipo (opus/sonnet/haiku) más nuevo, si no el opus más nuevo. '' = el CPAM no expone priv8/.
export const priv8Pick = (ids: readonly string[], model: string) => {
  const mine = ids.filter((x) => /^priv8\/claude-/.test(x)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  const b = bare(model).replace(/\[.*\]$/, '')
  const fam = /^(?:claude-)?(opus|sonnet|haiku|fable)\b/.exec(b)?.[1] || 'opus'
  return mine.find((x) => x === 'priv8/' + b) || mine.find((x) => x.startsWith(`priv8/claude-${fam}-`)) || mine.find((x) => x.startsWith('priv8/claude-opus-')) || mine[0] || ''
}
const acctNow = () => acctFor({ configDir, home, cpam: mdlCpam, model })
const acctName = (id: string) => (emails[id] || mdl.emails[id] || id).split('@')[0]
const acctToggle = ($: any) => {
  acctMenu = !acctMenu
  acctNote = ''
  if (acctMenu) void refreshModels($, true)
  $.ui.invalidate('ui.render')
}

async function loadEmails($: any) {
  for (const a of ACCOUNTS.filter((x) => x.conf)) {
    try {
      emails[a.id] = String(JSON.parse((await $.fs.read(`${home}/${a.conf}`).catch(() => '')) || '{}')?.oauthAccount?.emailAddress || '')
    } catch {}
  }
}

async function switchAccount($: any, id: string) {
  // No reemplaza la sesión: abre una tab nueva de herdr que reanuda esta conversación (fork).
  acctNote = working ? 'esperá a que termine el turno' : !paneId || !sessionId ? 'sólo se puede dentro de herdr' : ''
  if (!acctNote && id === 'priv8' && !mdl.ids.length) await refreshModels($, true)
  let target = id === 'priv8' ? priv8Pick(mdl.ids, model) : ''
  if (!acctNote && id === 'priv8' && !target) {
    await refreshModels($, true) // la lista cacheada puede ser de antes del prefix
    target = priv8Pick(mdl.ids, model)
  }
  if (!acctNote && id === 'priv8' && !target) acctNote = mdl.ids.length ? 'el CPAM no expone priv8/ — falta el prefix' : mdl.err || 'el CPAM no respondió'
  if (!acctNote) {
    await relaunchWith($, target)
    acctNote = mdlNote.startsWith('✓') ? `✓ ${acctName(id)} en tab nueva (fork de esta conversación)` : mdlNote
  }
  $.ui.invalidate('ui.render')
}

async function refreshTasks($: any) {
  if (!home || !sessionId) return
  const list = (await $.env.get('CLAUDE_CODE_TASK_LIST_ID').catch(() => '')) || sessionId
  const dir = `${configDir || home + '/.claude'}/tasks/${list}`
  const files = ((await $.fs.list(dir).catch(() => [])) as any[]).filter((f) => /^\d+\.json$/.test(f.name))
  const out: typeof sessionTasks = []
  for (const f of files) {
    try {
      const x = JSON.parse((await $.fs.read(`${dir}/${f.name}`).catch(() => '')) || '{}')
      if (x?.subject && x.status !== 'deleted') out.push({ id: String(x.id ?? f.name.slice(0, -5)), subject: String(x.subject), status: String(x.status || 'pending'), blockedBy: (x.blockedBy || []).map(String) })
    } catch {}
  }
  sessionTasks = out.sort((a, b) => Number(a.id) - Number(b.id))
}

async function refreshLocal($: any) {
  await refreshTasks($)
  const cwd = await $.session.cwd().catch(() => '')
  cwdNow = cwd
  project = base(cwd)
  model = await $.session.model().catch(() => model)
  const b = await $.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { cwd, timeoutMs: 5000 }).catch(() => undefined)
  branch = b?.exitCode === 0 ? b.stdout.trim() : ''
  const tl = await $.process.run(['git', 'rev-parse', '--show-toplevel'], { cwd, timeoutMs: 5000 }).catch(() => undefined)
  gitRoot = tl?.exitCode === 0 ? tl.stdout.trim() : ''
  const em = await $.process.run(['git', 'config', 'user.email'], { cwd, timeoutMs: 5000 }).catch(() => undefined)
  const email = em?.exitCode === 0 ? em.stdout.trim() : ''
  const lg = await $.process
    .run(['git', 'log', '--all', '--since=26.weeks', '--format=%ad', '--date=short', ...(email ? ['--author=' + email] : [])], { cwd, timeoutMs: 10000 })
    .catch(() => undefined)
  const days: Record<string, number> = {}
  if (lg?.exitCode === 0) for (const d of lg.stdout.split('\n')) if (d) days[d] = (days[d] || 0) + 1
  commitDays = days
  commitAuthor = email
  const stb = await $.process.run(['git', 'status', '--porcelain=2', '--branch'], { cwd, timeoutMs: 8000 }).catch(() => undefined)
  const sl = stb?.exitCode === 0 ? stb.stdout.split('\n') : []
  const ab = (sl.find((l: string) => l.startsWith('# branch.ab')) || '').match(/\+(\d+) -(\d+)/)
  const up = (sl.find((l: string) => l.startsWith('# branch.upstream')) || '').replace('# branch.upstream ', '')
  const dirty = sl.filter((l: string) => l && !l.startsWith('#')).length
  const rl = await $.process.run(['git', 'log', '-8', '--format=%h%x1f%s%x1f%ar%x1f%an'], { cwd, timeoutMs: 8000 }).catch(() => undefined)
  gitInfo = {
    ok: stb?.exitCode === 0,
    upstream: up,
    ahead: ab ? Number(ab[1]) : 0,
    behind: ab ? Number(ab[2]) : 0,
    dirty,
    recent: rl?.exitCode === 0 ? rl.stdout.split('\n').filter(Boolean).map((l: string) => l.split('\x1f')) : [],
  }
  if (!gitInfo.ok) {
    if (ws) commitDays = ws.days
    if (now() - wsAt > 300000) void refreshWorkspace($)
  }
  const st: any = await $.settings.read().catch(() => undefined)
  const se = String(st?.effortLevel || '')
  if (se && se !== settingsEffort) {
    settingsEffort = se
    if (!effortPick) setEffort(se)
  }
  if (home) {
    const log = await $.fs.read(`${home}/.local/state/claude-healthcheck.log`).catch(() => '')
    const lines = (log || '').trim().split('\n')
    const last = lines.filter((l: string) => /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d /.test(l)).at(-1) || ''
    const when = last.slice(11, 16)
    if (/ ok$/.test(last)) health = { ok: true, when, text: 'servicios ok' }
    else if (last) {
      const i = lines.lastIndexOf(last)
      const falla = lines.slice(i + 1).find((l: string) => l.startsWith('- ')) || 'algo falló'
      health = { ok: false, when, text: falla.replace(/^- /, '') }
    }
  }
  // la línea bajo el prompt sólo se redibuja si alguien lo pide (rama, modelo, git)
  $.ui.invalidate('ui.render')
}

async function refreshHw($: any) {
  if (hwBusy || !home) return
  hwBusy = true
  try {
    const env: Record<string, string> = ramTotal ? { JCODE_RAIL_RAM_TOTAL: ramTotal } : {}
    const r = await $.process.run([`${home}/.local/bin/jcode-rail`, '--json'], { env, timeoutMs: 8000 }).catch(() => undefined)
    if (r?.exitCode === 0) {
      hw = JSON.parse(r.stdout)
      if (typeof hw?.cpu?.pct === 'number') cpuHist.push(hw.cpu.pct)
      if (typeof hw?.gpu?.util === 'number') gpuHist.push(hw.gpu.util)
      while (cpuHist.length > 200) cpuHist.shift()
      while (gpuHist.length > 200) gpuHist.shift()
    }
  } catch {
  } finally {
    hwBusy = false
  }
}

const LIVE_SNAP = `deep=$1; rt=\${XDG_RUNTIME_DIR:-/run/user/$(id -u)}
mpvpid() { for p in $(pgrep -x mpv); do tr '\\0' '\\n' </proc/$p/cmdline 2>/dev/null | grep -qx -- "--title=$1" && { echo $p; return; }; done; }
q() { printf '{"command":["get_property","%s"]}\\n' "$2" | socat -t 0.3 - UNIX-CONNECT:"$rt/$1-mpv.sock" 2>/dev/null | jq -r '.data // empty' 2>/dev/null | head -1; }
snap() {
  p=$(mpvpid "$2")
  if [ -z "$p" ]; then printf '%s\\toff\\n' "$1"; return; fi
  printf '%s\\ton\\t%s\\t%s\\t%s\\t%s\\n' "$1" "$(q "$2" width)" "$(q "$2" height)" "$(q "$2" estimated-vf-fps)" "$(ps -o %cpu= -p "$p" | tr -d ' ')"
}
printf 'dc\t%s\n' "$(jq -c '{ch:.channel.name,g:.channel.guild,n:(.members|length),m:[.members[:9][]|{name,self,speaking,mute,deaf,streaming}],live:.live.on,vc:.live.count,v:[.live.viewers[:7][].name]}' "$rt/nerv-discord.json" 2>/dev/null)"
snap cam camoverlay
snap ip iphonecam
st=\${XDG_STATE_HOME:-$HOME/.local/state}
printf 'ipstate\\t%s\\t%s\\t%s\\n' "$(cat "$rt/iphonecam-mode" 2>/dev/null)" "$(cat "$st/iphonecam/scene" 2>/dev/null)" "$(cat "$rt/iphonecam-blur" 2>/dev/null)"
printf 'text\\t%s\\n' "$(tr '\\n\\t' '  ' < "$st/camoverlay-text.txt" 2>/dev/null)"
printf 'discord\\t%s\\n' "$(pgrep -ix discord >/dev/null && echo 1)"
if [ "$deep" = 1 ]; then
  ip=$(jq -r '.. | .cur_dev_ip? // empty' "$HOME/.config/droidcam-obs-client/basic/scenes/Untitled.json" 2>/dev/null | head -1)
  if [ -n "$ip" ] && name=$(curl -fs -m 1.5 "http://$ip:4747/v1/phone/name"); then
    printf 'ipapi\\t%s\\t%s\\t%s\\n' "$(echo "$name" | tr '\\n\\t' '  ')" "$(curl -fs -m 1.5 "http://$ip:4747/v1/phone/battery_info" | tr '\\n\\t' '  ')" "$(curl -fs -m 1.5 "http://$ip:4747/v1/camera/info" | tr '\\n\\t' '  ')"
  else printf 'ipapi\\t\\n'; fi
fi`

const liveJson = (s: string): any => {
  try {
    return JSON.parse(s)
  } catch {
    return undefined
  }
}

export const liveBattery = (raw: string): { bat: number; charging: boolean } => {
  const j = liveJson(raw)
  const lvl = Number(j?.level ?? j?.battery ?? j?.percent ?? (typeof j === 'number' ? j : NaN))
  return { bat: Number.isFinite(lvl) ? Math.round(lvl <= 1 ? lvl * 100 : lvl) : -1, charging: !!(j?.charging ?? j?.isCharging ?? j?.plugged) }
}

export const liveDc = (raw: string): LiveDc | null | undefined => {
  const j = liveJson(raw)
  if (!j || typeof j !== 'object') return undefined
  if (!j.ch) return null
  const m = (Array.isArray(j.m) ? j.m : []).map((x: any) => ({ name: String(x?.name || '?'), self: !!x?.self, speaking: !!x?.speaking, mute: !!x?.mute, deaf: !!x?.deaf, streaming: !!x?.streaming }))
  const v = (Array.isArray(j.v) ? j.v : []).map((x: any) => String(x || '?'))
  return { ch: String(j.ch), g: String(j.g || ''), n: Math.max(Number(j.n) || 0, m.length), m, live: !!j.live, vc: Math.max(Number(j.vc) || 0, v.length), v }
}

// El chat del canal de voz viene en nerv-discord.json. Sin campo chat = el NervLive cargado
// en Discord es el viejo (falta recargar); lista vacía = no hay mensajes.
export const liveChat = (raw: string): LiveChatMsg[] | undefined => {
  const c = liveJson(raw)?.chat
  if (!c || typeof c !== 'object' || !Array.isArray(c.m)) return undefined
  return c.m.slice(-8).map((x: any) => ({ a: String(x?.a || '?'), t: String(x?.t ?? '').replace(/\s+/g, ' ').trim(), ts: Number(x?.ts) || 0, self: !!x?.self }))
}

// Corta en palabras por ancho de celdas: la primera línea mide `first`, las siguientes `rest`.
// Una palabra más larga que la línea se parte.
export const wrapCells = (s: string, first: number, rest = first): string[] => {
  const out: string[] = []
  let line = ''
  const room = () => Math.max(1, out.length ? rest : first)
  for (const word of String(s).split(' ').filter(Boolean)) {
    let wd = word
    if (line && cellWidth(line) + 1 + cellWidth(wd) > room()) {
      out.push(line)
      line = ''
    }
    while (cellWidth((line ? line + ' ' : '') + wd) > room()) {
      let cut = ''
      for (const ch of wd) {
        if (cellWidth((line ? line + ' ' : '') + cut + ch) > room()) break
        cut += ch
      }
      if (!cut && line) {
        out.push(line)
        line = ''
        continue
      }
      if (!cut) cut = [...wd][0]!
      out.push((line ? line + ' ' : '') + cut)
      line = ''
      wd = wd.slice(cut.length)
    }
    line = line ? line + ' ' + wd : wd
  }
  if (line || !out.length) out.push(line)
  return out
}

// Filas visibles de la tarjeta del chat en el dock; el resto se lee scrolleando adentro.
export const CHAT_ROWS = 5
let chatPrevMax = 0
// Scroll del chat: si estaba abajo del todo (o nunca se tocó) sigue anclado al último mensaje;
// si subiste a leer, se queda donde estabas.
export const chatScroll = (off: number | undefined, prevMax: number, max: number) => (off === undefined || off >= prevMax ? max : Math.min(off, max))

export type ChatLine = { author?: string; text: string; self: boolean; who: number }
// Líneas del chat para `width` celdas, lo más nuevo abajo, en `max` líneas como mucho. Entran
// mensajes enteros desde el último hacia atrás; si el último solo no entra, se recorta con "…".
export const chatLines = (msgs: readonly LiveChatMsg[], width: number, max: number): ChatLine[] => {
  const out: ChatLine[] = []
  for (let i = msgs.length - 1; i >= 0 && max > 0; i--) {
    const m = msgs[i]!
    const author = clip(m.a, Math.max(4, Math.floor(width / 2)))
    const body = wrapCells(m.t, width - cellWidth(author) - 2, width - 2)
    const who = [...m.a].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
    const lines: ChatLine[] = body.map((text, j) => (j ? { text: '  ' + text, self: m.self, who } : { author, text, self: m.self, who }))
    if (out.length + lines.length > max) {
      if (!out.length) {
        const keep = lines.slice(0, max)
        const last = keep[max - 1]!
        const room = Math.max(1, width - (last.author ? cellWidth(last.author) + 2 : 0))
        last.text = cellWidth(last.text) < room ? last.text + '…' : clip(last.text, room)
        return keep
      }
      break
    }
    out.unshift(...lines)
  }
  return out
}

// En Go Live se listan sólo los que te miran; los que no entran quedan en "+N más".
export const liveViewers = (dc: LiveDc) => ({ names: dc.v, more: Math.max(0, dc.vc - dc.v.length) })

export const liveLens = (raw: string): string => {
  const j = liveJson(raw)
  if (!j) return ''
  const list = j.cameras || j.lenses || j.list
  const act = j.active ?? j.current ?? j.camera
  if (Array.isArray(list) && act != null) {
    const x = list[Number(act)] ?? list.find((c: any) => c?.id === act || c?.index === act)
    const nm = typeof x === 'string' ? x : x?.name || x?.label || x?.type
    if (nm) return String(nm)
  }
  return typeof act === 'string' ? act : act != null ? `lente ${act}` : ''
}

async function refreshLive($: any) {
  if (live.busy || !home) return
  live.busy = true
  try {
    const n = ++live.n
    const r = await $.process.run(['bash', '-c', LIVE_SNAP, 'nerv-live', n % 10 === 1 ? '1' : '0'], { timeoutMs: 12000 }).catch(() => undefined)
    for (const line of String(r?.stdout || '').split('\n')) {
      const f = line.split('\t')
      if (f[0] === 'cam' || f[0] === 'ip') {
        const c = live[f[0] as 'cam' | 'ip']
        c.on = f[1] === 'on'
        if (c.on) {
          c.w = Number(f[2]) || 0
          c.h = Number(f[3]) || 0
          c.fps = Math.round(Number(f[4]) || 0)
          c.cpu = Math.round(Number(f[5]) || 0)
        }
      } else if (f[0] === 'ipstate') {
        live.ip.mode = f[1] || ''
        live.ip.scene = f[2] || ''
        live.ip.blur = f[3] === '1'
      } else if (f[0] === 'text') live.text = f[1] || ''
      else if (f[0] === 'dc') live.dc = liveDc(f[1] || '')
      else if (f[0] === 'discord') live.discord = f[1] === '1'
      else if (f[0] === 'ipapi') {
        live.ip.reach = !!f[1]
        if (f[1]) {
          live.ip.name = clip(liveJson(f[1])?.name || f[1].replace(/^"|"$/g, ''), 24)
          Object.assign(live.ip, liveBattery(f[2] || ''))
          live.ip.lens = liveLens(f[3] || '')
        }
      }
    }
    live.chat = live.discord && live.dc ? liveChat(String((await $.fs.read(`${runDir}/nerv-discord.json`).catch(() => '')) || '')) : undefined
  } finally {
    live.busy = false
  }
  $.ui.invalidate('ui.render')
}

async function liveRun($: any, args: string[]) {
  await $.process.run(['setsid', '-f', ...args], { timeoutMs: 5000 }).catch(() => undefined)
  await $.clock.sleep(1500).catch(() => undefined)
  await refreshLive($)
}

async function herdrJson($: any, args: string[]) {
  const r = await $.process.run(['herdr', ...args], { timeoutMs: 5000 }).catch(() => undefined)
  if (r?.exitCode !== 0) return undefined
  try {
    return JSON.parse(r.stdout).result
  } catch {
    return undefined
  }
}

async function checkFocus($: any) {
  const r = await herdrJson($, ['pane', 'get', paneId])
  if (!r?.pane) return
  const was = away
  away = r.pane.focused === false
  if (!was && away) stopFast()
  if (was && !away) {
    startFast($)
    refreshLocal($)
    $.ui.invalidate('ui.render')
  }
}

function stopFast() {
  for (const t of fast) t.cancel()
  fast = []
}

function startFast($: any) {
  stopFast()
  fast.push(
    $.clock.every(125, () => {
      frame++
      if (!quiet && !placedOnce && frame % 24 === 0) void openPane($)
      if (quiet || !paneOpen || away) return
      if (tab === 'hw' && frame % 24 === 0) refreshHw($)
      if (tab === 'live' && frame % 12 === 0) void refreshLive($)
      if (tab === 'forge' && frame % 8 === 0) refreshForge($)
      if (tab === 'nodd' && frame % 16 === 0) refreshNodd($)
      if (tab === 'edd' && frame % 16 === 0) void refreshEdd($)
      if (tab === 'cortex' && frame % 960 === 0) refreshCortex($)
      if (tab === 'yt' && frame % 8 === 0) ytPoll($)
      if (tab === 'models' && frame % 480 === 0) void refreshModels($)
      if ((tab === 'models' || acctMenu) && frame % 24 === 0) void cpamWatch($)
      if (working || battery() || patternBlue || now() < confettiUntil || tab !== 'magi' || frame % 2 === 0) $.ui.invalidate('ui.render')
    }),
    $.clock.every(50, () => {
      if (quiet || !paneOpen || away || tab !== 'magi' || folded.has('sync') || !gauges.length) return
      for (const g of gauges) $.ui.blit({ requestId: PANE, key: g.key, cells: gaugeCells(g.p, g.w, g.hue), columns: g.w, rows: 1 }).catch(() => undefined)
    }),
    $.clock.every(G0N_MS / 2, () => {
      if (quiet || !paneOpen || away || g0nShown < 0 || g0nFrame() === g0nShown) return
      $.ui.invalidate('ui.render')
    }),
  )
}

async function loadRecap($: any) {
  const all = ((await $.store.get('sessions').catch(() => undefined)) || {}) as Record<string, any>
  const cut = now() - 7 * 86400000
  for (const k of Object.keys(all)) if (all[k].beat < cut) delete all[k]
  const prev = Object.entries(all)
    .filter(([id, s]: any) => id !== sessionId && s.cwd === cwdNow && now() - s.beat > 180000 && s.prompt)
    .sort(([, a]: any, [, b]: any) => b.beat - a.beat)[0]
  if (prev) {
    recap = { prompt: (prev[1] as any).prompt, at: (prev[1] as any).beat }
    delete all[prev[0]]
  }
  all[sessionId] = { cwd: cwdNow, beat: now(), prompt: '' }
  await $.store.set('sessions', all).catch(() => undefined)
}

async function beat($: any, prompt?: string) {
  if (!sessionId) return
  const all = ((await $.store.get('sessions').catch(() => undefined)) || {}) as Record<string, any>
  const mine = all[sessionId] || { cwd: cwdNow, prompt: '' }
  all[sessionId] = { ...mine, beat: now(), ...(prompt ? { prompt: clip(prompt.replace(/\s+/g, ' '), 140) } : {}) }
  await $.store.set('sessions', all).catch(() => undefined)
}

async function clean($: any) {
  const all = ((await $.store.get('sessions').catch(() => undefined)) || {}) as Record<string, any>
  delete all[sessionId]
  await $.store.set('sessions', all).catch(() => undefined)
}

const cells = (cols: number, rows: number, paint: (x: number, y: number) => number) => {
  const words = new Uint32Array(cols * rows * 3)
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const top = paint(c, r * 2)
      const bot = paint(c, r * 2 + 1)
      const i = (r * cols + c) * 3
      if (top === RGB.none && bot === RGB.none) {
        words[i] = 0x20
        words[i + 1] = RGB.none
        words[i + 2] = RGB.none
      } else if (top === RGB.none) {
        words[i] = 0x2584
        words[i + 1] = bot
        words[i + 2] = RGB.none
      } else {
        words[i] = 0x2580
        words[i + 1] = top
        words[i + 2] = bot
      }
    }
  return (new Uint8Array(words.buffer) as any).toBase64()
}

const TRAIL = [0x28ff, 0x28f7, 0x28f6, 0x2876, 0x2836, 0x2816, 0x2806, 0x2804]

const glyphs = (cols: number, rows: number, paint: (x: number, y: number) => [number, number] | undefined) => {
  const words = new Uint32Array(cols * rows * 3)
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 3
      const g = paint(x, y)
      words[i] = g ? g[0] : 0x20
      words[i + 1] = g ? g[1] : RGB.none
      words[i + 2] = RGB.none
    }
  return (new Uint8Array(words.buffer) as any).toBase64()
}

const hash = (x: number, y: number, k: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453
  return v - Math.floor(v)
}

const ramp = (stops: number[], v: number) => {
  const p = Math.max(0, Math.min(0.9999, v)) * (stops.length - 1)
  const i = Math.floor(p)
  return mix(stops[i], stops[i + 1], p - i)
}

const G0N_FRAMES = 64
const G0N_MS = 70
let g0nShown = -1
const g0nFrame = () => Math.floor(now() / G0N_MS) % G0N_FRAMES
// En EN VIVO el cartel se oculta y sus filas quedan para las cámaras y el chat.
export const g0nShownIn = (tabId: string) => tabId !== 'live'
// El medidor de EFFORT de abajo también se oculta en EN VIVO: esas filas van a las cámaras.
export const effortShownIn = (tabId: string) => tabId !== 'live'

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const heatColor = (n: number) => (n <= 0 ? 0x3a2d52 : n === 1 ? RGB.violet : n <= 3 ? RGB.purple : n <= 6 ? RGB.lime : n <= 10 ? RGB.orange : RGB.red)

const commitStats = (weeks: number) => {
  const today = new Date()
  let total = 0
  for (let i = 0; i < weeks * 7; i++) total += commitDays[dayKey(new Date(today.getTime() - i * 86400000))] || 0
  let streak = 0
  for (let i = commitDays[dayKey(today)] ? 0 : 1; commitDays[dayKey(new Date(today.getTime() - i * 86400000))]; i++) streak++
  return { total, streak, today: commitDays[dayKey(today)] || 0 }
}

const heatCells = (cols: number, weeks: number) => {
  const today = new Date()
  const dow = today.getDay()
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.35)
  return glyphs(cols, 7, (x, y) => {
    if (x % 2 === 1) return undefined
    const w = weeks - 1 - x / 2
    const back = w * 7 + (dow - y)
    if (w < 0 || back < 0) return undefined
    const n = commitDays[dayKey(new Date(today.getTime() - back * 86400000))] || 0
    const c = heatColor(n)
    return [0x25a0, back === 0 ? mix(n ? c : RGB.purple, 0xffffff, 0.25 + 0.45 * pulse) : c]
  })
}

const sparkCells = (cols: number, rows: number) => {
  const h = rows * 2
  const level = (hist: number[], x: number) => {
    const v = hist[hist.length - cols + x]
    return typeof v === 'number' ? h - 1 - Math.round((v / 100) * (h - 1)) : undefined
  }
  return cells(cols, rows, (x, y) => {
    const g = level(gpuHist, x)
    const c = level(cpuHist, x)
    if (c !== undefined && y === c) return RGB.lime
    if (g !== undefined && y >= g) return y === g ? RGB.purple : RGB.deep
    return RGB.none
  })
}

const SCAN_W = 18
const VERBS: Record<string, string[]> = {
  thinking: ['Sincronizando', 'Consultando a MAGI', 'Analizando patrón', 'Calculando'],
  requesting: ['Conectando cable umbilical', 'Enlazando con MAGI'],
  responding: ['Transmitiendo', 'Redactando informe'],
  'tool-input': ['Preparando despliegue', 'Armando la orden'],
  'tool-use': ['Desplegando', 'Ejecutando operación'],
}
const SCAN_COLOR: Record<string, number> = {
  get thinking() { return RGB.purple },
  get requesting() { return RGB.amber },
  get responding() { return RGB.cyan },
  get 'tool-input'() { return RGB.lime },
  get 'tool-use'() { return RGB.lime },
}

const mix = (a: number, b: number, k: number) => {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k)
  return (ch(16) << 16) | (ch(8) << 8) | ch(0)
}

const scanCells = (mode: string) => {
  const span = SCAN_W - 1
  const pos = frame % (span * 2)
  const head = pos <= span ? pos : span * 2 - pos
  const dir = pos <= span ? 1 : -1
  const hue = SCAN_COLOR[mode] || RGB.purple
  return glyphs(SCAN_W, 1, (x) => {
    const behind = (head - x) * dir
    if (x === head) return [0x28ff, 0xffffff]
    if (behind > 0 && behind < TRAIL.length) return [TRAIL[behind], mix(hue, RGB.trail, behind / TRAIL.length)]
    if (hash(x, 0, Math.floor(frame / 2)) > 0.8) return [0x2802, RGB.spark]
    return undefined
  })
}

const effortGeom = (cols: number) => {
  const segW = Math.max(3, Math.floor((cols - 4 - 4) / 5))
  return { segW, step: segW + 1 }
}

const effortCells = (cols: number) => {
  const lvl = effortLevel()
  const shown = effortShown()
  const { segW, step } = effortGeom(cols)
  const charging = now() - effortAt < 1100
  return cells(cols, 2, (x, py) => {
    const sx = x - (3 - py)
    if (sx < 0) return RGB.none
    const seg = Math.floor(sx / step)
    const inner = sx % step
    if (seg > 4 || inner >= segW) return RGB.none
    const hue = EFFORTS[seg].hue
    const fillK = Math.max(0, Math.min(1, shown - seg))
    const lit = inner < fillK * segW
    const edge = py === 0 || py === 3 || inner === 0 || inner === segW - 1
    if (!lit) return edge ? mix(hue, RGB.ink, 0.72) : RGB.none
    if (lvl === 5 && seg === 4) return (sx + py + Math.floor(frame / 2)) % 4 < 2 ? RGB.red : 0x3a0a10
    let col = mix(mix(hue, RGB.ink, 0.25), hue, inner / Math.max(1, segW - 1))
    if (py === 0) col = mix(col, 0xffffff, 0.35)
    if (py === 3) col = mix(col, RGB.ink, 0.35)
    if (seg === lvl - 1) {
      const pulse = 0.5 + 0.5 * Math.sin(frame * (working ? 0.5 : 0.22))
      const sweep = (frame * (working ? 0.8 : 0.35)) % (segW + 6) - 3
      col = mix(col, 0xffffff, 0.15 * pulse + 0.55 * Math.exp(-(((inner - sweep) / 1.6) ** 2)))
    }
    if (charging && Math.abs(inner - fillK * segW) < 1.5) col = mix(col, 0xffffff, 0.7)
    return col
  })
}

function draw($: any, e: any) {
  const { Box, Text, Raster, Button, Link, Input, Image } = $.ui.resolve(e)
  const dock = e.props.placement === 'dock' && (e.props.scroll?.bodyRows || 0) > 0
  for (const k of Object.keys(cardMax)) delete cardMax[k]
  const cols = Math.max(20, (e.props.bodyColumns || 40) - (dock ? 1 : 0))
  const compact = !dock
  const narrow = compact && cols < 56
  const w = cols - 4
  const t = (children: any[], color = C.text, extra: any = {}) => Text({ wrap: 'truncate', color, children, ...extra })
  const span = (s: string, color: string, extra: any = {}) => Text({ color, children: [s], ...extra })
  const foldBtn = (key: string) =>
    Button({
      key: 'fold-' + key,
      label: folded.has(key) ? '▸' : '▾',
      plain: true,
      dimColor: true,
      onPress: async () => {
        if (folded.has(key)) folded.delete(key)
        else folded.add(key)
        $.ui.invalidate('ui.render')
        await $.store.set('folded', [...folded]).catch(() => undefined)
        await savePrefs($, { folded: [...folded] })
      },
    })
  const titleRow = (key: string, parts: any[], color: string) =>
    Box({ key: 'title-' + key, flexDirection: 'row', justifyContent: 'space-between', children: [t(parts, color), foldBtn(key)] })
  const card = (key: string, title: string, color: string, rows: any[]) =>
    Box({ key, flexDirection: 'column', borderStyle: 'round', borderColor: color, paddingX: 1, children: [titleRow(key, [span(title, color, { bold: true })], color), ...(folded.has(key) ? [] : rows)] })
  const kv = (left: any[], right: any[]) => Box({ flexDirection: 'row', justifyContent: 'space-between', children: [t(left), t(right)] })
  const kvBtn = (left: any[], btn: any) => Box({ flexDirection: 'row', justifyContent: 'space-between', children: [t(left), btn] })
  const scard = (key: string, title: string, color: string, rows: any[], max: number) => {
    const content = measure(rows, w)
    if (!dock || content <= max || folded.has(key)) return card(key, title, color, rows)
    const cmax = content - max
    const off = Math.max(0, Math.min(cardScroll[key] || 0, cmax))
    cardScroll[key] = off
    cardMax[key] = cmax
    const thumb = Math.max(1, Math.round((max * max) / content))
    const at = Math.round(((max - thumb) * off) / cmax)
    const rail: any[] = []
    for (let i = 0; i < max; i++) rail.push(Text({ color: i >= at && i < at + thumb ? color : C.dim, children: [i >= at && i < at + thumb ? '┃' : '│'] }))
    return Box({
      key,
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: color,
      paddingLeft: 1,
      children: [
        Box({ key: 'title-' + key, flexDirection: 'row', justifyContent: 'space-between', paddingRight: 1, children: [t([span(title, color, { bold: true }), span(`  ↕ ${off + 1}-${off + max}/${content}`, C.dim)], color), foldBtn(key)] }),
        Box({
          key: key + '-win',
          flexDirection: 'row',
          height: max,
          overflow: 'hidden',
          children: [
            Box({ key: key + '-clip', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', children: [Box({ key: key + '-in', flexDirection: 'column', flexShrink: 0, marginTop: -off, children: rows })] }),
            Box({ key: key + '-rail', flexDirection: 'column', width: 1, children: rail }),
          ],
        }),
      ],
    })
  }
  const chip = (key: string, label: string, active: boolean, bg: string, onPress: () => void) =>
    Box({ key: 'box-' + key, paddingX: 1, backgroundColor: active ? bg : C.chipDim, children: [Button({ key, label, plain: true, dimColor: !active, onPress })] })

  const out: any[] = []
  const alert = battery()
  const ink = C.ink
  const magi = ['メルキオール', 'バルタザール', 'カスパー']
  const vote = (i: number) => {
    if (alert || (patternBlue && i === 2)) return { word: '否決', fg: blink() ? C.lime : C.purple, bg: C.chipDim, on: true }
    if (working && Math.floor(frame / 6) % 3 === i) return { word: '審議', fg: C.lime, bg: C.chipDim, on: true }
    if (working) return { word: '待機', fg: C.dim, bg: C.chipDim, on: false }
    return { word: '承認', fg: C.muted, bg: C.chipDim, on: false }
  }
  if (!g0nShownIn(tab)) g0nShown = -1
  else if (Image && e.surface === 'terminal') {
    const f = g0nFrame()
    g0nShown = f
    out.push(Box({ key: 'g0n', children: [Image({ key: 'g0n-img', source: { file: `${$.plugin.root}/assets/g0n/${themeId}/${String(f).padStart(2, '0')}.png`, format: 'png' }, columns: Math.max(1, cols - 2), rows: 6, alt: ' ' })] }))
  }
  out.push(
    Box({
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginRight: 2,
      children: [
        t([
          span(' NERV ', ink, { bold: true, backgroundColor: alert && blink() ? C.lime : C.purple }),
          ...(narrow ? [span(' MAGI ', C.dim), ...[0, 1, 2].map((i) => span(vote(i).on ? '◆' : '◇', vote(i).fg, { bold: vote(i).on }))] : [span(' ネルフ', C.orange, { bold: true }), span(' ⟋ MAGI', C.dim)]),
        ]),
        t([
          ...(compact && !narrow ? [0, 1, 2].map((i) => span(` ${'メバカ'[i]}·${vote(i).word} `, vote(i).fg, { bold: vote(i).on })) : []),
          span(compact ? ' ' : ''),
          working
            ? span(` ${SPIN[frame % 4]} OPERANDO `, ink, { bold: true, backgroundColor: C.lime })
            : span(' ◎ EN ESPERA ', C.muted, { backgroundColor: C.chip }),
        ]),
      ],
    }),
  )
  if (!compact)
  out.push(
    Box({
      flexDirection: 'row',
      columnGap: 1,
      children: magi.map((name, i) => {
        const v = vote(i)
        const cw = Math.floor((cols - 2) / 3)
        return Box({
          key: 'magi-' + i,
          width: cw,
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: v.bg,
          children: [t([span(name, v.on ? v.fg : C.muted, { bold: v.on })], v.fg), t([span(v.on ? `◆ ${v.word}` : v.word, v.fg, { bold: v.on })], v.fg)],
        })
      }),
    }),
  )
  const tabLabel = (x: (typeof TABS)[number]) => (tab === x.id ? `◆ ${x.label}` : x.label)
  const oneRow = TABS.reduce((n, x) => n + tabLabel(x).length + 4, 0) <= cols
  const perRow = compact && oneRow ? TABS.length : 3
  const cellW = perRow === TABS.length ? Math.max(...TABS.map((x) => tabLabel(x).length + 3)) + 1 : Math.floor((cols - (perRow - 1)) / perRow)
  const pickTab = (x: (typeof TABS)[number]) => {
    tab = x.id
    $.store.set('tab', tab).catch(() => undefined)
    if (x.id === 'hw') refreshHw($)
    if (x.id === 'live') void refreshLive($)
    if (x.id === 'forge') refreshForge($)
    if (x.id === 'nodd') refreshNodd($)
    if (x.id === 'edd') void refreshEdd($)
    if (x.id === 'cortex') refreshCortex($)
    if (x.id === 'yt') ytPoll($)
    if (x.id === 'models') void refreshModels($)
    $.ui.invalidate('ui.render')
  }
  const togglePin = () => {
    pinned = pinned === tab ? '' : tab
    void savePrefs($, { pinned: pinned || null })
    $.ui.invalidate('ui.render')
  }
  const tabButton = (x: (typeof TABS)[number]) =>
    Box({
      key: 'tabbox-' + x.id,
      width: cellW,
      justifyContent: 'center',
      backgroundColor: tab === x.id ? C.tabBg : undefined,
      children: [
        Button({
          key: 'tab-' + x.id,
          label: tabLabel(x),
          hotkey: x.hotkey,
          plain: true,
          dimColor: tab !== x.id,
          onPress: () => pickTab(x),
        }),
      ],
    })
  if (narrow)
    out.push(
      Box({
        key: 'tabrow-narrow',
        flexDirection: 'row',
        columnGap: 1,
        children: TABS.map((x) =>
          Box({
            key: 'tabbox-' + x.id,
            backgroundColor: tab === x.id ? C.tabBg : undefined,
            children: [Button({ key: 'tab-' + x.id, label: tab === x.id ? `◆ ${x.label}` : x.hotkey, ...(tab === x.id ? { hotkey: x.hotkey } : {}), plain: true, dimColor: tab !== x.id, onPress: () => pickTab(x) })],
          }),
        ),
      }),
    )
  const pinButton = Button({ key: 'tab-pin', label: pinned === tab ? '📌 fijada' : '📌 fijar', plain: true, dimColor: pinned !== tab, onPress: togglePin })
  const pinFits = !narrow && TABS.length % perRow !== 0
  if (!narrow)
    for (let i = 0; i < TABS.length; i += perRow) {
      const row = TABS.slice(i, i + perRow).map(tabButton)
      if (pinFits && i + perRow >= TABS.length) row.push(Box({ key: 'tabbox-pin', width: cellW, justifyContent: 'center', children: [pinButton] }))
      out.push(Box({ key: 'tabrow-' + i, flexDirection: 'row', columnGap: 1, marginTop: i === 0 && !compact ? 1 : 0, children: row }))
    }
  if (!narrow && !pinFits) out.push(Box({ key: 'tab-pinrow', flexDirection: 'row', justifyContent: 'flex-end', children: [pinButton] }))
  out.push(t([span('─'.repeat(Math.max(0, cols)), C.dim)]))
  const headN = out.length
  if (tab !== bodyTab) {
    bodyTab = tab
    bodyOffset = 0
  }

  if (tab === 'magi') {
    if (recap)
      out.push(
        card('recap', '⟲ ÚLTIMA MISIÓN', C.cyan, [
          t([span(`la sesión anterior se cortó ${ago(now() - recap.at)}`, C.muted)]),
          t([span('» ' + clip(recap.prompt, w * 2 - 2), C.text)], C.text, { wrap: 'wrap' }),
          Button({
            key: 'recap-ok',
            label: 'entendido',
            hotkey: 'x',
            plain: true,
            dimColor: true,
            onPress: () => {
              recap = undefined
              $.ui.invalidate('ui.render')
            },
          }),
        ]),
      )
    gauges = []
    const ctx = usage?.context?.percent
    const five = pct('five_hour')
    const seven = pct('seven_day')
    const gw = Math.max(6, w - 14)
    const gauge = (name: string, p: number | undefined) =>
      typeof p === 'number' && e.surface === 'terminal' && Raster
        ? (gauges.push({ key: 'gauge-' + name, p, w: gw, hue: heat(p) }),
          Box({ key: 'gbox-' + name, flexDirection: 'row', children: [t([span(name.padEnd(6), C.muted)]), Raster({ key: 'gauge-' + name, columns: gw, rows: 1, cells: gaugeCells(p, gw, heat(p)) }), t([span(` ${Math.round(p)}%`.padStart(5), C.text)])] }))
        : t([span(name.padEnd(6), C.muted), span('┈'.repeat(gw), C.dim), span(typeof p === 'number' ? ` ${Math.round(p)}%`.padStart(5) : '   –', C.text)])
    const acctRows: any[] = []
    if (acctNow()) {
      acctRows.push(kvBtn([span('CUENTA ', C.muted), span(clip(acctName(acctNow()), w - 18), C.text, { bold: true })], Button({ key: 'acct-menu', label: acctMenu ? '▴' : 'cambiar ▾', plain: true, dimColor: !acctMenu, onPress: () => acctToggle($) })))
      if (acctMenu)
        for (const a of ACCOUNTS.filter((x) => x.id !== acctNow()))
          acctRows.push(Box({ key: 'acct-' + a.id, flexDirection: 'row', children: [t([span('  → ', C.dim)]), Button({ key: 'acct-go-' + a.id, label: `${acctName(a.id)} · ${a.tag}`, plain: true, onPress: () => void switchAccount($, a.id) })] }))
      if (acctNote) acctRows.push(t([span('  ' + acctNote, C.amber)]))
    }
    const syncRows = [...acctRows, t([span('PILOT ', C.muted), span(clip(model || '?', w - 6), C.text, { bold: true })]), gauge('SYNC', ctx), gauge('5H', five), gauge('7D', seven)]
    if (typeof usage?.cost?.usd === 'number') syncRows.push(t([span('COSTO ', C.muted), span(`US$ ${usage.cost.usd.toFixed(2)}`, C.text)]))
    if (alert) {
      const rem = remaining()
      syncRows.push(t([span(blink() ? '▲ ACTIVE TIME REMAINING' : '△ ACTIVE TIME REMAINING', C.red, { bold: true })]))
      syncRows.push(t([span(rem ? `  ~${mmss(rem)} al ritmo actual` : '  cable umbilical cortado', C.pink)]))
    }
    out.push(card('sync', alert ? '⚠ BATERÍA INTERNA' : account ? `⬢ SINCRONIZACIÓN · ${account}` : '⬢ SINCRONIZACIÓN', alert ? (blink() ? C.lime : C.purple) : C.purple, syncRows))

    const act: any[] = []
    if (activity) act.push(t([span('▶ ', C.lime), span(activity.tool + ' ', C.lime, { bold: true }), span(clip(activity.label, w - activity.tool.length - 10), C.text), span(' ' + mmss(now() - activity.start), C.muted)]))
    else if (working) act.push(t([span(`${SPIN[frame % 4]} pensando `, C.purple), span(mmss(now() - turnStart), C.muted)]))
    else act.push(t([span('◎ esperando tu próxima orden', C.muted)]))
    if (working && lastProgress && now() - lastProgress > 300000) act.push(t([span(`⏸ sin avance hace ${mmss(now() - lastProgress)}`, C.amber)]))
    if (unverified.size) {
      act.push(t([span(`⚠ ${unverified.size} archivo${unverified.size > 1 ? 's' : ''} sin verificar`, C.amber, { bold: true })]))
      for (const f of [...unverified].slice(-3)) act.push(t([span('  · ' + clip(base(f), w - 4), C.muted)]))
    } else act.push(t([span('✔ cambios verificados', C.lime)]))
    if (patternBlue) {
      act.push(t([span(blink() ? '◆ PATTERN BLUE' : '◇ PATTERN BLUE', C.orange, { bold: true }), span(` · ${patternBlue.count}× ${patternBlue.tool}`, C.orange)]))
      act.push(t([span('  ' + clip(patternBlue.text, w - 2), C.muted)]))
    }
    out.push(card('act', '▶ ACTIVIDAD', patternBlue ? C.orange : C.violet, act))

    const live = [...tasks.values()].filter((a) => !a.end || now() - a.end < 600000).slice(-6)
    if (live.length) {
      const running = live.filter((a) => !a.end).length
      out.push(
        card(
          'tasks',
          `◌ TAREAS · ${running} corriendo`,
          C.purple,
          live.map((a) => {
            const [g, col] = !a.end ? [SPIN[frame % 4], C.purple] : a.status === 'completed' || !a.status ? ['✔', C.lime] : a.status === 'killed' ? ['■', C.muted] : ['✖', C.red]
            return t([span(g + ' ', col), span(a.kind === 'agent' ? '⬡ ' : '$ ', C.dim), span(clip(a.desc, w - 12), a.end ? C.muted : C.text), span(' ' + mmss((a.end || now()) - a.start), C.dim)])
          }),
        ),
      )
    }


    if (sessionTasks.length) {
      const open = (x: { status: string }) => x.status !== 'completed'
      const stuck = (x: { blockedBy: string[] }) => x.blockedBy.some((id) => sessionTasks.some((y) => y.id === id && open(y)))
      const doing = sessionTasks.filter((x) => x.status === 'in_progress')
      const waiting = sessionTasks.filter((x) => x.status === 'pending' && stuck(x))
      const next = sessionTasks.filter((x) => x.status === 'pending' && !stuck(x))
      const done = sessionTasks.filter((x) => !open(x))
      const row = (x: { id: string; subject: string }, mark: string, mc: string, tc: string, tail = '') =>
        t([span(x.id.padStart(2) + ' ', C.dim), span(mark + ' ', mc), span(clip(x.subject, Math.max(8, w - 6 - tail.length)), tc), ...(tail ? [span(tail, C.dim)] : [])])
      const head = (label: string, n: number) => t([span('─ ' + label + ' ', C.dim), span(String(n), C.muted)])
      const rows: any[] = doing.map((x) => row(x, '▶', C.orange, C.text, ''))
      if (next.length) rows.push(head('pendientes', next.length), ...next.map((x) => row(x, '□', C.muted, C.text)))
      if (waiting.length) rows.push(head('bloqueadas', waiting.length), ...waiting.map((x) => row(x, '⊘', C.dim, C.muted, ' ← ' + x.blockedBy.filter((id) => sessionTasks.some((y) => y.id === id && open(y))).map((id) => '#' + id).join(' '))))
      if (done.length) rows.push(t([span('✓ ', C.lime), span(`${done.length} hecha${done.length > 1 ? 's' : ''}`, C.muted), ...(done.length ? [span(' · última: ' + clip(done.at(-1)!.subject, Math.max(6, w - 22)), C.dim)] : [])]))
      const bar = Math.max(3, Math.min(8, w - 36))
      const k = Math.round((done.length / sessionTasks.length) * bar)
      out.push(scard('tasks', `▣ TAREAS ${done.length}/${sessionTasks.length} ${'■'.repeat(k)}${'·'.repeat(bar - k)}`, doing.length ? C.orange : C.violet, rows, 12))
    }
    if (health.when) out.push(t([span(health.ok ? '♥ ' : '✖ ', health.ok ? C.lime : C.red), span(clip(health.text, w - 10), health.ok ? C.muted : C.red), span(' ' + health.when, C.dim)]))
    out.push(
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Button({
            key: 'refresh',
            label: '↻ refrescar',
            hotkey: 'r',
            plain: true,
            dimColor: true,
            onPress: async () => {
              await refreshPRs($)
              await refreshLocal($)
              $.ui.invalidate('ui.render')
            },
          }),
          Button({
            key: 'quiet',
            label: '◌ silenciar',
            hotkey: 'q',
            plain: true,
            dimColor: true,
            onPress: async () => {
              quiet = true
              await $.store.set('quiet', true).catch(() => undefined)
              await savePrefs($, { quiet: true })
              await $.ui.close({ id: PANE }).catch(() => undefined)
              paneOpen = false
            },
          }),
        ],
      }),
    )
    out.push(
      Box({
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 1,
        children: [
          t([span('◈ UNIDAD', C.muted, { bold: true })]),
          ...THEME_IDS.map((id) => chip('theme-' + id, THEMES[id].label, themeId === id, THEMES[id].tabBg, () => void setTheme($, id))),
        ],
      }),
    )
  }

  if (tab === 'git') {
    const g = gitInfo
    const gi: any[] = []
    if (!g.ok && !ws) gi.push(t([span('no es un repo de git · leyendo tus proyectos…', C.muted)]))
    else if (!g.ok && ws)
      for (const rp of ws.repos)
        gi.push(
          t([
            span('⎇ ', C.purple),
            span(clip(rp.name, Math.max(8, w - 26)), C.text, { bold: true }),
            span(' ' + clip(rp.branch, 10), C.dim),
            span(rp.dirty ? `  ● ${rp.dirty}` : '  ✔', rp.dirty ? C.orange : C.lime),
            span(' ' + ago(now() - rp.ct * 1000).replace('hace ', ''), C.dim),
          ]),
        )
    else {
      gi.push(t([span('⎇ ', C.purple), span(clip(branch || '?', w - 20), C.text, { bold: true }), span(g.upstream ? `  → ${clip(g.upstream, 14)}` : '  sin upstream', C.dim)]))
      gi.push(
        t([
          span(`▲ ${g.ahead} `, g.ahead ? C.lime : C.dim),
          span(`▼ ${g.behind} `, g.behind ? C.amber : C.dim),
          span(g.dirty ? `  ● ${g.dirty} cambio${g.dirty > 1 ? 's' : ''} sin commitear` : '  ✔ limpio', g.dirty ? C.orange : C.lime),
        ]),
      )
    }
    out.push(card('git-branch', g.ok ? '⎇ RAMA' : '⎇ PROYECTOS', C.purple, gi))
    const act: any[] = []
    if (e.surface === 'terminal' && Raster && Object.keys(commitDays).length) {
      const weeks = Math.max(4, Math.floor((w + 1) / 2))
      const st = commitStats(weeks)
      act.push(t([span('▤ ', C.purple), span(`${st.total} commits`, C.text, { bold: true }), span(` · ${weeks} sem`, C.dim), span(st.streak ? `  ▲ racha ${st.streak} d` : '', C.orange), span(`  hoy ${st.today}`, st.today ? C.lime : C.dim)]))
      act.push(Raster({ key: 'heat', columns: weeks * 2 - 1, rows: 7, cells: heatCells(weeks * 2 - 1, weeks) }))
      act.push(t([span('frío ', C.dim), ...[0, 1, 2, 5, 8, 12].map((n) => span('■', '#' + heatColor(n).toString(16).padStart(6, '0'))), span(' caliente', C.dim)]))
    }
    if (!act.length) act.push(t([span('sin commits en las últimas semanas', C.muted)]))
    out.push(card('git-heat', '▤ COMMITS', C.violet, act))
    if (!g.ok && ws?.recent.length)
      out.push(
        scard(
          'git-log',
          '◷ ÚLTIMOS COMMITS',
          C.purple,
          ws.recent.map((c: any) => t([span(clip(c.repo, 14) + ' ', C.orange), span(clip(c.s || '', w - 24), C.text), span(' ' + ago(now() - c.ct * 1000).replace('hace ', ''), C.dim)])),
          6,
        ),
      )
    if (g.recent.length)
      out.push(
        scard(
          'git-log',
          '◷ ÚLTIMOS COMMITS',
          C.purple,
          g.recent.map((c: string[]) => t([span(c[0] + ' ', C.orange), span(clip(c[1] || '', w - 20), C.text), span(' ' + (c[2] || '').replace(/ ago$/, ''), C.dim)])),
          6,
        ),
      )
    const prRows: any[] = []
    if (prError) prRows.push(t([span(prError, C.muted)]))
    else if (!prs) prRows.push(t([span('consultando…', C.muted)]))
    else if (!prs.length) prRows.push(t([span('ninguna abierta', C.muted)]))
    else
      for (const p of prs) {
        const checks = p.statusCheckRollup || []
        const failed = checks.some((c: any) => ['FAILURE', 'ERROR', 'CANCELLED', 'TIMED_OUT'].includes(c.conclusion || c.state))
        const pending = checks.some((c: any) => ['PENDING', 'QUEUED', 'IN_PROGRESS', 'EXPECTED'].includes(c.status || c.state))
        const cic = !checks.length ? ['·', C.dim] : failed ? ['✖', C.red] : pending ? ['◌', C.amber] : ['●', C.lime]
        const rv = p.reviewDecision === 'APPROVED' ? ['✔', C.lime] : p.reviewDecision === 'CHANGES_REQUESTED' ? ['✎', C.red] : p.isDraft ? ['◇', C.dim] : ['◌', C.amber]
        const who = p.author?.login && p.author.login !== ghMe ? ` @${p.author.login}` : ''
        prRows.push(
          Box({
            key: 'prr-' + (p.repo || '') + p.number,
            flexDirection: 'row',
            children: [t([span(rv[0] + ' ', rv[1]), span(cic[0] + ' ', cic[1])]), Link({ key: 'pr-' + (p.repo || '') + p.number, href: p.url, label: clip(`${p.repo ? p.repo + ' ' : ''}#${p.number} ${p.title}${who}`, w - 5) })],
          }),
        )
      }
    const counts = prs?.length ? ` · ${prs.length} abiertas` : ''
    out.push(scard('prs', `⎇ ${prsWide ? 'TUS PRs' : 'PRs'}${counts}${!prsWide && branch ? ' · ' + clip(branch, w - 24) : ''}`, C.violet, prRows, 8))
  }

  if (tab === 'forge') drawForge($, e, out, { t, span, card, scard, chip, w, cols })
  if (tab === 'edd') drawEdd($, e, out, { t, span, card, scard, chip, w })
  if (tab === 'models') drawModels($, e, out, { t, span, card, chip, w })

  if (tab === 'yt') {
    const n = yt.now
    const cur = n ? yt.queue[n.idx] : undefined
    const wrap2 = (txt: string, n2: number) => {
      if (txt.length <= n2) return [txt]
      let cut = txt.lastIndexOf(' ', n2)
      if (cut < n2 * 0.5) cut = n2
      return [txt.slice(0, cut).trimEnd(), clip(txt.slice(cut).trim(), n2)]
    }
    const nowRows: any[] = []
    if (n) {
      if (cur?.id) void ytThumbFor($, cur.id)
      const thumb = !!Image && !!cur?.id && ytThumb[cur.id] === 'ok' && w >= 34
      const tw = thumb ? w - 17 : w - 2
      const info: any[] = wrap2(cur?.title || n.title || 'cargando…', tw).map((line) => t([span(line, C.text, { bold: true })]))
      if (cur?.ch) info.push(t([span(clip(cur.ch, tw), C.muted)]))
      nowRows.push(
        thumb
          ? Box({
              key: 'yt-head',
              flexDirection: 'row',
              children: [
                Image({ key: 'yt-thumb-' + cur!.id, source: { file: ytThumbPath(cur!.id), format: 'png' }, columns: 14, rows: 4, alt: '♪' }),
                Box({ key: 'yt-info', flexDirection: 'column', marginLeft: 1, flexGrow: 1, children: info }),
              ],
            })
          : Box({ key: 'yt-head', flexDirection: 'column', children: info }),
      )
      if (n.dur) {
        const bw = Math.max(6, w - 3)
        const f = Math.min(bw, Math.round(((n.pos || 0) / n.dur) * bw))
        const hue = n.pause ? C.amber : C.lime
        nowRows.push(t([span('━'.repeat(f), hue), span('●', hue), span('┈'.repeat(bw - f), C.dim)]))
        nowRows.push(kv([span(clockOf(n.pos || 0), C.muted)], [span(clockOf(n.dur), C.dim)]))
      } else nowRows.push(t([span('◌ cargando el audio…', C.amber)]))
      nowRows.push(
        Box({
          key: 'yt-ctl',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          children: [
            Box({
              key: 'yt-transport',
              flexDirection: 'row',
              children: [
                chip('yt-prev', '⏮', true, C.tabBg, () => void ytCtl($, ['playlist-prev'])),
                chip('yt-pause', n.pause ? '▶' : '⏸', true, n.pause ? C.amber : C.tabBg, () => void ytCtl($, ['cycle', 'pause'])),
                chip('yt-next', '⏭', true, C.tabBg, () => void ytCtl($, ['playlist-next'])),
                chip('yt-stop', '■', true, C.tabBg, () => void ytCtl($, ['quit'])),
              ],
            }),
            Box({
              key: 'yt-vol',
              flexDirection: 'row',
              children: [
                chip('yt-voldown', '−', true, C.tabBg, () => void ytCtl($, ['add', 'ao-volume', -5])),
                Box({
                  key: 'yt-vol-box',
                  width: 8,
                  paddingLeft: 1,
                  children: [
                    Input({
                      key: 'yt-vol-in-' + ytVolKey,
                      placeholder: '0-100',
                      value: ytVolDraft ?? String(Math.round(n.vol ?? 0)),
                      submitLabel: 'ok',
                      onInput: (v: string) => (ytVolDraft = v),
                      onSubmit: (v: string) => {
                        ytVolDraft = undefined
                        ytVolKey++
                        const num = Number(String(v).replace(/[^\d.]/g, ''))
                        if (String(v).trim() && Number.isFinite(num)) {
                          const target = Math.max(0, Math.min(100, Math.round(num)))
                          if (yt.now) yt.now.vol = target
                          void ytCtl($, ['set_property', 'ao-volume', target])
                        } else $.ui.invalidate('ui.render')
                      },
                    }),
                  ],
                }),
                t([span('% ', C.muted)]),
                chip('yt-volup', '+', true, C.tabBg, () => void ytCtl($, ['add', 'ao-volume', 5])),
              ],
            }),
          ],
        }),
      )
      if (ytNote) nowRows.push(t([span('◌ ' + ytNote, C.amber)]))
      else if (n.idx + 1 < yt.queue.length) nowRows.push(kvBtn([span('↳ ', C.dim), span(clip(yt.queue[n.idx + 1].title, w - 16), C.dim)], chip('yt-clear', narrow ? '✕ limpiar' : '✕ limpiar cola', false, C.tabBg, () => void ytCtl($, ['playlist-clear']))))
    } else nowRows.push(t([span('nada sonando · buscá algo abajo', C.muted)]))
    out.push(card('yt-now', n ? (n.pause ? '♪ EN PAUSA' : '♪ SONANDO') : '♪ YOUTUBE', n ? (n.pause ? C.amber : C.lime) : C.purple, nowRows))
    if (n && yt.queue.length > 1)
      out.push(
        scard(
          'yt-queue',
          `≡ COLA · ${n.idx + 1}/${yt.queue.length}`,
          n.pause ? C.amber : C.lime,
          yt.queue.map((q, k) => {
            const on = k === n.idx
            return Box({
              key: 'yq-' + k,
              flexDirection: 'row',
              justifyContent: 'space-between',
              children: [
                Button({ key: 'yq-go-' + k, label: `${on ? '▶' : String(k + 1).padStart(2)} ${clip(q.title, Math.max(8, w - 12))}`, plain: true, dimColor: k < n.idx, onPress: () => void ytCtl($, ['playlist-play-index', k]) }),
                on ? t([span(q.d ? clockOf(q.d) : '', C.lime)]) : chip('yq-rm-' + k, '✕', false, C.tabBg, () => void ytCtl($, ['playlist-remove', k])),
              ],
            })
          }),
          8,
        ),
      )
    const recentChips = ytRecent.filter((q) => q !== yt.query).slice(0, 3)
    out.push(
      card('yt-search', '⌕ BUSCAR', C.violet, [
        Box({
          key: 'yt-q-row',
          flexDirection: 'row',
          alignItems: 'center',
          children: [
            Box({
              key: 'yt-q-field',
              flexGrow: 1,
              borderStyle: 'round',
              borderColor: C.violet,
              paddingX: 1,
              flexDirection: 'row',
              children: [
                t([span('⌕ ', C.violet, { bold: true })]),
                Input({
                  key: 'yt-q',
                  placeholder: 'clickeá y escribí…',
                  value: ytDraft,
                  submitLabel: 'Enter',
                  onInput: (v: string) => (ytDraft = v),
                  onSubmit: (v: string) => {
                    const q = v.trim()
                    if (q) void ytSearch($, q)
                  },
                }),
              ],
            }),
            Box({
              key: 'box-yt-go',
              marginLeft: 1,
              paddingX: 1,
              backgroundColor: C.violet,
              children: [
                Button({
                  key: 'yt-go',
                  label: 'BUSCAR',
                  plain: true,
                  dimColor: false,
                  onPress: () => {
                    const q = ytDraft.trim()
                    if (q) void ytSearch($, q)
                    else $.ui.toast('escribí un tema, artista o playlist en el campo')
                  },
                }),
              ],
            }),
          ],
        }),
        t([span('o elegí un atajo:', C.dim)]),
        Box({
          key: 'yt-chips',
          flexDirection: 'row',
          flexWrap: 'wrap',
          children: [
            chip('yt-fav', '♥ me gusta', yt.query === 'me gusta', C.tabBg, () => void ytLoad($, ':ytfav', 'me gusta')),
            chip('yt-rec', '★ para vos', yt.query === 'para vos', C.tabBg, () => void ytLoad($, ':ytrec', 'para vos')),
            ...recentChips.map((q, i) => chip('yt-rq-' + i, clip(q, 14), false, C.tabBg, () => ((ytDraft = q), void ytSearch($, q)))),
            chip('yt-tui', '⧉ abrir yt', false, C.tabBg, () => void $.process.run(['setsid', '-f', 'uwsm-app', '--', 'ghostty', '--title=yt', '-e', `${home}/.local/bin/yt`, ...(yt.query ? [yt.query] : [])], { timeoutMs: 5000 }).catch(() => undefined)),
          ],
        }),
      ]),
    )
    const resRows: any[] = yt.busy ? [t([span(`◌ buscando «${clip(yt.query, w - 16)}»…`, C.amber)])] : yt.err ? [t([span('✖ ' + yt.err, C.red)])] : []
    yt.results.forEach((r, i) => {
      const playing = !!cur && cur.id === r.id
      resRows.push(
        Box({
          key: 'yt-r-' + r.id,
          flexDirection: 'row',
          justifyContent: 'space-between',
          children: [
            Button({ key: 'yt-play-' + r.id, label: `${playing ? '▶' : String(i + 1).padStart(2)} ${clip(r.title, Math.max(8, w - 17))}`, plain: true, dimColor: false, onPress: () => void ytPlay($, i) }),
            Box({ key: 'yt-r-side-' + r.id, flexDirection: 'row', children: [t([span(r.d ? clockOf(r.d) + ' ' : '', playing ? C.lime : C.dim)]), chip('yt-add-' + r.id, '+', false, C.tabBg, () => void ytInsert($, r, false))] }),
          ],
        }),
      )
    })
    if (yt.results.length || yt.busy || yt.err) out.push(scard('yt-results', yt.query ? `≡ ${clip(yt.query.toUpperCase(), w - 10)}` : '≡ RESULTADOS', C.violet, resRows, 10))
  }

  if (tab === 'cortex') {
    const s = cortex.stats
    const tally = cxTally(cxLog.events)
    const both = cxLog.events.some((ev) => ev.ws === 'wibond')
    const num = (n: number, color: string, pad: number) => span(String(n).padStart(pad), n ? color : C.dim, n ? { bold: true } : {})
    const row = (label: string, k: 'brought' | 'reads' | 'saves' | 'nudges', color: string) =>
      t([span(label.padEnd(14), C.muted), num(tally.personal[k], color, 9), ...(both ? [num(tally.wibond[k], C.cyan, 8)] : [])])
    const ICON: Record<string, [string, string]> = { context: ['◉', C.purple], hint: ['◈', C.cyan], nudge: ['⚑', C.amber], memoria_save: ['✚', C.lime], memoria_update: ['✎', C.lime] }
    const lastRows = cxLog.events.slice(-6).reverse().map((ev) => {
      const [g, gc] = ICON[ev.kind === 'tool' ? ev.tool : ev.kind] || (CX_READS.has(ev.tool) ? ['⌕', C.violet] : ['·', C.dim])
      const ids = ev.ids.slice(0, 2).map((id) => `#${id}`).join(' ') + (ev.ids.length > 2 ? ` +${ev.ids.length - 2}` : '')
      const what = ev.kind === 'nudge' ? 'pidió guardar lo aprendido' : ev.titles[0] || (ev.kind === 'tool' ? ev.tool.replace(/^memoria_/, '') : ev.kind)
      const head = `${ev.ts.slice(11, 16)} `
      const tag = ev.ws === 'wibond' ? 'wb ' : ''
      const room = Math.max(6, w - head.length - tag.length - 2 - (ids ? ids.length + 1 : 0))
      return t([span(head, C.dim), span(tag, C.cyan), span(g + ' ', gc, { bold: true }), span(ids ? ids + ' ' : '', C.orange), span(clip(what, room), C.text)])
    })
    const activity = card('cx-activity', '◎ ACTIVIDAD · HOY', C.cyan, [
      ...(cxLog.missing
        ? [t([span('sin registro de cortex-recall todavía', C.dim)])]
        : !cxLog.events.length
          ? [t([span('sin actividad hoy · esperando al hook', C.dim)])]
          : [
              t([span(''.padEnd(14), C.dim), span('PERSONAL'.padStart(9), C.purple, { bold: true }), ...(both ? [span('WIBOND'.padStart(8), C.cyan, { bold: true })] : [])]),
              row('TRAÍDAS', 'brought', C.lime),
              row('CONSULTAS', 'reads', C.text),
              row('GUARDADAS', 'saves', C.lime),
              row('RECORDATORIOS', 'nudges', C.amber),
              t([span('─ LO ÚLTIMO ' + '─'.repeat(Math.max(0, w - 12)), C.dim)]),
              ...lastRows,
            ]),
    ])
    if (!s) out.push(card('cx-main', '◉ CORTEX', C.purple, [t([span(cortex.err ? '✖ ' + cortex.err : 'leyendo Cortex…', cortex.err ? C.red : C.muted)])]), activity)
    else {
      out.push(
        card('cx-main', '◉ CORTEX · MEMORIA', C.purple, [
          kv([span('MEMORIAS ', C.muted), span(String(s.total_memories), C.text, { bold: true })], [span(`${s.total_projects} proyectos`, C.muted)]),
          kv([span('SESIONES ', C.muted), span(String(s.total_sessions), C.text)], [span(s.active_sessions ? `● ${s.active_sessions} activas` : '○ ninguna activa', s.active_sessions ? C.lime : C.dim)]),
          kv([span('7 DÍAS ', C.muted), span(`+${s.last_7_days}`, C.lime, { bold: true })], [span('30 DÍAS ', C.muted), span(`+${s.last_30_days}`, C.text)]),
          kv([span('RACHA ', C.muted), span(`${s.current_streak} días`, C.orange, { bold: true })], [span(`${s.active_days} días activos`, C.dim)]),
          ...(cortex.err ? [t([span('✖ ' + cortex.err, C.red)])] : []),
        ]),
        activity,
      )
      const bugs = s.bug_fix_count ?? 0
      const decisions = s.decisions_count ?? 0
      const hours = (bugs * 30) / 60
      const tokens = bugs * 2000 + decisions * 500 + Math.max(0, (s.total_memories ?? 0) - bugs - decisions) * 200
      const usd = hours * 30 + (tokens / 1_000_000) * 3
      const ars = usd * blue.ars
      const fmt = (n: number) => Math.round(n).toLocaleString('es-AR')
      const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.', ',')}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)))
      out.push(
        card('cx-savings', '◆ AHORRO', C.lime, [
          kv([span('USD ', C.muted), span(fmt(usd), C.lime, { bold: true })], [span('ARS ', C.muted), span(short(ars), C.lime, { bold: true })]),
          kv([span('DEBUG ', C.muted), span(`${fmt(hours)} h`, C.text)], [span(`${bugs} bugs × 30 min`, C.dim)]),
          kv([span('TOKENS ', C.muted), span(short(tokens), C.text)], [span(`USD ${((tokens / 1_000_000) * 3).toFixed(2).replace('.', ',')}`, C.dim)]),
          t([span(blue.live ? `blue hoy $${fmt(blue.ars)}` : `blue de referencia $${fmt(blue.ars)}`, C.dim), span(' · USD 30/h · USD 3/MTok', C.dim)]),
        ]),
      )
      const hue: Record<string, string> = { bug_fix: C.red, discovery: C.cyan, config: C.violet, architecture: C.purple, decision: C.orange, lesson: C.amber, pattern: C.lime, preference: C.pink }
      const bars = (rows: { name: string; count: number }[], color: (r: any) => string, mark: (r: any) => boolean, lw: number) => {
        const top = Math.max(1, ...rows.map((r) => r.count))
        const bw = Math.max(4, w - lw - 7)
        return rows.map((r) => {
          const f = Math.max(1, Math.round((r.count / top) * bw))
          return t([span(clip(r.name, lw).padEnd(lw) + ' ', mark(r) ? C.lime : C.muted, mark(r) ? { bold: true } : {}), span('━'.repeat(f), color(r)), span('┈'.repeat(bw - f), C.dim), span(` ${r.count}`.padStart(5), C.text)])
        })
      }
      const types = (s.by_type || []).map((x: any) => ({ name: CORTEX_TYPES[x.type] || x.type, type: x.type, count: x.count }))
      if (types.length) out.push(card('cx-types', '▤ POR TIPO', C.violet, bars(types, (r) => hue[r.type] || C.muted, () => false, 12)))
      const projs = (s.by_project || []).slice(0, 8)
      if (projs.length) out.push(card('cx-projects', '◈ PROYECTOS', C.violet, bars(projs, () => C.purple, (r) => r.name === project, 14)))
      const recent = cortex.recent || []
      if (recent.length)
        out.push(
          card(
            'cx-recent',
            '▸ RECIENTES',
            C.violet,
            recent.map((m: any) => {
              const when = Date.parse(String(m.updated_at || m.created_at || '').replace(' ', 'T') + 'Z')
              const tail = Number.isFinite(when) ? ' ' + ago(now() - when).replace('hace ', '') : ''
              return t([span('● ', hue[m.type] || C.muted), span(clip(String(m.title || ''), Math.max(8, w - 4 - tail.length)), C.text), span(tail, C.dim)])
            }),
          ),
        )
    }
  }

  if (tab === 'nodd') {
    if (!nodd) out.push(card('nodd-main', '◆ NODD', C.purple, [t([span('sin estado: cargá el mod nodd (CLAUDE_CODE_PLUGIN_DIRS)', C.muted)])]))
    else {
      const on = !!nodd.enabled
      out.push(
        card('nodd-main', '◆ NODD', on ? C.lime : C.purple, [
          Box({
            flexDirection: 'row',
            children: [
              chip('nodd-on', on ? '● PRENDIDO' : 'prender', on, C.tabBg, () => void noddCmd($, 'on')),
              t([span(' ')]),
              chip('nodd-off', !on ? '○ APAGADO' : 'apagar', !on, C.tabBg, () => void noddCmd($, 'off')),
            ],
          }),
          t([span(on ? 'frena las tool calls que rompen el protocolo ODD' : 'apagado: no frena nada en ninguna sesión', C.dim)]),
        ]),
      )
      const rows: any[] = []
      for (const g of nodd.gates || []) {
        const live = g.enabledInClaudeCode ?? g.enforcedInClaudeCode
        const state = !live ? ['sólo en pi', C.muted] : !g.enabled ? ['apagado', C.dim] : on ? ['aplica', C.lime] : ['en espera', C.muted]
        rows.push(
          Box({
            key: 'ngrow-' + g.id,
            flexDirection: 'row',
            children: [
              chip('ngate-' + g.id, g.enabled ? '◉ ON ' : '○ OFF', !!g.enabled, C.tabBg, () => void noddCmd($, `gate ${g.id} ${g.enabled ? 'off' : 'on'}`)),
              t([span(' ' + g.id, g.enabled ? C.text : C.muted, { bold: true }), span(' · ' + state[0], state[1])]),
            ],
          }),
        )
        rows.push(t([span('  ' + clip(GATE_INFO[g.id] || '', w - 6), C.dim)]))
      }
      out.push(scard('nodd-gates', '⛨ GATES · click prende/apaga', C.violet, rows, 12))
      const d = nodd.declaration
      out.push(
        card('nodd-decl', '✎ DECLARACIÓN', C.purple, [
          d ? t([span(clip(d.slug || '?', w - 22), C.text, { bold: true }), span(` · ${d.intent || '?'} · ${d.route || '?'}`, C.dim)]) : t([span('sin declarar en esta sesión', C.muted)]),
        ]),
      )
      const r = nodd.lastRefusal
      const c = nodd.counters || {}
      out.push(
        card('nodd-last', '✖ ÚLTIMO RECHAZO', r ? C.red : C.purple, [
          r ? t([span(r.gate + ' ', C.red, { bold: true }), span(clip(String(r.reason || '').replace(/^nodd\/\w+: /, ''), w - 14), C.text)]) : t([span('ninguno', C.muted)]),
          t([span(`${c.toolCalls || 0} calls · ${c.filesWritten || 0} escritos · ${c.refusals || 0} rechazos · ${c.delegations || 0} delegaciones`, C.dim)]),
        ]),
      )
    }
  }

  if (tab === 'hw') {
    if (!hw) out.push(t([span('leyendo sensores…', C.muted)]))
    else {
      const bw = w
      const m: any[] = []
      if (hw.gpu) {
        m.push(kv([span('🎮 ', C.text), span(hw.gpu.name, C.text)], [span(`${hw.gpu.util}%`, heat(hw.gpu.util)), span(` · ${hw.gpu.temp}°`, C.muted)]))
        m.push(t([span(dots(hw.gpu.util, bw), C.purple)]))
        const vp = (hw.gpu.vram_used / hw.gpu.vram_total) * 100
        m.push(kv([span('vram', C.muted)], [span(`${hw.gpu.vram_used.toFixed(1)}/${hw.gpu.vram_total.toFixed(1)} GB`, C.text)]))
        m.push(t([span(dots(vp, bw), C.violet)]))
      }
      if (hw.cpu) {
        m.push(kv([span('⚡ ', C.text), span(`${hw.cpu.model} · ${hw.cpu.cores}c`, C.text)], [span(`${hw.cpu.pct}%`, heat(hw.cpu.pct))]))
        m.push(t([span(dots(hw.cpu.pct, bw), C.lime)]))
      }
      if (hw.ram) {
        const rp = (hw.ram.used / hw.ram.total) * 100
        m.push(kv([span('🧠 ram', C.text)], [span(`${Math.round(hw.ram.used)}/${Math.round(hw.ram.total)} GB`, C.lime)]))
        m.push(t([span(dots(rp, bw), C.purple)]))
      }
      if (e.surface === 'terminal' && Raster && cpuHist.length > 1) {
        m.push(t([span('▁ cpu ', C.lime), span('▁ gpu', C.purple)], C.dim))
        m.push(Raster({ key: 'spark', columns: bw, rows: 3, cells: sparkCells(bw, 3) }))
      }
      if (hw.board) m.push(t([span('▣ ' + hw.board, C.muted)]))
      out.push(card('machine', '🖥  Machine', C.purple, m))
      if (hw.peripherals?.length)
        out.push(
          card(
            'setup',
            '🎛  Setup',
            C.purple,
            hw.peripherals.map((p: any) => kv([span(`${p.icon} `, C.text), span(p.name, p.present ? C.text : C.muted)], [span(p.present ? (frame % 16 > 2 ? '●' : '◉') : '○', p.present ? C.lime : C.dim)])),
          ),
        )
      if (hw.monitors?.length)
        out.push(
          card(
            'monitors',
            '🖥  Monitors',
            C.purple,
            hw.monitors.map((x: any) => kv([span('🖥  ', C.text), span(x.name, C.text)], [span(`${x.h}p ${x.hz}Hz`, x.hz > 60 ? C.lime : C.muted)])),
          ),
        )
      if (hw.remote?.length)
        out.push(
          card(
            'remote',
            '🌐 Secondary',
            C.cyan,
            hw.remote.map((r: any) => kv([span(`${r[0] || '💻'} `, C.text), span(r[1] || '', C.text)], [span(String(r[2] || ''), C.muted)])),
          ),
        )
    }
  }

  if (tab === 'live') {
    const nat = (aspect: number) => Math.max(4, Math.min(32, Math.ceil((w + 2) * 0.462 * aspect)))
    const full: Record<string, number> = { cam: nat(848 / 1328), ip: nat(3 / 4) }
    const sz: Record<string, number> = { ...full }
    const slot = (key: string) => Box({ key: `live-slot-${key}`, height: sz[key] })
    // Los datos de cada cámara van en filas que ya existen, así el hueco de la ventana es más alto.
    const fps = (c: LiveCam) => span(c.on && c.fps ? `${c.fps} fps ` : '', C.muted)
    const cpu = (c: LiveCam) => span(c.on ? `cpu ${c.cpu}%` : '', c.cpu > 60 ? C.amber : C.dim)
    // Una sola vista en el dock: GO LIVE, el chat de alto fijo (scroll adentro) y las dos cámaras,
    // que se achican parejo lo que haga falta para entrar. Acá no hay cartel g0n ni EFFORT abajo.
    const view = Math.max(3, (e.props.scroll?.bodyRows || 0) - measure(out.slice(0, headN), cols))
    const dc = live.discord ? live.dc : undefined
    const golive = !!dc?.live
    // De Discord sólo van los que te miran, y sólo mientras estás en Go Live.
    const viewers = golive ? liveViewers(dc!) : undefined
    const dcCard = viewers
      ? card('live-dc', `◉ GO LIVE · ${dc!.vc} ${dc!.vc === 1 ? 'mirando' : 'mirándote'}`, C.red, [
          ...(viewers.names.length
            ? wrapCells(viewers.names.join(', ') + (viewers.more ? ` +${viewers.more} más` : ''), w - 8, w - 2)
                .slice(0, 2)
                .map((line, i) => t([span(i ? '  ' : 'MIRAN ', C.red, { bold: true }), span(line, C.text)]))
            : [t([span('MIRAN ', C.red, { bold: true }), span('nadie todavía', C.dim)])]),
        ])
      : undefined
    const chatOn = live.discord && !!dc
    const all = live.chat ? chatLines(live.chat, w - 2, 999) : []
    const lines = dock ? all : all.slice(-CHAT_ROWS)
    const hue = (l: ChatLine) => (l.self ? C.lime : [C.cyan, C.orange, C.violet, C.amber, C.pink][l.who % 5]!)
    const chatRows = !live.chat
      ? [t([span(narrow ? 'recargá Discord (Ctrl+R)' : 'para ver el chat recargá Discord (Ctrl+R) cuando puedas', C.dim)])]
      : !lines.length
        ? [t([span('sin mensajes todavía', C.dim)])]
        : lines.map((l) => t(l.author ? [span(l.author, hue(l), { bold: true }), span(': ', C.dim), span(l.text, C.text)] : [span(l.text, C.text)]))
    // Alto fijo con scroll adentro, anclado al último mensaje salvo que hayas subido a leer.
    if (dock && live.chat?.length) chatRows.unshift(...Array.from({ length: Math.max(0, CHAT_ROWS - chatRows.length) }, () => t([span(' ', C.dim)])))
    if (dock) {
      const max = Math.max(0, chatRows.length - CHAT_ROWS)
      cardScroll['live-chat'] = chatScroll(cardScroll['live-chat'], chatPrevMax, max)
      chatPrevMax = max
    }
    const chatCard = chatOn ? scard('live-chat', '◇ CHAT DEL CANAL', live.chat?.length ? C.cyan : C.dim, chatRows, CHAT_ROWS) : undefined
    let cams: any[] = []
    for (let pass = 0; pass < 4; pass++) {
      const camCard = card('live-cam', live.cam.on ? '▣ STREAMCAM · en vivo' : '▣ STREAMCAM · apagada', live.cam.on ? C.lime : C.dim, [
        ...(live.cam.on ? [slot('cam')] : [t([span('el overlay está cerrado', C.muted)])]),
        Box({
          key: 'live-cam-ctl',
          flexDirection: 'row',
          justifyContent: 'space-between',
          children: [chip('live-cam-tg', live.cam.on ? '■ cerrar' : '▶ abrir', live.cam.on, live.cam.on ? C.tabBg : C.lime, () => void liveRun($, [`${home}/.local/bin/camoverlay`])), t([fps(live.cam), cpu(live.cam)])],
        }),
        Input({
          key: 'live-text-' + liveTextKey,
          placeholder: '▭ texto de la banda',
          value: liveText ?? live.text,
          submitLabel: 'poner',
          onInput: (v: string) => (liveText = v),
          onSubmit: (v: string) => {
            liveText = undefined
            liveTextKey++
            live.text = v.trim()
            void liveRun($, [`${home}/.local/bin/camoverlay`, '--text', v.trim()])
          },
        }),
      ])
      const ip = live.ip
      const ipTitle = !ip.on ? '▣ IPHONE · apagado' : ip.mode === 'placeholder' ? '▣ IPHONE · sin señal' : ip.scene ? `▣ IPHONE · tapado (${ip.scene})` : '▣ IPHONE · en vivo'
      const ipCard = card('live-ip', ipTitle, !ip.on ? C.dim : ip.mode === 'placeholder' ? C.amber : ip.scene ? C.violet : C.lime, [
        ...(ip.on ? [slot('ip')] : [t([span('la ventana del iPhone está cerrada', C.muted)])]),
        ip.reach
          ? kv(
              [span(clip(ip.name || 'iPhone', w - 22), C.text), span(ip.lens ? `  ${clip(ip.lens, 12)}` : '', C.muted)],
              [fps(ip), span(ip.bat >= 0 ? `${ip.charging ? '⚡' : '▮'} ${ip.bat}%` : '', ip.bat >= 0 && ip.bat < 20 && !ip.charging ? C.red : C.lime)],
            )
          : kv([span(narrow ? 'DroidCam no responde' : 'DroidCam no responde en el celu', C.dim)], [fps(ip)]),
        Box({
          key: 'live-ip-ctl',
          flexDirection: 'row',
          flexWrap: 'wrap',
          children: [
            chip('live-ip-tg', ip.on ? '■ cerrar' : '▶ abrir', ip.on, ip.on ? C.tabBg : C.lime, () => void liveRun($, [`${home}/.local/bin/iphonecam`])),
            ...(ip.on
              ? [
                  chip(
                    'live-ip-priv',
                    ip.scene ? '◉ mostrar' : '◌ tapar',
                    !!ip.scene,
                    ip.scene ? C.violet : C.tabBg,
                    () => void liveRun($, [`${home}/.local/bin/iphonecam`, ...(ip.scene ? ['--scene', ip.scene] : ['--privacy'])]),
                  ),
                  chip('live-ip-blur', ip.blur ? '◍ sin blur' : '◍ blur', ip.blur, ip.blur ? C.cyan : C.tabBg, () => void liveRun($, [`${home}/.local/bin/iphonecam`, '--blur'])),
                ]
              : []),
          ],
        }),
      ])
      cams = [camCard, ipCard]
      const on = (['cam', 'ip'] as const).filter((k) => live[k].on)
      const over = measure([...(dcCard ? [dcCard] : []), ...(chatCard ? [chatCard] : []), ...cams], cols) - view
      const shrunk = on.some((k) => sz[k]! < full[k]!)
      if (!dock || !on.length || over === 0 || (over < 0 && !shrunk)) break
      const total = on.reduce((a, k) => a + full[k]!, 0)
      const room = Math.min(total, on.reduce((a, k) => a + sz[k]!, 0) - over)
      for (const k of on) sz[k] = Math.max(4, Math.floor((room * full[k]!) / total))
      for (let left = room - on.reduce((a, k) => a + sz[k]!, 0), i = 0; left > 0 && i < 8; i++) {
        const k = on[i % on.length]!
        if (sz[k]! < full[k]!) (sz[k]!++, left--)
      }
    }
    out.push(...(dcCard ? [dcCard] : []), ...(chatCard ? [chatCard] : []), ...cams)
  }

  const lvl = effortLevel()
  const hue = hex(EFFORTS[lvl - 1]?.hue ?? RGB.purple)
  const hot = lvl === 5 && blink()
  const short = ['LOW', 'MED', 'HIGH', 'XHIGH', 'MAX']
  const pickRow = (step: number, pad: number) =>
      Box({
        key: 'effort-picks',
        flexDirection: 'row',
        paddingLeft: pad,
        children: EFFORTS.map((x, i) =>
          Box({
            key: 'effbox-' + x.id,
            width: i === 4 ? Math.max(step, 5) : step,
            backgroundColor: effortPick === x.id ? C.tabBg : undefined,
            children: [
              Button({
                key: 'eff-' + x.id,
                label: short[i],
                plain: true,
                dimColor: i !== lvl - 1,
                onPress: () => {
                  effortPick = effortPick === x.id ? undefined : x.id
                  setEffort(effortPick || settingsEffort || effort)
                  $.ui.invalidate('ui.render')
                  void savePrefs($, { effort: effortPick ?? null })
                },
              }),
            ],
          }),
        ),
      })
  const foot: any[] = [
    t([span('─'.repeat(cols), C.dim)]),
    Box({
      flexDirection: 'row',
      justifyContent: 'space-between',
      children: [
        t([
          span(hot ? '◈ ' : '◆ ', hue),
          span('EFFORT ', C.muted, { bold: true }),
          lvl ? span(` ${effortName()} `, ink, { bold: true, backgroundColor: hot ? C.pink : hue }) : span('sin dato', C.dim),
          ...(effortPick ? [span(' fijado', C.muted)] : []),
        ]),
        t([span(lvl ? '▰'.repeat(lvl) : '', hue), span('▱'.repeat(5 - lvl), C.dim), span(lvl === 5 ? ' OVERDRIVE' : ` ${lvl}/5`, lvl === 5 ? hue : C.dim, { bold: lvl === 5 })]),
      ],
    }),
  ]
  if (!compact && e.surface === 'terminal' && Raster) {
    foot.push(Raster({ key: 'effort', columns: cols, rows: 2, cells: effortCells(cols) }))
    foot.push(pickRow(effortGeom(cols).step, 3))
  }
  if (compact) {
    const label = t([span('◆ ', hue), span('EFFORT ', C.muted, { bold: true }), lvl ? span(` ${effortName()} `, ink, { bold: true, backgroundColor: hue }) : span('–', C.dim), span(effortPick ? ' fijado ' : ' ', C.muted)])
    foot.splice(1, foot.length, ...(narrow ? [Box({ flexDirection: 'row', children: [t([span('◆ ', hue)]), pickRow(Math.floor((cols - 3) / 5), 0)] })] : [Box({ flexDirection: 'row', children: [label, pickRow(6, 1)] })]))
  }
  const rows = e.props.scroll?.bodyRows || 0
  const showEffort = effortShownIn(tab)
  const footBox = showEffort ? Box({ key: 'effort-foot', flexDirection: 'column', flexShrink: 0, marginTop: 1, children: foot }) : undefined
  if (!rows || e.props.placement !== 'dock') {
    if (compact)
      return Box({ flexDirection: 'column', children: [...out.slice(0, headN), ...(showEffort ? [Box({ key: 'effort-top', flexDirection: 'column', marginTop: 0, children: foot.slice(1) })] : []), ...out.slice(headN)] })
    return Box({ flexDirection: 'column', minHeight: rows || undefined, children: [...out, Box({ key: 'spacer', flexGrow: 1 }), ...(footBox ? [footBox] : [])] })
  }
  const head = out.slice(0, headN)
  const body = out.slice(headN)
  const view = Math.max(3, rows - measure(head, cols) - measure(footBox, cols))
  const content = measure(body, cols)
  cardHits = []
  let y = measure(head, cols) - bodyOffset
  for (const item of body) {
    const hgt = measure(item, cols)
    const k = item?.props?.key
    if (k && cardMax[k] !== undefined) cardHits.push({ key: k, top: y, bottom: y + hgt })
    y += hgt
  }
  lastView = view
  lastContent = content
  bodyMax = Math.max(0, content - view)
  bodyOffset = Math.max(0, Math.min(bodyOffset, bodyMax))
  const rail: any[] = []
  if (bodyMax > 0) {
    const thumb = Math.max(1, Math.round((view * view) / content))
    const at = Math.round(((view - thumb) * bodyOffset) / bodyMax)
    for (let i = 0; i < view; i++) rail.push(Text({ color: i >= at && i < at + thumb ? C.purple : C.dim, children: [i >= at && i < at + thumb ? '┃' : '│'] }))
  }
  return Box({
    flexDirection: 'column',
    height: rows,
    children: [
      Box({ key: 'head', flexDirection: 'column', flexShrink: 0, children: head }),
      Box({
        key: 'body',
        flexDirection: 'row',
        flexGrow: 1,
        flexShrink: 1,
        minHeight: 0,
        overflow: 'hidden',
        children: [
          Box({ key: 'body-clip', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', children: [Box({ key: 'body-in', flexDirection: 'column', flexShrink: 0, marginTop: -bodyOffset, children: body })] }),
          ...(rail.length ? [Box({ key: 'body-bar', flexDirection: 'column', width: 1, children: rail })] : []),
        ],
      }),
      ...(footBox ? [footBox] : []),
    ],
  })
}

const kids = (el: any) => {
  const c = el?.children ?? el?.props?.children
  return Array.isArray(c) ? c.flat(Infinity) : c != null ? [c] : []
}

const textOf = (el: any): string => (typeof el === 'string' || typeof el === 'number' ? String(el) : el && typeof el === 'object' ? (el.props?.label ?? '') + kids(el).map(textOf).join('') : '')

const widthOf = (el: any): number => {
  if (!el || typeof el !== 'object') return String(el ?? '').length
  if (el.type === 'Button') return String(el.props?.label ?? '').length + (el.props?.plain ? 0 : 4)
  if (el.type === 'Box') {
    const p = el.props || {}
    const ks = kids(el)
    const gap = p.columnGap ?? p.gap ?? 0
    const inner = p.flexDirection === 'column' ? Math.max(0, ...ks.map(widthOf)) : ks.reduce((a: number, k: any) => a + widthOf(k), 0) + gap * Math.max(0, ks.length - 1)
    return inner + (p.borderStyle ? 2 : 0) + 2 * (p.paddingX ?? p.padding ?? 0)
  }
  return textOf(el).length
}

function measure(el: any, width: number): number {
  if (Array.isArray(el)) return el.reduce((a, x) => a + measure(x, width), 0)
  if (!el || typeof el !== 'object') return 0
  const p = el.props || {}
  if (el.type === 'Raster' || el.type === 'Image') return p.rows || 1
  if (el.type === 'Text') return p.wrap === 'wrap' ? Math.max(1, Math.ceil(textOf(el).length / Math.max(1, width))) : 1
  if (el.type !== 'Box') return 1
  if (p.display === 'none') return 0
  if (typeof p.height === 'number') return p.height + Math.max(0, (p.marginTop ?? p.marginY ?? p.margin ?? 0) + (p.marginBottom ?? p.marginY ?? p.margin ?? 0))
  const border = p.borderStyle ? 2 : 0
  const padY = (p.paddingTop ?? p.paddingY ?? p.padding ?? 0) + (p.paddingBottom ?? p.paddingY ?? p.padding ?? 0)
  const marY = (p.marginTop ?? p.marginY ?? p.margin ?? 0) + (p.marginBottom ?? p.marginY ?? p.margin ?? 0)
  const inner = Math.max(1, width - (p.borderStyle ? 2 : 0) - 2 * (p.paddingX ?? p.padding ?? 0))
  const ks = kids(el)
  let h = 0
  if (p.flexDirection === 'row' || p.flexDirection === 'row-reverse') {
    const tallest = Math.max(1, ...ks.map((k: any) => measure(k, inner)))
    if (p.flexWrap === 'wrap') {
      const gap = p.columnGap ?? p.gap ?? 0
      let lines = 1
      let used = 0
      for (const k of ks) {
        const kw = widthOf(k) + (used ? gap : 0)
        if (used && used + kw > inner) {
          lines++
          used = widthOf(k)
        } else used += kw
      }
      h = lines * tallest + (p.rowGap ?? p.gap ?? 0) * (lines - 1)
    } else h = tallest
  } else {
    h = ks.reduce((a: number, k: any) => a + measure(k, inner), 0) + (p.rowGap ?? p.gap ?? 0) * Math.max(0, ks.length - 1)
  }
  return h + border + padY + Math.max(0, marY)
}

const prefsPath = () => `${home}/.local/state/nerv/prefs.json`
let prefsStamp = -1

async function savePrefs($: any, patch: Record<string, unknown>) {
  if (!home) return
  const cur = JSON.parse((await $.fs.read(prefsPath()).catch(() => '')) || '{}')
  await $.process.run(['mkdir', '-p', `${home}/.local/state/nerv`], { timeoutMs: 5000 }).catch(() => undefined)
  await $.fs.write(prefsPath(), JSON.stringify({ ...cur, ...patch }) + '\n').catch(() => undefined)
  prefsStamp = (await $.fs.stat(prefsPath()).catch(() => undefined))?.mtimeMs ?? prefsStamp
}

function enterTab($: any, id: string) {
  if (id === 'hw') refreshHw($)
  if (id === 'live') void refreshLive($)
  if (id === 'forge') refreshForge($)
  if (id === 'nodd') refreshNodd($)
  if (id === 'edd') void refreshEdd($)
  if (id === 'cortex') refreshCortex($)
  if (id === 'yt') ytPoll($)
}

async function syncPrefs($: any) {
  if (!home) return
  const st = await $.fs.stat(prefsPath()).catch(() => undefined)
  if (!st || st.mtimeMs === prefsStamp) return
  prefsStamp = st.mtimeMs
  let p: any
  try {
    p = JSON.parse((await $.fs.read(prefsPath()).catch(() => '')) || '{}')
  } catch {
    return
  }
  if (typeof p.theme === 'string' && p.theme !== themeId) applyTheme(p.theme)
  if ('pinned' in p) {
    const next = TABS.some((x) => x.id === p.pinned) ? p.pinned : ''
    if (next && next !== pinned && next !== tab) {
      tab = next
      $.store.set('tab', tab).catch(() => undefined)
      enterTab($, tab)
    }
    pinned = next
  }
  if (Array.isArray(p.folded)) {
    folded.clear()
    for (const k of p.folded) folded.add(String(k))
  }
  if ('effort' in p) {
    const pick = typeof p.effort === 'string' ? p.effort : undefined
    if (pick !== effortPick) {
      effortPick = pick
      setEffort(effortPick || settingsEffort || effort)
    }
  }
  if (typeof p.quiet === 'boolean' && p.quiet !== quiet) {
    quiet = p.quiet
    if (quiet) {
      await $.ui.close({ id: PANE }).catch(() => undefined)
      paneOpen = false
    } else {
      await refreshLocal($)
      await openPane($)
    }
  }
  $.ui.invalidate('ui.render')
}

async function setTheme($: any, id: string) {
  if (!applyTheme(id)) return false
  await $.store.set('theme', id).catch(() => undefined)
  await savePrefs($, { theme: themeId })
  if (home) {
    await $.process.run(['mkdir', '-p', `${home}/.local/state/nerv`], { timeoutMs: 5000 }).catch(() => undefined)
    const { label, ...colors } = THEMES[themeId]
    await $.fs.write(`${home}/.local/state/nerv/theme.json`, JSON.stringify({ theme: themeId, label, colors }, null, 2) + '\n').catch(() => undefined)
  }
  $.ui.invalidate('ui.render')
  return true
}

export type EddDecision = { id: string; kind: string; question: string; suggested?: string; test?: string }
export type EddView = {
  slug: string
  title: string
  n: number | null
  open: boolean
  approved: boolean
  tests: { total: number; green: number; sealed: number; pending: number }
  openStep: string
  decisions: EddDecision[]
  demo: number | 'timeout' | null
  perito: { findings: number; sealsOk: boolean; green: boolean } | null
  presence: string
}
export const eddParse = (raw: unknown): any[] =>
  (typeof raw === 'string' ? raw.split('\n') : [])
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l)
      } catch {
        return null
      }
    })
    .filter(Boolean)
export const eddCounts = (index: readonly any[]) => {
  const closed = new Set<string>()
  let opened = 0
  for (const e of index) {
    if (e?.type === 'story_opened') opened++
    else if (e?.type === 'story_closed' && e.payload?.slug) closed.add(e.payload.slug)
  }
  return { opened, closed: closed.size }
}
export const eddActiveSlug = (index: readonly any[]): string => {
  const closed = new Set<string>()
  const opened: string[] = []
  for (const e of index) {
    if (e?.type === 'story_opened' && e.payload?.slug) opened.push(e.payload.slug)
    else if (e?.type === 'story_closed' && e.payload?.slug) closed.add(e.payload.slug)
  }
  for (let i = opened.length - 1; i >= 0; i--) if (!closed.has(opened[i]!)) return opened[i]!
  return opened[opened.length - 1] || ''
}
export const eddStory = (entries: readonly any[]): EddView => {
  const v: EddView = { slug: '', title: '', n: null, open: true, approved: false, tests: { total: 0, green: 0, sealed: 0, pending: 0 }, openStep: '', decisions: [], demo: null, perito: null, presence: '' }
  const tests = new Map<string, { status: string }>()
  const unseals = new Map<string, string>()
  const queued = new Map<string, EddDecision>()
  const answered = new Set<string>()
  for (const e of entries) {
    const p = (e && e.payload) || {}
    switch (e?.type) {
      case 'story_opened':
        v.title = p.text || p.title || v.title
        v.n = typeof p.n === 'number' ? p.n : v.n
        if (e.presence) v.presence = e.presence
        break
      case 'pact_proposed':
        tests.clear()
        for (const x of p.tests || []) if (x?.name) tests.set(x.name, { status: 'pending' })
        break
      case 'pact_approved':
        v.approved = true
        break
      case 'pact_changed':
        if (p.op === 'add' && p.name && !tests.has(p.name)) tests.set(p.name, { status: 'pending' })
        else if (p.op === 'drop' && p.name) tests.delete(p.name)
        break
      case 'test_sealed': {
        if (p.kind === 'demo') break
        const x = tests.get(p.name)
        if (x) x.status = 'sealed'
        break
      }
      case 'step_opened':
        if (p.test) v.openStep = p.test
        break
      case 'step_closed': {
        const x = tests.get(p.test)
        if (x) x.status = 'green'
        if (v.openStep === p.test) v.openStep = ''
        break
      }
      case 'test_unsealed':
        if (typeof p.decisionId === 'string') unseals.set(p.decisionId, p.name)
        else {
          const x = tests.get(p.name)
          if (x) x.status = 'pending'
        }
        break
      case 'decision_queued':
        if (p.id) queued.set(p.id, { id: p.id, kind: p.kind || '?', question: p.question || '', suggested: p.suggested, test: p.test })
        break
      case 'decision_answered':
        if (p.id) answered.add(p.id)
        if (p.answer === 'allow') {
          const nm = unseals.get(p.id)
          const x = nm ? tests.get(nm) : undefined
          if (x) x.status = 'pending'
        }
        break
      case 'demo_run':
        v.demo = p.exit ?? null
        break
      case 'perito_report':
        v.perito = { findings: Array.isArray(p.findings) ? p.findings.length : 0, sealsOk: !!p.seals_ok, green: !!(p.suite && p.suite.green) }
        break
      case 'presence_changed':
        if (p.to) v.presence = p.to
        break
      case 'story_closed':
        v.open = false
        break
    }
  }
  const list = [...tests.values()]
  v.tests = {
    total: list.length,
    green: list.filter((x) => x.status === 'green').length,
    sealed: list.filter((x) => x.status === 'sealed').length,
    pending: list.filter((x) => x.status === 'pending').length,
  }
  v.decisions = [...queued.values()].filter((d) => !answered.has(d.id))
  return v
}

export type EddBacklogItem = { n: number; text: string; slug?: string; state: 'todo' | 'open' | 'closed' }
export const eddBacklog = (md: string, index: readonly any[]): EddBacklogItem[] => {
  const slugs = new Map<number, string>()
  const closed = new Set<string>()
  for (const e of index) {
    const p = (e && e.payload) || {}
    const n = typeof p.n === 'number' ? p.n : typeof p.storyIndex === 'number' ? p.storyIndex : null
    if (e?.type === 'story_opened' && p.slug && n != null) slugs.set(n, p.slug)
    else if (e?.type === 'story_closed' && p.slug) closed.add(p.slug)
  }
  const items: EddBacklogItem[] = []
  for (const line of String(md || '').split('\n')) {
    const m = /^\s*(\d+)\.\s+(.*)$/.exec(line)
    if (!m) continue
    const n = Number(m[1])
    const slug = slugs.get(n)
    items.push({ n, text: m[2]!.trim(), ...(slug ? { slug } : {}), state: slug ? (closed.has(slug) ? 'closed' : 'open') : 'todo' })
  }
  return items
}

const EDD_MISSING = 'edd no está en el PATH (npm link / npm i -g @gonrocca/edd)'
const firstLine = (s: unknown) => String(s || '').split('\n').map((l) => l.trim()).find(Boolean) || ''
async function eddAct($: any, fn: () => Promise<string | void>) {
  try {
    const msg = await fn()
    if (msg) $.ui.toast(clip(msg, 70))
  } catch (err: any) {
    $.ui.toast(clip(String(err?.message || err), 70))
  }
  await refreshEdd($)
  $.ui.invalidate('ui.render')
}
async function eddCli($: any, root: string, args: string[]): Promise<string> {
  let r: any
  try {
    r = await $.process.run(['edd', ...args], { cwd: root, timeoutMs: 60000 })
  } catch (err: any) {
    if (/ENOENT|not found|no such file/i.test(String(err?.message || err))) return EDD_MISSING
    throw err
  }
  if (r.exitCode === 127 || (r.exitCode !== 0 && /ENOENT|command not found/i.test(String(r.stderr || '')))) return EDD_MISSING
  return firstLine(r.stdout) || firstLine(r.stderr) || (r.exitCode === 0 ? `edd ${args[0]} ok` : `edd ${args[0]}: exit ${r.exitCode}`)
}
// command.run / prompt.submit se encolan hasta que la sesión está libre (una historia entera puede tardar): no se esperan
const eddToastErr = ($: any) => (err: any) => $.ui.toast(clip(String(err?.message || err), 70))
const eddSlash = ($: any, command: string, args?: string) =>
  eddAct($, async () => {
    $.command.run(args ? { command, args } : { command }).catch(eddToastErr($))
    return `/${command}${args ? ' ' + args : ''} enviado`
  })
const eddChat = ($: any, text: string, msg: string) =>
  eddAct($, async () => {
    $.prompt.submit({ text }).catch(eddToastErr($))
    return msg
  })

async function refreshEdd($: any) {
  const root = gitRoot || cwdNow
  if (!root) {
    edd = undefined
    return
  }
  const idxRaw = await $.fs.read(`${root}/.edd/index.jsonl`).catch(() => undefined)
  if (typeof idxRaw !== 'string') {
    edd = { present: false, root }
    return
  }
  const index = eddParse(idxRaw)
  const counts = eddCounts(index)
  const activeOnBranch = branch.startsWith('edd/')
  const slug = activeOnBranch ? branch.slice('edd/'.length) : eddActiveSlug(index)
  let view: EddView | null = null
  if (slug) {
    const raw = await $.fs.read(`${root}/.edd/stories/${slug}/ledger.jsonl`).catch(() => undefined)
    if (typeof raw === 'string') {
      view = eddStory(eddParse(raw))
      view.slug = slug
    }
  }
  let presence = view?.presence || ''
  let approvals = ''
  const cfgRaw = await $.fs.read(`${root}/edd.config.json`).catch(() => undefined)
  if (typeof cfgRaw === 'string') {
    try {
      const cfg = JSON.parse(cfgRaw)
      presence = cfg.presence || presence
      approvals = cfg.approvals || ''
    } catch {}
  }
  // .edd/presence (edd presence <modo>) es local a este checkout y pisa la config: es lo que ve esta sesión
  const localRaw = await $.fs.read(`${root}/.edd/presence`).catch(() => undefined)
  const local = typeof localRaw === 'string' ? localRaw.trim() : ''
  const presenceLocal = ['sync', 'async', 'auto'].includes(local)
  if (presenceLocal) presence = local
  const blRaw = await $.fs.read(`${root}/BACKLOG.md`).catch(() => undefined)
  const backlog = typeof blRaw === 'string' ? eddBacklog(blRaw, index) : null
  if (view && view.n == null) view.n = backlog?.find((b) => b.slug === view!.slug)?.n ?? null
  edd = { present: true, root, counts, view, presence, presenceLocal, approvals, activeOnBranch, backlog, at: now() }
}

async function refreshForge($: any) {
  if (!home) return
  const raw = await $.fs.read(`${home}/.local/state/forge/state.json`).catch(() => undefined)
  if (typeof raw !== 'string') {
    forge = undefined
    forgeMissing = true
    return
  }
  try {
    forge = JSON.parse(raw)
    forgeMissing = false
  } catch {}
}

async function cortexCall($: any, name: string, args: Record<string, unknown> = {}) {
  const r = await $.http.fetch(CORTEX_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cortexKey}`, 'Content-Type': 'application/json', Accept: 'application/json', 'X-Cortex-Output': 'json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  })
  if (!r.ok) throw new Error(`Cortex respondió ${r.status}`)
  const j = JSON.parse(r.text)
  if (j.error) throw new Error(String(j.error.message || 'error de Cortex'))
  return JSON.parse(j.result?.content?.[0]?.text || 'null')
}

async function refreshCortex($: any) {
  if (cortexBusy || !home) return
  cortexBusy = true
  try {
    if (!cortexKey) {
      const conf = JSON.parse((await $.fs.read(`${home}/.claude.json`).catch(() => '')) || '{}')
      cortexKey = String(conf?.mcpServers?.cortex?.env?.CORTEX_API_KEY || '')
    }
    if (!cortexKey) cortex = { err: 'no encontré la clave de Cortex en ~/.claude.json' }
    else {
      const [stats, recent] = await Promise.all([cortexCall($, 'memoria_stats'), cortexCall($, 'memoria_recent', { limit: 6 })])
      cortex = { stats, recent: Array.isArray(recent) ? recent : [], at: now() }
      if (now() - blue.at > 3600000) {
        const r = await $.http.fetch('https://dolarapi.com/v1/dolares/blue').catch(() => undefined)
        const venta = r?.ok ? Number(JSON.parse(r.text)?.venta) : NaN
        blue = Number.isFinite(venta) && venta > 0 ? { ars: venta, live: true, at: now() } : { ...blue, at: now() }
      }
    }
  } catch (err: any) {
    cortex = { ...cortex, err: clip(String(err?.message || err), 60) }
  } finally {
    cortexBusy = false
    $.ui.invalidate('ui.render')
  }
}

export const cxEvent = (x: any): CxEvent => ({
  ts: String(x?.ts || ''),
  kind: String(x?.kind || ''),
  ws: x?.workspace === 'wibond' ? 'wibond' : 'personal',
  tool: String(x?.tool || '').replace(/^mcp__.+?__/, ''),
  ids: (Array.isArray(x?.ids) ? x.ids : []).map(Number).filter(Number.isFinite),
  titles: Array.isArray(x?.titles) ? x.titles.map((s: unknown) => oneLine(s)) : x?.title ? [oneLine(x.title)] : [],
  types: Array.isArray(x?.types) ? x.types.map((s: unknown) => String(s || '')) : [],
  projects: Array.isArray(x?.projects) ? x.projects.map((s: unknown) => String(s || '')) : [],
  workspaces: Array.isArray(x?.workspaces) ? x.workspaces.map((s: unknown) => String(s || '')) : [],
  session: String(x?.session || ''),
  project: String(x?.project || ''),
  prompt: oneLine(x?.prompt),
})

export const cxTally = (events: readonly CxEvent[]) => {
  const zero = () => ({ brought: 0, reads: 0, saves: 0, nudges: 0 })
  const by = { personal: zero(), wibond: zero() }
  for (const ev of events) {
    const b = ev.ws === 'wibond' ? by.wibond : by.personal
    if (ev.kind === 'context' || ev.kind === 'hint') b.brought += ev.ids.length
    else if (ev.kind === 'nudge') b.nudges++
    else if (ev.kind === 'tool' && CX_SAVES.has(ev.tool)) b.saves++
    else if (ev.kind === 'tool' && CX_READS.has(ev.tool)) b.reads++
  }
  return by
}

export const cxTool = (tool: unknown) => /^mcp__.*?cortex.*?__(memoria_\w+)$/.exec(String(tool || ''))?.[1]

const cxText = (v: any): string => {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map(cxText).join('\n')
  if (!v || typeof v !== 'object') return ''
  if (typeof v.text === 'string') return v.text
  return v.content !== undefined ? cxText(v.content) : ''
}

export const cxHits = (output: unknown): CxHit[] => {
  const lines = cxText(output).split('\n')
  const out = new Map<number, CxHit>()
  lines.forEach((line, i) => {
    const row = /#(\d+)(?: \[([\w.-]+)\])? · ([a-z_]+) · (.+?) · \d{4}-\d\d-\d\d/.exec(line)
    if (row) {
      if (!out.has(+row[1])) out.set(+row[1], { id: +row[1], type: row[3], project: row[4], workspace: row[2] || '', title: oneLine(lines[i + 1]).replace(/^title: /, '') })
      return
    }
    const hint = /^\s*(\S+)\s+#(\d+)(?: \[([\w.-]+)\])? (.+) \(\d+(?:\.\d+)?\)(?: · .*)?$/.exec(line)
    if (hint && !out.has(+hint[2])) out.set(+hint[2], { id: +hint[2], type: CX_EMOJI[hint[1].replace(/\uFE0F/g, '')] || '', project: '', workspace: hint[3] || '', title: hint[4] })
  })
  return [...out.values()]
}

const cxArg = (tool: string, input: any) => {
  const i = input && typeof input === 'object' ? input : {}
  if (tool === 'memoria_get') return (Array.isArray(i.ids) ? i.ids : [i.id]).filter((x: unknown) => x !== undefined).map((x: unknown) => `#${x}`).join(' ')
  if (tool === 'memoria_timeline' && i.id !== undefined) return `#${i.id}`
  if (CX_SAVES.has(tool)) return i.project ? `en ${i.project}` : ''
  const v = i.query ?? i.symptom ?? i.context ?? i.title ?? i.goal
  return v ? `«${clip(oneLine(v), 40)}»` : ''
}

export const cxCalls = (calls: readonly any[]) => {
  const verbs = new Map<string, number>()
  const read = new Map<number, CxHit>()
  const saved: CxHit[] = []
  for (const c of calls) {
    const tool = cxTool(c.tool)
    if (!tool) continue
    const label = [CX_VERBS[tool] || tool.replace(/^memoria_/, ''), cxArg(tool, c.input)].filter(Boolean).join(' ')
    verbs.set(label, (verbs.get(label) || 0) + 1)
    if (CX_SAVES.has(tool)) {
      const id = Number(/#(\d+)/.exec(cxText(c.output))?.[1] ?? c.input?.id)
      if (Number.isFinite(id)) saved.push({ id, type: String(c.input?.type || ''), project: String(c.input?.project || ''), workspace: '', title: oneLine(c.input?.title || '') })
    } else for (const h of cxHits(c.output)) if (!read.has(h.id)) read.set(h.id, h)
  }
  return { verbs: [...verbs].map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)), read: [...read.values()], saved }
}

const cxHue = (type: string) => ({ bug_fix: C.red, discovery: C.cyan, config: C.violet, architecture: C.purple, decision: C.orange, lesson: C.amber, pattern: C.lime, preference: C.pink })[type] || C.muted

const cxRow = (Text: any, h: CxHit, accent: string, skipProject = '') =>
  Text({
    wrap: 'truncate',
    children: [
      Text({ color: cxHue(h.type), children: ['▍'] }),
      Text({ color: accent, bold: true, children: [` #${h.id}`] }),
      ...(h.workspace ? [Text({ color: C.amber, children: [` [${h.workspace}]`] })] : []),
      Text({ color: C.text, children: [` ${h.title || '…'}`] }),
      ...(h.project && h.project !== skipProject ? [Text({ color: C.dim, children: [` · ${h.project}`] })] : []),
    ],
  })

const cxCard = ({ Box, Text }: any, accent: string, glyph: string, head: string, tag: string, rows: any[]) =>
  Box({
    flexDirection: 'column',
    borderStyle: 'round',
    borderColor: accent,
    paddingX: 1,
    children: [
      Box({
        flexDirection: 'row',
        justifyContent: 'space-between',
        columnGap: 2,
        children: [
          Box({ flexShrink: 1, children: [Text({ wrap: 'truncate', children: [Text({ color: accent, bold: true, children: [`${glyph} CORTEX`] }), Text({ color: C.dim, children: [' 記憶 '] }), Text({ color: C.text, children: [`▸ ${head}`] })] })] }),
          ...(tag ? [Box({ flexShrink: 0, children: [Text({ color: C.dim, children: [tag] })] })] : []),
        ],
      }),
      ...rows,
    ],
  })

export const cxPromptKey = (text: unknown) => oneLine(text).slice(0, 100)

const cxEventCard = (ui: any, ev: CxEvent) => {
  const accent = ev.kind === 'context' ? C.purple : C.cyan
  const hits: CxHit[] = ev.ids.map((id, i) => ({ id, title: ev.titles[i] || '', type: ev.types[i] || '', project: ev.projects[i] || '', workspace: ev.workspaces[i] || '' }))
  const rows = hits.slice(0, CX_ROWS).map((h) => cxRow(ui.Text, h, accent, ev.kind === 'context' ? ev.project : ''))
  if (hits.length > CX_ROWS) rows.push(ui.Text({ wrap: 'truncate', color: C.dim, children: [`  + ${hits.length - CX_ROWS} más · memoria_get con el #id trae el detalle`] }))
  const n = `${hits.length} ${hits.length === 1 ? 'memoria' : 'memorias'}`
  const head = ev.kind === 'context' ? `cargó ${n} de ${ev.project}` : `trajo ${n} para este pedido`
  return cxCard(ui, accent, ev.kind === 'context' ? '◉' : '◈', head, `${ev.ws} · ${ev.ts.slice(11, 16)}`, rows)
}

const cxContextAt = new Map<string, string>()

const cxEventsFor = (text: string) => {
  const prompt = cxPromptKey(text)
  const mine = cxLog.events.filter((ev) => ev.session === sessionId && ev.ids.length)
  const out: CxEvent[] = []
  const ctx = mine.filter((ev) => ev.kind === 'context').at(-1)
  if (ctx && prompt) {
    const key = ctx.ts + ctx.ids.join(',')
    if (!cxContextAt.has(key)) cxContextAt.set(key, prompt)
    if (cxContextAt.get(key) === prompt) out.push(ctx)
  }
  const hint = mine.filter((ev) => ev.kind === 'hint' && ev.prompt && ev.prompt === prompt).at(-1)
  if (hint) out.push(hint)
  return out
}

const cxToolCard = (ui: any, calls: readonly any[]) => {
  const { verbs, read, saved } = cxCalls(calls)
  const live = calls.some((c) => c.isRunning)
  const failed = calls.some((c) => c.isErrored)
  const accent = failed ? C.red : saved.length ? C.lime : C.violet
  const glyph = live ? SPIN[frame % 4] : failed ? '✖' : saved.length ? '✚' : '⌕'
  const single = calls.length === 1
  const head = single ? verbs[0] || 'Cortex' : `${calls.length} consultas`
  const rows: any[] = []
  if (!single && verbs.length) rows.push(ui.Text({ wrap: 'truncate', color: C.muted, children: [verbs.join(' · ')] }))
  for (const h of saved) rows.push(cxRow(ui.Text, h, C.lime))
  for (const h of read.slice(0, CX_ROWS)) rows.push(cxRow(ui.Text, h, accent))
  if (read.length > CX_ROWS) rows.push(ui.Text({ wrap: 'truncate', color: C.dim, children: [`  + ${read.length - CX_ROWS} memorias más`] }))
  if (live && !rows.length) rows.push(ui.Text({ color: C.dim, children: ['consultando…'] }))
  const tag = read.length ? `${read.length} ${read.length === 1 ? 'memoria' : 'memorias'}` : ''
  return cxCard(ui, accent, glyph, head, tag, rows)
}

async function readCortexLog($: any) {
  if (cxLog.busy || !cxLog.path) return
  cxLog.busy = true
  try {
    const st = await $.fs.stat(cxLog.path).catch(() => undefined)
    if (!st) {
      const had = cxLog.events.length > 0 || !cxLog.missing
      cxLog = { ...cxLog, primed: true, line: 0, size: 0, mtime: 0, missing: true, events: [] }
      if (had && tab === 'cortex') $.ui.invalidate('ui.render')
      return
    }
    if (cxLog.primed && st.mtimeMs === cxLog.mtime && st.size === cxLog.size) return
    const reset = !cxLog.primed || st.size < cxLog.size
    const r = await $.process.run(['sh', '-c', CX_AWK, 'sh', String(reset ? 1 : cxLog.line + 1), reset ? '1' : '0', cxLog.path], { timeoutMs: 5000 }).catch(() => undefined)
    if (r?.exitCode !== 0) return
    const rows = String(r.stdout || '').split('\n').filter(Boolean)
    const day = rows.shift() || ''
    const end = Number(rows.pop())
    if (!day || !Number.isFinite(end)) return
    let line = end
    const added: CxEvent[] = []
    for (const row of rows) {
      const tabAt = row.indexOf('\t')
      const nr = Number(row.slice(0, tabAt))
      try {
        const ev = cxEvent(JSON.parse(row.slice(tabAt + 1)))
        if (ev.ts.startsWith(day)) added.push(ev)
      } catch {
        if (nr === end) line = end - 1
      }
    }
    const kept = reset ? [] : cxLog.events.filter((ev) => ev.ts.startsWith(day))
    cxLog = { ...cxLog, primed: true, line, size: st.size, mtime: st.mtimeMs, day, missing: false, events: [...kept, ...added].slice(-5000) }
    if (added.length && (tab === 'cortex' || added.some((ev) => ev.session === sessionId && (ev.kind === 'context' || ev.kind === 'hint')))) $.ui.invalidate('ui.render')
  } finally {
    cxLog.busy = false
  }
}

async function ytSend($: any, cmds: any[][]) {
  const r = await $.process.run(['socat', '-t', '0.3', '-', `UNIX-CONNECT:${ytSock()}`], { stdin: cmds.map((c, i) => JSON.stringify({ command: c, request_id: i + 1 })).join('\n') + '\n', timeoutMs: 3000 })
  const out: Record<number, any> = {}
  for (const line of String(r?.stdout || '').split('\n')) {
    try {
      const j = JSON.parse(line)
      if (j.request_id) out[j.request_id] = j.error === 'success' ? j.data : undefined
    } catch {}
  }
  return cmds.map((_, i) => out[i + 1])
}

async function ytSearch($: any, q: string) {
  ytRecent = [q, ...ytRecent.filter((x) => x !== q)].slice(0, 5)
  await $.store.set('ytRecent', ytRecent).catch(() => undefined)
  await ytLoad($, `ytsearch25:${q}`, q)
}

async function ytLoad($: any, target: string, label: string) {
  yt = { ...yt, busy: true, err: '', query: label }
  $.ui.invalidate('ui.render')
  const account = target.startsWith(':') ? ['--cookies-from-browser', YT_COOKIES, '--playlist-end', '25'] : []
  const r = await $.process.run(['yt-dlp', ...account, target, '--flat-playlist', '-J', '--no-warnings'], { timeoutMs: 60000 }).catch((err: any) => ({ exitCode: 1, stdout: '', stderr: String(err) }))
  try {
    const entries = JSON.parse(String(r.stdout || '{}')).entries || []
    yt.results = entries.filter((e: any) => e?.id).map((e: any) => ({ id: String(e.id), title: String(e.title || e.id), ch: String(e.channel || e.uploader || ''), d: Number(e.duration) || 0 }))
    if (!yt.results.length) yt.err = 'sin resultados'
  } catch {
    yt.err = clip(String(r.stderr || 'no se pudo buscar').trim().split('\n').pop() || '', 60)
  }
  yt.busy = false
  $.ui.invalidate('ui.render')
}

async function ytResolve($: any, id: string) {
  const r = await $.process.run(['yt-dlp', '--cookies-from-browser', YT_COOKIES, '-f', 'bestaudio/best', '-g', '--no-warnings', `https://youtu.be/${id}`], { timeoutMs: 30000 }).catch(() => undefined)
  const direct = String(r?.stdout || '').trim().split('\n')[0]
  return direct.startsWith('http') ? direct : ''
}

async function ytRemember($: any, list: YtItem[], url = '', id = '') {
  let items: Record<string, YtItem> = {}
  try {
    items = JSON.parse((await $.fs.read(ytState()).catch(() => '')) || '{}').items || {}
  } catch {}
  for (const x of list) items[x.id] = x
  ytItems = items
  await $.fs.write(ytState(), JSON.stringify({ items }) + '\n').catch(() => undefined)
  if (url && id) await $.process.run(['bash', '-c', 'printf "%s\\t%s\\n" "$1" "$2" >> "$3"', 'nerv-yt-map', url, id, ytMapPath()], { timeoutMs: 5000 }).catch(() => undefined)
}

async function ytPlay($: any, i: number) {
  if (yt.now) return ytInsert($, yt.results[i], true)
  return ytStart($, yt.results.slice(i, i + 25))
}

async function ytStart($: any, list: YtItem[]) {
  if (!list.length) return
  ytStarting = Date.now()
  await $.fs.write(ytStartFile(), String(ytStarting)).catch(() => undefined)
  yt.queue = list
  yt.now = { idx: 0, title: list[0].title }
  $.ui.invalidate('ui.render')
  try {
    await ytSend($, [['quit']]).catch(() => undefined)
    await $.process.run(['bash', '-c', YT_KILL, 'nerv-yt-kill', ytSock()], { timeoutMs: 5000 }).catch(() => undefined)
    await $.process.run(['rm', '-f', ytMapPath()], { timeoutMs: 5000 }).catch(() => undefined)
    const direct = await ytResolve($, list[0].id)
    await ytRemember($, list, direct, list[0].id)
    await $.process
      .run(['setsid', '-f', 'mpv', '--no-video', '--no-terminal', '--volume=100', `--ytdl=${direct ? 'no' : 'yes'}`, `--input-ipc-server=${ytSock()}`, '--ytdl-format=bestaudio/best', `--ytdl-raw-options=cookies-from-browser=${YT_COOKIES}`, direct || `https://youtu.be/${list[0].id}`], { timeoutMs: 5000 })
      .catch(() => undefined)
    if (list.length > 1) await $.process.run(['setsid', '-f', 'bash', '-c', YT_FILL, 'nerv-yt-fill', ytSock(), YT_COOKIES, ytMapPath(), ...list.slice(1).map((x) => x.id)], { timeoutMs: 5000 }).catch(() => undefined)
    await ytWaitSock($)
  } finally {
    ytStarting = 0
    await $.process.run(['rm', '-f', ytStartFile()], { timeoutMs: 5000 }).catch(() => undefined)
  }
  $.ui.invalidate('ui.render')
}

async function ytWaitSock($: any) {
  for (let k = 0; k < 40; k++) {
    if (await $.fs.stat(ytSock()).catch(() => undefined)) return true
    await $.clock.sleep(250).catch(() => undefined)
  }
  return false
}

async function ytInsert($: any, item: YtItem | undefined, playNow: boolean) {
  if (!item || ytPend.has(item.id)) return
  if (!playNow && yt.now && yt.queue.slice((yt.now.idx || 0) + 1).some((x) => x.id === item.id)) {
    $.ui.toast(`«${clip(item.title, 28)}» ya está en la cola`)
    return
  }
  const elsewhere = Date.now() - ((await $.fs.stat(ytStartFile()).catch(() => undefined))?.mtimeMs || 0) < 30000
  ytPend.add(item.id)
  if (!yt.now && !ytStarting && !elsewhere) return ytStart($, [item]).finally(() => ytPend.delete(item.id))
  ytNote = playNow ? `poniendo «${clip(item.title, 28)}»…` : `sumando «${clip(item.title, 28)}» a la cola…`
  $.ui.invalidate('ui.render')
  try {
    const direct = await ytResolve($, item.id)
    await ytRemember($, [item], direct, item.id)
    if (ytStarting || elsewhere) await ytWaitSock($)
    const load = direct ? ['loadfile', direct, playNow ? 'insert-next' : 'append'] : ['loadfile', `https://youtu.be/${item.id}`, playNow ? 'insert-next' : 'append', -1, 'ytdl=yes']
    await ytSend($, playNow ? [load, ['playlist-next']] : [load]).catch(() => undefined)
  } finally {
    ytPend.delete(item.id)
    ytNote = ytPend.size ? ytNote : ''
  }
  await ytPoll($)
}

async function ytPoll($: any) {
  const alive = await $.fs.stat(ytSock()).catch(() => undefined)
  if (ytStarting && (!alive || Date.now() - ytStarting < 60000)) return
  if (!alive) {
    if (yt.now) ((yt.now = undefined), (yt.queue = []), $.ui.invalidate('ui.render'))
    return
  }
  const [pos, dur, pause, idx, aoVol, title, list] = await ytSend($, [['get_property', 'time-pos'], ['get_property', 'duration'], ['get_property', 'pause'], ['get_property', 'playlist-pos'], ['get_property', 'ao-volume'], ['get_property', 'media-title'], ['get_property', 'playlist']]).catch(() => [])
  const vol = typeof aoVol === 'number' ? aoVol : undefined
  if (idx === undefined && pause === undefined) {
    yt.now = undefined
    yt.queue = []
  } else {
    const mapStat = await $.fs.stat(ytMapPath()).catch(() => undefined)
    const stateStat = await $.fs.stat(ytState()).catch(() => undefined)
    const size = (mapStat?.size || 0) + (stateStat?.size || 0)
    if (size !== ytFilesSize) {
      ytFilesSize = size
      ytMap = {}
      for (const line of String((await $.fs.read(ytMapPath()).catch(() => '')) || '').split('\n')) {
        const [u, id] = line.split('\t')
        if (u && id) ytMap[u] = id
      }
      try {
        const st = JSON.parse((await $.fs.read(ytState()).catch(() => '')) || '{}')
        ytItems = st.items || {}
        ytLegacy = Array.isArray(st.queue) ? st.queue : []
      } catch {}
    }
    yt.queue = (Array.isArray(list) ? list : []).map((e: any, k: number) => {
      const f = String(e?.filename || '')
      const id = ytMap[f] || (f.match(/youtu\.be\/([\w-]{6,20})/) || [])[1] || ''
      return ytItems[id] || ytLegacy[k] || { id, title: e?.title || 'tema de la cola', ch: '', d: 0 }
    })
    yt.now = { pos, dur, pause, idx: Number(idx) || 0, vol, title }
  }
  $.ui.invalidate('ui.render')
}

async function ytThumbFor($: any, id: string) {
  if (ytThumb[id] || !/^[\w-]{6,20}$/.test(id)) return
  ytThumb[id] = 'loading'
  if (await $.fs.stat(ytThumbPath(id)).catch(() => undefined)) ytThumb[id] = 'ok'
  else {
    const r = await $.process
      .run(['bash', '-c', 'mkdir -p "$1" && curl -fsSL -m 15 "https://i.ytimg.com/vi/$2/mqdefault.jpg" -o "$1/$2.jpg" && magick "$1/$2.jpg" -resize 160x90 "$1/$2.png" && rm -f "$1/$2.jpg"', 'nerv-thumb', `${home}/.cache/nerv/yt`, id], { timeoutMs: 30000 })
      .catch(() => undefined)
    ytThumb[id] = r?.exitCode === 0 ? 'ok' : 'fail'
  }
  $.ui.invalidate('ui.render')
}

async function ytCtl($: any, cmd: any[]) {
  await ytSend($, [cmd]).catch(() => undefined)
  await ytPoll($)
}

async function refreshNodd($: any) {
  if (!home || !sessionId) return
  const raw = await $.fs.read(`${home}/.local/state/nodd/sessions/${sessionId}.json`).catch(() => undefined)
  try {
    nodd = typeof raw === 'string' ? JSON.parse(raw) : undefined
  } catch {
    nodd = undefined
  }
}

async function noddCmd($: any, args: string) {
  await $.command.run({ command: 'nodd', args }).catch((err: any) => $.ui.toast(`nodd: ${clip(String(err?.message || err), 70)}`))
  await refreshNodd($)
  $.ui.invalidate('ui.render')
}

const GATE_INFO: Record<string, string> = {
  authorize: 'frena escrituras si declaraste read-only',
  classify: 'pide nodd_declare antes de escribir',
  track: 'no deja tocar .nodd/ a mano',
  delegate: 'pide delegar tras mucho trabajo propio',
  evidence: 'tilda una tarea sólo si vio pasar el runner',
  promotion: 'escala a /forge si el runner falla 2 veces',
}

async function viaInbox($: any, mod: string, args: string): Promise<string | false> {
  const sid = home ? await $.session.id().catch(() => '') : ''
  if (!sid) return false
  const path = `${home}/.local/state/${mod}/inbox-${sid}.json`
  const id = `${now()}-${Math.random().toString(36).slice(2, 8)}`
  try {
    await $.fs.write(path, JSON.stringify({ id, args, at: now() }) + '\n')
  } catch {
    return false
  }
  for (let i = 0; i < 15; i++) {
    await $.clock.sleep(100)
    try {
      const back = JSON.parse(String((await $.fs.read(path).catch(() => '')) || '{}'))
      if (back.id === id && back.done) return String(back.text ?? '')
    } catch {}
  }
  return false
}

async function forgeCmd($: any, args: string, announce = false) {
  let text = await viaInbox($, 'forge', args)
  if (text === false) text = String(((await $.command.run({ command: 'forge', args }).catch((err: any) => ({ text: `⚠ ${err?.message || err}` }))) as any)?.text || '')
  if (text && (announce || /^(⚠|no se)/.test(text))) $.ui.toast(`forge: ${clip(text, 70)}`)
  await refreshForge($)
  $.ui.invalidate('ui.render')
}

async function askProfileName($: any) {
  const taken = Object.keys(forge?.profiles || {})
  const base = String(forge?.profile || 'custom').replace(/^zero:/, '')
  let suggestion = base === 'custom' ? 'mio' : `${base}-mio`
  for (let i = 2; taken.includes(suggestion); i++) suggestion = `${base === 'custom' ? 'mio' : `${base}-mio`}-${i}`
  const pick = await $.ui
    .ask('¿Cómo se llama el perfil nuevo? Copia los modelos y efforts de ahora. Escribí el nombre en «Other» o usá el sugerido.', { options: [suggestion, 'Cancelar'], header: 'forge' })
    .catch(() => 'Cancelar')
  const name = String(pick || '').trim()
  if (!name || name === 'Cancelar') return
  await forgeCmd($, `profile new ${name}`, true)
}

async function confirmDelete($: any, name: string) {
  const pick = await $.ui.ask(`¿Borrar el perfil ${name}? No se puede deshacer.`, { options: ['Borrar', 'Cancelar'], header: 'forge' }).catch(() => 'Cancelar')
  if (pick === 'Borrar') await forgeCmd($, `profile delete ${name}`, true)
}

const FORGE_STATUS: Record<string, [string, string]> = {
  running: ['OPERANDO', 'lime'],
  paused: ['EN PAUSA', 'amber'],
  pasa: ['PASA ✔', 'lime'],
  'no-verificado': ['NO VERIFICADO', 'amber'],
  falló: ['FALLÓ', 'red'],
  parado: ['PARADO', 'muted'],
}

const tok = (n: number) => (!n ? '0' : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n))
const bare = (id: string) => String(id || '').replace(/^[^/]+\//, '')
const claudeName = (id: string) => {
  const m = /^claude-(opus|sonnet|haiku|fable)-(\d+)(?:-(\d))?(?:-\d{8})?$/.exec(id)
  return m ? `Claude ${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}${m[3] ? '.' + m[3] : ''}` : id
}
const acctOf = (id: string) => (groupOf(id) === 'claude' ? String(forge?.accounts?.claude || '') : groupOf(id))
const isWork = (id: string) => (forge?.work || []).includes(groupOf(id))
const baseName = (id: string) => {
  const a = acctOf(id)
  const l = forge?.labels?.[id] || claudeName(bare(id))
  return a && l.endsWith(` · ${a}`) ? l.slice(0, -(a.length + 3)) : l
}
const nice = (id: string) => (acctOf(id) ? `${baseName(id)} · ${acctOf(id)}` : baseName(id))
const fitModel = (id: string, width: number) => {
  const a = acctOf(id)
  if (!a) return clip(baseName(id), width)
  const room = Math.max(4, width - a.length - 3)
  const base = baseName(id).length > room ? baseName(id).replace(/^Claude /, '') : baseName(id)
  return `${clip(base, room)} · ${a}`
}
const FACTORY_ORDER = ['turbo', 'barato', 'equilibrado', 'calidad', 'solo-claude', 'openai', 'gemini', 'open-source']
const EFFORT_SHORT: Record<string, string> = { auto: 'auto', off: 'off', minimal: 'min', low: 'low', medium: 'med', high: 'high', xhigh: 'xhigh' }
const groupOf = (id: string) => (['haiku', 'sonnet', 'opus', 'fable'].includes(id) || /^claude-/.test(id) ? 'claude' : id.includes('/') ? id.split('/')[0] : 'cpam')

// ── MODELOS: catálogo del CPAM (CLIProxyAPI local) agrupado por prefijo de cuenta ──
const CPAM_URL = 'http://127.0.0.1:8317'
export const MDL_BROKEN: Record<string, string> = { 'nan/glm5.3-flash': 'timeout', 'nan/mimo-v2.6-flash': 'timeout', 'nan/qwen3.6': 'timeout', 'nan/minimax-h3': '401', 'refuseless/glm-5.3-flash-abliterated': '503' }
export type MdlGroup = { key: string; label: string; prefix: string; models: string[] }
export const mdlSplit = (id: string) => {
  const i = id.indexOf('/')
  return i > 0 ? { prefix: id.slice(0, i), name: id.slice(i + 1) } : { prefix: '', name: id }
}
const mdlFamily = (name: string) => (/^claude/.test(name) ? 'claude' : /^(gpt|codex|o\d)/.test(name) ? 'gpt' : /^glm/.test(name) ? 'glm' : /^gemini/.test(name) ? 'gemini' : 'otros')
// Por qué un modelo sale apagado: roto conocido, o no es de chat (imágenes, revisor de codex).
export const mdlDim = (id: string) => MDL_BROKEN[id] || (/image|auto-review/.test(mdlSplit(id).name) ? 'no chat' : '')
const FAMILY_LABEL: Record<string, string> = { claude: 'Claude', gpt: 'Codex/GPT', glm: 'GLM', gemini: 'Gemini', otros: 'Otros' }
const mdlRank = (g: { key: string; prefix: string }) => {
  if (g.prefix === 'nan') return 0
  if (!g.prefix) return 1 + Object.keys(FAMILY_LABEL).indexOf(g.key)
  const ag = /^ag(\d*)$/.exec(g.prefix)
  if (ag) return 10 + Number(ag[1] || 1)
  return g.prefix === 'wibond' ? 99 : 50
}
export const mdlGroups = (ids: readonly string[], emails: Record<string, string> = {}): MdlGroup[] => {
  const by = new Map<string, MdlGroup>()
  for (const id of ids) {
    const { prefix, name } = mdlSplit(id)
    const key = prefix ? 'p:' + prefix : mdlFamily(name)
    if (!by.has(key)) {
      const who = emails[prefix] ? ' · ' + emails[prefix].split('@')[0] : ''
      const label = prefix === 'nan' ? 'NaN' : prefix === 'ds' ? 'DeepSeek (API oficial)' : prefix === 'refuseless' ? 'Refuseless (abliterated)' : prefix === 'wibond' ? 'Wibond (trabajo)' : /^ag\d*$/.test(prefix) ? `Google ${prefix}${who}` : prefix ? prefix + who : FAMILY_LABEL[key] || key
      by.set(key, { key: prefix ? prefix : key, label, prefix, models: [] })
    }
    by.get(key)!.models.push(id)
  }
  const out = [...by.values()]
  for (const g of out) g.models.sort()
  return out.sort((a, b) => mdlRank(a) - mdlRank(b) || a.key.localeCompare(b.key))
}
export const mdlFilter = (groups: readonly MdlGroup[], q: string): MdlGroup[] => {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return [...groups]
  return groups
    .map((g) => ({ ...g, models: g.models.filter((id) => words.every((x) => `${g.label} ${id}`.toLowerCase().includes(x))) }))
    .filter((g) => g.models.length)
}
// El comando que se tipea en la tab nueva de herdr: reanuda esta conversación (fork, así no
// pisa el transcript de la sesión que sigue abierta) por el CPAM con `id`, o sin `id` vuelve
// directo a Anthropic. La api-key nunca va acá: la lee el apiKeyHelper en runtime.
// Contexto de los modelos openai-compatibility del config.yaml del CPAM: "prefix/name" -> tokens.
// Sólo lee `prefix:` y las filas `{ name: ..., max-context-length: N }` (nunca las api-keys).
export const cpamContexts = (yaml: string) => {
  const out: Record<string, number> = {}
  let prefix = ''
  for (const line of yaml.split('\n')) {
    const p = line.match(/^\s*prefix:\s*"?([\w.-]+)"?\s*$/)
    if (p) prefix = p[1]
    const m = line.match(/name:\s*"?([\w.:-]+)"?.*max-context-length:\s*(\d+)/)
    if (m) out[prefix ? `${prefix}/${m[1]}` : m[1]] = Number(m[2])
  }
  return out
}
// `fork: false` es para reabrir en el mismo pane: el proceso viejo ya salió, así que se retoma la
// misma conversación. `extra` son los flags del arranque original, ya entrecomillados (keepFlags).
export const mdlLaunchCmd = (o: { id?: string; sid?: string; keyHelper: string; configDir?: string; ctx?: number; fork?: boolean; extra?: string }) => {
  const safe = (s: string) => /^[\w.@:/+-]+$/.test(s)
  if ((o.sid && !safe(o.sid)) || !safe(o.keyHelper) || (o.id && !safe(o.id)) || (o.configDir && !safe(o.configDir))) return ''
  const cfg = o.configDir ? ` CLAUDE_CONFIG_DIR=${o.configDir}` : ''
  const extra = o.extra ? ' ' + o.extra : ''
  // Sin sid (la conversación todavía no tiene transcript): sesión nueva con ese modelo.
  const resume = o.sid ? ` --resume ${o.sid}${o.fork === false ? '' : ' --fork-session'}` : ''
  if (!o.id) return `env -u ANTHROPIC_BASE_URL -u ANTHROPIC_MODEL -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN -u CLAUDE_CODE_MAX_CONTEXT_TOKENS${cfg} claude${extra}${resume}`
  // Claude Code asume 200k para un id que no conoce: se le declara el contexto real.
  const ctx = o.ctx && Number.isInteger(o.ctx) && o.ctx > 0 ? ` CLAUDE_CODE_MAX_CONTEXT_TOKENS=${o.ctx}` : ''
  return `env -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_MODEL${cfg}${ctx} ANTHROPIC_BASE_URL=${CPAM_URL} claude --settings '{"apiKeyHelper":"${o.keyHelper}"}'${extra}${resume} --model ${o.id}`
}
// Flags del arranque original que se repiten al reabrir acá (--permission-mode, --plugin-dir…).
// Sesión, modelo y settings los pone mdlLaunchCmd; cada valor va con comilla simple de fish.
const KEEP_DROP_VAL = new Set(['--resume', '-r', '--session-id', '--model', '--settings'])
const KEEP_DROP = new Set(['--fork-session', '--continue', '-c'])
export const keepFlags = (argv: readonly string[]) => {
  const out: string[] = []
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i]!
    if (KEEP_DROP_VAL.has(a)) {
      i++
      continue
    }
    if (KEEP_DROP.has(a) || /^--(resume|session-id|model|settings)=/.test(a)) continue
    out.push("'" + a.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'")
  }
  return out.join(' ')
}
// Lo escrito en el prompt de Claude, leído de la pantalla del pane ('' = vacío). Después de ❯ va
// un espacio duro (\xa0); "Try …" es el placeholder del prompt vacío. La barra NERV va a la derecha
// del mismo renglón, detrás de un │.
export const promptDraft = (screen: string) => {
  const line = screen.split('\n').reverse().find((l) => l.trim().startsWith('❯'))
  if (line === undefined) return '?'
  const text = line.split('│')[0]!.replace(/\xa0/g, ' ').trim().slice(1).trim()
  return text.startsWith('Try "') ? '' : text
}
// Corre suelto (setsid) para sobrevivir al /exit: espera hasta 10 s a que el pane vuelva a la
// shell y recién ahí tipea el comando. Si Claude no salió, no hace nada.
const RELAUNCH_PY = `import json,subprocess,sys,time
pane,cmd=sys.argv[1],sys.argv[2]
def shell():
    try:
        r=subprocess.run(['herdr','pane','process-info','--pane',pane],capture_output=True,text=True,timeout=5)
        ps=json.loads(r.stdout)['result']['process_info']['foreground_processes']
        return bool(ps) and all(p.get('name') in ('fish','bash','zsh','sh') for p in ps)
    except Exception:
        return False
for _ in range(40):
    time.sleep(0.25)
    if shell():
        subprocess.run(['herdr','pane','run',pane,cmd],capture_output=True,timeout=10)
        break
`
// Dónde guarda Claude Code el transcript: projects/<cwd con todo lo no alfanumérico -> '-'>/<sid>.jsonl
export const transcriptPath = (base: string, cwd: string, sid: string) => `${base}/projects/${cwd.replace(/[^a-zA-Z0-9]/g, '-')}/${sid}.jsonl`

// ── Línea NERV bajo el prompt: cuenta, modelo, contexto y datos de un vistazo ──
// Cuenta de la sesión. Por el CPAM: el prefijo del modelo (ag3/, wibond/, nan/, priv8/…) y su
// email (de los json de auth del CPAM). Directa: el config dir de Claude Code (personal = ~/.claude).
export const acctBadge = (o: { model: string; cpam: boolean; configDir: string; home: string; emails: Record<string, string>; directEmail?: string }) => {
  const local = (m?: string) => clip(String(m || '').split('@')[0], 14)
  if (o.cpam) {
    const prefix = /^([\w.-]+)\//.exec(o.model || '')?.[1] || ''
    const email = prefix ? o.emails[prefix] || '' : ''
    const who = prefix ? (email ? `${prefix}·${local(email)}` : prefix) : 'default'
    return { who, tag: 'CPAM' as const, warn: /wibond/i.test(prefix + ' ' + email) }
  }
  const dir = (o.configDir || '').replace(/\/+$/, '')
  const name = !dir || dir === `${o.home}/.claude` ? 'personal' : dir.split('/').pop()!.replace(/^\.?claude-?/i, '').toLowerCase() || 'personal'
  const who = o.directEmail ? `${name}·${local(o.directEmail)}` : name
  return { who, tag: 'ANTHROPIC' as const, warn: /wibond/i.test(name + ' ' + (o.directEmail || '')) }
}
// Ventana de contexto: CLAUDE_CODE_MAX_CONTEXT_TOKENS si está, si no la que reporta la sesión,
// si no la del config del CPAM, si no 200k.
export const ctxTotal = (o: { env?: string; window?: number; cpam?: number }) => {
  const env = Number(o.env)
  if (Number.isInteger(env) && env > 0) return env
  if (o.window && o.window > 0) return o.window
  if (o.cpam && o.cpam > 0) return o.cpam
  return 200000
}
export const kfmt = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(Math.round(n)))
// ▰▰▰▱▱ + umbrales: ok < 60%, warn < 85%, hot desde 85% (donde arranca el auto-compact).
export const ctxGauge = (tokens: number | undefined, total: number, cells = 5) => {
  if (tokens === undefined || !(total > 0)) return { bar: '▱'.repeat(cells), pct: undefined as number | undefined, level: 'idle' as const, text: `–/${kfmt(total)}` }
  const pct = Math.max(0, Math.min(100, Math.round((tokens / total) * 100)))
  const on = Math.min(cells, Math.ceil((pct / 100) * cells))
  const level = pct >= 85 ? ('hot' as const) : pct >= 60 ? ('warn' as const) : ('ok' as const)
  return { bar: '▰'.repeat(on) + '▱'.repeat(cells - on), pct, level, text: `${kfmt(tokens)}/${kfmt(total)} ${pct}%` }
}
// claude-opus-5-5[1m] → OPUS 5.5 [1M]; un id de otro proveedor queda como está (sin el prefijo).
export const shortModel = (id: string) => {
  const b = String(id || '').replace(/^[^/]+\//, '')
  const ctx = /\[(\w+)\]$/.exec(b)?.[1]
  const m = /^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{8})?$/.exec(b.replace(/\[.*\]$/, ''))
  const name = m ? `${m[1].toUpperCase()} ${m[2]}${m[3] ? '.' + m[3] : ''}` : b.replace(/\[.*\]$/, '') || '—'
  return ctx ? `${name} [${ctx.toUpperCase()}]` : name
}
// Ancho en celdas: katakana/kanji/fullwidth ocupan 2.
export const cellWidth = (s: string) => {
  let w = 0
  for (const ch of s) w += /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1
  return w
}
export type StatusSeg = { id: string; prio: number; parts: [string, string, boolean?][] }
export const STATUS_SEP = ' ⟋ '
// Entra en `cols`: se descartan primero los de menor prioridad, el orden se mantiene.
export const fitSegs = (segs: readonly StatusSeg[], cols: number) => {
  const w = (s: StatusSeg) => s.parts.reduce((n, p) => n + cellWidth(p[0]), 0)
  const kept = [...segs]
  const total = () => kept.reduce((n, s) => n + w(s), 0) + Math.max(0, kept.length - 1) * cellWidth(STATUS_SEP)
  while (kept.length > 1 && total() > cols) {
    const low = kept.reduce((a, b) => (b.prio < a.prio ? b : a))
    kept.splice(kept.indexOf(low), 1)
  }
  return kept
}

let mdl: { ids: string[]; emails: Record<string, string>; at: number; err: string; busy: boolean } = { ids: [], emails: {}, at: 0, err: '', busy: false }
let mdlCpam = false
let mdlQuery = ''
let mdlPick = ''
let mdlNote = ''
// A qué modelo se refiere mdlNote: se muestra en su grupo, donde se hizo click ('' = arriba).
let mdlNoteFor = ''
let mdlSig = ''
let directEmail = ''
let ctxEnv = ''
let cpamCtx: Record<string, number> = {}

// Los segmentos de la línea bajo el prompt, en orden; `prio` alto = se queda en terminales angostas.
const statusSegs = (): StatusSeg[] => {
  const a = acctBadge({ model, cpam: mdlCpam, configDir, home, emails: mdl.emails, directEmail })
  const ctx = ctxGauge(usage?.context?.tokens, ctxTotal({ env: ctxEnv, window: usage?.context?.window, cpam: cpamCtx[model] }))
  const hue = ctx.level === 'hot' ? C.red : ctx.level === 'warn' ? C.amber : ctx.level === 'ok' ? C.lime : C.dim
  const segs: StatusSeg[] = [
    { id: 'nerv', prio: 9, parts: [['ネルフ', C.purple, true]] },
    { id: 'acct', prio: 8, parts: [['◆ ', C.violet], [(a.warn ? '⚠ ' : '') + a.who, a.warn ? C.amber : C.text, a.warn], [' ' + a.tag, a.tag === 'CPAM' ? C.lime : C.cyan, true]] },
    { id: 'model', prio: 6, parts: [[shortModel(model), C.text, true]] },
    { id: 'ctx', prio: 7, parts: [['SYNC ', C.muted], [ctx.bar + ' ', hue], [ctx.text, hue]] },
  ]
  const lvl = effortLevel()
  if (lvl) segs.push({ id: 'effort', prio: 4, parts: [['EFFORT ', C.muted], [effortName(), hex(EFFORTS[lvl - 1].hue)]] })
  if (branch) segs.push({ id: 'git', prio: 3, parts: [['⎇ ' + clip(branch, 24), C.cyan], ...(gitInfo.dirty ? [[` ●${gitInfo.dirty}`, C.amber] as [string, string]] : [])] })
  const five = pct('five_hour')
  if (typeof five === 'number') segs.push({ id: 'five', prio: 2, parts: [['5H ', C.muted], [`${Math.round(five)}%`, heat(five)]] })
  const usd = usage?.cost?.usd
  if (typeof usd === 'number' && usd > 0) segs.push({ id: 'cost', prio: 1, parts: [[`$${usd.toFixed(2)}`, C.muted]] })
  return segs
}

// Firma de las cuentas del CPAM: json de auth + su prefix, y mtime/size del config.yaml (nunca tokens).
export const cpamSig = (auth: readonly { name: string; prefix?: string }[], conf?: { mtimeMs?: number; size?: number }) =>
  auth.map((a) => `${a.name}=${a.prefix || ''}`).sort().join(',') + `|${conf?.mtimeMs ?? 0}:${conf?.size ?? 0}`

async function cpamScan($: any) {
  const dir = `${home}/.cli-proxy-api`
  const auth: { name: string; prefix: string; email: string }[] = []
  for (const f of ((await $.fs.list(dir).catch(() => [])) as any[]).filter((f) => /\.json$/.test(f.name))) {
    try {
      const j = JSON.parse((await $.fs.read(`${dir}/${f.name}`).catch(() => '')) || '{}')
      auth.push({ name: f.name, prefix: String(j?.prefix || ''), email: String(j?.email || '') })
    } catch {}
  }
  return { auth, sig: cpamSig(auth, await $.fs.stat(`${dir}/config.yaml`).catch(() => undefined)) }
}

// Si cambió el set de cuentas/prefijos del CPAM, la lista cacheada de modelos ya no vale: se relee.
async function cpamWatch($: any) {
  if (!home || mdl.busy || !mdlSig) return
  if ((await cpamScan($)).sig !== mdlSig) void refreshModels($, true)
}

async function refreshModels($: any, force = false) {
  if (mdl.busy || !home || (!force && now() - mdl.at < 300000 && mdl.ids.length)) return
  mdl.busy = true
  try {
    mdlCpam = /:8317\b/.test(String((await $.env.get('ANTHROPIC_BASE_URL').catch(() => '')) || ''))
    if (!mdl.ids.length) {
      const cached: any = await $.store.get('mdlCache').catch(() => undefined)
      if (cached?.ids?.length) mdl = { ...mdl, ids: cached.ids, emails: cached.emails || {}, at: cached.at || 0 }
    }
    const scan = await cpamScan($)
    const r = await $.process
      .run(['sh', '-c', `curl -s -m 8 -H "Authorization: Bearer $("$HOME/.local/bin/claude-go-key")" ${CPAM_URL}/v1/models`], { timeoutMs: 12000 })
      .catch(() => undefined)
    const ids = r?.exitCode === 0 ? ((JSON.parse(r.stdout || '{}')?.data || []) as any[]).map((x) => String(x.id)).filter(Boolean) : []
    if (!ids.length) throw new Error('el CPAM no respondió (127.0.0.1:8317)')
    // Etiquetas de los grupos: prefijo → email, de los json de auth del CPAM (sólo esos dos campos).
    const emails: Record<string, string> = {}
    for (const a of scan.auth) if (a.prefix && a.email) emails[a.prefix] = a.email
    mdl = { ids, emails, at: now(), err: '', busy: false }
    mdlSig = scan.sig
    await $.store.set('mdlCache', { ids, emails, at: mdl.at }).catch(() => undefined)
  } catch (err: any) {
    mdl.err = clip(String(err?.message || err), 60)
  } finally {
    mdl.busy = false
    $.ui.invalidate('ui.render')
  }
}

async function launchPlan($: any, id: string, fork: boolean, extra = '') {
  // El id se relee al click: tras /clear o /resume la conversación ya no es la del arranque.
  sessionId = (await $.session.id().catch(() => '')) || sessionId
  const base = configDir || `${home}/.claude`
  // --resume exige al menos un mensaje del usuario: una sesión recién abierta ya tiene el
  // .jsonl (hooks de arranque) pero "No conversation found".
  const hasTranscript = !!sessionId && !!cwdNow &&
    (await $.process.run(['grep', '-qm1', '"type":"user"', transcriptPath(base, cwdNow, sessionId)], { timeoutMs: 5000 }).catch(() => undefined))?.exitCode === 0
  const ctx = id ? cpamContexts((await $.fs.read(`${home}/.cli-proxy-api/config.yaml`).catch(() => '')) || '')[id] : undefined
  const cmd = mdlLaunchCmd({ id: id || undefined, sid: hasTranscript ? sessionId : undefined, ctx, fork, extra, keyHelper: `${home}/.local/bin/claude-go-key`, configDir: configDir && configDir !== `${home}/.claude` ? configDir : undefined })
  return { cmd, hasTranscript }
}

// Cambia el modelo en el mismo pane: cierra este Claude (/exit) y un ayudante suelto retoma la
// misma conversación ahí con el modelo nuevo. Si el /exit no llega en 10 s, todo queda como estaba.
async function relaunchHere($: any, id: string) {
  mdlNoteFor = id
  const say = (s: string) => ((mdlNote = s), $.ui.invalidate('ui.render'))
  if (working) return say('⚠ esperá a que termine el turno')
  if (!paneId) return say('⚠ sólo se puede dentro de herdr')
  const screen = (await $.process.run(['herdr', 'pane', 'read', paneId, '--source', 'visible', '--format', 'text'], { timeoutMs: 5000 }).catch(() => undefined))?.stdout || ''
  if (promptDraft(String(screen))) return say('⚠ tenés texto en el prompt: mandalo o borralo y volvé a tocar')
  const info = await herdrJson($, ['pane', 'process-info', '--pane', paneId])
  const cl = (info?.process_info?.foreground_processes || []).find((p: any) => p?.name === 'claude')
  const { cmd, hasTranscript } = await launchPlan($, id, false, cl?.argv ? keepFlags(cl.argv) : '')
  if (!cmd || !cwdNow) return say('⚠ no sé el id o la carpeta de esta sesión')
  const run = await $.process
    .run(['sh', '-c', 'setsid -f python3 -c "$0" "$1" "$2" >/dev/null 2>&1 </dev/null', RELAUNCH_PY, paneId, cmd], { timeoutMs: 5000 })
    .catch(() => undefined)
  if (run?.exitCode !== 0) return say('⚠ no pude lanzar el ayudante: quedó como estaba')
  say(hasTranscript ? 'cerrando y reabriendo acá…' : 'cerrando y abriendo acá (sesión nueva: esta todavía no tiene historial)…')
  // Si este proceso sigue vivo pasados los 10 s del ayudante, el /exit no llegó.
  setTimeout(() => say('⚠ el /exit no llegó en 10 s: quedó como estaba'), 11000)
  await $.command.run({ command: 'exit' }).catch((err: any) => say('⚠ no pude cerrar: ' + clip(String(err?.message || err), 50)))
}

async function relaunchWith($: any, id: string) {
  mdlNoteFor = id
  const wsId = String((await $.env.get('HERDR_WORKSPACE_ID').catch(() => '')) || '')
  const { cmd, hasTranscript } = await launchPlan($, id, true)
  mdlNote = !wsId || !paneId ? 'sólo se puede dentro de herdr' : !cmd || !cwdNow ? 'no sé el id o la carpeta de esta sesión' : 'abriendo tab nueva…'
  $.ui.invalidate('ui.render')
  if (mdlNote !== 'abriendo tab nueva…') return
  const label = id ? `${project || 'claude'} · ${clip(id, 24)}` : `${project || 'claude'} · anthropic`
  const r = await herdrJson($, ['tab', 'create', '--workspace', wsId, '--cwd', cwdNow, '--label', label, '--focus'])
  const pane = String(r?.root_pane?.pane_id || '')
  const ran = pane ? await $.process.run(['herdr', 'pane', 'run', pane, cmd], { timeoutMs: 5000 }).catch(() => undefined) : undefined
  mdlNote = ran?.exitCode !== 0 ? 'herdr no pudo abrir la tab' : hasTranscript ? `✓ tab "${label}" abierta (fork de esta conversación)` : `✓ tab "${label}" abierta (sesión nueva: esta todavía no tiene historial)`
  mdlPick = ''
  $.ui.invalidate('ui.render')
}

async function useHere($: any, id: string) {
  mdlNoteFor = id
  mdlNote = `cambiando a ${id}…`
  $.ui.invalidate('ui.render')
  // /model además guarda el id como default de TODAS las sesiones nuevas; un id del CPAM ahí
  // rompe las sesiones directas a Anthropic, así que después se devuelve el default que había.
  const sp = `${configDir || home + '/.claude'}/settings.json`
  const prevOf = (txt: unknown) => {
    try {
      return { ok: true, model: JSON.parse(String(txt))?.model as unknown }
    } catch {
      return { ok: false, model: undefined }
    }
  }
  const prev = prevOf(await $.fs.read(sp).catch(() => undefined))
  const r = await $.command.run({ command: 'model', args: id }).catch((err: any) => ({ text: '✖ ' + String(err?.message || err) }))
  if (prev.ok) {
    try {
      const j = JSON.parse(String(await $.fs.read(sp)))
      if (j.model !== prev.model) {
        if (prev.model === undefined) delete j.model
        else j.model = prev.model
        await $.fs.write(sp, JSON.stringify(j, null, 2) + '\n')
      }
    } catch {}
  }
  model = await $.session.model().catch(() => model)
  mdlNote = clip(String(r?.text || `/model ${id}`).split('\n')[0] || '', 70)
  mdlPick = ''
  $.ui.invalidate('ui.render')
}

function drawModels($: any, e: any, out: any[], h: any) {
  const { Box, Button, Input } = $.ui.resolve(e)
  const { t, span, card, chip, w } = h
  const cur = String(model || '').replace(/\[.*\]$/, '')
  const groups = mdlFilter(mdlGroups(mdl.ids, mdl.emails), mdlQuery)
  const total = mdl.ids.length
  const head: any[] = [
    t([span('SESIÓN ', C.muted), mdlCpam ? span('● CPAM 8317', C.lime, { bold: true }) : span('● Anthropic directo', C.cyan, { bold: true }), span('  ' + clip(cur || '—', w - 30), C.text)]),
    t([span(mdl.err ? '✖ ' + mdl.err : mdl.busy && !total ? 'leyendo el CPAM…' : `${total} modelos · ${mdl.at ? 'leído ' + ago(now() - mdl.at) : ''}`, mdl.err ? C.red : C.muted)]),
    Box({
      key: 'mdl-q-row',
      flexDirection: 'row',
      children: [
        Box({
          key: 'mdl-q-field',
          flexGrow: 1,
          borderStyle: 'round',
          borderColor: C.violet,
          paddingX: 1,
          flexDirection: 'row',
          children: [
            t([span('⌕ ', C.violet, { bold: true })]),
            Input({
              key: 'mdl-q',
              placeholder: 'filtrar: nan, opus, ag3…',
              value: mdlQuery,
              submitLabel: 'Enter',
              onInput: (v: string) => {
                mdlQuery = v
                $.ui.invalidate('ui.render')
              },
              onSubmit: (v: string) => {
                mdlQuery = v
                $.ui.invalidate('ui.render')
              },
            }),
          ],
        }),
      ],
    }),
    Box({
      key: 'mdl-ctl',
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 1,
      children: [
        chip('mdl-refresh', mdl.busy ? '◌ leyendo' : '↻ refrescar', true, C.tabBg, () => void refreshModels($, true)),
        ...(mdlQuery ? [chip('mdl-clear', '✕ filtro', true, C.tabBg, () => ((mdlQuery = ''), $.ui.invalidate('ui.render')))] : []),
        ...(mdlCpam
          ? [
              chip('mdl-back', '↩ volver a Anthropic', true, C.tabBg, () => void relaunchHere($, '')),
              chip('mdl-back-tab', '⧉ en tab nueva', true, C.chipDim, () => void relaunchWith($, '')),
            ]
          : []),
      ],
    }),
  ]
  const note = () => t([span(mdlNote, mdlNote.startsWith('✓') ? C.lime : mdlNote.startsWith('⚠') || mdlNote.startsWith('✖') ? C.amber : C.muted)], undefined, { wrap: 'wrap' })
  // El resultado se muestra donde se hizo click: arriba sólo lo de "volver a Anthropic".
  const noteIn = (ids: readonly string[]) => !!mdlNote && !!mdlNoteFor && ids.includes(mdlNoteFor)
  if (mdlNote && !noteIn(mdl.ids)) head.push(note())
  out.push(card('mdl-head', '◈ MODELOS · CPAM', C.purple, head))
  // Las acciones del modelo elegido van adentro de su grupo, justo debajo de la lista: no hay que
  // subir a buscarlas y lo de arriba no se corre al elegir.
  const pickRows = (id: string) => {
    const dim = mdlDim(id)
    const rows: any[] = [t([span('▶ ', C.lime, { bold: true }), span(clip(id, w - 4), C.text, { bold: true })])]
    if (mdlSplit(id).prefix === 'wibond') rows.push(t([span('⚠ usa la cuenta de TRABAJO (Wibond)', C.red, { bold: true })]))
    // Refuseless contesta 400 a cualquier pedido con una imagen, y la imagen queda en el historial.
    if (mdlSplit(id).prefix === 'refuseless') rows.push(t([span('⚠ no ve imágenes: si la conversación tiene una, cada mensaje da 400', C.amber)], undefined, { wrap: 'wrap' }))
    if (dim) rows.push(t([span(`⚠ ${dim === 'no chat' ? 'no es un modelo de chat' : 'antes falló en Claude Code: ' + dim}`, C.amber)]))
    rows.push(
      Box({
        key: 'mdl-act',
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 1,
        children: [
          mdlCpam ? chip('mdl-here', '▶ usar acá (/model)', true, C.tabBg, () => void useHere($, id)) : chip('mdl-swap', '⟳ cambiar acá', true, C.tabBg, () => void relaunchHere($, id)),
          chip('mdl-reopen', '⧉ en tab nueva', true, C.chipDim, () => void relaunchWith($, id)),
          chip('mdl-cancel', '✕', true, C.chipDim, () => ((mdlPick = ''), $.ui.invalidate('ui.render'))),
        ],
      }),
    )
    return rows
  }
  for (const g of groups) {
    const color = g.prefix === 'wibond' ? C.red : g.prefix === 'nan' ? C.lime : g.prefix === 'ds' ? C.amber : g.prefix === 'refuseless' ? C.pink : /^ag/.test(g.prefix) ? C.cyan : g.key === 'claude' ? C.orange : C.violet
    const picked = mdlPick && g.models.includes(mdlPick) ? mdlPick : ''
    out.push(
      card('mdl-' + g.key, `${g.label}${g.prefix ? ' · ' + g.prefix + '/' : ''} (${g.models.length})`, picked && mdlSplit(picked).prefix === 'wibond' ? C.red : color, [
        Box({
          key: 'mdl-list-' + g.key,
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: 1,
          children: g.models.map((id) => {
            const on = id === cur
            const off = !!mdlDim(id)
            return Box({
              key: 'mdlbox-' + id,
              backgroundColor: mdlPick === id ? C.tabBg : undefined,
              // Tocar de nuevo el elegido lo suelta.
              children: [Button({ key: 'mdl-' + id, label: (on ? '◆ ' : '') + mdlSplit(id).name + (MDL_BROKEN[id] ? ' ⚠' : ''), plain: true, dimColor: off && !on, onPress: () => ((mdlPick = mdlPick === id ? '' : id), (mdlNote = ''), (mdlNoteFor = ''), $.ui.invalidate('ui.render')) })],
            })
          }),
        }),
        ...(picked ? pickRows(picked) : []),
        ...(noteIn(g.models) ? [note()] : []),
      ]),
    )
  }
  if (total && !groups.length) out.push(t([span(`nada coincide con "${mdlQuery}"`, C.dim)]))
  out.push(t([span(mdlCpam ? '"usar acá" cambia con /model; "volver a Anthropic" cierra y reabre esta conversación en el mismo pane' : '"cambiar acá" cierra este Claude y reabre la misma conversación en el mismo pane; "en tab nueva" abre un fork al lado', C.dim)], C.dim, { wrap: 'wrap' }))
}

function drawEdd($: any, e: any, out: any[], h: any) {
  const { Box } = $.ui.resolve(e)
  const { t, span, card, scard, w } = h
  const expl = () =>
    card('edd-what', '✒ EDD', C.violet, [
      t([span('TDD con dos roles: ', C.text), span('Testigo', C.cyan, { bold: true }), span(' sella los tests, ', C.text), span('Perito', C.pink, { bold: true }), span(' revisa.', C.text)]),
      t([span('/edd:backlog', C.lime), span(' charla → BACKLOG.md', C.dim)]),
      t([span('/edd:story N', C.lime), span(' arranca; frena 1 vez (tests + decisiones), después solo', C.dim)]),
      t([span('tests → código → demo → revisión del Perito', C.muted)]),
      t([span('necesita git · Node ≥22.6 · runner (vitest/node:test)', C.dim)]),
      t([span('los tests sellados no se editan a mano: los frena un hook de git', C.dim)]),
    ])
  const a = eddActions($, e, h, edd?.root || '')
  if (!edd || !edd.present) {
    if (edd && edd.present === false)
      out.push(
        card('edd-init', '◎ sin inicializar', C.dim, [
          t([span('este repo no tiene .edd/', C.muted)]),
          a.row('edd-init-row', [a.btn('edd-init-btn', '▶ edd init', a.init), a.btn('edd-init-bl', '▶ /edd:backlog', () => a.slash('edd:backlog'))]),
          t([span('/edd:backlog también prepara una carpeta vacía (git, manifest, edd init)', C.dim)], C.dim, { wrap: 'wrap' }),
        ]),
      )
    out.push(expl())
    return
  }
  const c = edd.counts || { opened: 0, closed: 0 }
  out.push(
    Box({
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginRight: 2,
      children: [
        Box({
          flexDirection: 'row',
          columnGap: 1,
          children: [
            t([span(' ✒ EDD ', C.ink, { bold: true, backgroundColor: C.violet }), ...(edd.presence ? [span(`  ${edd.presence}`, edd.presence === 'auto' ? C.lime : C.cyan, { bold: true })] : []), ...(edd.presenceLocal ? [span(' local', C.dim)] : []), ...(edd.approvals ? [span(` · ${edd.approvals}`, C.muted)] : [])]),
            // cambia sólo este checkout (.edd/presence): las otras sesiones siguen con lo suyo
            ...(edd.presence ? [a.btn('edd-presence', edd.presence === 'auto' ? '⇄ interactivo' : '⇄ auto', a.togglePresence)] : []),
          ],
        }),
        t([span(` ${c.closed}✓ `, C.lime), span(`/ ${c.opened} historias `, C.muted)]),
      ],
    }),
  )
  const v = edd.view
  if (!v) {
    out.push(card('edd-none', '◎ sin historia activa', C.muted, [t([span(edd.activeOnBranch ? 'branch edd/ sin ledger todavía' : 'no estás en un branch edd/…', C.muted)]), t([span('elegí una del backlog: ', C.dim), span('▶ N', C.cyan), span(' corre /edd:story N', C.dim)])]))
    a.backlogCard(out)
    out.push(expl())
    return
  }
  const col = v.open ? C.lime : C.muted
  out.push(
    card('edd-story', (v.open ? '◆ ' : '◇ ') + 'HISTORIA', col, [
      t([span(clip(v.title || v.slug, w - 8), C.text, { bold: true }), ...(v.n != null ? [span(`  #${v.n}`, C.dim)] : [])]),
      Box({ flexDirection: 'row', justifyContent: 'space-between', children: [t([span(clip(v.slug, w - 10), C.muted)]), t([span(v.open ? 'abierta' : 'cerrada', col, { bold: true })])] }),
    ]),
  )
  const tt = v.tests || { total: 0, green: 0, sealed: 0, pending: 0 }
  const pct = tt.total ? Math.round((tt.green / tt.total) * 100) : 0
  const rows: any[] = []
  rows.push(Box({ flexDirection: 'row', justifyContent: 'space-between', children: [t([span('PACTO ', C.muted), span(v.approved ? 'aprobado' : 'propuesto', v.approved ? C.lime : C.amber, { bold: true })]), t([span(`${tt.green}/${tt.total} verdes`, heat(100 - pct))])] }))
  if (tt.total) rows.push(t([span(dots(pct, w), v.approved ? C.lime : C.violet)]))
  rows.push(t([span(`✔ ${tt.green} verdes · ◼ ${tt.sealed} sellados · ○ ${tt.pending} pendientes`, C.dim)]))
  if (v.openStep) rows.push(t([span('▶ paso abierto: ', C.orange), span(clip(v.openStep, w - 16), C.text)]))
  const demo = v.demo
  rows.push(Box({ flexDirection: 'row', justifyContent: 'space-between', children: [t([span('DEMO', C.muted)]), t([span(demo == null ? 'sin correr' : demo === 'timeout' ? 'timeout' : demo === 0 ? 'ok' : `exit ${demo}`, demo === 0 ? C.lime : demo == null ? C.dim : C.red, { bold: demo != null })])] }))
  const per = v.perito
  rows.push(Box({ flexDirection: 'row', justifyContent: 'space-between', children: [t([span('PERITO', C.muted)]), t([per ? span(`${per.findings} obs · seals ${per.sealsOk ? 'ok' : 'ROTO'} · suite ${per.green ? 'verde' : 'ROJA'}`, per.sealsOk && per.green ? C.lime : C.amber) : span('sin revisar', C.dim)])] }))
  out.push(scard('edd-prog', '◢ PROGRESO', v.open ? C.orange : C.violet, rows, 10))
  const storyArg = v.n != null ? String(v.n) : v.slug
  if (v.open && !v.approved) out.push(a.row('edd-pact-row', [a.btn('edd-pact-ok', '✓ aprobar pacto', () => a.chat('ok', 'ok enviado al chat'), true), t([span(' el skill espera tu ok', C.dim)])]))
  out.push(
    a.row(
      'edd-act-row',
      v.open
        ? [a.btn('edd-continue', '↻ continuar', () => a.slash('edd:story', storyArg)), a.btn('edd-stop', '■ parar', () => a.cli(['stop', 'parado desde NERV'])), a.btn('edd-status', 'estado', () => a.slash('edd:status'))]
        : [a.btn('edd-main', 'git checkout main', a.checkoutMain), ...(a.next(v.n) ? [a.btn('edd-next', `▶ siguiente (${a.next(v.n)!.n})`, () => a.slash('edd:story', String(a.next(v.n)!.n)))] : []), a.btn('edd-status', 'estado', () => a.slash('edd:status'))],
    ),
  )
  if (v.decisions && v.decisions.length) {
    const drows: any[] = []
    for (const d of v.decisions) {
      drows.push(t([span('• ', C.amber), span(`[${d.kind}] `, C.amber, { bold: true }), span(clip(d.question, w - 8), C.text)]))
      if (d.suggested) drows.push(t([span('  sugerido: ', C.dim), span(clip(d.suggested, w - 14), C.muted)]))
      drows.push(...a.decision(d))
    }
    out.push(scard('edd-dec', '⏸ TE FRENA ACÁ · decisiones', C.amber, drows, 14))
  }
  if (!v.open) a.backlogCard(out)
}

function eddActions($: any, e: any, h: any, root: string) {
  const { Box, Button, Input } = $.ui.resolve(e)
  const { t, span, chip, scard, w } = h
  const btn = (key: string, label: string, onPress: () => void, hot = false) => chip(key, label, hot, C.tabBg, onPress)
  // la variante por CLI (sin skill esperando) va sin fondo, más apagada que el botón del chat
  const dimBtn = (key: string, label: string, onPress: () => void) => Box({ key: 'box-' + key, paddingX: 1, children: [Button({ key, label, plain: true, dimColor: true, onPress })] })
  const row = (key: string, children: any[]) => Box({ key, flexDirection: 'row', columnGap: 1, flexWrap: 'wrap', children })
  const slash = (command: string, args?: string) => void eddSlash($, command, args)
  const chat = (text: string, msg: string) => void eddChat($, text, msg)
  const cli = (args: string[]) => void eddAct($, () => eddCli($, root, args))
  const init = () => cli(['init'])
  const checkoutMain = () =>
    void eddAct($, async () => {
      const r = await $.process.run(['git', 'checkout', 'main'], { cwd: root, timeoutMs: 15000 })
      return firstLine(r.stderr) || firstLine(r.stdout) || (r.exitCode === 0 ? 'en main' : `git checkout: exit ${r.exitCode}`)
    })
  // auto ⇄ interactivo (async) para este checkout, con confirmación; lo escribe edd presence en .edd/presence
  const togglePresence = async () => {
    const to = edd?.presence === 'auto' ? 'async' : 'auto'
    const what = to === 'auto' ? 'auto: la política responde todo y la historia corre sola' : 'interactivo (async): el skill te pregunta en los checkpoints'
    const pick = await $.ui.ask(`¿Pasar esta sesión a ${what}? Sólo cambia este checkout (.edd/presence); las otras sesiones no se tocan.`, { options: ['Cambiar', 'Cancelar'], header: 'EDD' }).catch(() => 'Cancelar')
    if (pick !== 'Cambiar') return
    void eddAct($, () => eddCli($, root, ['presence', to]))
  }
  const backlog: EddBacklogItem[] | null = edd?.backlog ?? null
  const next = (n: number | null) => (n == null || !backlog ? undefined : backlog.find((b) => b.n === n + 1 && b.state !== 'closed'))
  const decision = (d: EddDecision): any[] => {
    const send = (answer: string) => chat(`${answer} (decisión ${d.id})`, `${clip(answer, 30)} enviado al chat`)
    const viaCli = (answer: string) => cli(['decide', d.id, answer, '--by', 'cli'])
    if (['size_waiver', 'dependency', 'unseal', 'quarantine'].includes(d.kind))
      return [
        row(`edd-d-${d.id}`, [
          btn(`edd-d-${d.id}-allow`, 'allow', () => send('allow')),
          btn(`edd-d-${d.id}-deny`, 'deny', () => send('deny')),
          dimBtn(`edd-d-${d.id}-cli-allow`, 'cli allow', () => viaCli('allow')),
          dimBtn(`edd-d-${d.id}-cli-deny`, 'cli deny', () => viaCli('deny')),
        ]),
      ]
    const draft = () => String(eddAnswers[d.id] || '').trim()
    return [
      ...(d.suggested ? [row(`edd-d-${d.id}-sug`, [btn(`edd-d-${d.id}-sug-btn`, 'sugerido', () => send(d.suggested!)), dimBtn(`edd-d-${d.id}-cli-sug`, 'cli sugerido', () => viaCli(d.suggested!))])] : []),
      Box({
        key: `edd-d-${d.id}-free`,
        flexDirection: 'row',
        columnGap: 1,
        children: [
          t([span('›', C.amber, { bold: true })]),
          Box({
            key: `edd-d-${d.id}-in-box`,
            flexGrow: 1,
            children: [
              Input({
                key: `edd-d-${d.id}-in`,
                placeholder: 'tu respuesta…',
                value: eddAnswers[d.id] || '',
                submitLabel: 'Enter',
                onInput: (val: string) => (eddAnswers[d.id] = val),
                onSubmit: (val: string) => {
                  eddAnswers[d.id] = val
                  if (draft()) send(draft())
                },
              }),
            ],
          }),
          btn(`edd-d-${d.id}-reply`, 'responder', () => (draft() ? send(draft()) : $.ui.toast('escribí una respuesta'))),
          dimBtn(`edd-d-${d.id}-cli-reply`, 'cli', () => (draft() ? viaCli(draft()) : $.ui.toast('escribí una respuesta'))),
        ],
      }),
    ]
  }
  const backlogCard = (out: any[]) => {
    if (!backlog) {
      out.push(
        h.card('edd-bl', '◆ BACKLOG', C.cyan, [
          t([span('no hay BACKLOG.md: armalo charlando una historia por línea', C.dim)], C.dim, { wrap: 'wrap' }),
          row('edd-bl-row', [btn('edd-bl-new', '▶ /edd:backlog', () => slash('edd:backlog')), btn('edd-bl-status', 'estado', () => slash('edd:status'))]),
        ]),
      )
      return
    }
    const rows: any[] = [row('edd-bl-chips', [btn('edd-bl-status', 'estado', () => slash('edd:status')), btn('edd-bl-edit', '/edd:backlog', () => slash('edd:backlog'))])]
    if (!backlog.length) rows.push(t([span('BACKLOG.md sin historias numeradas (1. Como …)', C.dim)]))
    for (const b of backlog) {
      const label = b.state === 'closed' ? `✓ ${b.n}` : `${b.state === 'open' ? '↻' : '▶'} ${b.n}`
      const lead =
        b.state === 'closed'
          ? Box({ key: `edd-bl-${b.n}-done`, paddingX: 1, children: [t([span(label, C.dim)])] })
          : btn(`edd-bl-${b.n}`, label, () => slash('edd:story', String(b.n)), b.state === 'open')
      rows.push(Box({ key: `edd-bl-${b.n}-row`, flexDirection: 'row', columnGap: 1, children: [lead, t([span(clip(b.text, Math.max(8, w - label.length - 5)), b.state === 'closed' ? C.dim : C.text)])] }))
    }
    out.push(scard('edd-bl', `◆ BACKLOG · ${backlog.filter((b) => b.state === 'closed').length}/${backlog.length}`, C.cyan, rows, 12))
  }
  return { btn, row, slash, chat, cli, init, checkoutMain, togglePresence, next, decision, backlogCard }
}

function drawForge($: any, e: any, out: any[], h: any) {
  const { Box, Button, Input } = $.ui.resolve(e)
  const { t, span, card, chip, w } = h
  if (!forge) {
    out.push(
      card('forge-off', '⚒ FORGE', C.dim, [
        t([span(forgeMissing ? 'forge no está cargado' : 'leyendo forge…', C.muted, { bold: true })]),
        ...(forgeMissing
          ? [
              t([span('no existe ~/.local/state/forge/state.json', C.dim)]),
              t([span('arrancá claude con el mod:', C.muted)]),
              t([span(' claude --plugin-dir ~/projects/forge', C.cyan)]),
              t([span('o activalo en /plugin › Installed', C.muted)]),
            ]
          : []),
      ]),
    )
    return
  }
  const run = forge.run
  const live = run && (run.status === 'running' || run.status === 'paused')
  const [word, tone] = run ? FORGE_STATUS[run.status] || [String(run.status).toUpperCase(), 'muted'] : ['EN ESPERA', 'muted']
  const toneColor = (C as any)[tone] || C.muted
  const elapsed = run ? mmss((run.endedAt || now()) - run.startedAt) : ''
  out.push(
    Box({
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginRight: 2,
      children: [
        t([
          span(' ⚒ FORGE ', C.ink, { bold: true, backgroundColor: C.purple }),
          ...(run ? [] : [span(' SDD', C.orange, { bold: true })]),
          ...(run ? [span(`  R ${run.round}/${run.cap}`, C.cyan, { bold: true }), span(`  ⏱ ${elapsed}`, C.muted)] : []),
        ]),
        t([
          run && run.status !== 'parado'
            ? span(` ${run.status === 'running' ? SPIN[frame % 4] : '◆'} ${word} `, C.ink, { bold: true, backgroundColor: toneColor })
            : span(` ◎ ${word} `, C.muted, { backgroundColor: C.chip }),
        ]),
      ],
    }),
  )
  if (run) out.push(t([span('» ', C.dim), span(clip(run.request, w), C.text)]))
  const order: string[] = Array.isArray(forge.phaseOrder) && forge.phaseOrder.length ? forge.phaseOrder : PHASES
  const phases: any[] = run?.phases || order.map((name) => ({ name, status: 'pending', model: forge.models?.[name] || '' }))
  const node = (p: any) => {
    const st = p.status
    const icon = st === 'running' ? SPIN[frame % 4] : st === 'done' ? '✔' : st === 'failed' ? '✖' : '·'
    const col = st === 'running' ? (blink() ? C.orange : C.purple) : st === 'done' ? C.lime : st === 'failed' ? C.red : C.dim
    return [span(`${icon} `, col, { bold: st !== 'pending' }), span(p.name.toUpperCase(), col, { bold: st === 'running' })]
  }
  const arrow = span(' ─▶ ', C.dim)
  const plugRows: any[] = []
  let line: any[] = []
  let used = 0
  phases.forEach((p: any, i: number) => {
    const add = p.name.length + 2 + (i < phases.length - 1 ? 4 : 0)
    if (used && used + add > w) {
      plugRows.push(t(line))
      line = [span('  ', C.dim)]
      used = 2
    }
    line.push(...node(p))
    if (i < phases.length - 1) line.push(arrow)
    used += add
  })
  if (line.length) plugRows.push(t(line))
  plugRows.push(t([span('─'.repeat(w), C.dim)]))
  for (const p of phases) {
    const st = p.status
    const col = st === 'running' ? C.orange : st === 'done' ? C.lime : st === 'failed' ? C.red : C.muted
    const ms = st === 'running' && p.startedAt ? now() - p.startedAt : p.ms || 0
    const eff = p.effort || forge.efforts?.[p.name] || 'auto'
    const effTag = eff === 'auto' || forge.effortNotes?.[p.name] ? '' : `⚡${eff}`
    plugRows.push(
      Box({
        flexDirection: 'row',
        justifyContent: 'space-between',
        children: [t([span(p.name.toUpperCase().padEnd(10), col, { bold: true }), span(fitModel(p.model, Math.max(8, w - 11 - effTag.length)), isWork(p.model) ? C.red : C.text, { bold: isWork(p.model) })]), t([span(effTag, C.orange)])],
      }),
    )
    if (st !== 'pending') {
      const who = (/\(([^)]+)\)$/.exec(p.responded || '') || [])[1] || p.responded || '…'
      const stats = `${mmss(ms)} · ${p.steps || 0}p · ${tok(p.tokensIn || 0)}↓ ${tok(p.tokensOut || 0)}↑`
      plugRows.push(
        Box({
          flexDirection: 'row',
          justifyContent: 'space-between',
          children: [t([span('  ↳ ', C.dim), span(clip(who, Math.max(6, w - 6 - stats.length)), C.pink)]), t([span(stats, C.muted)])],
        }),
      )
    }
  }
  if (run?.verdicts?.length)
    plugRows.push(t([span('VEREDICTOS ', C.muted), ...run.verdicts.map((v: string, i: number) => span(`${i ? ' → ' : ''}${v}`, v === 'pasa' ? C.lime : v === 'corregir' ? C.amber : C.red, { bold: true }))]))
  out.push(card('forge-plug', '◢ ENTRY PLUG', live ? C.orange : C.violet, plugRows))

  const all = Object.entries<any>(forge.profiles || {})
  const broken = (pr: any) => ['explore', 'plan', 'build', 'veredicto'].some((f) => /^(plus|oc)\//.test(String(pr?.[f] || pr?.models?.[f] || '')))
  const sections: { title: string; names: string[] }[] = []
  const factory = all.filter(([, p]) => p.source !== 'zero-pi' && p.builtin).map(([n]) => n)
  sections.push({ title: 'FÁBRICA', names: [...FACTORY_ORDER.filter((n) => factory.includes(n)), ...factory.filter((n) => !FACTORY_ORDER.includes(n)).sort()] })
  sections.push({ title: 'MÍOS', names: all.filter(([, p]) => p.source !== 'zero-pi' && !p.builtin).map(([n]) => n).sort() })
  const zero = all.filter(([, p]) => p.source === 'zero-pi').map(([n]) => n)
  const zgroup = (n: string) => {
    const k = n.replace(/^zero:/, '')
    if (/^solo-/.test(k)) return 'ZERO-PI · UN MODELO'
    if (/economico/.test(k)) return 'ZERO-PI · ECONÓMICOS'
    if (/adversarial|veredicto-claude-codex|revisa|review/.test(k)) return 'ZERO-PI · REVISIÓN'
    return 'ZERO-PI · COMBINADOS'
  }
  for (const g of ['ZERO-PI · UN MODELO', 'ZERO-PI · ECONÓMICOS', 'ZERO-PI · REVISIÓN', 'ZERO-PI · COMBINADOS']) {
    const names = zero.filter((n) => zgroup(n) === g).sort()
    if (names.length) sections.push({ title: g, names })
  }
  const profileRows: any[] = []
  const curName = String(forge.profile || 'custom')
  const cur = forge.profiles?.[curName]
  const bar = (left: any[], right?: any) => Box({ key: 'fp-bar', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1, children: [t(left), ...(right ? [right] : [])] })
  if (!cur) profileRows.push(bar([span('sin perfil', C.amber, { bold: true }), span(' · no se guarda', C.dim)], chip('fp-new-top', '+ guardar', false, C.tabBg, () => void askProfileName($))))
  else if (cur.source === 'zero-pi') profileRows.push(bar([span('cambios → ', C.dim), span('~/.pi/zero.json', C.muted)]))
  else if (cur.builtin && cur.modified) profileRows.push(bar([span('★ modificado', C.amber, { bold: true })], chip('fp-reset', '↺ restaurar', false, C.tabBg, () => void forgeCmd($, `profile reset ${curName}`, true))))
  else if (!cur.builtin) profileRows.push(bar([span('perfil tuyo', C.dim)], chip('fp-delete', '🗑 borrar', false, C.tabBg, () => void confirmDelete($, curName))))
  for (const sec of sections) {
    profileRows.push(
      sec.title === 'MÍOS'
        ? Box({ key: 'psec-head-mios', flexDirection: 'row', justifyContent: 'space-between', children: [t([span(sec.title, C.cyan, { bold: true }), span(` · ${sec.names.length}`, C.dim)]), chip('fp-new', '+ nuevo', false, C.tabBg, () => void askProfileName($))] })
        : t([span(sec.title, C.cyan, { bold: true }), span(` · ${sec.names.length}`, C.dim)]),
    )
    if (sec.title === 'MÍOS' && !sec.names.length) profileRows.push(t([span('  ninguno todavía · usá + nuevo', C.dim)]))
    const colW = Math.floor((w - 1) / 2)
    for (let i = 0; i < sec.names.length; i += 2) {
      profileRows.push(
        Box({
          key: `psec-${sec.title}-${i}`,
          flexDirection: 'row',
          columnGap: 1,
          children: sec.names.slice(i, i + 2).map((n) => {
            const bad = broken(forge.profiles[n])
            const mod = !!forge.profiles[n]?.modified
            const on = forge.profile === n
            const label = n.replace(/^zero:/, '').replace(/^personal-/, '').replace(/-/g, ' ')
            return Box({
              key: 'pg-' + n,
              width: colW,
              paddingX: 1,
              backgroundColor: on ? C.tabBg : C.chipDim,
              children: [Button({ key: 'profile-' + n, label: clip((on ? '● ' : '') + label + (mod ? ' ★' : '') + (bad ? ' ⚠' : ''), colW - 2), plain: true, dimColor: !on, onPress: () => void forgeCmd($, `profile ${n}`) })],
            })
          }),
        }),
      )
    }
  }
  const shown = String(forge.profile).replace(/^zero:/, 'zero-pi › ').replace(/personal-/, '')
  out.push(h.scard('forge-profiles', `◈ PERFIL · ${clip(shown, w - 22)}`, C.purple, profileRows, 10))

  const catalog: Record<string, string[]> = forge.catalog || {}
  const levels: string[] = forge.effortLevels || ['auto', 'off', 'minimal', 'low', 'medium', 'high', 'xhigh']
  const pill = (key: string, label: string, active: boolean, color: string, onPress: () => void) =>
    Box({ key: 'pb-' + key, paddingX: 1, backgroundColor: active ? C.tabBg : C.chipDim, children: [Button({ key, label, plain: true, dimColor: !active && color === C.dim, onPress })] })
  const item = (key: string, mark: string, markColor: string, label: string, active: boolean, onPress: () => void, indent = 2) =>
    Box({
      key: 'it-' + key,
      flexDirection: 'row',
      paddingLeft: indent,
      children: [t([span(mark + ' ', markColor)]), Box({ key: 'itb-' + key, backgroundColor: active ? C.chipDim : undefined, children: [Button({ key, label: clip(label, w - indent - 4), plain: true, dimColor: !active, onPress })] })],
    })
  const modelRows: any[] = []
  for (const p of order) {
    const current = forge.models?.[p] || ''
    const note = forge.effortNotes?.[p] || ''
    const effort = forge.efforts?.[p] || 'auto'
    const mOpen = openDrop === 'fmodel-' + p
    const eOpen = openDrop === 'feffort-' + p
    const group = forgeGroup[p] || groupOf(current)
    const acct = current ? acctOf(current) : ''
    const name = current ? baseName(current) : 'elegí modelo'
    const effLabel = note ? '⚡ n/a' : `⚡ ${EFFORT_SHORT[effort] || effort} ${eOpen ? '▴' : '▾'}`
    const work = !!current && isWork(current)
    modelRows.push(
      Box({
        key: 'mrow-' + p,
        flexDirection: 'row',
        justifyContent: 'space-between',
        children: [
          t([span(p.toUpperCase().padEnd(10), mOpen || eOpen ? C.lime : C.cyan, { bold: true }), ...(acct ? [span(acct, work ? C.red : C.muted, { bold: work })] : [])]),
          note
            ? t([span(effLabel, C.dim)])
            : pill('ddh-feffort-' + p, effLabel, eOpen, effort === 'auto' ? C.dim : C.orange, () => {
                openDrop = eOpen ? '' : 'feffort-' + p
                $.ui.invalidate('ui.render')
              }),
        ],
      }),
    )
    modelRows.push(
      Box({
        key: 'mrow2-' + p,
        flexDirection: 'row',
        paddingLeft: 2,
        children: [
          pill('ddh-fmodel-' + p, `${clip(name, Math.max(8, w - 10))} ${mOpen ? '▴' : '▾'}`, mOpen, C.text, () => {
            openDrop = mOpen ? '' : 'fmodel-' + p
            forgeGroup[p] = groupOf(current)
            forgeAccounts[p] = false
            $.ui.invalidate('ui.render')
          }),
        ],
      }),
    )
    if (mOpen && forgeAccounts[p]) {
      const groups = Object.keys(catalog)
      groups.forEach((g, i) =>
        modelRows.push(
          item(`ddg-fmodel-${p}-${i}`, g === group ? '●' : '○', g === group ? C.lime : C.dim, `${forge.groupLabels?.[g] || g}  ${(catalog[g] || []).length}`, g === group, () => {
            forgeGroup[p] = g
            forgeAccounts[p] = false
            $.ui.invalidate('ui.render')
          }),
        ),
      )
    } else if (mOpen) {
      let models = (catalog[group] || []).map((id) => ({ value: id, label: baseName(id) }))
      if (group === groupOf(current) && current && !models.some((m) => m.value === current)) models = [{ value: current, label: `${baseName(current)} ⚠ no está en el CPAM` }, ...models]
      modelRows.push(
        item(`ddg-back-${p}`, '‹', C.cyan, `cuentas · ${forge.groupLabels?.[group] || group}`, false, () => {
          forgeAccounts[p] = true
          $.ui.invalidate('ui.render')
        }),
      )
      models.forEach((m, i) =>
        modelRows.push(
          item(`ddp-fmodel-${p}-${i}`, m.value === current ? '●' : '○', m.value === current ? C.lime : C.dim, m.label, m.value === current, () => {
            openDrop = ''
            void forgeCmd($, `model ${p} ${m.value}`)
            $.ui.invalidate('ui.render')
          }),
        ),
      )
      if (!models.length) modelRows.push(t([span('    sin modelos en esta cuenta', C.dim)]))
    }
    if (eOpen && !note)
      modelRows.push(
        Box({
          key: 'feffort-' + p,
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: 1,
          paddingLeft: 2,
          children: levels.map((l) =>
            pill(`fe-${p}-${l}`, EFFORT_SHORT[l] || l, effort === l, C.text, () => {
              openDrop = ''
              void forgeCmd($, `effort ${p} ${l}`)
              $.ui.invalidate('ui.render')
            }),
          ),
        }),
      )
    if (eOpen && note) modelRows.push(t([span('  ' + clip(note, w - 2), C.dim)]))
  }
  out.push(h.scard('forge-models', '⬡ MODELOS · EFFORT', C.violet, modelRows, 12))

  const control: any[] = [
    Box({
      flexDirection: 'row',
      columnGap: 1,
      children: [
        t([span('MODO', C.muted, { bold: true })]),
        ...[
          ['interactive', 'interactivo'],
          ['automatic', 'auto'],
          ['ask', 'preguntar'],
        ].map(([v, l]) => chip('fmode-' + v, l, forge.mode === v, C.tabBg, () => void forgeCmd($, `mode ${v}`))),
      ],
    }),
    Box({
      flexDirection: 'row',
      columnGap: 1,
      children: [
        t([span('CAP ', C.muted, { bold: true }), span(`${forge.cap} rondas`, C.cyan, { bold: true })]),
        chip('fcap-down', ' − ', false, C.tabBg, () => void forgeCmd($, `cap ${Math.max(1, (forge.cap || 3) - 1)}`)),
        chip('fcap-up', ' + ', false, C.tabBg, () => void forgeCmd($, `cap ${Math.min(9, (forge.cap || 3) + 1)}`)),
      ],
    }),
  ]
  if (live) control.push(Box({ flexDirection: 'row', children: [chip('fstop', '■ PARAR', true, C.red, () => void forgeCmd($, 'stop'))] }))
  else
    control.push(
      Input({
        key: 'fdraft',
        placeholder: 'pedido para forge…',
        value: forgeDraft,
        onInput: (v: string) => (forgeDraft = v),
        onSubmit: (v: string) => {
          if (!v.trim()) return
          forgeDraft = ''
          void forgeCmd($, v.trim())
        },
      }),
      Box({
        flexDirection: 'row',
        children: [
          chip('fstart', '▶ INICIAR', true, C.tabBg, () => {
            if (!forgeDraft.trim()) return void $.ui.toast('forge: escribí el pedido primero')
            const text = forgeDraft.trim()
            forgeDraft = ''
            void forgeCmd($, text)
          }),
        ],
      }),
    )
  out.push(card('forge-control', '▶ MANDO', live ? C.orange : C.lime, control))
}

async function openPane($: any) {
  const r = await $.ui.open({ id: PANE, title: 'NERV', columns: 46 }).catch(() => undefined)
  paneOpen = !!r?.isPlaced
  if (paneOpen) placedOnce = true
  return r
}

export function register(on: any) {
  on('session.start', async ($: any, e: any, next: any) => {
    const r = await next(e)
    home = (await $.env.get('HOME').catch(() => '')) || ''
    runDir = (await $.env.get('XDG_RUNTIME_DIR').catch(() => '')) || '/tmp'
    paneId = (await $.env.get('HERDR_PANE_ID').catch(() => '')) || ''
    account = String((await $.env.get('CLAUDE_CONFIG_DIR').catch(() => '')) || '').replace(/\/+$/, '').split('/').pop()!.replace(/^\.?claude-?/i, '').toUpperCase()
    sessionId = (await $.session.id().catch(() => '')) || ''
    configDir = String((await $.env.get('CLAUDE_CONFIG_DIR').catch(() => '')) || '').replace(/\/+$/, '')
    mdlCpam = /:8317\b/.test(String((await $.env.get('ANTHROPIC_BASE_URL').catch(() => '')) || ''))
    if (mdlCpam) void refreshModels($)
    ctxEnv = String((await $.env.get('CLAUDE_CODE_MAX_CONTEXT_TOKENS').catch(() => '')) || '')
    if (home) {
      try {
        directEmail = String(JSON.parse((await $.fs.read(`${configDir || home}/.claude.json`).catch(() => '')) || '{}')?.oauthAccount?.emailAddress || '')
      } catch {}
      if (mdlCpam) cpamCtx = cpamContexts((await $.fs.read(`${home}/.cli-proxy-api/config.yaml`).catch(() => '')) || '')
    }
    cxLog.path = String((await $.env.get('CORTEX_RECALL_EVENTS').catch(() => '')) || (home ? `${home}/.cache/cortex-recall/events.jsonl` : ''))
    await refreshTasks($)
    await loadEmails($)
    quiet = (await $.store.get('quiet').catch(() => false)) === true
    tab = ((await $.store.get('tab').catch(() => undefined)) as string) || 'magi'
    if (tab === 'crew' || tab === 'board') tab = 'live'
    for (const k of ((await $.store.get('folded').catch(() => [])) as string[]) || []) folded.add(k)
    ytRecent = ((await $.store.get('ytRecent').catch(() => [])) as string[]) || []
    applyTheme(String((await $.store.get('theme').catch(() => '')) || 'eva01'))
    await syncPrefs($)
    if (pinned) tab = pinned
    const unit = home ? await $.fs.read(`${home}/.config/systemd/user/jcode-rail.service`).catch(() => '') : ''
    ramTotal = ((unit || '').match(/JCODE_RAIL_RAM_TOTAL=(\d+)/) || [])[1] || ''
    take(await $.session.usage().catch(() => undefined))
    await $.command
      .register({ name: 'nerv', description: 'Barra NERV: abrir, /nerv quiet para apagarla, /nerv prs para refrescar PRs, /nerv tema <unidad>', argumentHint: '[quiet | on | prs | cuenta <personal|dev> | magi | git | hw | vivo | forge | cortex | yt [búsqueda] | modelos | tema <eva01|eva00|eva02|eva08|mark06>]', immediate: true })
      .catch(() => undefined)
    await refreshLocal($)
    if (sessionId) await loadRecap($)
    refreshPRs($)
    if (tab === 'hw') refreshHw($)
    if (tab === 'live') void refreshLive($)
    if (tab === 'forge') refreshForge($)
    if (tab === 'cortex') refreshCortex($)
    if (tab === 'models') void refreshModels($)
    await readCortexLog($)
    $.clock.every(3000, () => {
      readCortexLog($)
    })
    startFast($)
    if (paneId)
      $.clock.every(2000, () => {
        if (!quiet) checkFocus($)
      })
    $.clock.every(1000, () => {
      syncPrefs($)
    })
    $.clock.every(20000, () => {
      if (!quiet && !away) refreshLocal($)
    })
    $.clock.every(60000, () => {
      beat($)
    })
    $.clock.every(180000, () => {
      if (!quiet) refreshPRs($)
    })
    if (!quiet) await openPane($)
    return r
  })

  on('session.end', async ($: any, e: any, next: any) => {
    if (sessionId) await clean($)
    return next(e)
  })

  on('command.run', { command: 'nerv' }, async ($: any, e: any) => {
    const arg = (e.args || '').trim().toLowerCase()
    if (arg === 'quiet' || arg === 'off') {
      quiet = true
      await $.store.set('quiet', true).catch(() => undefined)
      await savePrefs($, { quiet: true })
      await $.ui.close({ id: PANE }).catch(() => undefined)
      paneOpen = false
      $.ui.invalidate('ui.render')
      return { text: 'NERV en silencio. /nerv on para volver.' }
    }
    if (arg === 'debug') {
      const panes = await $.ui.panes().catch((err: any) => String(err))
      const st = { scroll: { bodyOffset, bodyMax, lastView, lastContent }, paneOpen, away, tab, unverified: unverified.size, patternBlue: patternBlue?.count || 0, confetti: now() < confettiUntil, tasks: [...tasks.values()].map((x) => x.status || 'running'), recap: !!recap, effort: effort ?? null, effortLevel: effortLevel(), effortPick: effortPick ?? null, theme: themeId, quiet }
      return { text: 'nerv debug: ' + JSON.stringify(st) + ' panes=' + JSON.stringify(panes) }
    }
    if (arg.startsWith('cuenta')) {
      const id = arg.split(/\s+/)[1] || ''
      if (!acctNow()) return { text: 'esta sesión no tiene otra cuenta a la que cambiar' }
      if (!ACCOUNTS.some((x) => x.id === id) || id === acctNow()) return { text: `uso: /nerv cuenta <${ACCOUNTS.filter((x) => x.id !== acctNow()).map((x) => x.id).join('|')}> · ahora: ${acctName(acctNow())}` }
      await switchAccount($, id)
      return { text: `NERV: ${acctNote}` }
    }
    if (arg === 'prs') {
      await refreshPRs($)
      $.ui.invalidate('ui.render')
      return {}
    }
    if (arg.startsWith('tema') || arg.startsWith('theme')) {
      const id = arg.split(/\s+/)[1] || ''
      if (!(await setTheme($, id))) return { text: `uso: /nerv tema <${THEME_IDS.join('|')}> · activo: ${themeId}` }
      return { text: `NERV: unidad ${THEMES[themeId].label}` }
    }
    if (arg === 'yt' || arg.startsWith('yt ')) {
      tab = 'yt'
      await $.store.set('tab', tab).catch(() => undefined)
      const q = String(e.args || '').trim().slice(2).trim()
      if (q) {
        ytDraft = q
        void ytSearch($, q)
      } else await ytPoll($)
    }
    if (arg === 'modelos' || arg === 'models') {
      tab = 'models'
      await $.store.set('tab', tab).catch(() => undefined)
      await refreshModels($, true)
    }
    if (arg === 'hw' || arg === 'vivo' || arg === 'live' || arg === 'magi' || arg === 'forge' || arg === 'git' || arg === 'nodd' || arg === 'cortex') {
      tab = arg === 'hw' ? 'hw' : arg === 'vivo' || arg === 'live' ? 'live' : arg === 'forge' ? 'forge' : arg === 'git' ? 'git' : arg === 'nodd' ? 'nodd' : arg === 'cortex' ? 'cortex' : 'magi'
      await $.store.set('tab', tab).catch(() => undefined)
      if (tab === 'hw') await refreshHw($)
      if (tab === 'live') await refreshLive($)
      if (tab === 'forge') await refreshForge($)
      if (tab === 'nodd') await refreshNodd($)
      if (tab === 'cortex') await refreshCortex($)
    }
    quiet = false
    await $.store.set('quiet', false).catch(() => undefined)
    await savePrefs($, { quiet: false })
    await refreshLocal($)
    const r = await openPane($)
    $.ui.invalidate('ui.render')
    return r?.isPlaced ? {} : { text: `NERV: no hay lugar para la barra (${r?.reason || 'terminal angosta'})` }
  })

  on('ui.scroll', { requestId: PANE }, async ($: any, e: any, next: any) => {
    const row = e.pointer?.row
    const hit = typeof row === 'number' ? cardHits.find((c) => row >= c.top && row < c.bottom) : undefined
    if (hit) {
      const cur = cardScroll[hit.key] || 0
      const nxt = Math.max(0, Math.min(cardMax[hit.key] || 0, cur + (e.by || 0)))
      if (nxt !== cur) {
        cardScroll[hit.key] = nxt
        $.ui.invalidate('ui.render')
      }
      return {}
    }
    if (!bodyMax) return next(e)
    bodyOffset = Math.max(0, Math.min(bodyMax, bodyOffset + (e.by || 0)))
    $.ui.invalidate('ui.render')
    return {}
  })

  on('ui.close', { id: PANE }, async ($: any, e: any, next: any) => {
    const r = await next(e)
    paneOpen = false
    return r
  })

  on('prompt.submit', async ($: any, e: any, next: any) => {
    const r = await next(e)
    if (e.origin?.kind === 'task-notification') {
      const text = String(e.text || '')
      const use = tag(text, 'tool-use-id')
      const id = tag(text, 'task-id')
      const status = tag(text, 'status') || 'completed'
      const key = (use && tasks.has(use) && use) || (id && agentToUse.get(id)) || (id && tasks.has(id) && id)
      if (key) {
        const x = tasks.get(key)
        if (x) {
          x.end = now()
          x.status = status
        }
      } else if (id) tasks.set(id, { kind: 'shell', desc: clip((tag(text, 'summary') || id).replace(/\s+/g, ' '), 80), start: now(), end: now(), status })
      $.ui.invalidate('ui.render')
    } else if (e.text && !String(e.text).startsWith('/')) {
      recap = undefined
      await beat($, String(e.text))
    }
    return r
  })

  on('turn.start', async ($: any, e: any, next: any) => {
    if (!e.agentId) {
      working = true
      turnStart = now()
      lastProgress = now()
    }
    return next(e)
  })

  on('turn.step', async function* ($: any, e: any, next: any) {
    if (!e.agentId && effortPick && e.effort !== undefined) return yield* next({ ...e, effort: effortPick })
    if (!e.agentId && e.effort !== undefined && e.effort !== effort) {
      setEffort(e.effort)
      $.ui.invalidate('ui.render')
    }
    return yield* next(e)
  })

  on('turn.complete', async ($: any, e: any, next: any) => {
    const r = await next(e)
    if (e.agentId) {
      const key = agentToUse.get(e.agentId) || e.agentId
      const x = tasks.get(key)
      if (x && !x.end) {
        x.end = now()
        x.status = e.isAborted ? 'killed' : 'completed'
      }
      $.ui.invalidate('ui.render')
      return r
    }
    working = false
    activity = undefined
    const took = now() - turnStart
    if (!e.isAborted && took > LONG_TURN_MS && !quiet) {
      const msg = `${project || 'Claude'} · ${mmss(took)}${unverified.size ? ` · ⚠ ${unverified.size} sin verificar` : ''}`
      $.ui.toast(`MISSION COMPLETE · ${msg}`, { timeoutMs: 6000 })
      const shown = await $.process.run(missionWindow(project || 'Claude', mmss(took), unverified.size), { timeoutMs: 5000 }).catch(() => undefined)
      if (shown?.exitCode !== 0 || String(shown?.stdout || '').trim() !== 'ok')
        $.process.run(missionNotify($.plugin.root, project || 'Claude', mmss(took), unverified.size, C), { timeoutMs: 5000 }).catch(() => undefined)
    }
    take(await $.session.usage().catch(() => undefined))
    refreshLocal($)
    $.ui.invalidate('ui.render')
    return r
  })

  on('session.measure', async ($: any, e: any, next: any) => {
    const r = await next(e)
    take(e)
    $.ui.invalidate('ui.render')
    return r
  })

  on('agent.spawn', async ($: any, e: any, next: any) => {
    const r = await next(e)
    if (r?.agentId) {
      const key = e.tool_use_id || r.agentId
      tasks.set(key, { kind: 'agent', desc: e.description || e.subagentType || 'subagente', start: now() })
      agentToUse.set(r.agentId, key)
    }
    $.ui.invalidate('ui.render')
    return r
  })

  on('tool.call', async ($: any, e: any, next: any) => {
    if (e.agentId) return next(e)
    activity = { tool: e.tool, label: label(e), start: now() }
    $.ui.invalidate('ui.render')
    const r = await next(e)
    activity = undefined
    if (e.tool === 'TaskCreate' || e.tool === 'TaskUpdate') {
      await refreshTasks($)
      $.ui.invalidate('ui.render')
    }
    if (r?.deny) {
      $.ui.invalidate('ui.render')
      return r
    }
    if (e.tool === 'Bash' && e.run_in_background && !r?.isError && e.tool_use_id) tasks.set(e.tool_use_id, { kind: 'shell', desc: e.description || e.command || 'comando', start: now() })
    if (r?.isError) {
      const sig = e.tool + ':' + (r.text || '').slice(0, 80)
      errCount = sig === lastErr ? errCount + 1 : 1
      lastErr = sig
      if (errCount >= 3) patternBlue = { tool: e.tool, count: errCount, text: (r.text || '').split('\n')[0] }
    } else {
      lastProgress = now()
      if (patternBlue?.tool === e.tool) patternBlue = undefined
      if (lastErr.startsWith(e.tool + ':')) {
        lastErr = ''
        errCount = 0
      }
    }
    if (EDIT_TOOLS.includes(e.tool) && !r?.isError) unverified.add(e.file_path || e.notebook_path || '?')
    if (e.tool === 'Bash' && !r?.isReadOnly && !e.run_in_background) {
      unverified.clear()
      const key = String(e.command || '').slice(0, 60)
      if (r?.isError) failedCmds.add(key)
      else if (failedCmds.delete(key)) {
        confettiUntil = now() + 2500
      }
    }
    $.ui.invalidate('ui.render')
    return r
  })

  on('ui.render', { component: 'Pane' }, async ($: any, e: any, next: any) => {
    if (e.requestId !== PANE) return next(e)
    try {
      return draw($, e)
    } catch (err) {
      $.ui.log(`nerv: falló el dibujo: ${err}`)
      return next(e)
    }
  })

  on('ui.render', { component: 'Spinner' }, async ($: any, e: any, next: any) => {
    if (quiet) return next(e)
    const ctx = usage?.context?.percent ?? 0
    const sync = Math.min(99.9, Math.max(0, 98 - ctx + Math.sin(frame * 0.7) * 1.7))
    const doing = activity ? ` · ${activity.tool} ${mmss(now() - activity.start)}` : ''
    const mode = e.props.mode || 'thinking'
    const words = VERBS[mode] || VERBS.thinking
    const word = words[Math.floor(turnStart / 1000) % words.length]
    const rest = await next({ ...e, props: { ...e.props, word, suffix: `${e.props.suffix || ''} · SYNC ${sync.toFixed(1)}%${doing}` } })
    if (e.surface !== 'terminal') return rest
    try {
      const { Box, Raster } = $.ui.resolve(e)
      if (!Raster) return rest
      return Box({ flexDirection: 'row', columnGap: 1, children: [Box({ marginTop: 1, children: [Raster({ key: 'scan', columns: SCAN_W, rows: 1, cells: scanCells(mode) })] }), rest] })
    } catch {
      return rest
    }
  })

  on('ui.render', { component: 'ToolUse' }, async ($: any, e: any, next: any) => {
    if (quiet || e.surface !== 'terminal' || !e.props.tool) return next(e)
    if (cxTool(e.props.tool)) return cxToolCard($.ui.resolve(e), [e.props])
    const { Box, Text } = $.ui.resolve(e)
    const { g, c } = toolGlyph(e.props)
    const { name, arg } = toolHead(String(e.props.tool), e.props.input)
    const head = Text({ wrap: 'truncate', children: [Text({ color: c, children: [g + ' '] }), Text({ color: C.text, bold: true, children: [name] }), ...(arg && e.props.tool !== 'Bash' ? [Text({ color: C.muted, children: [` ${arg}`] })] : [])] })
    if (e.props.tool !== 'Bash' || !arg) return head
    return Box({ flexDirection: 'column', children: [head, Text({ wrap: 'truncate', color: C.dim, children: [`  $ ${arg}`] })] })
  })

  on('ui.render', { component: 'ToolGroup' }, async ($: any, e: any, next: any) => {
    const calls: any[] = e.props.calls || []
    if (quiet || e.surface !== 'terminal' || e.props.isExpanded || !calls.length) return next(e)
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const cx = calls.filter((x) => cxTool(x.tool))
    const rest = cx.length ? calls.filter((x) => !cxTool(x.tool)) : calls
    if (!rest.length) return cxToolCard(ui, cx)
    const live = rest.find((x) => x.isRunning)
    const { g, c } = toolGlyph({ isRunning: !!live, isErrored: rest.some((x) => x.isErrored), isInterrupted: rest.some((x) => x.isInterrupted) })
    const now = live ? toolHead(live.tool, live.input) : undefined
    const line = Text({ wrap: 'truncate', children: [Text({ color: c, children: [g + ' '] }), Text({ color: C.muted, children: [groupSummary(rest)] }), ...(now ? [Text({ color: C.dim, children: [`  ${now.name}${now.arg && live.tool !== 'Bash' ? ' ' + now.arg : ''}`] })] : [])] })
    return cx.length ? Box({ flexDirection: 'column', children: [line, cxToolCard(ui, cx)] }) : line
  })

  on('ui.render', { component: 'UserMessage' }, async ($: any, e: any, next: any) => {
    if (quiet || e.surface !== 'terminal' || e.props.task || e.props.from) return next(e)
    const found = cxEventsFor(String(e.props.text || ''))
    if (!found.length) return next(e)
    const rest = await next(e)
    try {
      const ui = $.ui.resolve(e)
      return ui.Box({ flexDirection: 'column', children: [rest, ...found.map((ev) => cxEventCard(ui, ev))] })
    } catch {
      return rest
    }
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($: any, e: any, next: any) => {
    const text = String(e.props.text || '')
    if (quiet || e.surface !== 'terminal' || !text || text.length > 10000) return next(e)
    const { Box, Text, Markdown } = $.ui.resolve(e)
    if (!Markdown) return next(e)
    return Box({
      flexDirection: 'row',
      children: [Box({ width: 2, flexShrink: 0, children: [Text({ color: C.purple, children: [e.props.isFirstOfReply ? '◆' : ' '] })] }), Box({ flexGrow: 1, flexShrink: 1, children: [Markdown({ text })] })],
    })
  })

  on('ui.render', { component: 'TurnDuration' }, async ($: any, e: any, next: any) => {
    if (quiet || e.surface !== 'terminal' || typeof e.props.durationMs !== 'number') return next(e)
    const { Text } = $.ui.resolve(e)
    return Text({ wrap: 'truncate', children: [Text({ color: C.purple, children: ['◆ '] }), Text({ color: C.muted, children: ['完了'] }), Text({ color: C.dim, children: [` · ${took(e.props.durationMs)}`] })] })
  })

  on('ui.render', { component: 'InfoNotice' }, async ($: any, e: any, next: any) => {
    const m = /^([\w.-]+): (?:plugin\.json changed\s*[—-]\s*)?reloaded\b/.exec(String(e.props.text || ''))
    if (quiet || !m || e.surface !== 'terminal') return next(e)
    const { Text } = $.ui.resolve(e)
    return Text({ wrap: 'truncate', color: C.dim, children: [`↻ ${m[1]} recargado`] })
  })

  // La línea NERV bajo el prompt: la del engine (modo, esc to interrupt, sus pills) queda arriba intacta.
  on('ui.render', { component: 'PromptHint' }, async ($: any, e: any, next: any) => {
    const rest = await next(e)
    if (quiet || e.surface !== 'terminal') return rest
    try {
      const { Box, Text } = $.ui.resolve(e)
      const kept = fitSegs(statusSegs(), Math.max(10, (e.viewport?.columns || 100) - 2))
      const parts: any[] = []
      kept.forEach((sg, i) => {
        if (i) parts.push(Text({ color: C.dim, children: [STATUS_SEP] }))
        for (const [text, color, bold] of sg.parts) parts.push(Text({ color, bold: !!bold, children: [text] }))
      })
      return Box({ flexDirection: 'column', children: [rest, Box({ key: 'nerv-status', children: [Text({ wrap: 'truncate', children: parts })] })] })
    } catch {
      return rest
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($: any, e: any, next: any) => {
    if (quiet || paneOpen || e.props.hasSurvey) return next(e)
    try {
      const { Box, Text, Button } = $.ui.resolve(e)
      const rest = await next(e)
      const ctx = usage?.context?.percent
      const five = pct('five_hour')
      const alert = battery()
      const bits = [
        Text({ color: alert ? C.lime : C.purple, bold: true, children: [alert ? '⚠ NERV ' : '⬢ NERV '] }),
        Text({ color: C.muted, children: [`SYNC ${ctx === undefined ? '–' : Math.round(ctx) + '%'} · 5H ${five === undefined ? '–' : Math.round(five) + '%'}`] }),
      ]
      const lvl = effortLevel()
      if (lvl) bits.push(Text({ color: hex(EFFORTS[lvl - 1].hue), children: [` · EFFORT ${effortName()} ${'▰'.repeat(lvl)}${'▱'.repeat(5 - lvl)}`] }))
      if (unverified.size) bits.push(Text({ color: C.amber, children: [` · ⚠ ${unverified.size} sin verificar`] }))
      if (patternBlue) bits.push(Text({ color: C.orange, children: [' · ◆ PATTERN BLUE'] }))
      bits.push(Text({ color: C.dim, children: [' · /nerv'] }))
      const top: any[] = [Text({ wrap: 'truncate', children: bits })]
      if (acctNow()) top.push(Text({ color: C.dim, children: [' · '] }), Button({ key: 'band-acct', label: `${acctName(acctNow())} ${acctMenu ? '▴' : '▾'}`, plain: true, onPress: () => acctToggle($) }))
      const rows: any[] = [Box({ key: 'band-top', flexDirection: 'row', children: top })]
      if (acctNow() && acctMenu) {
        const opts: any[] = [Text({ color: C.dim, children: ['  cambiar a → '] })]
        for (const a of ACCOUNTS.filter((x) => x.id !== acctNow())) opts.push(Button({ key: 'band-go-' + a.id, label: `${acctName(a.id)} · ${a.tag}`, plain: true, onPress: () => void switchAccount($, a.id) }))
        if (acctNote) opts.push(Text({ color: C.amber, children: ['  ' + acctNote] }))
        rows.push(Box({ key: 'band-menu', flexDirection: 'row', children: opts }))
      }
      return Box({ flexDirection: 'column', children: [...rows, rest] })
    } catch {
      return next(e)
    }
  })
}
