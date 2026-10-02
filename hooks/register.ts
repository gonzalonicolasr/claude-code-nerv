const PANE = 'nerv'
const C = {
  purple: '#8b5cf6',
  violet: '#7b3fb8',
  lime: '#a3e635',
  green: '#8fe645',
  amber: '#f59e0b',
  orange: '#ff7a1a',
  red: '#ef4444',
  pink: '#ff4d6d',
  text: '#ece2fb',
  muted: '#8a73ad',
  dim: '#5b4a75',
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
  none: 0x01000000,
}
const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']
const LONG_TURN_MS = 180000
const BATTERY_AT = 85

let quiet = false
let paneOpen = false
let frame = 0
let working = false
let turnStart = 0
let model = ''
let project = ''
let branch = ''
let home = ''
let paneId = ''
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
let confettiSeed = 0
const agents = new Map<string, { desc: string; start: number; end?: number }>()
let prs: any[] | undefined
let prError = ''
let todos: string[] = []
let health = { ok: true, when: '', text: '' }

const now = () => Date.now()
const base = (p: string) => (p || '').split('/').filter(Boolean).at(-1) || p
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, Math.max(0, n - 1)) + '…' : s)
const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`
}
const heat = (p: number) => (p >= 90 ? C.red : p >= 70 ? C.amber : C.lime)
const bar = (p: number, w: number) => {
  const f = Math.max(0, Math.min(w, Math.round((p / 100) * w)))
  return '━'.repeat(f) + '┈'.repeat(w - f)
}
const blink = () => Math.floor(frame / 4) % 2 === 0

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

const battery = () => {
  const ctx = usage?.context?.percent ?? 0
  const five = pct('five_hour') ?? 0
  return ctx >= BATTERY_AT || five >= BATTERY_AT
}

const ghEnv = async ($: any, cwd: string) => {
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
    prError = 'sin repo de GitHub'
    return
  }
  const r = await $.process
    .run(['gh', 'pr', 'list', '--author', '@me', '--state', 'open', '--limit', '6', '--json', 'number,title,reviewDecision,isDraft,statusCheckRollup'], { cwd, env, timeoutMs: 20000 })
    .catch((err: any) => ({ exitCode: 1, stdout: '', stderr: String(err) }))
  if (r.exitCode !== 0) {
    prError = clip((r.stderr || 'gh falló').split('\n')[0], 60)
    return
  }
  try {
    prs = JSON.parse(r.stdout)
    prError = ''
  } catch {
    prError = 'respuesta de gh ilegible'
  }
}

async function refreshLocal($: any) {
  const cwd = await $.session.cwd().catch(() => '')
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

const rand = (n: number) => {
  const x = Math.sin(n * 12.9898 + confettiSeed) * 43758.5453
  return x - Math.floor(x)
}

const waveCells = (cols: number, rows: number) => {
  const h = rows * 2
  const alert = battery()
  const blue = !!patternBlue
  const speed = working ? 0.45 : 0.12
  const party = now() < confettiUntil
  return cells(cols, rows, (x, y) => {
    if (party) {
      for (let k = 0; k < 18; k++) {
        const px = Math.floor(rand(k) * cols)
        const py = Math.floor((rand(k + 99) * h + frame * (0.5 + rand(k + 7))) % h)
        if (px === x && py === y) return [RGB.lime, RGB.pink, RGB.cyan, RGB.amber, RGB.purple][k % 5]
      }
      return RGB.none
    }
    const amp = (h - 1) / 2
    const w1 = amp + Math.sin(x * 0.32 + frame * speed) * amp * 0.9
    const w2 = amp + Math.sin(x * 0.19 - frame * speed * 0.7 + 1.3) * amp * 0.7
    if (Math.abs(y - w1) < 0.6) return alert ? (blink() ? RGB.red : RGB.pink) : blue ? RGB.orange : RGB.lime
    if (Math.abs(y - w2) < 0.6) return alert ? RGB.amber : RGB.purple
    return RGB.none
  })
}

function draw($: any, e: any) {
  const { Box, Text, Raster } = $.ui.resolve(e)
  const cols = Math.max(20, e.props.bodyColumns || 40)
  const w = cols - 4
  const t = (children: any[], color = C.text, extra: any = {}) => Text({ wrap: 'truncate', color, children, ...extra })
  const span = (s: string, color: string, extra: any = {}) => Text({ color, children: [s], ...extra })
  const card = (key: string, title: string, color: string, rows: any[]) =>
    Box({ key, flexDirection: 'column', borderStyle: 'round', borderColor: color, paddingX: 1, children: [t([span(title, color, { bold: true })], color), ...rows] })

  const out: any[] = []
  const alert = battery()
  out.push(
    t([
      span('NERV ', alert && blink() ? C.red : C.purple, { bold: true }),
      span('ネルフ', C.orange),
      span(' ▸ MAGI ', C.muted),
      span(working ? '◉ OPERANDO' : '◎ EN ESPERA', working ? C.lime : C.muted, { bold: working }),
    ]),
  )
  if (e.surface === 'terminal' && Raster) out.push(Raster({ key: 'wave', columns: cols, rows: 4, cells: waveCells(cols, 4) }))

  const ctx = usage?.context?.percent
  const five = pct('five_hour')
  const seven = pct('seven_day')
  const gw = Math.max(6, w - 14)
  const gauge = (name: string, p: number | undefined) =>
    t([span(name.padEnd(6), C.muted), span(bar(p ?? 0, gw), typeof p === 'number' ? heat(p) : C.dim), span(typeof p === 'number' ? ` ${Math.round(p)}%`.padStart(5) : '   –', C.text)])
  const syncRows = [
    t([span('PILOT ', C.muted), span(clip(model || '?', w - 6), C.text, { bold: true })]),
    gauge('SYNC', ctx),
    gauge('5H', five),
    gauge('7D', seven),
  ]
  if (typeof usage?.cost?.usd === 'number') syncRows.push(t([span('COSTO ', C.muted), span(`US$ ${usage.cost.usd.toFixed(2)}`, C.text)]))
  if (alert) {
    const rem = remaining()
    syncRows.push(t([span(blink() ? '▲ ACTIVE TIME REMAINING' : '△ ACTIVE TIME REMAINING', C.red, { bold: true })]))
    syncRows.push(t([span(rem ? `  ~${mmss(rem)} al ritmo actual` : '  cable umbilical cortado', C.pink)]))
  }
  out.push(card('sync', alert ? '⚠ BATERÍA INTERNA' : '⬢ SINCRONIZACIÓN', alert ? (blink() ? C.red : C.pink) : C.purple, syncRows))

  const act: any[] = []
  if (activity) act.push(t([span('▶ ', C.lime), span(activity.tool + ' ', C.lime, { bold: true }), span(clip(activity.label, w - activity.tool.length - 10), C.text), span(' ' + mmss(now() - activity.start), C.muted)]))
  else if (working) act.push(t([span('◌ pensando ', C.purple), span(mmss(now() - turnStart), C.muted)]))
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

  const live = [...agents.entries()].filter(([, a]) => !a.end || now() - a.end < 600000).slice(-5)
  if (live.length)
    out.push(
      card(
        'agents',
        `◌ SUBAGENTES ${live.filter(([, a]) => !a.end).length}`,
        C.purple,
        live.map(([id, a]) =>
          t([span(a.end ? '✔ ' : '◌ ', a.end ? C.lime : C.purple), span(clip(a.desc, w - 10), a.end ? C.muted : C.text), span(' ' + mmss((a.end || now()) - a.start), C.muted)]),
        ),
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
      const ci = !checks.length ? ['·', C.dim] : failed ? ['✖', C.red] : pending ? ['◌', C.amber] : ['●', C.lime]
      const rv =
        p.reviewDecision === 'APPROVED' ? ['✔', C.lime] : p.reviewDecision === 'CHANGES_REQUESTED' ? ['✎', C.red] : p.isDraft ? ['◇', C.dim] : ['◌', C.amber]
      prRows.push(t([span(`#${p.number} `, C.muted), span(rv[0] + ' ', rv[1]), span(ci[0] + ' ', ci[1]), span(clip(p.title, w - 10), p.isDraft ? C.muted : C.text)]))
    }
  out.push(card('prs', `⎇ PRs${branch ? ' · ' + clip(branch, w - 10) : ''}`, C.violet, prRows))

  if (todos.length)
    out.push(card('todos', `□ ${todos.length} TO-DO${todos.length > 1 ? 'S' : ''}`, C.amber, todos.slice(0, 4).map((x) => t([span('□ ' + clip(x, w - 2), '#f0c987')]))))

  if (health.when)
    out.push(
      t([
        span(health.ok ? '♥ ' : '✖ ', health.ok ? C.lime : C.red),
        span(clip(health.text, w - 10), health.ok ? C.muted : C.red),
        span(' ' + health.when, C.dim),
      ]),
    )
  out.push(t([span('/nerv quiet · /nerv prs', C.dim)]))
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
    quiet = (await $.store.get('quiet').catch(() => false)) === true
    take(await $.session.usage().catch(() => undefined))
    await $.command
      .register({ name: 'nerv', description: 'Barra NERV: abrir, /nerv quiet para apagarla, /nerv prs para refrescar PRs', argumentHint: '[quiet | on | prs]', immediate: true })
      .catch(() => undefined)
    refreshLocal($)
    refreshPRs($)
    $.clock.every(125, () => {
      frame++
      if (quiet || !paneOpen) return
      if (working || battery() || patternBlue || now() < confettiUntil || frame % 8 === 0) $.ui.invalidate('ui.render')
    })
    $.clock.every(20000, () => {
      if (!quiet) refreshLocal($)
    })
    $.clock.every(180000, () => {
      if (!quiet) refreshPRs($)
    })
    if (!quiet) await openPane($)
    return r
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
      const st = { paneOpen, unverified: unverified.size, patternBlue: patternBlue?.count || 0, confetti: now() < confettiUntil, agents: agents.size }
      return { text: 'nerv debug: ' + JSON.stringify(st) + ' panes=' + JSON.stringify(panes) }
    }
    if (arg === 'prs') {
      await refreshPRs($)
      $.ui.invalidate('ui.render')
      return {}
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
      const a = agents.get(e.agentId)
      if (a && !a.end) a.end = now()
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
    if (r?.agentId) agents.set(r.agentId, { desc: e.description || e.subagentType || 'subagente', start: now() })
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
    if (e.tool === 'Bash' && !r?.isReadOnly) {
      unverified.clear()
      const key = String(e.command || '').slice(0, 60)
      if (r?.isError) failedCmds.add(key)
      else if (failedCmds.delete(key)) {
        confettiUntil = now() + 2500
        confettiSeed = Math.random() * 1000
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
    const hex = ['⬡', '⬢'][Math.floor(frame / 3) % 2]
    const doing = activity ? ` · ${activity.tool} ${mmss(now() - activity.start)}` : ''
    return next({ ...e, props: { ...e.props, suffix: `${e.props.suffix || ''} ${hex} SYNC ${sync.toFixed(1)}%${doing}` } })
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
