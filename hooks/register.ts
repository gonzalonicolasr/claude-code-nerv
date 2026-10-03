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
  { id: 'crew', label: 'EQUIPO', hotkey: '4' },
  { id: 'forge', label: 'FORGE', hotkey: '5' },
  { id: 'nodd', label: 'NODD', hotkey: '6' },
]
const PHASES = ['explore', 'plan', 'build', 'veredicto']
const SPIN = ['◐', '◓', '◑', '◒']

let quiet = false
let placedOnce = false
let paneOpen = false
let tab = 'magi'
let frame = 0
let working = false
let turnStart = 0
let model = ''
let project = ''
let cwdNow = ''
let branch = ''
let home = ''
let paneId = ''
let sessionId = ''
let usage: any = undefined
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
let todos: string[] = []
let health = { ok: true, when: '', text: '' }
let recap: { prompt: string; at: number } | undefined
let hw: any = undefined
let hwBusy = false
const cpuHist: number[] = []
const gpuHist: number[] = []
let crew: any[] = []
let crewBusy = false
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
let forgeMissing = false
let forgeDraft = ''
const forgeGroup: Record<string, string> = {}

const now = () => Date.now()
const base = (p: string) => (p || '').split('/').filter(Boolean).at(-1) || p
const clip = (s: string, n: number) => {
  s = String(s ?? '')
  return s.length > n ? s.slice(0, Math.max(0, n - 1)) + '…' : s
}
const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`
}
const ago = (ms: number) => {
  const m = Math.floor(ms / 60000)
  return m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.floor(m / 60)} h` : `hace ${Math.floor(m / 1440)} d`
}
const heat = (p: number) => (p >= 90 ? C.red : p >= 70 ? C.amber : C.lime)
const bar = (p: number, w: number) => {
  const f = Math.max(0, Math.min(w, Math.round((p / 100) * w)))
  return '━'.repeat(f) + '┈'.repeat(w - f)
}
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

