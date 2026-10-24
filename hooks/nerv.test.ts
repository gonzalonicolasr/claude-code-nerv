import { expect, test, mock } from 'claude-code/testing'
import { CHAT_ROWS, chatLines, chatScroll, effortShownIn, g0nShownIn, liveChat, liveViewers, wrapCells, acctFor, cpamSig, cxCalls, cxEvent, cxHits, cxPromptKey, cxTally, cxTool, liveBattery, liveDc, liveLens, mdlDim, mdlFilter, mdlGroups, mdlLaunchCmd, mdlSplit, keepFlags, promptDraft, missionNotify, missionWindow, priv8Pick, transcriptPath, cpamContexts, acctBadge, ctxTotal, ctxGauge, shortModel, fitSegs, cellWidth, kfmt, eddParse, eddStory, eddCounts, eddActiveSlug } from './register'

const state = async ($: any) => {
  const r = await $.command.run({ command: 'nerv', args: 'debug' })
  return JSON.parse(r.text.replace(/^nerv debug: /, '').replace(/ panes=.*$/, ''))
}

test('editar marca archivos sin verificar y correr un comando los limpia', async ($, on) => {
  on('tool.call', { tool: 'Write' }, () => ({ result: { type: 'create' } }))
  on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: 'ok', stderr: '', interrupted: false } }))
  await $.tool.call({ tool: 'Write', file_path: '/tmp/a.txt', content: 'x' })
  await $.tool.call({ tool: 'Write', file_path: '/tmp/b.txt', content: 'y' })
  expect((await state($)).unverified).toBe(2)
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  expect((await state($)).unverified).toBe(0)
})

test('el mismo error tres veces seguidas prende PATTERN BLUE', async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ isError: true, result: 'cat: /nerv-no-existe: No such file', text: 'cat: /nerv-no-existe: No such file' }))
  for (let i = 0; i < 3; i++) await $.tool.call({ tool: 'Bash', command: 'cat /nerv-no-existe' })
  expect((await state($)).patternBlue).toBeGreaterThanOrEqual(3)
})

test('un comando que fallaba y ahora pasa tira confeti', async ($, on) => {
  const f = '/tmp/nerv-flag'
  let exists = false
  on('tool.call', { tool: 'Bash' }, (_$: any, e: any) => {
    if (e.command.startsWith('touch')) exists = true
    return exists ? { result: { stdout: '', stderr: '', interrupted: false } } : { isError: true, result: 'exit 1', text: 'Exit code 1' }
  })
  await $.tool.call({ tool: 'Bash', command: `test -f ${f}` })
  expect((await state($)).confetti).toBe(false)
  await $.tool.call({ tool: 'Bash', command: `touch ${f} && test -f ${f}` })
  await $.tool.call({ tool: 'Bash', command: `test -f ${f}` })
  expect((await state($)).confetti).toBe(true)
})

test('la barra dibuja la tríada MAGI, las pestañas y el medidor de effort abajo', async ($) => {
  const m: any = await ($ as any).ui.mount({
    plugin: 'nerv',
    surface: 'terminal',
    component: 'Pane',
    requestId: 'nerv',
    props: { title: 'NERV', isFocused: false, bodyColumns: 44, placement: 'dock', scroll: { offset: 0, bodyRows: 40, contentRows: 40 }, view: {} },
  })
  const text = JSON.stringify(await m.drawn())
  expect(text).toContain('メルキオール')
  expect(text).toContain('EFFORT')
  expect(text).toContain('MAGI')
  expect(await m.find({ key: 'effort-foot' })).toBeDefined()
  await m.press({ key: 'tab-hw' })
  expect(JSON.stringify(await m.drawn())).toContain('◆ HW')
})

const PANE_PROPS = { title: 'NERV', isFocused: false, bodyColumns: 44, placement: 'dock', scroll: { offset: 0, bodyRows: 60, contentRows: 60 }, view: {} }

test('/nerv tema cambia la paleta del dibujo y la deja en theme.json', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  const files: Record<string, string> = {}
  on('fs.write', async (_$: any, e: any) => {
    files[e.path] = e.text
    return { value: undefined }
  })
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  const bad: any = await $.command.run({ command: 'nerv', args: 'tema eva99' })
  expect(bad.text).toContain('uso: /nerv tema')
  const ok: any = await $.command.run({ command: 'nerv', args: 'tema eva02' })
  expect(ok.text).toBe('NERV: unidad EVA-02')
  expect(JSON.parse(files['/h/.local/state/nerv/theme.json']).colors.purple).toBe('#ef4444')
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  const drawn = JSON.stringify(await m.drawn())
  expect(drawn).toContain('#ef4444')
  expect(drawn).not.toContain('#8b5cf6')
  await m.press({ key: 'theme-eva00' })
  expect(JSON.parse(files['/h/.local/state/nerv/theme.json']).theme).toBe('eva00')
  expect(JSON.stringify(await m.drawn())).toContain('#3b82f6')
})

test('la pestaña FORGE dibuja el run y sus botones mandan /forge', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  const state = {
    profile: 'barato',
    profiles: { barato: { builtin: true, source: 'forge' }, turbo: { builtin: true, source: 'forge' }, 'zero:solo-gemini': { builtin: true, source: 'zero-pi' } },
    efforts: { explore: 'low', plan: 'medium', build: 'medium', veredicto: 'high' },
    effortLevels: ['auto', 'off', 'minimal', 'low', 'medium', 'high', 'xhigh'],
    effortNotes: { explore: '', plan: '', build: '', veredicto: '' },
    labels: { 'ag3/gemini-3.7-flash-high': 'Gemini 3.7 Flash', 'prolite/gpt-6-luna': 'GPT 6.0 Luna' },
    groupLabels: { claude: 'Claude Code (tu plan)', ag3: 'ag3 · Gemini', prolite: 'prolite · GPT' },
    models: { explore: 'ag3/gemini-3.7-flash-high', plan: 'ag3/gemini-3.7-flash-high', build: 'personal/claude-sonnet-5-5', veredicto: 'prolite/gpt-5.6-terra' },
    mode: 'automatic',
    cap: 3,
    catalog: { claude: ['haiku', 'sonnet', 'opus'], ag3: ['ag3/gemini-3.7-flash-high'], prolite: ['prolite/gpt-5.6-terra', 'prolite/gpt-6-luna'] },
    run: {
      status: 'running',
      request: 'agregá suma',
      slug: 'agrega-suma',
      round: 1,
      cap: 3,
      phase: 'build',
      startedAt: 0,
      phases: [
        { name: 'explore', status: 'done', model: 'ag3/gemini-3.7-flash-high', responded: 'gemini-3.7-flash', ms: 1000, tokensIn: 1200, tokensOut: 300, steps: 4 },
        { name: 'plan', status: 'done', model: 'ag3/gemini-3.7-flash-high', responded: 'gemini-3.7-flash', ms: 2000, tokensIn: 1, tokensOut: 1, steps: 2 },
        { name: 'build', status: 'running', model: 'ag3/gemini-3.7-flash-high', responded: '', ms: 0, startedAt: 0, tokensIn: 0, tokensOut: 0, steps: 0 },
        { name: 'veredicto', status: 'pending', model: 'prolite/gpt-5.6-terra', responded: '', ms: 0, tokensIn: 0, tokensOut: 0, steps: 0 },
      ],
      verdicts: [],
    },
  }
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/h/.local/state/forge/state.json' ? JSON.stringify(state) : '' }))
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  const sent: string[] = []
  on('command.run', { command: 'forge' }, async (_$: any, e: any) => {
    sent.push(e.args)
    return {}
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'forge' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  const drawn = JSON.stringify(await m.drawn())
  for (const s of ['ENTRY PLUG', 'EXPLORE', 'VEREDICTO', 'OPERANDO', 'R 1/3', 'Gemini 3.7 Flash · ag3', 'Claude Sonnet 5.5 ▾', 'personal']) expect(drawn).toContain(s)
  await m.press({ key: 'profile-turbo' })
  expect(drawn).not.toContain('ddp-fmodel-veredicto-')
  await m.press({ key: 'ddh-fmodel-veredicto' })
  const opened = JSON.stringify(await m.drawn())
  const luna = opened.match(/"key":"(ddp-fmodel-veredicto-\d+)","label":"GPT 6.0 Luna"/)?.[1]
  expect(luna).toBeDefined()
  await m.press({ key: luna })
  expect(JSON.stringify(await m.drawn())).not.toContain('ddp-fmodel-veredicto-')
  await m.press({ key: 'ddh-fmodel-plan' })
  expect(JSON.stringify(await m.drawn())).toContain('ddp-fmodel-plan-')
  expect(JSON.stringify(await m.drawn())).toContain('cuentas · ag3 · Gemini')
  await m.press({ key: 'ddg-back-plan' })
  expect(JSON.stringify(await m.drawn())).toContain('ddg-fmodel-plan-')
  await m.press({ key: 'ddh-fmodel-plan' })
  expect(JSON.stringify(await m.drawn())).not.toContain('ddg-fmodel-plan-')
  await m.press({ key: 'ddh-feffort-explore' })
  await m.press({ key: 'fe-explore-high' })
  await m.press({ key: 'profile-zero:solo-gemini' })
  await m.press({ key: 'fcap-up' })
  await m.press({ key: 'fstop' })
  expect(sent).toEqual(['profile turbo', 'model veredicto prolite/gpt-6-luna', 'effort explore high', 'profile zero:solo-gemini', 'cap 4', 'stop'])
})

test('FORGE separa fábrica, míos y zero-pi, y sus botones crean, restauran y borran perfiles', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  const state: any = {
    profile: 'barato',
    profiles: {
      barato: { builtin: true, modified: true, source: 'forge' },
      turbo: { builtin: true, modified: false, source: 'forge' },
      mio: { builtin: false, modified: false, source: 'forge' },
      'zero:solo-claude': { builtin: false, modified: false, source: 'zero-pi' },
    },
    efforts: {},
    effortLevels: ['auto', 'low', 'high'],
    effortNotes: {},
    models: { explore: 'ag3/gemini-3.7-flash-high', plan: 'opus', build: 'opus', veredicto: 'opus' },
    phaseOrder: ['explore', 'plan', 'build', 'veredicto'],
    mode: 'automatic',
    cap: 3,
    catalog: { claude: ['haiku', 'sonnet', 'opus', 'fable'] },
    run: null,
  }
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/h/.local/state/forge/state.json' ? JSON.stringify(state) : '' }))
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  const asked: string[] = []
  const answers = ['Prueba X', 'Cancelar', 'Borrar']
  on('tool.call', { tool: 'AskUserQuestion' }, async (_$: any, e: any) => {
    asked.push(e.questions[0].question)
    const a = answers.shift()
    return { result: { questions: e.questions, answers: { [e.questions[0].question]: a } } }
  })
  const sent: string[] = []
  on('command.run', { command: 'forge' }, async (_$: any, e: any) => {
    sent.push(e.args)
    return { text: 'ok' }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'forge' })
  for (const props of [PANE_PROPS, { ...PANE_PROPS, placement: 'band', scroll: { offset: 0, bodyRows: 0, contentRows: 0 } }]) {
    const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props })
    const drawn = JSON.stringify(await m.drawn())
    const at = (x: string) => drawn.indexOf(x)
    for (const x of ['FÁBRICA', 'MÍOS', 'ZERO-PI · UN MODELO', '★ modificado', '● barato ★', '"label":"turbo"', '+ nuevo', '↺ restaurar']) expect(drawn).toContain(x)
    expect(at('FÁBRICA') < at('MÍOS') && at('MÍOS') < at('ZERO-PI')).toBe(true)
    expect(at('"label":"mio"') > at('MÍOS') && at('"label":"mio"') < at('ZERO-PI')).toBe(true)
    expect(drawn).not.toContain('fp-delete')
    await m.unmount()
  }
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await m.press({ key: 'fp-reset' })
  await m.press({ key: 'fp-new' })
  await m.press({ key: 'fp-new' })
  state.profile = 'mio'
  await m.press({ key: 'profile-mio' })
  const mine = JSON.stringify(await m.drawn())
  expect(mine).toContain('perfil tuyo')
  expect(mine).not.toContain('fp-reset')
  await m.press({ key: 'fp-delete' })
  expect(asked.length).toBe(3)
  expect(asked[2]).toContain('¿Borrar el perfil mio?')
  expect(sent).toEqual(['profile reset barato', 'profile new Prueba X', 'profile mio', 'profile delete mio'])
  state.profile = 'zero:solo-claude'
  await m.press({ key: 'profile-zero:solo-claude' })
  expect(JSON.stringify(await m.drawn())).toContain('~/.pi/zero.json')
  state.profile = 'custom'
  await m.press({ key: 'profile-turbo' })
  const none = JSON.stringify(await m.drawn())
  expect(none).toContain('sin perfil')
  expect(none).toContain('fp-new-top')
})

