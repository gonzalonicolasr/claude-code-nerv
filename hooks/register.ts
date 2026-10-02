const PANE = 'nerv'
const C = {
  purple: '#8b5cf6',
  violet: '#7b3fb8',
  lime: '#a3e635',
  amber: '#f59e0b',
  orange: '#ff7a1a',
  red: '#ef4444',
  pink: '#ff4d6d',
  cyan: '#22d3ee',
  text: '#ece2fb',
  muted: '#8a73ad',
  dim: '#5b4a75',
  todo: '#f0c987',
}
const RGB = {
  purple: 0x8b5cf6,
  violet: 0x7b3fb8,
  lime: 0xa3e635,
  orange: 0xff7a1a,
  red: 0xef4444,
  pink: 0xff4d6d,
  amber: 0xf59e0b,
  cyan: 0x22d3ee,
  deep: 0x2e2340,
  none: 0x01000000,
}
const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']
const LONG_TURN_MS = 180000
const BATTERY_AT = 85
const TABS = [
  { id: 'magi', label: 'MAGI', hotkey: '1' },
  { id: 'hw', label: 'HARDWARE', hotkey: '2' },
  { id: 'crew', label: 'EQUIPO', hotkey: '3' },
]
const SPIN = ['◐', '◓', '◑', '◒']

let quiet = false
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
let prError = ''
let ci: any = undefined
let todos: string[] = []
let health = { ok: true, when: '', text: '' }
let recap: { prompt: string; at: number } | undefined
let hw: any = undefined
let hwBusy = false
const cpuHist: number[] = []
const gpuHist: number[] = []
let crew: any[] = []
let crewBusy = false
let ramTotal = ''

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

const battery = () => (usage?.context?.percent ?? 0) >= BATTERY_AT || (pct('five_hour') ?? 0) >= BATTERY_AT