async function refreshLocal($: any) {
  const cwd = await $.session.cwd().catch(() => '')
  cwdNow = cwd
  project = base(cwd)
  model = await $.session.model().catch(() => model)
  const b = await $.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { cwd, timeoutMs: 5000 }).catch(() => undefined)
  branch = b?.exitCode === 0 ? b.stdout.trim() : ''
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
  if (home && paneId) {
    const raw = await $.fs.read(`${home}/.local/state/herdr-todos.json`).catch(() => '')
    try {
      const items = (JSON.parse(raw || '{}')[paneId] || []).map((i: any) => (typeof i === 'string' ? { text: i } : i))
      todos = items.filter((i: any) => !i.done).map((i: any) => i.text)
    } catch {
      todos = []
    }
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

async function refreshCrew($: any) {
  if (crewBusy) return
  crewBusy = true
  try {
    const a = await herdrJson($, ['agent', 'list'])
    const w = await herdrJson($, ['workspace', 'list'])
    const t = await herdrJson($, ['tab', 'list'])
    if (!a) {
      crew = []
      return
    }
    const spaces = Object.fromEntries((w?.workspaces || []).map((x: any) => [x.workspace_id, x.label]))
    const tabs = Object.fromEntries((t?.tabs || []).map((x: any) => [x.tab_id, x.label || '']))
    const rank: any = { blocked: 0, done: 1, working: 2, idle: 3 }
    crew = a.agents
      .map((x: any) => {
        const tb = tabs[x.tab_id] || ''
        return {
          status: x.agent_status,
          agent: x.agent,
          where: tb && !/^\d+$/.test(tb) ? `${spaces[x.workspace_id] || ''} › ${tb}` : spaces[x.workspace_id] || '',
          title: (x.terminal_title_stripped || '').replace(/^(π|pi)\s*-\s*\S+$/, ''),
          me: x.pane_id === paneId,
        }
      })
      .sort((x: any, y: any) => (rank[x.status] ?? 9) - (rank[y.status] ?? 9) || x.where.localeCompare(y.where))
  } catch {
  } finally {
    crewBusy = false
  }
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


const WAVES = {
  get eva() { return [RGB.lime, RGB.purple] },
  get alert() { return [RGB.pink, RGB.red] },
  get blue() { return [RGB.amber, RGB.orange] },
}

const softWave = (cols: number, rows: number) => {
  const h = rows * 2
  const t = frame * (working ? 0.2 : 0.06)
  const [hi, lo] = battery() ? WAVES.alert : patternBlue ? WAVES.blue : WAVES.eva
  const party = now() < confettiUntil
  const amp = (h - 1) / 2
  const glintA = (frame * (working ? 0.9 : 0.35)) % (cols + 16) - 8
  const glintB = cols - ((frame * (working ? 0.7 : 0.25)) % (cols + 16) - 8)
  const ink = RGB.ink
  return cells(cols, rows, (x, y) => {
    if (party && hash(x, y, frame) > 0.9) return [RGB.lime, RGB.pink, RGB.cyan, RGB.amber][Math.floor(hash(y, x, frame) * 4)]
    const w1 = amp + Math.sin(x * 0.2 + t) * amp * 0.85
    const w2 = amp + Math.sin(x * 0.13 - t * 0.7 + 1.3) * amp * 0.65
    const i1 = Math.exp(-((y - w1) ** 2) / 0.45)
    const i2 = Math.exp(-((y - w2) ** 2) / 0.45)
    const g1 = Math.exp(-(((x - glintA) / 2.5) ** 2))
    const g2 = Math.exp(-(((x - glintB) / 2.5) ** 2))
    const top = Math.max(i1, i2)
    if (top < 0.12) return RGB.none
    const front = i1 >= i2
    const hue = front ? hi : lo
    const glint = front ? g1 : g2
    const base = mix(ink, hue, Math.min(1, 0.35 + top * (working ? 0.75 : 0.6)))
    return mix(base, 0xffffff, glint * top * 0.75)
  })
}

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
  const { Box, Text, Raster, Button, Link } = $.ui.resolve(e)
  const dock = e.props.placement === 'dock' && (e.props.scroll?.bodyRows || 0) > 0
  for (const k of Object.keys(cardMax)) delete cardMax[k]
  const cols = Math.max(20, (e.props.bodyColumns || 40) - (dock ? 1 : 0))
  const compact = !dock
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
      },
    })
  const titleRow = (key: string, parts: any[], color: string) =>
    Box({ key: 'title-' + key, flexDirection: 'row', justifyContent: 'space-between', children: [t(parts, color), foldBtn(key)] })
  const card = (key: string, title: string, color: string, rows: any[]) =>
    Box({ key, flexDirection: 'column', borderStyle: 'round', borderColor: color, paddingX: 1, children: [titleRow(key, [span(title, color, { bold: true })], color), ...(folded.has(key) ? [] : rows)] })
  const kv = (left: any[], right: any[]) => Box({ flexDirection: 'row', justifyContent: 'space-between', children: [t(left), t(right)] })
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
  const magi = ['MELCHIOR·1', 'BALTHASAR·2', 'CASPER·3']
  const vote = (i: number) => {
    if (alert || (patternBlue && i === 2)) return { word: '否決', fg: ink, bg: blink() ? C.red : C.pink }
    if (working && Math.floor(frame / 3) % 3 === i) return { word: '審議', fg: ink, bg: C.lime }
    if (working) return { word: '待機', fg: C.purple, bg: C.chip }
    return { word: '承認', fg: C.muted, bg: C.chipDim }
  }
  out.push(
    Box({
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginRight: 2,
      children: [
        t([
          span(' NERV ', ink, { bold: true, backgroundColor: alert && blink() ? C.red : C.purple }),
          span(' ネルフ', C.orange, { bold: true }),
          span(' ⟋ MAGI', C.dim),
        ]),
        t([
          ...(compact ? [0, 1, 2].map((i) => span(` ${'MBC'[i]}·${vote(i).word} `, vote(i).fg, { backgroundColor: vote(i).bg })) : []),
          span(compact ? ' ' : ''),
          working
            ? span(` ${SPIN[frame % 4]} OPERANDO `, ink, { bold: true, backgroundColor: C.lime })
            : span(' ◎ EN ESPERA ', C.muted, { backgroundColor: C.chip }),
        ]),
      ],
    }),
  )
  if (!compact && e.surface === 'terminal' && Raster) out.push(Raster({ key: 'wave', columns: cols, rows: 3, cells: softWave(cols, 3) }))
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
          children: [t([span(clip(name, cw), v.fg, { bold: v.bg === C.lime })], v.fg), t([span(v.word, v.fg, { bold: true })], v.fg)],
        })
      }),
    }),
  )
  const tabLabel = (x: (typeof TABS)[number]) => (tab === x.id ? `◆ ${x.label}` : x.label)
  const oneRow = TABS.reduce((n, x) => n + tabLabel(x).length + 4, 0) <= cols
  const perRow = compact && oneRow ? TABS.length : 3
  const cellW = perRow === TABS.length ? Math.max(...TABS.map((x) => tabLabel(x).length + 3)) + 1 : Math.floor((cols - (perRow - 1)) / perRow)
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
          onPress: () => {
            tab = x.id
            $.store.set('tab', tab).catch(() => undefined)
            if (x.id === 'hw') refreshHw($)
            if (x.id === 'crew') refreshCrew($)
            if (x.id === 'forge') refreshForge($)
            if (x.id === 'nodd') refreshNodd($)
            $.ui.invalidate('ui.render')
          },
        }),
      ],
    })
  for (let i = 0; i < TABS.length; i += perRow)
    out.push(Box({ key: 'tabrow-' + i, flexDirection: 'row', columnGap: 1, marginTop: i === 0 && !compact ? 1 : 0, children: TABS.slice(i, i + perRow).map(tabButton) }))
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
    const ctx = usage?.context?.percent
    const five = pct('five_hour')
    const seven = pct('seven_day')
    const gw = Math.max(6, w - 14)
    const gauge = (name: string, p: number | undefined) =>
      t([span(name.padEnd(6), C.muted), span(bar(p ?? 0, gw), typeof p === 'number' ? heat(p) : C.dim), span(typeof p === 'number' ? ` ${Math.round(p)}%`.padStart(5) : '   –', C.text)])
    const syncRows = [t([span('PILOT ', C.muted), span(clip(model || '?', w - 6), C.text, { bold: true })]), gauge('SYNC', ctx), gauge('5H', five), gauge('7D', seven)]
    if (typeof usage?.cost?.usd === 'number') syncRows.push(t([span('COSTO ', C.muted), span(`US$ ${usage.cost.usd.toFixed(2)}`, C.text)]))
    if (alert) {
      const rem = remaining()
      syncRows.push(t([span(blink() ? '▲ ACTIVE TIME REMAINING' : '△ ACTIVE TIME REMAINING', C.red, { bold: true })]))
      syncRows.push(t([span(rem ? `  ~${mmss(rem)} al ritmo actual` : '  cable umbilical cortado', C.pink)]))
    }
    out.push(card('sync', alert ? '⚠ BATERÍA INTERNA' : '⬢ SINCRONIZACIÓN', alert ? (blink() ? C.red : C.pink) : C.purple, syncRows))

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


    if (todos.length) out.push(card('todos', `□ ${todos.length} TO-DO${todos.length > 1 ? 'S' : ''}`, C.amber, todos.slice(0, 4).map((x) => t([span('□ ' + clip(x, w - 2), C.todo)]))))
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
        const state = !live ? ['pendiente', C.amber] : !g.enabled ? ['apagado', C.dim] : on ? ['aplica', C.lime] : ['en espera', C.muted]
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

  if (tab === 'crew') {
    const n = (s: string) => crew.filter((x) => x.status === s).length
    out.push(
      t([
        span(`▲ ${n('blocked')} te necesita${n('blocked') === 1 ? '' : 'n'} `, n('blocked') ? C.pink : C.dim),
        span(`✔ ${n('done')} `, n('done') ? C.lime : C.dim),
        span(`◌ ${n('working')} `, n('working') ? C.purple : C.dim),
        span(`· ${n('idle')} quietos`, C.dim),
      ]),
    )
    const led = (s: string) => (s === 'blocked' ? [blink() ? '▲' : '△', C.pink] : s === 'done' ? ['✔', C.lime] : s === 'working' ? [SPIN[frame % 4], C.purple] : ['·', C.dim])
    const rows = crew.slice(0, 18).map((x) => {
      const [g, col] = led(x.status)
      return Box({
        flexDirection: 'column',
        children: [
          t([span(g + ' ', col), span(clip(x.where || '?', w - 12), x.status === 'idle' ? C.muted : C.text, { bold: x.status === 'blocked' }), span(` ${x.agent}${x.me ? ' ◂ vos' : ''}`, C.dim)]),
          ...(x.title && x.status !== 'idle' ? [t([span('  ' + clip(x.title, w - 2), C.muted)])] : []),
        ],
      })
    })
    out.push(scard('crew', '◈ EQUIPO NERV', C.purple, rows.length ? rows : [t([span('herdr no responde', C.muted)])], 14))
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
  if (compact)
    foot.splice(
      1,
      foot.length,
      Box({
        flexDirection: 'row',
        children: [
          t([span('◆ ', hue), span('EFFORT ', C.muted, { bold: true }), lvl ? span(` ${effortName()} `, ink, { bold: true, backgroundColor: hue }) : span('–', C.dim), span(effortPick ? ' fijado ' : ' ', C.muted)]),
          pickRow(6, 1),
        ],
      }),
    )
  const rows = e.props.scroll?.bodyRows || 0
  const footBox = Box({ key: 'effort-foot', flexDirection: 'column', flexShrink: 0, marginTop: 1, children: foot })
  if (!rows || e.props.placement !== 'dock') {
    if (compact) return Box({ flexDirection: 'column', children: [...out.slice(0, headN), Box({ key: 'effort-top', flexDirection: 'column', marginTop: 0, children: foot.slice(1) }), ...out.slice(headN)] })
    return Box({ flexDirection: 'column', minHeight: rows || undefined, children: [...out, Box({ key: 'spacer', flexGrow: 1 }), footBox] })
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
      footBox,
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

async function setTheme($: any, id: string) {
  if (!applyTheme(id)) return false
  await $.store.set('theme', id).catch(() => undefined)
  if (home) {
    await $.process.run(['mkdir', '-p', `${home}/.local/state/nerv`], { timeoutMs: 5000 }).catch(() => undefined)
    const { label, ...colors } = THEMES[themeId]
    await $.fs.write(`${home}/.local/state/nerv/theme.json`, JSON.stringify({ theme: themeId, label, colors }, null, 2) + '\n').catch(() => undefined)
  }
  $.ui.invalidate('ui.render')
  return true
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

async function refreshNodd($: any) {
  if (!home) return
  const raw = await $.fs.read(`${home}/.local/state/nodd/state.json`).catch(() => undefined)
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

async function forgeCmd($: any, args: string) {
  await $.command.run({ command: 'forge', args }).catch((err: any) => $.ui.toast(`forge: ${clip(String(err?.message || err), 70)}`))
  await refreshForge($)
  $.ui.invalidate('ui.render')
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
const nice = (id: string) => forge?.labels?.[id] || bare(id)
const FACTORY_ORDER = ['turbo', 'barato', 'equilibrado', 'calidad', 'solo-claude', 'openai', 'gemini', 'open-source']
const EFFORT_SHORT: Record<string, string> = { auto: 'auto', off: 'off', minimal: 'min', low: 'low', medium: 'med', high: 'high', xhigh: 'xhigh' }
const groupOf = (id: string) => (['haiku', 'sonnet', 'opus', 'fable'].includes(id) || /^claude-/.test(id) ? 'claude' : id.includes('/') ? id.split('/')[0] : 'cpam')

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
        children: [t([span(p.name.toUpperCase().padEnd(10), col, { bold: true }), span(clip(nice(p.model), Math.max(8, w - 11 - effTag.length)), C.text)]), t([span(effTag, C.orange)])],
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
  const factory = all.filter(([, p]) => p.source !== 'zero-pi').map(([n]) => n)
  sections.push({ title: 'FÁBRICA', names: [...FACTORY_ORDER.filter((n) => factory.includes(n)), ...factory.filter((n) => !FACTORY_ORDER.includes(n)).sort()] })
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
  for (const sec of sections) {
    profileRows.push(t([span(sec.title, C.cyan, { bold: true }), span(` · ${sec.names.length}`, C.dim)]))
    const colW = Math.floor((w - 1) / 2)
    for (let i = 0; i < sec.names.length; i += 2) {
      profileRows.push(
        Box({
          key: `psec-${sec.title}-${i}`,
          flexDirection: 'row',
          columnGap: 1,
          children: sec.names.slice(i, i + 2).map((n) => {
            const bad = broken(forge.profiles[n])
            const on = forge.profile === n
            const label = n.replace(/^zero:/, '').replace(/^personal-/, '').replace(/-/g, ' ')
            return Box({
              key: 'pg-' + n,
              width: colW,
              paddingX: 1,
              backgroundColor: on ? C.tabBg : C.chipDim,
              children: [Button({ key: 'profile-' + n, label: clip((on ? '● ' : '') + label + (bad ? ' ⚠' : ''), colW - 2), plain: true, dimColor: !on, onPress: () => void forgeCmd($, `profile ${n}`) })],
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
    const curLabel = current ? nice(current) : 'elegí modelo'
    const effLabel = note ? '⚡ n/a' : `⚡ ${EFFORT_SHORT[effort] || effort} ${eOpen ? '▴' : '▾'}`
    modelRows.push(
      Box({
        key: 'mrow-' + p,
        flexDirection: 'row',
        justifyContent: 'space-between',
        children: [
          Box({
            key: 'mrl-' + p,
            flexDirection: 'row',
            children: [
              t([span(p.toUpperCase().padEnd(10), mOpen || eOpen ? C.lime : C.cyan, { bold: true })]),
              pill('ddh-fmodel-' + p, `${clip(curLabel, w - 22)} ${mOpen ? '▴' : '▾'}`, mOpen, C.text, () => {
                openDrop = mOpen ? '' : 'fmodel-' + p
                forgeGroup[p] = groupOf(current)
                forgeAccounts[p] = false
                $.ui.invalidate('ui.render')
              }),
            ],
          }),
          note
            ? t([span(effLabel, C.dim)])
            : pill('ddh-feffort-' + p, effLabel, eOpen, effort === 'auto' ? C.dim : C.orange, () => {
                openDrop = eOpen ? '' : 'feffort-' + p
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
      let models = (catalog[group] || []).map((id) => ({ value: id, label: nice(id) }))
      if (group === groupOf(current) && current && !models.some((m) => m.value === current)) models = [{ value: current, label: `${nice(current)} ⚠ no está en el CPAM` }, ...models]
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
  out.push(h.scard('forge-models', '⬡ MODELOS · EFFORT', C.violet, modelRows, 9))

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
    paneId = (await $.env.get('HERDR_PANE_ID').catch(() => '')) || ''
    sessionId = (await $.session.id().catch(() => '')) || ''
    quiet = (await $.store.get('quiet').catch(() => false)) === true
    tab = ((await $.store.get('tab').catch(() => undefined)) as string) || 'magi'
    for (const k of ((await $.store.get('folded').catch(() => [])) as string[]) || []) folded.add(k)
    applyTheme(String((await $.store.get('theme').catch(() => '')) || 'eva01'))
    const unit = home ? await $.fs.read(`${home}/.config/systemd/user/jcode-rail.service`).catch(() => '') : ''
    ramTotal = ((unit || '').match(/JCODE_RAIL_RAM_TOTAL=(\d+)/) || [])[1] || ''
    take(await $.session.usage().catch(() => undefined))
    await $.command
      .register({ name: 'nerv', description: 'Barra NERV: abrir, /nerv quiet para apagarla, /nerv prs para refrescar PRs, /nerv tema <unidad>', argumentHint: '[quiet | on | prs | magi | git | hw | equipo | forge | tema <eva01|eva00|eva02|eva08|mark06>]', immediate: true })
      .catch(() => undefined)
    await refreshLocal($)
    if (sessionId) await loadRecap($)
    refreshPRs($)
    if (tab === 'hw') refreshHw($)
    if (tab === 'crew') refreshCrew($)
    if (tab === 'forge') refreshForge($)
    $.clock.every(125, () => {
      frame++
      if (!quiet && !placedOnce && frame % 24 === 0) void openPane($)
      if (quiet || !paneOpen) return
      if (tab === 'hw' && frame % 24 === 0) refreshHw($)
      if (tab === 'crew' && frame % 32 === 0) refreshCrew($)
      if (tab === 'forge' && frame % 8 === 0) refreshForge($)
      if (tab === 'nodd' && frame % 16 === 0) refreshNodd($)
      if (working || battery() || patternBlue || now() < confettiUntil || tab !== 'magi' || frame % 2 === 0) $.ui.invalidate('ui.render')
    })
    $.clock.every(20000, () => {
      if (!quiet) refreshLocal($)
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
      await $.ui.close({ id: PANE }).catch(() => undefined)
      paneOpen = false
      $.ui.invalidate('ui.render')
      return { text: 'NERV en silencio. /nerv on para volver.' }
    }
    if (arg === 'debug') {
      const panes = await $.ui.panes().catch((err: any) => String(err))
      const st = { scroll: { bodyOffset, bodyMax, lastView, lastContent }, paneOpen, tab, unverified: unverified.size, patternBlue: patternBlue?.count || 0, confetti: now() < confettiUntil, tasks: [...tasks.values()].map((x) => x.status || 'running'), recap: !!recap, effort: effort ?? null, effortLevel: effortLevel() }
      return { text: 'nerv debug: ' + JSON.stringify(st) + ' panes=' + JSON.stringify(panes) }
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
    if (arg === 'hw' || arg === 'equipo' || arg === 'magi' || arg === 'forge' || arg === 'git' || arg === 'nodd') {
      tab = arg === 'hw' ? 'hw' : arg === 'equipo' ? 'crew' : arg === 'forge' ? 'forge' : arg === 'git' ? 'git' : arg === 'nodd' ? 'nodd' : 'magi'
      await $.store.set('tab', tab).catch(() => undefined)
      if (tab === 'hw') await refreshHw($)
      if (tab === 'crew') await refreshCrew($)
      if (tab === 'forge') await refreshForge($)
      if (tab === 'nodd') await refreshNodd($)
    }
    quiet = false
    await $.store.set('quiet', false).catch(() => undefined)
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
      $.process.run(['notify-send', '-a', 'NERV', 'MISSION COMPLETE', msg], { timeoutMs: 5000 }).catch(() => undefined)
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

  on('ui.render', { component: 'AbovePrompt' }, async ($: any, e: any, next: any) => {
    if (quiet || paneOpen || e.props.hasSurvey) return next(e)
    try {
      const { Box, Text } = $.ui.resolve(e)
      const rest = await next(e)
      const ctx = usage?.context?.percent
      const five = pct('five_hour')
      const alert = battery()
      const bits = [
        Text({ color: alert ? C.red : C.purple, bold: true, children: [alert ? '⚠ NERV ' : '⬢ NERV '] }),
        Text({ color: C.muted, children: [`SYNC ${ctx === undefined ? '–' : Math.round(ctx) + '%'} · 5H ${five === undefined ? '–' : Math.round(five) + '%'}`] }),
      ]
      const lvl = effortLevel()
      if (lvl) bits.push(Text({ color: hex(EFFORTS[lvl - 1].hue), children: [` · EFFORT ${effortName()} ${'▰'.repeat(lvl)}${'▱'.repeat(5 - lvl)}`] }))
      if (unverified.size) bits.push(Text({ color: C.amber, children: [` · ⚠ ${unverified.size} sin verificar`] }))
      if (patternBlue) bits.push(Text({ color: C.orange, children: [' · ◆ PATTERN BLUE'] }))
      bits.push(Text({ color: C.dim, children: [' · /nerv'] }))
      return Box({ flexDirection: 'column', children: [Text({ wrap: 'truncate', children: bits }), rest] })
    } catch {
      return next(e)
    }
  })
}