test('la pestaña NODD muestra el estado del mod y sus botones mandan /nodd', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  const state = {
    version: '0.1.0',
    enabled: true,
    gates: [
      { id: 'classify', enabled: true, enforcedInClaudeCode: true },
      { id: 'promotion', enabled: false, enforcedInClaudeCode: false },
    ],
    declaration: { slug: 'chau-txt', intent: 'change', route: 'inline' },
    lastRefusal: { gate: 'classify', reason: 'nodd/classify: no hay declaración', at: '2026-10-03T05:00:00Z' },
    counters: { toolCalls: 3, filesRead: 0, filesWritten: 1, delegations: 0, refusals: 1, agents: 0 },
  }
  on('session.id', async () => ({ value: 's1' }))
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/h/.local/state/nodd/sessions/s1.json' ? JSON.stringify(state) : '' }))
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  const sent: string[] = []
  on('command.run', { command: 'nodd' }, async (_$: any, e: any) => {
    sent.push(e.args)
    return {}
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'nodd' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  const drawn = JSON.stringify(await m.drawn())
  for (const x of ['PRENDIDO', 'chau-txt', 'classify', 'sólo en pi', '3 calls']) expect(drawn).toContain(x)
  await m.press({ key: 'nodd-off' })
  await m.press({ key: 'ngate-promotion' })
  await m.press({ key: 'ngate-classify' })
  expect(sent).toEqual(['off', 'gate promotion on', 'gate classify off'])
})

test('clickear un nivel del medidor fija ese effort y clickearlo de nuevo lo suelta', async ($) => {
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await m.press({ key: 'eff-low' })
  const fixed = JSON.stringify(await m.drawn())
  expect(fixed).toContain('fijado')
  expect(fixed).toContain(' LOW ')
  await m.press({ key: 'eff-low' })
  expect(JSON.stringify(await m.drawn())).not.toContain('fijado')
})

test('el cierre del turno y los avisos de recarga se dibujan cortos', async ($) => {
  const turn: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'TurnDuration', requestId: 't', props: { word: 'Churned', durationMs: 188000 } })
  const t = JSON.stringify(await turn.drawn())
  expect(t).toContain('完了')
  expect(t).toContain('3 min 8 s')
  const note: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'InfoNotice', requestId: 'n', props: { text: 'forge: plugin.json changed — reloaded (11 hooks: session.start)', command: null } })
  expect(JSON.stringify(await note.drawn())).toContain('↻ forge recargado')
})

test('las respuestas abren con un rombo del tema y conservan su markdown', async ($) => {
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'AssistantMessage', requestId: 'a', props: { text: '**hola** y `código`', isFirstOfReply: true } })
  const d = JSON.stringify(await m.drawn())
  expect(d).toContain('◆')
  expect(d).toContain('**hola** y `código`')
})

test('las tools se dibujan con los glifos del tema y el grupo resume en castellano', async ($) => {
  const bash: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'ToolUse', requestId: 'b', props: { tool: 'Bash', input: { command: 'echo uno', description: 'Probar eco' }, isRunning: false, isErrored: false, isInterrupted: false } })
  const b = JSON.stringify(await bash.drawn())
  for (const x of ['◇ ', 'Probar eco', '$ echo uno']) expect(b).toContain(x)
  const bad: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'ToolUse', requestId: 'r', props: { tool: 'Read', input: { file_path: '/x/a.md' }, isRunning: false, isErrored: true, isInterrupted: false } })
  expect(JSON.stringify(await bad.drawn())).toContain('✖ ')
  const group: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'ToolGroup', requestId: 'g', props: { isActive: false, isExpanded: false, calls: [{ tool: 'Read', input: {}, isRunning: false, isErrored: false, isInterrupted: false }, { tool: 'Read', input: {}, isRunning: false, isErrored: false, isInterrupted: false }, { tool: 'Bash', input: {}, isRunning: false, isErrored: false, isInterrupted: false }] } })
  expect(JSON.stringify(await group.drawn())).toContain('2 lecturas · 1 comando')
})

test('la notificacion de escritorio lleva icono, colores del tema y escapa el proyecto', async () => {
  const c = { orange: '#ff7a1a', amber: '#f59e0b', lime: '#a3e635' }
  const pend = missionNotify('/m', 'a<b>&c', '2:31', 2, c)
  expect(pend.slice(0, 6)).toEqual(['notify-send', '-a', 'NERV', '-i', '/m/assets/mission-complete.png', 'MISSION COMPLETE'])
  expect(pend[6]).toContain('<b>a&lt;b&gt;&amp;c</b>')
  expect(pend[6]).toContain('<font color="#ff7a1a">⏱ 2:31</font>')
  expect(pend[6]).toContain('<font color="#f59e0b"><b>⚠ 2 sin verificar</b></font>')
  expect(missionNotify('/m', 'auno', '0:45', 0, c)[6]).toContain('<font color="#a3e635">✓ verificado</font>')
})

test('la ventana de MISSION COMPLETE se abre por el shell de Omarchy con el resumen en JSON', () => {
  const argv = missionWindow('eco', '4:12', 2)
  expect(argv.slice(0, 4)).toEqual(['omarchy-shell', 'shell', 'summon', 'gon.nerv-mission'])
  expect(JSON.parse(argv[4])).toEqual({ project: 'eco', took: '4:12', unverified: 2 })
})