async function ghEnv($: any, cwd: string) {
  const r = await $.process.run(['git', 'remote', 'get-url', 'origin'], { cwd, timeoutMs: 5000 }).catch(() => undefined)
  const url = r?.stdout?.trim() || ''
  if (!url) return undefined
  if (!/github\.com[:/]gonzalonicolasr\//.test(url)) return {}
  const t = await $.process.run(['gh', 'auth', 'token', '--user', 'gonzalonicolasr'], { timeoutMs: 5000 }).catch(() => undefined)
  return t?.exitCode === 0 ? { GH_TOKEN: t.stdout.trim() } : {}
}

async function refreshPRs($: any) {
  const cwd = await $.session.cwd().catch(() => '')
  if (!cwd) return
  const env = await ghEnv($, cwd)
  if (!env) {
    prs = undefined
    ci = undefined
    prError = 'sin repo de GitHub'
    return
  }
  const r = await $.process
    .run(['gh', 'pr', 'list', '--author', '@me', '--state', 'open', '--limit', '6', '--json', 'number,title,reviewDecision,isDraft,statusCheckRollup,url'], { cwd, env, timeoutMs: 20000 })
    .catch((err: any) => ({ exitCode: 1, stdout: '', stderr: String(err) }))
  if (r.exitCode !== 0) prError = clip((r.stderr || 'gh falló').split('\n')[0], 60)
  else
    try {
      prs = JSON.parse(r.stdout)
      prError = ''
    } catch {
      prError = 'respuesta de gh ilegible'
    }
  if (!branch) return
  const runs = await $.process
    .run(['gh', 'run', 'list', '--branch', branch, '--limit', '1', '--json', 'status,conclusion,workflowName,url,createdAt'], { cwd, env, timeoutMs: 20000 })
    .catch(() => undefined)
  try {
    ci = runs?.exitCode === 0 ? JSON.parse(runs.stdout)[0] : undefined
  } catch {
    ci = undefined
  }
}

async function refreshLocal($: any) {
  const cwd = await $.session.cwd().catch(() => '')
  cwdNow = cwd
  project = base(cwd)
  model = await $.session.model().catch(() => model)
  const b = await $.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { cwd, timeoutMs: 5000 }).catch(() => undefined)
  branch = b?.exitCode === 0 ? b.stdout.trim() : ''
  if (home && paneId) {
    const raw = await $.fs.read(`${home}/.local/state/herdr-todos.json`).catch(() => '')
    try {
      const items = (JSON.parse(raw || '{}')[paneId] || []).map((i: any) => (typeof i === 'string' ? { text: i } : i))
      todos = items.filter((i: any) => !i.done).map((i: any) => i.text)
    } catch {
      todos = []
    }
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

const PALETTES = {
  eva: [0x2a1f3d, 0x4a2d80, 0x7b3fb8, RGB.purple, 0xc4a5ff, RGB.lime, 0xeaffc2],
  alert: [0x2a0f16, 0x6e1420, 0xb4202f, RGB.red, RGB.pink, 0xffb3c4, 0xffffff],
  blue: [0x2a1a0c, 0x6b3410, 0xb4561a, RGB.orange, RGB.amber, 0xffe08a, 0xffffff],
}
const DOT = [0x00b7, 0x25aa]

const particleCells = (cols: number, rows: number) => {
  const t = frame * (working ? 0.18 : 0.05)
  const stops = battery() ? PALETTES.alert : patternBlue ? PALETTES.blue : PALETTES.eva
  const party = now() < confettiUntil
  const sweep = ((frame * (working ? 0.9 : 0.25)) % (cols + 24)) - 12
  return glyphs(cols, rows, (x, y) => {
    let v = 0.42 + 0.17 * Math.sin(x * 0.19 + t) + 0.13 * Math.sin(y * 1.3 - t * 0.9 + x * 0.05) + 0.1 * Math.sin((x + y * 4) * 0.11 - t * 1.4)
    v += (working ? 0.55 : 0.3) * Math.exp(-(((x - sweep) / 5) ** 2))
    v += (hash(x, y, Math.floor(frame / 4)) - 0.5) * 0.18
    if (party) v = 0.55 + hash(x, y, frame) * 0.45
    v = Math.max(0, Math.min(1, v))
    if (hash(x, y, Math.floor(frame / 3) + 7) > (party ? 0.8 : 0.992)) {
      const hue = party ? [RGB.lime, RGB.pink, RGB.cyan, RGB.amber, 0xffffff][Math.floor(hash(y, x, frame) * 5)] : 0xffffff
      return [0x25aa, hue]
    }
    return [DOT[v < 0.22 ? 0 : 1], ramp(stops, v)]
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
  thinking: RGB.purple,
  requesting: RGB.amber,
  responding: RGB.cyan,
  'tool-input': RGB.lime,
  'tool-use': RGB.lime,
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
    if (behind > 0 && behind < TRAIL.length) return [TRAIL[behind], mix(hue, 0x1c1526, behind / TRAIL.length)]
    if (hash(x, 0, Math.floor(frame / 2)) > 0.8) return [0x2802, 0x4b2a7a]
    return undefined
  })
}

function draw($: any, e: any) {
  const { Box, Text, Raster, Button, Link } = $.ui.resolve(e)
  const cols = Math.max(20, e.props.bodyColumns || 40)
  const w = cols - 4
  const t = (children: any[], color = C.text, extra: any = {}) => Text({ wrap: 'truncate', color, children, ...extra })
  const span = (s: string, color: string, extra: any = {}) => Text({ color, children: [s], ...extra })
  const card = (key: string, title: string, color: string, rows: any[]) =>
    Box({ key, flexDirection: 'column', borderStyle: 'round', borderColor: color, paddingX: 1, children: [t([span(title, color, { bold: true })], color), ...rows] })
  const kv = (left: any[], right: any[]) => Box({ flexDirection: 'row', justifyContent: 'space-between', children: [t(left), t(right)] })

  const out: any[] = []
  const alert = battery()
  out.push(
    t([
      span('NERV ', alert && blink() ? C.red : C.purple, { bold: true }),
      span('ネルフ', C.orange),
      span(' ▸ MAGI ', C.muted),
      span(working ? `${SPIN[frame % 4]} OPERANDO` : '◎ EN ESPERA', working ? C.lime : C.muted, { bold: working }),
    ]),
  )
  if (e.surface === 'terminal' && Raster) out.push(Raster({ key: 'wave', columns: cols, rows: 4, cells: particleCells(cols, 4) }))
  out.push(
    Box({
      flexDirection: 'row',
      columnGap: 1,
      children: TABS.map((x) =>
        Button({
          key: 'tab-' + x.id,
          label: tab === x.id ? `▣ ${x.label}` : `□ ${x.label}`,
          hotkey: x.hotkey,
          plain: true,
          dimColor: tab !== x.id,
          onPress: () => {
            tab = x.id
            if (x.id === 'hw') refreshHw($)
            if (x.id === 'crew') refreshCrew($)
            $.ui.invalidate('ui.render')
          },
        }),
      ),
    }),
  )

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
        prRows.push(
          Box({
            flexDirection: 'row',
            children: [t([span(rv[0] + ' ', rv[1]), span(cic[0] + ' ', cic[1])]), Link({ key: 'pr-' + p.number, href: p.url, label: clip(`#${p.number} ${p.title}`, w - 5) })],
          }),
        )
      }
    if (ci) {
      const done = ci.status === 'completed'
      const ok = ci.conclusion === 'success'
      const [g, col] = !done ? [SPIN[frame % 4], C.amber] : ok ? ['●', C.lime] : ['✖', C.red]
      prRows.push(
        Box({
          flexDirection: 'row',
          children: [t([span(`${g} CI `, col)]), Link({ key: 'ci', href: ci.url, label: clip(`${ci.workflowName} · ${done ? ci.conclusion : ci.status}`, w - 6) })],
        }),
      )
    }
    out.push(card('prs', `⎇ PRs${branch ? ' · ' + clip(branch, w - 10) : ''}`, C.violet, prRows))

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
    out.push(card('crew', '◈ EQUIPO NERV', C.purple, rows.length ? rows : [t([span('herdr no responde', C.muted)])]))
  }

  return Box({ flexDirection: 'column', children: out })
}

async function openPane($: any) {
  const r = await $.ui.open({ id: PANE, title: 'NERV', columns: 46 }).catch(() => undefined)
  paneOpen = !!r?.isPlaced
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
    const unit = home ? await $.fs.read(`${home}/.config/systemd/user/jcode-rail.service`).catch(() => '') : ''
    ramTotal = ((unit || '').match(/JCODE_RAIL_RAM_TOTAL=(\d+)/) || [])[1] || ''
    take(await $.session.usage().catch(() => undefined))
    await $.command
      .register({ name: 'nerv', description: 'Barra NERV: abrir, /nerv quiet para apagarla, /nerv prs para refrescar PRs', argumentHint: '[quiet | on | prs | hw | equipo]', immediate: true })
      .catch(() => undefined)
    await refreshLocal($)
    if (sessionId) await loadRecap($)
    refreshPRs($)
    if (tab === 'hw') refreshHw($)
    if (tab === 'crew') refreshCrew($)
    $.clock.every(125, () => {
      frame++
      if (quiet || !paneOpen) return
      if (tab === 'hw' && frame % 24 === 0) refreshHw($)
      if (tab === 'crew' && frame % 32 === 0) refreshCrew($)
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
      const st = { paneOpen, tab, unverified: unverified.size, patternBlue: patternBlue?.count || 0, confetti: now() < confettiUntil, tasks: [...tasks.values()].map((x) => x.status || 'running'), recap: !!recap }
      return { text: 'nerv debug: ' + JSON.stringify(st) + ' panes=' + JSON.stringify(panes) }
    }
    if (arg === 'prs') {
      await refreshPRs($)
      $.ui.invalidate('ui.render')
      return {}
    }
    if (arg === 'hw' || arg === 'equipo' || arg === 'magi') {
      tab = arg === 'hw' ? 'hw' : arg === 'equipo' ? 'crew' : 'magi'
      await $.store.set('tab', tab).catch(() => undefined)
      if (tab === 'hw') await refreshHw($)
      if (tab === 'crew') await refreshCrew($)
    }
    quiet = false
    await $.store.set('quiet', false).catch(() => undefined)
    await refreshLocal($)
    const r = await openPane($)
    $.ui.invalidate('ui.render')
    return r?.isPlaced ? {} : { text: `NERV: no hay lugar para la barra (${r?.reason || 'terminal angosta'})` }
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
      if (unverified.size) bits.push(Text({ color: C.amber, children: [` · ⚠ ${unverified.size} sin verificar`] }))
      if (patternBlue) bits.push(Text({ color: C.orange, children: [' · ◆ PATTERN BLUE'] }))
      bits.push(Text({ color: C.dim, children: [' · /nerv'] }))
      return Box({ flexDirection: 'column', children: [Text({ wrap: 'truncate', children: bits }), rest] })
    } catch {
      return next(e)
    }
  })
}