test('sin foco en herdr la barra se duerme y al volver el foco despierta', async ($, on) => {
  mock.env(on, { HOME: '/h', HERDR_PANE_ID: 'w1:p1' })
  mock.store(on)
  const clock = mock.clock(on)
  let focused = false
  const asked: string[][] = []
  on('process.run', async (_$: any, e: any) => {
    if (e.argv[0] !== 'herdr') return { value: { exitCode: 1, stdout: '', stderr: '' } }
    asked.push(e.argv)
    return { value: { exitCode: 0, stdout: JSON.stringify({ result: { pane: { pane_id: 'w1:p1', focused } } }), stderr: '' } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  expect((await state($)).away).toBe(false)
  await clock.advance(2000)
  expect(asked.some((a) => a.join(' ') === 'herdr pane get w1:p1')).toBe(true)
  expect((await state($)).away).toBe(true)
  focused = true
  await clock.advance(2000)
  expect((await state($)).away).toBe(false)
})

test('la cuenta de Cortex separa los workspaces', () => {
  const hint = cxEvent({ ts: '2026-10-09T10:52:35', kind: 'hint', workspace: 'personal', session: 's1', ids: [406, 3113, 7], titles: ['Mouse/cursor frizado en Hyprland con NVIDIA', 'Otra'] })
  const tally = cxTally([
    hint,
    cxEvent({ kind: 'context', workspace: 'wibond', ids: [1, 2] }),
    cxEvent({ kind: 'tool', tool: 'mcp__cortex__memoria_search', ids: [] }),
    cxEvent({ kind: 'tool', tool: 'memoria_update', ids: [5] }),
    cxEvent({ kind: 'nudge', workspace: 'wibond', tools: 30 }),
  ])
  expect(tally.personal).toEqual({ brought: 3, reads: 1, saves: 1, nudges: 0 })
  expect(tally.wibond).toEqual({ brought: 2, reads: 0, saves: 0, nudges: 1 })
})

test('CORTEX lee el registro de cortex-recall en tandas y no tira toasts', async ($, on) => {
  mock.env(on, { HOME: '/h', CORTEX_RECALL_EVENTS: '/x/events.jsonl' })
  mock.store(on)
  const clock = mock.clock(on)
  const toasts: string[] = []
  on('ui.toast', async (_$: any, e: any) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('session.id', async () => ({ value: 's1' }))
  const line = (o: any) => JSON.stringify({ ts: '2026-10-09T10:50:00', workspace: 'personal', project: 'nerv', session: 's1', ...o })
  let size = 200
  let out = ['2026-10-09', `1\t${line({ kind: 'context', ids: [1, 2, 3], titles: ['a', 'b', 'c'] })}`, `2\t${line({ kind: 'tool', tool: 'memoria_search', ids: [], title: 'algo' })}`, '2']
  const awk: string[][] = []
  on('fs.stat', async (_$: any, e: any) => {
    if (e.path !== '/x/events.jsonl') throw new Error('ENOENT')
    return { value: { kind: 'file', size, mtimeMs: size, isLink: false } }
  })
  on('fs.read', async () => ({ value: '' }))
  on('process.run', async (_$: any, e: any) => {
    if (e.argv[0] !== 'sh' || e.argv.at(-1) !== '/x/events.jsonl') return { value: { exitCode: 1, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    awk.push(e.argv.slice(3))
    return { value: { exitCode: 0, stdout: out.join('\n') + '\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  expect(awk[0]).toEqual(['sh', '1', '1', '/x/events.jsonl'])
  expect(toasts.filter((x) => x.includes('CORTEX'))).toEqual([])
  size = 500
  out = [
    '2026-10-09',
    `3\t${line({ ts: '2026-10-09T10:52:35', kind: 'hint', ids: [406, 3113], titles: ['Mouse/cursor frizado', 'Otra cosa'] })}`,
    `4\t${line({ ts: '2026-10-09T10:53:00', kind: 'tool', tool: 'memoria_save', session: 'otra', ids: [4001], title: 'De otra sesión' })}`,
    `5\t${line({ ts: '2026-10-09T10:54:00', kind: 'tool', tool: 'memoria_save', workspace: 'wibond', ids: [4002], title: 'Gotcha de Delta' })}`,
    `6\t{"ts": "2026-10-09T10:5`,
    '6',
  ]
  await clock.advance(3000)
  expect(awk.at(-1)).toEqual(['sh', '3', '0', '/x/events.jsonl'])
  expect(toasts.filter((x) => x.includes('CORTEX'))).toEqual([])
  size = 600
  out = ['2026-10-09', '6']
  await clock.advance(3000)
  expect(awk.at(-1)).toEqual(['sh', '6', '0', '/x/events.jsonl'])
  await $.command.run({ command: 'nerv', args: 'cortex' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  const drawn = JSON.stringify(await m.drawn())
  expect(drawn).toContain('ACTIVIDAD · HOY')
  expect(drawn).toContain('WIBOND')
  expect(drawn).toContain('LO ÚLTIMO')
  expect(drawn).toContain('#4002')
  expect(drawn).toContain('Gotcha de Delta')
})

test('Cortex reconoce sus tools, las líneas del hook y las memorias de cada salida', () => {
  expect(cxTool('mcp__cortex__memoria_search')).toBe('memoria_search')
  expect(cxTool('mcp__cortex-wibond__memoria_get')).toBe('memoria_get')
  expect(cxTool('mcp__eco__search')).toBeUndefined()
  expect(cxPromptKey('que es\n  muonline ?')).toBe('que es muonline ?')
  const search = '🔎 Cortex · 2 resultados · "muonline"\n\n⚙️ #868 · config · gon · 2026-07-11 · kw\n   OlympusMU desplegado en hosting del cliente\n   Desplegué…\n\n📋 #3365 · session_summary · gon · 2026-10-08 · kw+sem .85\n   Contexto de la ultima compactacion (gon)'
  expect(cxHits(search)).toEqual([
    { id: 868, type: 'config', project: 'gon', workspace: '', title: 'OlympusMU desplegado en hosting del cliente' },
    { id: 3365, type: 'session_summary', project: 'gon', workspace: '', title: 'Contexto de la ultima compactacion (gon)' },
  ])
  expect(cxHits('🎯 Cortex · 1 caso parecido\n\n🐛 #4012 [wibond] · bug_fix · balance-investment-v2 · 2026-09-20 · kw+sem .88\n   CashIn duplicado por reintento')).toEqual([{ id: 4012, type: 'bug_fix', project: 'balance-investment-v2', workspace: 'wibond', title: 'CashIn duplicado por reintento' }])
  expect(cxHits([{ type: 'text', text: '⚙️ #868 · config · gon · 2026-07-11\ntitle: OlympusMU desplegado\nwhat: x' }])).toEqual([{ id: 868, type: 'config', project: 'gon', workspace: '', title: 'OlympusMU desplegado' }])
  expect(cxHits('⚡ Cortex · 2 hints\n💡 #925 Entrega de premios MU rota: web usa GremoryCase (0.39) · kw\n📋 #3365 [telecom] Contexto de la ultima compactacion (gon) (0.42) · kw+sem .86')).toEqual([
    { id: 925, type: 'discovery', project: '', workspace: '', title: 'Entrega de premios MU rota: web usa GremoryCase' },
    { id: 3365, type: 'session_summary', project: '', workspace: 'telecom', title: 'Contexto de la ultima compactacion (gon)' },
  ])
  const got = cxCalls([
    { tool: 'mcp__cortex__memoria_search', input: { query: 'muonline' }, output: search },
    { tool: 'mcp__cortex__memoria_search', input: { query: 'muonline' }, output: search },
    { tool: 'mcp__cortex__memoria_projects', input: {}, output: '📁 Cortex · 134 proyectos' },
    { tool: 'mcp__cortex__memoria_save', input: { title: 'Webhook WhatsApp', type: 'lesson', project: 'nerv' }, output: [{ type: 'text', text: '✅ Cortex saved #4107 · 🎓 lesson · nerv' }] },
    { tool: 'Read', input: { file_path: '/x' } },
  ])
  expect(got.verbs).toEqual(['buscó «muonline» ×2', 'listó proyectos', 'guardó en nerv'])
  expect(got.read.map((h) => h.id)).toEqual([868, 3365])
  expect(got.saved).toEqual([{ id: 4107, type: 'lesson', project: 'nerv', workspace: '', title: 'Webhook WhatsApp' }])
})

test('el chat dibuja la actividad de Cortex como tarjeta NERV', async ($, on) => {
  on('ui.render', { component: 'UserMessage' }, (_$: any, e: any) => _$.ui.resolve(e).Text({ children: [String(e.props.text)] }))
  mock.env(on, { HOME: '/h', CORTEX_RECALL_EVENTS: '/x/events.jsonl' })
  mock.store(on)
  on('session.id', async () => ({ value: 's1' }))
  const line = (o: any) => JSON.stringify({ ts: '2026-10-09T11:40:00', workspace: 'personal', project: 'gon', session: 's1', ...o })
  const out = [
    '2026-10-09',
    `1\t${line({ kind: 'context', ids: [3365, 3983, 1, 2, 3, 4, 5], titles: ['Contexto de la ultima compactacion', 'DroidCam no llega a la PC', 'c', 'd', 'e', 'f', 'g'], types: ['session_summary', 'bug_fix'], projects: ['gon', 'gon'] })}`,
    `2\t${line({ ts: '2026-10-09T11:41:00', kind: 'hint', ids: [925, 4012], titles: ['Entrega de premios MU rota', 'CashIn duplicado'], types: ['discovery', 'bug_fix'], projects: ['sourceathenas', 'balance-investment-v2'], workspaces: ['', 'wibond'], prompt: 'que es muonline ?' })}`,
    '2',
  ]
  on('fs.stat', async (_$: any, e: any) => {
    if (e.path !== '/x/events.jsonl') throw new Error('ENOENT')
    return { value: { kind: 'file', size: 300, mtimeMs: 300, isLink: false } }
  })
  on('fs.read', async () => ({ value: '' }))
  on('process.run', async (_$: any, e: any) => {
    if (e.argv[0] !== 'sh' || e.argv.at(-1) !== '/x/events.jsonl') return { value: { exitCode: 1, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    return { value: { exitCode: 0, stdout: out.join('\n') + '\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  let n = 0
  const mount = async (component: string, props: any) => JSON.stringify(await (await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component, requestId: `${component}-${++n}`, props })).drawn())
  const first = await mount('UserMessage', { text: 'que es\nmuonline ?', origin: 'user', isExpanded: false })
  expect(first).toContain('cargó 7 memorias de gon')
  expect(first).toContain('DroidCam no llega a la PC')
  expect(first).toContain('+ 2 más')
  expect(first).toContain('trajo 2 memorias para este pedido')
  expect(first).toContain('[wibond]')
  expect(first).toContain('Entrega de premios MU rota')
  expect(first).toContain('sourceathenas')
  expect(first).toContain('round')
  const second = await mount('UserMessage', { text: 'otra cosa', origin: 'user', isExpanded: false })
  expect(second).toContain('otra cosa')
  expect(second).not.toContain('CORTEX')
  const group = await mount('ToolGroup', {
    isActive: false,
    isExpanded: false,
    calls: [
      { tool_use_id: 't1', tool: 'ToolSearch', input: { query: 'select:mcp__cortex__memoria_search' }, isRunning: false, isErrored: false, isInterrupted: false },
      { tool_use_id: 't2', tool: 'mcp__cortex__memoria_search', input: { query: 'muonline' }, isRunning: false, isErrored: false, isInterrupted: false, output: [{ type: 'text', text: '⚙️ #868 · config · gon · 2026-07-11 · kw\n   OlympusMU desplegado' }] },
    ],
  })
  expect(group).toContain('1 tool cargada')
  expect(group).toContain('buscó «muonline»')
  expect(group).toContain('OlympusMU desplegado')
})

test('EN VIVO muestra GO LIVE, el chat y las dos cámaras, sin micrófono ni EFFORT, y sus botones lanzan los overlays', async ($, on) => {
  mock.env(on, { HOME: '/h', XDG_RUNTIME_DIR: '/r' })
  mock.store(on)
  const launched: string[][] = []
  const clock = mock.clock(on)
  on('process.run', async (_$: any, e: any) => {
    const argv: string[] = e.argv
    if (argv[0] === 'setsid') launched.push(argv.slice(2))
    if (argv[0] === 'bash' && argv.includes('nerv-live'))
      return {
        value: {
          exitCode: 0,
          stderr: '',
          stdout: [
          'cam\ton\t1920\t1080\t30.000\t12.5',
          'ip\ton\t1024\t768\t29.97\t8',
          'ipstate\tcamera\tcafe\t1',
          'text\twww.cortexmem.com',
          'dc\t' + JSON.stringify({ ch: 'general', g: 'NERV HQ', n: 12, m: [{ name: 'gon', self: true, speaking: true, mute: false, deaf: false, streaming: true }, { name: 'rei', self: false, speaking: false, mute: true, deaf: false, streaming: false }], live: true, vc: 9, v: ['asuka', 'shinji'] }),
          'discord\t1',
          'ipapi\t"iPhone de Gon"\t{"level":87,"charging":true}\t{"active":1,"cameras":["Wide","Ultrawide"]}',
          ].join('\n'),
        },
      }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/r/nerv-discord.json' ? JSON.stringify({ chat: { ch: '1', m: [{ a: 'asuka', t: 'hola desde el canal', ts: 1, self: false }, { a: 'gon', t: 'buenas', ts: 2, self: true }] } }) : '' }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'vivo' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: { ...PANE_PROPS, scroll: { offset: 0, bodyRows: 200, contentRows: 200 } } })
  const drawn = JSON.stringify(await m.drawn())
  for (const x of ['EN VIVO', 'STREAMCAM · en vivo', '30 fps', 'cpu 13%', 'IPHONE · tapado (cafe)', 'Ultrawide', '87%', 'GO LIVE · 9 mirándote', 'asuka, shinji +7 más', 'CHAT DEL CANAL', 'hola desde el canal', 'buenas']) expect(drawn).toContain(x)
  for (const x of ['gon (vos)', 'rei', 'mudo', 'en el canal', 'NERV HQ', 'DISCORD', 'g0n-img', 'SILENCIADO', 'AL AIRE', 'live-mic', 'effort-foot', 'EFFORT']) expect(drawn).not.toContain(x)
  expect(drawn.indexOf('GO LIVE')).toBeLessThan(drawn.indexOf('CHAT DEL CANAL'))
  expect(drawn.indexOf('CHAT DEL CANAL')).toBeLessThan(drawn.indexOf('STREAMCAM'))
  expect(drawn.indexOf('hola desde el canal')).toBeLessThan(drawn.indexOf('buenas'))
  await m.press({ key: 'live-cam-tg' })
  await m.press({ key: 'live-ip-priv' })
  await clock.advance(2000)
  expect(launched).toContainEqual(['/h/.local/bin/camoverlay'])
  expect(launched).toContainEqual(['/h/.local/bin/iphonecam', '--scene', 'cafe'])
})

test('EN VIVO entiende la batería y el lente que manda DroidCam en varias formas', () => {
  expect(liveBattery('{"level":87,"charging":true}')).toEqual({ bat: 87, charging: true })
  expect(liveBattery('{"battery":0.42}')).toEqual({ bat: 42, charging: false })
  expect(liveBattery('basura')).toEqual({ bat: -1, charging: false })
  expect(liveLens('{"active":1,"cameras":[{"name":"Wide"},{"name":"Ultrawide"}]}')).toBe('Ultrawide')
  expect(liveLens('{"active":3}')).toBe('lente 3')
  expect(liveLens('')).toBe('')
})

test('YOUTUBE: el + sin nada sonando pone sólo ese tema, una vez, con un solo reproductor', async ($, on) => {
  mock.env(on, { HOME: '/h', XDG_RUNTIME_DIR: '/r' })
  mock.store(on)
  const clock = mock.clock(on)
  const launched: string[][] = []
  const sent: string[] = []
  on('process.run', async (_$: any, e: any) => {
    const argv: string[] = e.argv
    if (argv[0] === 'setsid') launched.push(argv.slice(2))
    if (argv[0] === 'socat') sent.push(String(e.stdin || ''))
    if (argv[0] === 'yt-dlp' && argv.includes('--flat-playlist'))
      return { value: { exitCode: 0, stderr: '', stdout: JSON.stringify({ entries: ['aaaaaaa', 'bbbbbbb', 'ccccccc'].map((id) => ({ id, title: 'tema ' + id, duration: 60 })) }) } }
    if (argv[0] === 'yt-dlp' && argv.includes('-g')) return { value: { exitCode: 0, stderr: '', stdout: 'https://direct/' + argv[argv.length - 1].slice(-7) + '\n' } }
    return { value: { exitCode: 0, stdout: '', stderr: '' } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'yt algo' })
  await clock.advance(500)
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await m.drawn()
  await m.press({ key: 'yt-add-bbbbbbb' })
  await m.press({ key: 'yt-add-bbbbbbb' })
  await clock.advance(20000)
  const players = launched.filter((a) => a[0] === 'mpv')
  expect(players.length).toBe(1)
  expect(players[0]).toContain('https://direct/bbbbbbb')
  expect(launched.some((a) => a.includes('nerv-yt-fill'))).toBe(false)
  expect(sent.join('').match(/loadfile/g) || []).toHaveLength(0)
})

test('la chinche fija la pestaña, una sesión nueva arranca ahí y tocarla de nuevo la suelta', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  const files: Record<string, string> = {}
  on('fs.write', async (_$: any, e: any) => {
    files[e.path] = e.text
    return { value: undefined }
  })
  on('fs.read', async (_$: any, e: any) => ({ value: files[e.path] ?? '' }))
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await m.press({ key: 'tab-live' })
  await m.press({ key: 'tab-pin' })
  expect(JSON.parse(files['/h/.local/state/nerv/prefs.json']).pinned).toBe('live')
  expect(JSON.stringify(await m.drawn())).toContain('📌 fijada')
  await m.press({ key: 'tab-magi' })
  expect(JSON.stringify(await m.drawn())).toContain('📌 fijar')
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  expect(JSON.stringify(await m.drawn())).toContain('◆ EN VIVO')
  await m.press({ key: 'tab-pin' })
  expect(JSON.parse(files['/h/.local/state/nerv/prefs.json']).pinned).toBeNull()
})

test('si otra sesión fija una pestaña, la barra abierta salta a esa pestaña', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  const clock = mock.clock(on)
  const files: Record<string, string> = {}
  let stamp = 1
  on('fs.write', async (_$: any, e: any) => {
    files[e.path] = e.text
    stamp++
    return { value: undefined }
  })
  on('fs.read', async (_$: any, e: any) => ({ value: files[e.path] ?? '' }))
  on('fs.stat', async (_$: any, e: any) => {
    if (!(e.path in files)) throw new Error('ENOENT')
    return { value: { kind: 'file', size: files[e.path].length, mtimeMs: stamp, isLink: false } }
  })
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await m.press({ key: 'tab-forge' })
  expect(JSON.stringify(await m.drawn())).toContain('◆ FORGE')
  files['/h/.local/state/nerv/prefs.json'] = JSON.stringify({ pinned: 'live' })
  stamp++
  await clock.advance(1500)
  const drawn = JSON.stringify(await m.drawn())
  expect(drawn).toContain('◆ EN VIVO')
  expect(drawn).toContain('📌 fijada')
  await m.press({ key: 'tab-magi' })
  await clock.advance(1500)
  expect(JSON.stringify(await m.drawn())).toContain('◆ MAGI')
})

test('en la terminal angosta del celu la barra junta encabezado, pestañas y effort en una fila cada uno', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'vivo' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: { ...PANE_PROPS, bodyColumns: 40, placement: 'inline', scroll: { offset: 0, bodyRows: 17, contentRows: 40 } } })
  const drawn = JSON.stringify(await m.drawn())
  expect(drawn).toContain('tabrow-narrow')
  expect(drawn).toContain('◆ EN VIVO')
  expect(drawn).not.toContain('ネルフ')
  expect(drawn).not.toContain('メ·')
  await m.press({ key: 'tab-yt' })
  expect(JSON.stringify(await m.drawn())).toContain('◆ YOUTUBE')
})

test('la tarjeta de Discord dice falta Vencord sin el archivo y entiende el canal vacío', () => {
  expect(liveDc('')).toBeUndefined()
  expect(liveDc('{"ch":"x"')).toBeUndefined()
  expect(liveDc('{"ch":null,"n":0,"m":[],"live":null,"vc":null,"v":[]}')).toBeNull()
  const d = liveDc('{"ch":"general","g":"g","n":3,"m":[{"name":"a","speaking":true}],"live":false,"vc":0,"v":[]}')!
  expect(d.n).toBe(3)
  expect(d.m[0]).toEqual({ name: 'a', self: false, speaking: true, mute: false, deaf: false, streaming: false })
  expect(d.live).toBe(false)
})

test('EN VIVO sin nerv-discord.json no muestra nada de Discord, sólo las cámaras', async ($, on) => {
  mock.env(on, { HOME: '/h', XDG_RUNTIME_DIR: '/r' })
  mock.store(on)
  on('process.run', async (_$: any, e: any) => {
    if (e.argv[0] === 'bash' && e.argv.includes('nerv-live')) return { value: { exitCode: 0, stderr: '', stdout: 'dc\t\ncam\toff\nip\toff\ndiscord\t1\n' } }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'vivo' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  const drawn = JSON.stringify(await m.drawn())
  for (const x of ['STREAMCAM', 'IPHONE']) expect(drawn).toContain(x)
  for (const x of ['falta Vencord', 'DISCORD', 'live-dc', 'CHAT DEL CANAL']) expect(drawn).not.toContain(x)
})

test('el cartel g0n se dibuja arriba de NERV con el cuadro del tema, también en la terminal angosta', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  const drawn = JSON.stringify(await m.drawn())
  expect(drawn).toMatch(/assets\/g0n\/eva01\/\d\d\.png/)
  expect(drawn.indexOf('g0n-img')).toBeLessThan(drawn.indexOf(' NERV '))
  await m.unmount()
  const n: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: { ...PANE_PROPS, bodyColumns: 40, placement: 'inline', scroll: { offset: 0, bodyRows: 17, contentRows: 40 } } })
  expect(JSON.stringify(await n.drawn())).toContain('g0n-img')
})

test('MODELOS: el prefijo del id del CPAM se separa del nombre', () => {
  expect(mdlSplit('nan/qwen3.8-flash')).toEqual({ prefix: 'nan', name: 'qwen3.8-flash' })
  expect(mdlSplit('ag3/gemini-3-flash')).toEqual({ prefix: 'ag3', name: 'gemini-3-flash' })
  expect(mdlSplit('claude-opus-5-5')).toEqual({ prefix: '', name: 'claude-opus-5-5' })
})

test('MODELOS: agrupa por prefijo con etiqueta legible, NaN primero y Wibond al final', () => {
  const ids = ['wibond/claude-opus-5-5', 'claude-sonnet-5', 'gpt-6-sol', 'ag2/gemini-3-flash', 'ag/gemini-3-flash', 'ag10/x', 'nan/gemma4', 'nan/deepseek-v4-flash', 'glm-5.2', 'codex-auto-review']
  const g = mdlGroups(ids, { ag: 'gonn.nicolas@gmail.com', ag2: 'gnicolasrocca@gmail.com' })
  expect(g.map((x) => x.label)).toEqual(['NaN', 'Claude', 'Codex/GPT', 'GLM', 'Google ag · gonn.nicolas', 'Google ag2 · gnicolasrocca', 'Google ag10', 'Wibond (trabajo)'])
  expect(g[0]!.models).toEqual(['nan/deepseek-v4-flash', 'nan/gemma4'])
  expect(g.find((x) => x.key === 'gpt')!.models).toEqual(['codex-auto-review', 'gpt-6-sol'])
})

test('MODELOS: el filtro busca en id y etiqueta y marca los rotos conocidos', () => {
  const g = mdlGroups(['nan/gemma4', 'nan/qwen3.6', 'ag3/claude-sonnet-4-6', 'claude-opus-5-5'], { ag3: 'gonzalonicolas.dev@gmail.com' })
  expect(mdlFilter(g, 'sonnet').map((x) => x.key)).toEqual(['ag3'])
  expect(mdlFilter(g, 'gonzalonicolas').flatMap((x) => x.models)).toEqual(['ag3/claude-sonnet-4-6'])
  expect(mdlFilter(g, '').length).toBe(g.length)
  expect(mdlDim('nan/qwen3.6')).toBe('timeout')
  expect(mdlDim('gpt-image-2')).toBe('no chat')
  expect(mdlDim('nan/qwen3.8-flash')).toBe('')
  expect(mdlDim('refuseless/glm-5.3-flash-abliterated')).toBe('503')
  expect(mdlGroups(['refuseless/glm-5.3-abliterated'])[0]!.label).toBe('Refuseless (abliterated)')
})

test('MODELOS: el relanzado reanuda en fork por el CPAM sin la key, o vuelve a Anthropic', () => {
  const sid = '0b7c1d2e-1111-2222-3333-444455556666'
  const cpam = mdlLaunchCmd({ id: 'nan/qwen3.8-flash', sid, keyHelper: '/h/.local/bin/claude-go-key' })
  expect(cpam).toContain('ANTHROPIC_BASE_URL=http://127.0.0.1:8317')
  expect(cpam).toContain(`--resume ${sid} --fork-session --model nan/qwen3.8-flash`)
  expect(cpam).toContain('"apiKeyHelper":"/h/.local/bin/claude-go-key"')
  const back = mdlLaunchCmd({ sid, keyHelper: '/h/k', configDir: '/h/.claude-secundaria' })
  expect(back).toContain('env -u ANTHROPIC_BASE_URL')
  expect(back).toContain('CLAUDE_CONFIG_DIR=/h/.claude-secundaria')
  expect(back).not.toContain('--model')
  expect(mdlLaunchCmd({ id: 'x; rm -rf ~', sid, keyHelper: '/h/k' })).toBe('')
  // Conversación sin transcript todavía: sesión nueva con el modelo, sin --resume.
  const fresh = mdlLaunchCmd({ id: 'nan/deepseek-v4-flash', keyHelper: '/h/k' })
  expect(fresh).not.toContain('--resume')
  expect(fresh).toContain('--model nan/deepseek-v4-flash')
  expect(mdlLaunchCmd({ id: 'nan/deepseek-v4-flash', keyHelper: '/h/k', ctx: 1048576 })).toContain('CLAUDE_CODE_MAX_CONTEXT_TOKENS=1048576 ANTHROPIC_BASE_URL=')
  const yaml = 'openai-compatibility:\n  - name: "nan"\n    prefix: "nan"\n    api-key-entries:\n      - api-key: "sk-x"\n    models:\n      - { name: "deepseek-v4-flash", alias: "deepseek-v4-flash", max-context-length: 1048576 }\n      - { name: "gemma4", alias: "gemma4", max-context-length: 262144 }\n'
  expect(cpamContexts(yaml)).toEqual({ 'nan/deepseek-v4-flash': 1048576, 'nan/gemma4': 262144 })
  expect(transcriptPath('/home/gonza/.claude', '/home/gonza/projects/my.app', sid)).toBe(`/home/gonza/.claude/projects/-home-gonza-projects-my-app/${sid}.jsonl`)
})

test('MODELOS: la pestaña lista los grupos y elegir wibond avisa que es la cuenta de trabajo', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  on('fs.read', async () => ({ value: '' }))
  on('process.run', async (_$: any, e: any) =>
    e.argv[0] === 'sh' && e.argv[2].includes('/v1/models')
      ? { value: { exitCode: 0, stdout: JSON.stringify({ data: [{ id: 'nan/qwen3.8-flash' }, { id: 'wibond/claude-opus-5-5' }, { id: 'claude-sonnet-5' }] }), stderr: '' } }
      : { value: { exitCode: 1, stdout: '', stderr: '' } },
  )
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'modelos' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  let text = JSON.stringify(await m.drawn())
  expect(text).toContain('◆ MODELOS')
  expect(text).toContain('Wibond (trabajo)')
  expect(text).toContain('qwen3.8-flash')
  await m.press({ key: 'mdl-wibond/claude-opus-5-5' })
  text = JSON.stringify(await m.drawn())
  expect(text).toContain('cuenta de TRABAJO')
  expect(text).toContain('cambiar acá')
  expect(text).toContain('en tab nueva')
  // Las acciones quedan dentro del grupo del modelo elegido (el último), no arriba de todo.
  expect(text.indexOf('"mdl-swap"')).toBeGreaterThan(text.indexOf('Wibond (trabajo)'))
  expect(text.indexOf('"mdl-swap"')).toBeGreaterThan(text.indexOf('qwen3.8-flash'))
  // Tocar de nuevo el elegido lo suelta.
  await m.press({ key: 'mdl-wibond/claude-opus-5-5' })
  expect(JSON.stringify(await m.drawn())).not.toContain('"mdl-swap"')
})

test('MODELOS: elegir un modelo muestra sus acciones justo debajo de su grupo, antes del siguiente', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  on('fs.read', async () => ({ value: '' }))
  on('process.run', async (_$: any, e: any) =>
    e.argv[0] === 'sh' && e.argv[2].includes('/v1/models')
      ? { value: { exitCode: 0, stdout: JSON.stringify({ data: [{ id: 'nan/qwen3.8-flash' }, { id: 'ds/deepseek-v4-pro' }, { id: 'claude-sonnet-5' }, { id: 'ag3/gemini-3.8-flash' }] }), stderr: '' } }
      : { value: { exitCode: 1, stdout: '', stderr: '' } },
  )
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'modelos' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await m.drawn()
  await m.press({ key: 'mdl-claude-sonnet-5' })
  const text = JSON.stringify(await m.drawn())
  expect(text).not.toContain('"mdl-pick"')
  const act = text.indexOf('"mdl-swap"')
  expect(act).toBeGreaterThan(text.indexOf('claude-sonnet-5'))
  expect(act).toBeLessThan(text.indexOf('Google ag3'))
  expect(text).toContain('DeepSeek (API oficial)')
})

test('MODELOS: "cambiar acá" cierra este Claude y un ayudante retoma la misma conversación en el pane', async ($, on) => {
  mock.env(on, { HOME: '/h', HERDR_PANE_ID: 'w1:p1', HERDR_WORKSPACE_ID: 'w1' })
  mock.store(on)
  on('fs.read', async () => ({ value: '' }))
  on('session.id', async () => ({ value: 's1' }))
  on('session.cwd', async () => ({ value: '/tmp' }))
  let screen = 'algo\n❯\xa0Try "fix typecheck errors"      │ NERV\n'
  const spawned: string[][] = []
  on('process.run', async (_$: any, e: any) => {
    const a = e.argv as string[]
    if (a[0] === 'sh' && a[2]?.includes('/v1/models')) return { value: { exitCode: 0, stdout: JSON.stringify({ data: [{ id: 'nan/qwen3.8-flash' }] }), stderr: '' } }
    if (a[0] === 'herdr' && a[2] === 'read') return { value: { exitCode: 0, stdout: screen, stderr: '' } }
    if (a[0] === 'herdr' && a[2] === 'process-info')
      return { value: { exitCode: 0, stdout: JSON.stringify({ result: { process_info: { foreground_processes: [{ name: 'claude', argv: ['claude', '--permission-mode', 'bypassPermissions', '--resume', 'viejo', '--model', 'opus'] }] } } }), stderr: '' } }
    if (a[0] === 'grep') return { value: { exitCode: 0, stdout: '', stderr: '' } }
    if (a[0] === 'sh' && a[2]?.startsWith('setsid')) spawned.push(a)
    return { value: { exitCode: 0, stdout: '', stderr: '' } }
  })
  const exits: number[] = []
  on('command.run', { command: 'exit' }, async () => (exits.push(1), { text: '' }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'modelos' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await m.drawn()
  // Con texto escrito en el prompt no cierra nada y lo avisa ahí mismo.
  screen = 'algo\n❯\xa0un pedido a medio escribir   │ NERV\n'
  await m.press({ key: 'mdl-nan/qwen3.8-flash' })
  await m.press({ key: 'mdl-swap' })
  for (let i = 0; i < 30 && !JSON.stringify(await m.drawn()).includes('texto en el prompt'); i++) await new Promise((r) => setTimeout(r, 10))
  expect(JSON.stringify(await m.drawn())).toContain('texto en el prompt')
  expect(exits).toEqual([])
  screen = 'algo\n❯\xa0Try "fix typecheck errors"      │ NERV\n'
  await m.press({ key: 'mdl-swap' })
  for (let i = 0; i < 50 && !exits.length; i++) await new Promise((r) => setTimeout(r, 10))
  expect(exits).toEqual([1])
  expect(spawned.length).toBe(1)
  const [, , , , pane, cmd] = spawned[0]!
  expect(pane).toBe('w1:p1')
  expect(cmd).toContain('--resume s1 --model nan/qwen3.8-flash')
  expect(cmd).not.toContain('--fork-session')
  expect(cmd).toContain("'--permission-mode' 'bypassPermissions'")
  expect(cmd).not.toContain('viejo')
})

test('MODELOS: flags que se repiten al reabrir y prompt vacío leído de la pantalla', () => {
  expect(keepFlags(['claude', '--plugin-dir', '/a b', '--resume', 'x', '--fork-session', '--model', 'opus', '--settings', '{}', '-c', "--append-system-prompt=it's"])).toBe("'--plugin-dir' '/a b' '--append-system-prompt=it\\'s'")
  expect(promptDraft('x\n❯\xa0Try "fix typecheck errors"   │ NERV\n')).toBe('')
  expect(promptDraft('x\n❯\xa0\n')).toBe('')
  expect(promptDraft('❯ hola mundo      │ ◇ NERV')).toBe('hola mundo')
  expect(promptDraft('sin prompt a la vista')).toBe('?')
  const sid = '0b7c1d2e-1111-2222-3333-444455556666'
  const here = mdlLaunchCmd({ id: 'nan/qwen3.8-flash', sid, keyHelper: '/h/k', fork: false, extra: "'--permission-mode' 'bypassPermissions'" })
  expect(here).toContain(`'--permission-mode' 'bypassPermissions' --resume ${sid} --model nan/qwen3.8-flash`)
  expect(here).not.toContain('--fork-session')
  expect(mdlLaunchCmd({ sid, keyHelper: '/h/k', fork: false })).toContain('-u CLAUDE_CODE_MAX_CONTEXT_TOKENS')
  expect(mdlGroups(['ds/deepseek-v4-pro', 'nan/deepseek-v4-flash']).map((g) => g.label)).toEqual(['NaN', 'DeepSeek (API oficial)'])
})

test('MODELOS: en una sesión por el CPAM "usar acá" corre /model y devuelve el default de settings.json', async ($, on) => {
  mock.env(on, { HOME: '/h', ANTHROPIC_BASE_URL: 'http://127.0.0.1:8317' })
  mock.store(on)
  let settings = JSON.stringify({ effortLevel: 'high' }, null, 2) + '\n'
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/h/.claude/settings.json' ? settings : '' }))
  on('fs.write', async (_$: any, e: any) => {
    if (e.path === '/h/.claude/settings.json') settings = e.text
    return { value: undefined }
  })
  on('process.run', async (_$: any, e: any) =>
    e.argv[0] === 'sh' ? { value: { exitCode: 0, stdout: JSON.stringify({ data: [{ id: 'nan/qwen3.8-flash' }] }), stderr: '' } } : { value: { exitCode: 1, stdout: '', stderr: '' } },
  )
  const asked: string[] = []
  on('command.run', { command: 'model' }, async (_$: any, e: any) => {
    asked.push(e.args)
    settings = JSON.stringify({ ...JSON.parse(settings), model: e.args }, null, 2) + '\n'
    return { text: `Set model to ${e.args}` }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'modelos' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  expect(JSON.stringify(await m.drawn())).toContain('CPAM 8317')
  await m.press({ key: 'mdl-nan/qwen3.8-flash' })
  await m.press({ key: 'mdl-here' })
  for (let i = 0; i < 20 && !asked.length; i++) await new Promise((r) => setTimeout(r, 10))
  await new Promise((r) => setTimeout(r, 20))
  expect(asked).toEqual(['nan/qwen3.8-flash'])
  expect(JSON.parse(settings).model).toBeUndefined()
  expect(JSON.parse(settings).effortLevel).toBe('high')
})

test('CUENTA: personal directo, priv8 por el CPAM, y Wibond u otro prefijo sin menú', () => {
  const h = '/h'
  expect(acctFor({ configDir: '', home: h, cpam: false, model: 'claude-opus-5-5' })).toBe('personal')
  expect(acctFor({ configDir: '/h/.claude', home: h, cpam: true, model: 'priv8/claude-opus-5-5' })).toBe('priv8')
  expect(acctFor({ configDir: '', home: h, cpam: true, model: 'ag/claude-opus-5-5' })).toBe('')
  expect(acctFor({ configDir: '/h/.claude-wibond', home: h, cpam: false, model: 'claude-opus-5-5' })).toBe('')
  expect(acctFor({ configDir: '/h/.claude-wibond', home: h, cpam: true, model: 'priv8/claude-opus-5-5' })).toBe('')
})

test('CUENTA: priv8 usa el mismo Claude si lo tiene, si no el mismo tipo, si no el opus más nuevo', () => {
  const ids = ['ag/claude-opus-5-5', 'priv8/claude-opus-4-7', 'priv8/claude-opus-5-5', 'priv8/claude-sonnet-4-6', 'priv8/claude-sonnet-5']
  expect(priv8Pick(ids, 'claude-opus-5-5')).toBe('priv8/claude-opus-5-5')
  expect(priv8Pick(ids, 'claude-opus-4-7[1m]')).toBe('priv8/claude-opus-4-7')
  expect(priv8Pick(ids, 'sonnet')).toBe('priv8/claude-sonnet-5')
  expect(priv8Pick(ids, 'claude-haiku-4-5')).toBe('priv8/claude-opus-5-5')
  expect(priv8Pick(ids, '')).toBe('priv8/claude-opus-5-5')
  expect(priv8Pick(['ag/claude-opus-5-5', 'nan/qwen3.6'], 'claude-opus-5-5')).toBe('')
})

test('CPAM: la firma cambia al sumar un prefix o tocar el config.yaml, no por el orden de los archivos', () => {
  const a: { name: string; prefix?: string }[] = [{ name: 'claude-a.json', prefix: 'ag' }, { name: 'claude-b.json' }]
  const conf = { mtimeMs: 1, size: 10 }
  expect(cpamSig(a, conf)).toBe(cpamSig([...a].reverse(), conf))
  expect(cpamSig([a[0]!, { name: 'claude-b.json', prefix: 'priv8' }], conf)).not.toBe(cpamSig(a, conf))
  expect(cpamSig(a, { mtimeMs: 2, size: 10 })).not.toBe(cpamSig(a, conf))
  expect(cpamSig(a)).toBe('claude-a.json=ag,claude-b.json=|0:0')
})

test('línea bajo el prompt: la cuenta sale del prefijo del modelo por el CPAM y del config dir directo', () => {
  const emails = { ag3: 'gon.ag3@example.com', wibond: 'x@wibond.test' }
  const base = { cpam: true, configDir: '', home: '/h', emails }
  expect(acctBadge({ ...base, model: 'ag3/claude-opus-5-5' })).toEqual({ who: 'ag3·gon.ag3', tag: 'CPAM', warn: false })
  expect(acctBadge({ ...base, model: 'wibond/claude-sonnet-4-6' })).toEqual({ who: 'wibond·x', tag: 'CPAM', warn: true })
  expect(acctBadge({ ...base, model: 'nan/glm-5' }).who).toBe('nan')
  expect(acctBadge({ ...base, model: 'claude-opus-5-5' }).who).toBe('default')
  const direct = { cpam: false, home: '/h', emails, model: 'claude-opus-5-5' }
  expect(acctBadge({ ...direct, configDir: '' })).toEqual({ who: 'personal', tag: 'ANTHROPIC', warn: false })
  expect(acctBadge({ ...direct, configDir: '/h/.claude/' }).who).toBe('personal')
  expect(acctBadge({ ...direct, configDir: '/h/.claude-wibond', directEmail: 'x@wibond.test' })).toEqual({ who: 'wibond·x', tag: 'ANTHROPIC', warn: true })
})

test('línea bajo el prompt: ventana de contexto, barra y umbrales', () => {
  expect(ctxTotal({ env: '1000000', window: 200000 })).toBe(1000000)
  expect(ctxTotal({ env: '', window: 200000, cpam: 400000 })).toBe(200000)
  expect(ctxTotal({ cpam: 400000 })).toBe(400000)
  expect(ctxTotal({})).toBe(200000)
  expect(kfmt(84321)).toBe('84K')
  expect(kfmt(1200000)).toBe('1.2M')
  expect(kfmt(1000000)).toBe('1M')
  expect(ctxGauge(undefined, 200000)).toEqual({ bar: '▱▱▱▱▱', pct: undefined, level: 'idle', text: '–/200K' })
  expect(ctxGauge(40000, 200000)).toEqual({ bar: '▰▱▱▱▱', pct: 20, level: 'ok', text: '40K/200K 20%' })
  expect(ctxGauge(130000, 200000).level).toBe('warn')
  expect(ctxGauge(170000, 200000)).toEqual({ bar: '▰▰▰▰▰', pct: 85, level: 'hot', text: '170K/200K 85%' })
  expect(shortModel('claude-opus-5-5')).toBe('OPUS 5.5')
  expect(shortModel('ag3/claude-sonnet-4-5-20250929[1m]')).toBe('SONNET 4.5 [1M]')
  expect(shortModel('nan/glm-5')).toBe('glm-5')
})

test('línea bajo el prompt: en terminal angosta se caen primero los de menor prioridad', () => {
  expect(cellWidth('ネルフ')).toBe(6)
  const segs = [
    { id: 'nerv', prio: 9, parts: [['ネルフ', '#fff']] as [string, string][] },
    { id: 'acct', prio: 8, parts: [['◆ personal ANTHROPIC', '#fff']] as [string, string][] },
    { id: 'git', prio: 3, parts: [['⎇ main', '#fff']] as [string, string][] },
    { id: 'cost', prio: 1, parts: [['$1.23', '#fff']] as [string, string][] },
  ]
  expect(fitSegs(segs, 200).map((s) => s.id)).toEqual(['nerv', 'acct', 'git', 'cost'])
  expect(fitSegs(segs, 40).map((s) => s.id)).toEqual(['nerv', 'acct', 'git'])
  expect(fitSegs(segs, 30).map((s) => s.id)).toEqual(['nerv', 'acct'])
  expect(fitSegs(segs, 5).map((s) => s.id)).toEqual(['nerv'])
})

test('la línea NERV se dibuja bajo el hint del prompt y conserva la línea del engine', async ($, on) => {
  on('ui.render', { component: 'PromptHint' }, (_$: any, e: any) => _$.ui.resolve(e).Text({ children: [String(e.props.hint)] }))
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'PromptHint', props: { isDraft: false, isWorking: true, hint: 'esc to interrupt' } })
  const text = JSON.stringify(await m.drawn())
  expect(text).toContain('esc to interrupt')
  expect(text).toContain('ネルフ')
  expect(text).toContain('ANTHROPIC')
  expect(text).toContain('SYNC')
})

test('EN VIVO: de Discord sólo se muestran los que miran, con "+N más" para el resto', () => {
  const dc = { ch: 'general', g: 'g', n: 12, m: [{ name: 'a', self: true, speaking: false, mute: false, deaf: false, streaming: true }], live: true, vc: 9, v: ['x', 'y'] }
  expect(liveViewers(dc)).toEqual({ names: ['x', 'y'], more: 7 })
  expect(liveViewers({ ...dc, vc: 0, v: [] })).toEqual({ names: [], more: 0 })
})

test('EN VIVO: sin Go Live no hay tarjeta de Discord, pero el chat y las cámaras siguen', async ($, on) => {
  mock.env(on, { HOME: '/h', XDG_RUNTIME_DIR: '/r' })
  mock.store(on)
  on('process.run', async (_$: any, e: any) => {
    if (e.argv[0] === 'bash' && e.argv.includes('nerv-live'))
      return {
        value: {
          exitCode: 0,
          stderr: '',
          stdout: ['cam\ton\t1920\t1080\t30\t5', 'ip\ton\t1280\t720\t30\t5', 'ipstate\tcamera\t\t0', 'dc\t' + JSON.stringify({ ch: 'general', g: 'NERV HQ', n: 3, m: [{ name: 'rei', self: false, speaking: true, mute: false, deaf: false, streaming: false }, { name: 'gon', self: true, speaking: false, mute: true, deaf: false, streaming: false }], live: false, vc: 0, v: [] }), 'discord\t1'].join('\n'),
        },
      }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/r/nerv-discord.json' ? JSON.stringify({ chat: { ch: '1', m: [{ a: 'asuka', t: 'hola desde el canal', ts: 1, self: false }] } }) : '' }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'vivo' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: { ...PANE_PROPS, scroll: { offset: 0, bodyRows: 200, contentRows: 200 } } })
  const drawn = JSON.stringify(await m.drawn())
  for (const x of ['CHAT DEL CANAL', 'hola desde el canal', 'STREAMCAM', 'IPHONE']) expect(drawn).toContain(x)
  for (const x of ['DISCORD', 'GO LIVE', 'MIRAN', 'en el canal', 'general', 'NERV HQ', 'rei', 'gon (vos)', 'mudo', 'live-dc']) expect(drawn).not.toContain(x)
})

test('EN VIVO: el cartel g0n y el EFFORT se ocultan sólo en la pestaña EN VIVO', async ($, on) => {
  expect(g0nShownIn('live')).toBe(false)
  expect(effortShownIn('live')).toBe(false)
  for (const id of ['magi', 'git', 'hw', 'forge', 'nodd', 'cortex', 'yt', 'models']) {
    expect(g0nShownIn(id)).toBe(true)
    expect(effortShownIn(id)).toBe(true)
  }
  mock.env(on, { HOME: '/h', XDG_RUNTIME_DIR: '/r' })
  mock.store(on)
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  const magi = JSON.stringify(await m.drawn())
  expect(magi).toContain('effort-foot')
  expect(magi).toContain('g0n-img')
  await m.press({ key: 'tab-live' })
  const vivo = JSON.stringify(await m.drawn())
  expect(vivo).not.toContain('effort-foot')
  expect(vivo).not.toContain('g0n-img')
  await m.press({ key: 'tab-magi' })
  expect(JSON.stringify(await m.drawn())).toContain('effort-foot')
})

test('chat: sin campo chat pide recargar, con lista vacía no hay mensajes, y se queda con los últimos 8', () => {
  expect(liveChat('')).toBeUndefined()
  expect(liveChat('{"channel":null}')).toBeUndefined()
  expect(liveChat('{"chat":{"ch":null,"m":[]}}')).toEqual([])
  const many = { chat: { ch: '1', m: Array.from({ length: 12 }, (_, i) => ({ a: 'u' + i, t: ` hola\n  ${i} `, ts: i, self: i === 11 })) } }
  const c = liveChat(JSON.stringify(many))!
  expect(c.length).toBe(8)
  expect(c[0]).toEqual({ a: 'u4', t: 'hola 4', ts: 4, self: false })
  expect(c[7].self).toBe(true)
})

test('chat: corta por palabras y por ancho de celdas, y parte palabras largas', () => {
  expect(wrapCells('hola que tal', 20)).toEqual(['hola que tal'])
  expect(wrapCells('hola que tal', 8)).toEqual(['hola que', 'tal'])
  expect(wrapCells('uno dos tres', 3, 8)).toEqual(['uno', 'dos tres'])
  expect(wrapCells('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij'])
  expect(wrapCells('ネルフネルフ', 4)).toEqual(['ネル', 'フネ', 'ルフ'])
  expect(wrapCells('', 5)).toEqual([''])
  for (const l of wrapCells('una frase bastante larga para partir en varias líneas', 10)) expect(cellWidth(l)).toBeLessThanOrEqual(10)
})

test('chat: lo más nuevo abajo, mensajes enteros y el último recortado si no entra solo', () => {
  const msgs = [
    { a: 'rei', t: 'primero', ts: 1, self: false },
    { a: 'asuka', t: 'uno dos tres cuatro cinco seis', ts: 2, self: false },
    { a: 'gon', t: 'ok', ts: 3, self: true },
  ]
  const all = chatLines(msgs, 20, 10)
  expect(all.map((l) => l.text)).toEqual(['primero', 'uno dos tres', '  cuatro cinco seis', 'ok'])
  expect(all[0].author).toBe('rei')
  expect(all[2].author).toBeUndefined()
  expect(all[3]).toMatchObject({ author: 'gon', self: true })
  expect(chatLines(msgs, 20, 3).map((l) => l.text)).toEqual(['uno dos tres', '  cuatro cinco seis', 'ok'])
  expect(chatLines(msgs, 20, 2).map((l) => l.text)).toEqual(['ok'])
  const cut = chatLines([{ a: 'asuka', t: 'uno dos tres cuatro cinco seis siete ocho', ts: 1, self: false }], 20, 1)
  expect(cut.length).toBe(1)
  expect(cut[0].text.endsWith('…')).toBe(true)
  expect(chatLines([], 20, 4)).toEqual([])
})

test('EN VIVO: con el NervLive viejo el chat pide recargar Discord, y sin mensajes lo dice', async ($, on) => {
  mock.env(on, { HOME: '/h', XDG_RUNTIME_DIR: '/r' })
  mock.store(on)
  let file = JSON.stringify({ channel: { name: 'general' } })
  on('process.run', async (_$: any, e: any) => {
    if (e.argv[0] === 'bash' && e.argv.includes('nerv-live'))
      return { value: { exitCode: 0, stderr: '', stdout: 'dc\t{"ch":"general","g":"g","n":1,"m":[],"live":false,"vc":0,"v":[]}\ncam\toff\nip\toff\ndiscord\t1\n' } }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/r/nerv-discord.json' ? file : '' }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'vivo' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  expect(JSON.stringify(await m.drawn())).toContain('recargá Discord (Ctrl+R)')
  await m.unmount()
  file = JSON.stringify({ chat: { ch: '1', m: [] } })
  await $.command.run({ command: 'nerv', args: 'vivo' })
  const n: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  expect(JSON.stringify(await n.drawn())).toContain('sin mensajes todavía')
})

test('chat: el scroll de adentro queda anclado al último mensaje salvo que hayas subido', () => {
  expect(chatScroll(undefined, 0, 4)).toBe(4)
  expect(chatScroll(4, 4, 6)).toBe(6)
  expect(chatScroll(1, 4, 6)).toBe(1)
  expect(chatScroll(5, 4, 2)).toBe(2)
  expect(chatScroll(0, 0, 0)).toBe(0)
})

test('EN VIVO: el chat tiene alto fijo con scroll adentro y las cámaras entran en la misma vista', async ($, on) => {
  mock.env(on, { HOME: '/h', XDG_RUNTIME_DIR: '/r' })
  mock.store(on)
  const msgs = Array.from({ length: 8 }, (_, i) => ({ a: 'piloto' + i, t: `mensaje número ${i} con algo de texto para que ocupe una línea larga o dos en la tarjeta`, ts: i, self: false }))
  on('process.run', async (_$: any, e: any) => {
    if (e.argv[0] === 'bash' && e.argv.includes('nerv-live'))
      return {
        value: {
          exitCode: 0,
          stderr: '',
          stdout: ['cam\ton\t1920\t1080\t30\t5', 'ip\ton\t1280\t720\t30\t5', 'ipstate\tcamera\t\t0', 'dc\t' + JSON.stringify({ ch: 'general', g: 'g', n: 5, m: [], live: true, vc: 2, v: ['asuka', 'rei'] }), 'discord\t1'].join('\n'),
        },
      }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/r/nerv-discord.json' ? JSON.stringify({ chat: { ch: '1', m: msgs } }) : '' }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'vivo' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: { ...PANE_PROPS, scroll: { offset: 0, bodyRows: 50, contentRows: 50 } } })
  const drawn = JSON.stringify(await m.drawn())
  expect(CHAT_ROWS).toBeLessThanOrEqual(7)
  expect(drawn).toContain('live-chat-win')
  expect(drawn).toContain(`"height":${CHAT_ROWS}`)
  expect(drawn).toContain('piloto7')
  for (const x of ['STREAMCAM', 'IPHONE', 'MIRAN', 'asuka, rei']) expect(drawn).toContain(x)
  expect(drawn).not.toContain('body-bar')
})


test('eddStory arma el progreso de la historia y las decisiones pendientes', () => {
  const entries = [
    { type: 'story_opened', presence: 'async', payload: { n: 1, text: 'login con token', storyIndex: 1 } },
    { type: 'pact_proposed', payload: { tests: [{ name: 'rechaza token vencido', level: 'endpoint' }, { name: 'acepta token válido', level: 'endpoint' }], demo: [] } },
    { type: 'pact_approved', payload: {} },
    { type: 'test_sealed', payload: { name: 'rechaza token vencido', file: 'a.test.ts', sha256: 'x' } },
    { type: 'step_opened', payload: { test: 'rechaza token vencido' } },
    { type: 'step_closed', payload: { test: 'rechaza token vencido' } },
    { type: 'test_sealed', payload: { name: 'acepta token válido', file: 'a.test.ts', sha256: 'y' } },
    { type: 'step_opened', payload: { test: 'acepta token válido' } },
    { type: 'decision_queued', payload: { id: 'd1', kind: 'dependency', question: '¿sumo jsonwebtoken?', suggested: 'sí' } },
    { type: 'demo_run', payload: { exit: 0 } },
    { type: 'perito_report', payload: { findings: [{}], seals_ok: true, suite: { green: true } } },
  ]
  const v = eddStory(entries)
  expect(v.title).toBe('login con token')
  expect(v.n).toBe(1)
  expect(v.approved).toBe(true)
  expect(v.open).toBe(true)
  expect(v.tests).toEqual({ total: 2, green: 1, sealed: 1, pending: 0 })
  expect(v.openStep).toBe('acepta token válido')
  expect(v.decisions.map((d) => d.id)).toEqual(['d1'])
  expect(v.demo).toBe(0)
  expect(v.perito).toEqual({ findings: 1, sealsOk: true, green: true })
  expect(v.presence).toBe('async')
})

test('eddStory: una decisión respondida sale de pendientes y sin pacto da totales en cero', () => {
  const v = eddStory([
    { type: 'story_opened', payload: { text: 's' } },
    { type: 'decision_queued', payload: { id: 'd1', kind: 'size', question: '¿waiver?' } },
    { type: 'decision_answered', payload: { id: 'd1', answer: 'allow' } },
    { type: 'story_closed', payload: {} },
  ])
  expect(v.decisions).toEqual([])
  expect(v.open).toBe(false)
  expect(v.tests.total).toBe(0)
})

test('eddParse salta líneas rotas y eddCounts/eddActiveSlug leen el índice', () => {
  const idx = [
    JSON.stringify({ type: 'story_opened', payload: { slug: 'uno', storyIndex: 1 } }),
    'basura {no json',
    JSON.stringify({ type: 'story_closed', payload: { slug: 'uno' } }),
    JSON.stringify({ type: 'story_opened', payload: { slug: 'dos', storyIndex: 2 } }),
  ].join('\n')
  const entries = eddParse(idx)
  expect(entries.length).toBe(3)
  expect(eddCounts(entries)).toEqual({ opened: 2, closed: 1 })
  expect(eddActiveSlug(entries)).toBe('dos')
})

test('la barra incluye la pestaña EDD', async ($) => {
  const m: any = await ($ as any).ui.mount({
    plugin: 'nerv',
    surface: 'terminal',
    component: 'Pane',
    requestId: 'nerv',
    props: { title: 'NERV', isFocused: false, bodyColumns: 44, placement: 'dock', scroll: { offset: 0, bodyRows: 40, contentRows: 40 }, view: {} },
  })
  const text = JSON.stringify(await m.drawn())
  expect(text).toContain('EDD')
})
