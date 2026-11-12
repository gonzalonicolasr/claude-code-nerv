import { expect, test, mock } from 'claude-code/testing'
import { CHAT_ROWS, cardAt, chatLines, chatScroll, effortShownIn, g0nShownIn, liveChat, liveViewers, wrapCells, acctFor, cpamSig, cxCalls, cxEvent, cxHits, cxPromptKey, cxTally, cxTool, liveBattery, liveDc, liveLens, mdlDim, mdlFilter, mdlGroups, mdlLaunchCmd, mdlSplit, keepFlags, promptDraft, pngSource, missionNotify, missionWindow, priv8Pick, transcriptPath, cpamContexts, acctBadge, ctxTotal, ctxGauge, shortModel, fitSegs, cellWidth, kfmt, eddParse, eddStory, eddCounts, eddActiveSlug, eddBacklog, sidePrompt, sideLines, orqParse, orqLive, orqPath, orqPulse, orqBar, orqResumen, orqDraw, orqVista, orqModelosParse, orqModelosSet, orqMdlCuentas, orqMdlError, orqPerfilesParse, orqPerfilArgv, orqPerfilLibre, ytCells, ytClip } from './register'

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
    others: [{ slug: 'mejoras-de-fps', project: 'ascii-rpg', status: 'running' }],
  }
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/h/.local/state/forge/state-sesion.json' ? JSON.stringify(state) : '' }))
  on('session.id', async () => ({ value: 'sesion' }))
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
  for (const s of ['ENTRY PLUG', 'EXPLORE', 'VEREDICTO', 'OPERANDO', 'R 1/3', 'Gemini 3.7 Flash · ag3', 'Claude Sonnet 5.5 ▾', 'personal', 'otros: ', '1 corriendo (ascii-rpg)']) expect(drawn).toContain(s)
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

test('FORGE dice si edita la config de esta sesión o el default, y la fija como default', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  const state: any = {
    profile: 'barato',
    configScope: 'default',
    profiles: { barato: { builtin: true, source: 'forge' } },
    models: { explore: 'opus', plan: 'opus', build: 'opus', veredicto: 'opus' },
    mode: 'automatic',
    cap: 3,
    catalog: { claude: ['opus'] },
    run: null,
  }
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/h/.local/state/forge/state-sesion.json' ? JSON.stringify(state) : '' }))
  on('session.id', async () => ({ value: 'sesion' }))
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  const sent: string[] = []
  on('command.run', { command: 'forge' }, async (_$: any, e: any) => {
    sent.push(e.args)
    return { text: 'ok' }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'forge' })
  let m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  let drawn = JSON.stringify(await m.drawn())
  expect(drawn).toContain('PERFIL (default)')
  expect(drawn).not.toContain('fp-default')
  await m.unmount()
  state.configScope = 'session'
  await $.command.run({ command: 'nerv', args: 'forge' })
  m = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  drawn = JSON.stringify(await m.drawn())
  expect(drawn).toContain('PERFIL (esta sesión)')
  await m.press({ key: 'fp-default' })
  await m.press({ key: 'fp-undo' })
  expect(sent).toEqual(['config save-default', 'config reset'])
})

test('FORGE no muestra el run de otra sesión que quedó en el state.json compartido', async ($, on) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  const shared = {
    profile: 'barato',
    profiles: { barato: { builtin: true, source: 'forge' } },
    models: { explore: 'opus', plan: 'opus', build: 'opus', veredicto: 'opus' },
    mode: 'automatic',
    cap: 3,
    catalog: { claude: ['opus'] },
    run: { status: 'running', request: 'mejoras de fps', slug: 'mejoras-de-fps', round: 1, cap: 3, phase: 'build', startedAt: 0, phases: [], verdicts: [] },
  }
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/h/.local/state/forge/state.json' ? JSON.stringify(shared) : '' }))
  on('session.id', async () => ({ value: 'otra' }))
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'forge' })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  const drawn = JSON.stringify(await m.drawn())
  expect(drawn).toContain('EN ESPERA')
  for (const x of ['OPERANDO', 'R 1/3', 'mejoras de fps']) expect(drawn).not.toContain(x)
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
      'zero:puro-codex': { builtin: false, modified: false, source: 'zero-pi' },
      'zero:mix-adversarial': { builtin: false, modified: false, source: 'zero-pi' },
      'zero:rev-ds-revisa-codex': { builtin: false, modified: false, source: 'zero-pi' },
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
    // los perfiles puro-*/mix-* de zero.json tienen su sección; mix-adversarial no cae en REVISIÓN
    // y el label no repite el prefijo de la categoría
    expect(at('ZERO-PI · PUROS') < at('"label":"codex"') && at('"label":"codex"') < at('ZERO-PI · MEZCLADOS')).toBe(true)
    expect(at('ZERO-PI · MEZCLADOS') < at('"label":"adversarial"') && at('"label":"adversarial"') < at('ZERO-PI · REVISIÓN')).toBe(true)
    expect(at('ZERO-PI · REVISIÓN') < at('"label":"ds revisa codex"') && at('"label":"ds revisa codex"') < at('ZERO-PI · UN MODELO')).toBe(true)
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
    if (a.join(' ').includes('"type":"user"')) return { value: { exitCode: 0, stdout: '', stderr: '' } }
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

test('MAGI: cambiar de cuenta retoma la misma conversación en el mismo pane aunque la carpeta haya cambiado', async ($, on) => {
  mock.env(on, { HOME: '/h', HERDR_PANE_ID: 'w1:p1', HERDR_WORKSPACE_ID: 'w1', ANTHROPIC_BASE_URL: 'http://127.0.0.1:8317' })
  mock.store(on)
  on('fs.read', async () => ({ value: '' }))
  on('session.id', async () => ({ value: 's1' }))
  on('session.model', async () => ({ value: 'priv8/claude-opus-5-5' }))
  // Arrancó en /h (el transcript está en projects/-h/s1.jsonl) y ahora trabaja en /h/proj.
  on('session.cwd', async () => ({ value: '/h/proj' }))
  const spawned: string[][] = []
  const lookups: string[][] = []
  on('process.run', async (_$: any, e: any) => {
    const a = e.argv as string[]
    if (a[0] === 'herdr' && a[2] === 'read') return { value: { exitCode: 0, stdout: '❯\xa0Try "x"   │ NERV\n', stderr: '' } }
    if (a[0] === 'herdr' && a[2] === 'process-info')
      return { value: { exitCode: 0, stdout: JSON.stringify({ result: { process_info: { foreground_processes: [{ name: 'claude', argv: ['claude', '--permission-mode', 'bypassPermissions'] }] } } }), stderr: '' } }
    if (a.join(' ').includes('"type":"user"')) {
      lookups.push(a)
      const found = a.join(' ').includes('/h/.claude') && a.includes('s1') && !a.join(' ').includes('-h-proj')
      return { value: { exitCode: found ? 0 : 1, stdout: '', stderr: '' } }
    }
    if (a[0] === 'sh' && a[2]?.startsWith('setsid')) spawned.push(a)
    return { value: { exitCode: 0, stdout: '', stderr: '' } }
  })
  const exits: number[] = []
  on('command.run', { command: 'exit' }, async () => (exits.push(1), { text: '' }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/h/proj', surface: null, isInteractive: false })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  for (let i = 0; i < 50 && !JSON.stringify(await m.drawn()).includes('"acct-menu"'); i++) await new Promise((r) => setTimeout(r, 10))
  await m.press({ key: 'acct-menu' })
  await m.press({ key: 'acct-go-personal' })
  for (let i = 0; i < 50 && !exits.length; i++) await new Promise((r) => setTimeout(r, 10))
  expect(lookups.length).toBeGreaterThan(0)
  expect(exits).toEqual([1])
  expect(spawned.length).toBe(1)
  const [, , , , pane, cmd] = spawned[0]!
  expect(pane).toBe('w1:p1')
  expect(cmd).toContain('-u ANTHROPIC_BASE_URL')
  expect(cmd).toContain('--resume s1')
  expect(cmd).not.toContain('--fork-session')
  expect(cmd).toContain("'--permission-mode' 'bypassPermissions'")
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

test('rueda: mueve la tarjeta de abajo del puntero, sólo en la parte que se ve, y al llegar a la punta sigue al cuerpo', () => {
  // cuerpo visible en las filas 10-29; PERFIL arranca tapada por la cabecera (filas 4-15), MODELOS abajo (16-35)
  const hits = [
    { key: 'perfil', top: 4, bottom: 16 },
    { key: 'modelos', top: 16, bottom: 36 },
  ]
  const win = { top: 10, bottom: 30 }
  const max = { perfil: 6, modelos: 4 }
  expect(cardAt(hits, win, 12, 1, { perfil: 2 }, max)).toEqual({ key: 'perfil', offset: 3 })
  expect(cardAt(hits, win, 20, -1, { modelos: 2 }, max)).toEqual({ key: 'modelos', offset: 1 })
  // la parte de PERFIL tapada por las pestañas y la de MODELOS tapada por el pie del EFFORT no cuentan
  expect(cardAt(hits, win, 6, 1, { perfil: 2 }, max)).toBeUndefined()
  expect(cardAt(hits, win, 32, 1, { modelos: 2 }, max)).toBeUndefined()
  // en la punta, la rueda pasa al cuerpo
  expect(cardAt(hits, win, 12, 1, { perfil: 6 }, max)).toBeUndefined()
  expect(cardAt(hits, win, 20, -1, { modelos: 0 }, max)).toBeUndefined()
  expect(cardAt(hits, win, undefined, 1, {}, max)).toBeUndefined()
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

test('eddBacklog numera las historias, guarda el Requires y marca cerrada/abierta/pendiente', () => {
  const md = ['# Backlog', '', '1. Como streamer, quiero ver el chat, para responder', '  2. Como streamer, quiero banear, para moderar Requires: #1', '- nota suelta', '3. Como mod, quiero un log, para auditar', '10.sin espacio no cuenta'].join('\n')
  const index = [
    { type: 'story_opened', payload: { n: 1, slug: 'ver-chat', text: 'x' } },
    { type: 'story_closed', payload: { slug: 'ver-chat' } },
    { type: 'story_opened', payload: { n: 2, slug: 'banear' } },
  ]
  const b = eddBacklog(md, index)
  expect(b.map((x) => x.n)).toEqual([1, 2, 3])
  expect(b[1]!.text).toBe('Como streamer, quiero banear, para moderar Requires: #1')
  expect(b.map((x) => x.state)).toEqual(['closed', 'open', 'todo'])
  expect(b[0]!.slug).toBe('ver-chat')
  expect(b[2]!.slug).toBeUndefined()
  expect(eddBacklog('', [])).toEqual([])
})

test('EDD: desde la barra se aprueba el pacto, se responden decisiones y se sigue la historia', async ($, on) => {
  const index = [JSON.stringify({ type: 'story_opened', payload: { n: 2, slug: 'banear', text: 'Como streamer, quiero banear' } })].join('\n')
  const ledger = [
    { type: 'story_opened', payload: { n: 2, text: 'Como streamer, quiero banear' } },
    { type: 'pact_proposed', payload: { tests: [{ name: 'banea' }] } },
    { type: 'decision_queued', payload: { id: 'd1', kind: 'unseal', question: '¿desello banea?' } },
    { type: 'decision_queued', payload: { id: 'd2', kind: 'design', question: '¿lista o mapa?', suggested: 'mapa' } },
  ]
    .map((x) => JSON.stringify(x))
    .join('\n')
  const files: Record<string, string> = { '/tmp/.edd/index.jsonl': index, '/tmp/.edd/stories/banear/ledger.jsonl': ledger, '/tmp/BACKLOG.md': '1. Como streamer, quiero ver el chat\n2. Como streamer, quiero banear\n' }
  on('fs.read', async (_$: any, e: any) => (e.path in files ? { value: files[e.path] } : { deny: 'no existe' }) as any)
  const argvs: string[][] = []
  on('process.run', async (_$: any, e: any) => {
    argvs.push([...e.argv])
    return { value: { exitCode: e.argv[0] === 'edd' ? 0 : 1, stdout: e.argv[0] === 'edd' ? 'decidido d1\n' : '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } } as any
  })
  const prompts: string[] = []
  on('prompt.submit', async (_$: any, e: any) => {
    prompts.push(e.text)
    return { text: e.text } as any
  })
  const cmds: string[] = []
  on('command.run', { command: 'edd:story' }, async (_$: any, e: any) => {
    cmds.push(`edd:story ${e.args}`)
    return {}
  })
  on('session.cwd', async () => ({ value: '/tmp' }) as any)
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await m.press({ key: 'tab-edd' })
  await new Promise((r) => (globalThis as any).setTimeout(r, 50))
  const drawn = JSON.stringify(await m.drawn())
  for (const x of ['aprobar pacto', 'continuar', 'parar', 'allow', 'deny', 'sugerido', 'responder']) expect(drawn).toContain(x)
  await m.press({ key: 'edd-pact-ok' })
  await m.press({ key: 'edd-d-d1-allow' })
  await m.press({ key: 'edd-d-d2-sug-btn' })
  await m.press({ key: 'edd-d-d1-cli-allow' })
  await m.press({ key: 'edd-continue' })
  await m.press({ key: 'edd-stop' })
  expect(prompts).toEqual(['ok', 'allow (decisión d1)', 'mapa (decisión d2)'])
  expect(cmds).toEqual(['edd:story 2'])
  const edds = argvs.filter((a) => a[0] === 'edd')
  expect(edds).toEqual([
    ['edd', 'decide', 'd1', 'allow', '--by', 'cli'],
    ['edd', 'stop', 'parado desde NERV'],
  ])
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

const USAGE = { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 90, cache_creation_input_tokens: 0 }

test('side chat: el prompt avisa que es una pregunta lateral sin herramientas y arrastra la charla anterior', () => {
  const first = sidePrompt([], '¿cómo viene?')
  expect(first).toContain('SIDE CHAT')
  expect(first).toContain('No tenés herramientas')
  expect(first.endsWith('Pregunta: ¿cómo viene?')).toBe(true)
  expect(first).not.toContain('P: ')
  const next = sidePrompt([{ q: '¿cómo viene?', a: 'va por el test 3', at: 0 }, { q: 'colgada', err: 'se cortó', at: 0 }], '¿y el 4?')
  expect(next).toContain('P: ¿cómo viene?\nR: va por el test 3')
  expect(next).not.toContain('colgada')
  expect(next.endsWith('Pregunta: ¿y el 4?')).toBe(true)
})

test('side chat: las líneas parten la pregunta al ancho, respetan los renglones de la respuesta y dicen lo que costó', () => {
  const lines = sideLines([{ q: 'una pregunta bastante larga para partir', a: 'uno\n\ndos', at: 0, ms: 3000, usage: USAGE }], 20)
  expect(lines).toEqual([
    { text: '› una pregunta', kind: 'q' },
    { text: '  bastante larga', kind: 'q' },
    { text: '  para partir', kind: 'q' },
    { text: 'uno', kind: 'a' },
    { text: '', kind: 'a' },
    { text: 'dos', kind: 'a' },
    { text: '3 s · 100 tok · cache 90%', kind: 'meta' },
  ])
  const two = sideLines([{ q: 'a', err: 'falló', at: 0 }, { q: 'b', at: 0 }], 20)
  expect(two.map((l) => l.kind)).toEqual(['q', 'err', 'meta', 'q', 'wait'])
})

test('SIDE CHAT: la pregunta va por un fork de la sesión y la respuesta queda en la pestaña', async ($, on) => {
  const asked: string[] = []
  on('model.fork', async (_$: any, e: any) => {
    asked.push(e.prompt)
    return { value: { isAnswered: true, text: `respuesta ${asked.length}`, usage: USAGE } } as any
  })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await m.press({ key: 'tab-side' })
  const inputKey = async () => JSON.stringify(await m.drawn()).match(/side-q-\d+/)![0]
  await m.input({ key: await inputKey(), text: '¿cómo viene?', kind: 'submit' })
  await new Promise((r) => (globalThis as any).setTimeout(r, 50))
  expect(JSON.stringify(await m.drawn())).toContain('respuesta 1')
  expect(asked[0]).toContain('Pregunta: ¿cómo viene?')
  await m.input({ key: await inputKey(), text: '¿y ahora?', kind: 'submit' })
  await new Promise((r) => (globalThis as any).setTimeout(r, 50))
  expect(JSON.stringify(await m.drawn())).toContain('respuesta 2')
  expect(asked[1]).toContain('R: respuesta 1')
  await m.press({ key: 'side-clear' })
  expect(JSON.stringify(await m.drawn())).not.toContain('respuesta 1')
})

test('SIDE CHAT: si todavía no hay turno para forkear lo dice en vez de quedarse esperando', async ($, on) => {
  on('model.fork', async () => ({ value: { isAnswered: false, reason: 'nothing-to-fork' } }) as any)
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await m.press({ key: 'tab-side' })
  const key = JSON.stringify(await m.drawn()).match(/side-q-\d+/)![0]
  await m.input({ key, text: '¿cómo viene?', kind: 'submit' })
  await new Promise((r) => (globalThis as any).setTimeout(r, 50))
  const drawn = JSON.stringify(await m.drawn())
  expect(drawn).toContain('todavía no hay')
  expect(drawn).not.toContain('pensando')
})

test('/nerv debug suma stats y los contadores suben sin cambiar las claves viejas', async ($, on) => {
  mock.env(on, { HOME: '/h', HC_TERMINAL_ID: 't1', CORTEX_RECALL_EVENTS: '/x/events.jsonl' })
  mock.store(on)
  const clock = mock.clock(on)
  on('session.id', async () => ({ value: 's1' }))
  on('session.cwd', async () => ({ value: '/tmp' }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  let viewMtime = 0
  let view = JSON.stringify({ active: 'sp1', spaces: { sp1: 't1' } })
  on('fs.stat', async (_$: any, e: any) => {
    if (e.path === '/h/.config/herdr-app/view.json') return { value: { kind: 'file', size: view.length, mtimeMs: viewMtime, isLink: false } }
    if (e.path === '/x/events.jsonl') return { value: { kind: 'file', size: 100, mtimeMs: 100, isLink: false } }
    return { value: { kind: 'file', size: 0, mtimeMs: 0, isLink: false } }
  })
  on('fs.read', async (_$: any, e: any) => {
    if (e.path === '/h/.config/herdr-app/view.json') return { value: view }
    return { value: '' }
  })
  const gh: string[][] = []
  const awk: string[][] = []
  const hc: string[][] = []
  on('process.run', async (_$: any, e: any) => {
    const a = e.argv as string[]
    if (a[0] === 'hc' && a[1] === 'get') { hc.push(a); return { value: { exitCode: 0, stdout: JSON.stringify({ labels: { 'herdr.space': 'sp1', 'herdr.tab': 't1' } }), stderr: '' } } }
    if (a[0] === 'git' && a[1] === 'remote') return { value: { exitCode: 0, stdout: 'https://github.com/gonzalonicolasr/nerv.git', stderr: '' } }
    if (a[0] === 'gh') { gh.push(a); if (a[1] === 'auth') return { value: { exitCode: 0, stdout: 'tok', stderr: '' } }; if (a[1] === 'api') return { value: { exitCode: 0, stdout: 'gonzalonicolasr', stderr: '' } }; return { value: { exitCode: 0, stdout: '[]', stderr: '' } } }
    if (a[0] === 'sh' && a[2]?.includes('awk')) { awk.push(a); return { value: { exitCode: 0, stdout: '2026-10-09\n1\n', stderr: '' } } }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  viewMtime = 1
  await clock.advance(2100)
  await clock.advance(1000)
  const st = await state($)
  expect(st.stats).toBeDefined()
  expect(Object.keys(st.stats).sort()).toEqual(['awkRuns', 'ghRuns', 'hcGets', 'invalidates'])
  expect(st.stats.ghRuns).toBeGreaterThan(0)
  expect(st.stats.awkRuns).toBeGreaterThan(0)
  expect(st.stats.hcGets).toBeGreaterThan(0)
  expect(st.stats.invalidates).toBeGreaterThan(0)
  // claves viejas intactas
  expect(st.paneOpen).toBe(true)
  expect(st.away).toBe(false)
  expect(typeof st.quiet).toBe('boolean')
  // triangulación: otro cambio de view.json (space activo distinto) vuelve a contar hc get y más ticks siguen invalidando
  view = JSON.stringify({ active: 'sp2', spaces: { sp1: 't1' } })
  viewMtime = 2
  await clock.advance(2100)
  const st2 = await state($)
  expect(st2.stats.hcGets).toBeGreaterThan(st.stats.hcGets)
  expect(st2.stats.invalidates).toBeGreaterThan(st.stats.invalidates)
})

test('imgSource devuelve el mismo objeto {png} para el mismo archivo y uno distinto para otro', () => {
  const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAJAAAACcCAYAAACQhCLDAAAAIGNIUg=='
  const cache: Record<string, { png: string }> = {}
  const a = pngSource(cache, 'a.png', PNG)
  const b = pngSource(cache, 'a.png', PNG)
  const c = pngSource(cache, 'b.png', PNG)
  expect(a).toEqual({ png: PNG })
  expect(a).toBe(b)
  expect(c).not.toBe(a)
})

test('en la Herdr app el panel no repite el cartel g0n: ya está en la barra lateral de la app', async ($, on) => {
  mock.env(on, { HOME: '/h', HC_TERMINAL_ID: 't1', CORTEX_RECALL_EVENTS: '/x/events.jsonl' })
  mock.store(on)
  const clock = mock.clock(on, { now: 0 })
  on('session.id', async () => ({ value: 's1' }))
  on('session.cwd', async () => ({ value: '/tmp' }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAJAAAACcCAYAAACQhCLDAAAAIGNIUg=='
  const reads: string[] = []
  on('fs.read', async (_$: any, e: any) => {
    if (String(e.path).includes('/assets/g0n/')) { reads.push(String(e.path)); return { value: { base64: PNG } } }
    return { value: '' }
  })
  on('fs.stat', async () => ({ value: { kind: 'file', size: 0, mtimeMs: 0, isLink: false } }))
  on('process.run', async () => ({ value: { exitCode: 1, stdout: '', stderr: '' } }))
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  const sources: any[] = []
  on('ui.resolve', { component: 'Pane' }, async (_$: any, e: any, next: any) => {
    const table = await next(e)
    const Image = table.Image
    return { ...table, Image: (props: any) => { if (props.key === 'g0n-img') sources.push(props.source); return Image ? Image(props) : undefined } }
  })
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })

  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await clock.advance(1000)
  const drawn = JSON.stringify(await m.drawn())
  expect(drawn).toContain(' NERV ')
  expect(drawn).not.toContain('g0n-img')
  expect(sources).toHaveLength(0)
  expect(reads).toHaveLength(0)
  await m.unmount()
})

test('checkAppFocus cachea labels: sin cambio de estado no vuelve a llamar a hc get y el flip sí', async ($, on) => {
  mock.env(on, { HOME: '/h', HC_TERMINAL_ID: 't1', CORTEX_RECALL_EVENTS: '/x/events.jsonl' })
  mock.store(on)
  const clock = mock.clock(on)
  on('session.id', async () => ({ value: 's1' }))
  on('session.cwd', async () => ({ value: '/tmp' }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  let viewMtime = 0
  let view = JSON.stringify({ active: 'sp1', spaces: { sp1: 't1' } })
  on('fs.stat', async (_$: any, e: any) => {
    if (e.path === '/h/.config/herdr-app/view.json') return { value: { kind: 'file', size: view.length, mtimeMs: viewMtime, isLink: false } }
    if (e.path === '/x/events.jsonl') return { value: { kind: 'file', size: 100, mtimeMs: 100, isLink: false } }
    return { value: { kind: 'file', size: 0, mtimeMs: 0, isLink: false } }
  })
  on('fs.read', async (_$: any, e: any) => {
    if (e.path === '/h/.config/herdr-app/view.json') return { value: view }
    return { value: '' }
  })
  const hc: string[][] = []
  on('process.run', async (_$: any, e: any) => {
    const a = e.argv as string[]
    if (a[0] === 'hc' && a[1] === 'get') { hc.push(a); return { value: { exitCode: 0, stdout: JSON.stringify({ labels: { 'herdr.space': 'sp1', 'herdr.tab': 't1' } }), stderr: '' } } }
    if (a[0] === 'git' && a[1] === 'remote') return { value: { exitCode: 0, stdout: 'https://github.com/gonzalonicolasr/nerv.git', stderr: '' } }
    if (a[0] === 'gh') { if (a[1] === 'auth') return { value: { exitCode: 0, stdout: 'tok', stderr: '' } }; if (a[1] === 'api') return { value: { exitCode: 0, stdout: 'gonzalonicolasr', stderr: '' } }; return { value: { exitCode: 0, stdout: '[]', stderr: '' } } }
    if (a[0] === 'sh' && a[2]?.includes('awk')) return { value: { exitCode: 0, stdout: '2026-10-09\n1\n', stderr: '' } }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  expect(hc.length).toBe(1)
  expect((await state($)).away).toBe(false)
  viewMtime = 1
  await clock.advance(2100)
  expect(hc.length).toBe(1)
  view = JSON.stringify({ active: 'sp2', spaces: { sp1: 't1' } })
  viewMtime = 2
  await clock.advance(2100)
  expect(hc.length).toBe(2)
  expect((await state($)).away).toBe(true)
})

test('checkAppFocus si hc get falla no cambia away y reintenta al volver a funcionar', async ($, on) => {
  mock.env(on, { HOME: '/h', HC_TERMINAL_ID: 't1', CORTEX_RECALL_EVENTS: '/x/events.jsonl' })
  mock.store(on)
  const clock = mock.clock(on)
  on('session.id', async () => ({ value: 's1' }))
  on('session.cwd', async () => ({ value: '/tmp' }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  let viewMtime = 0
  let view = JSON.stringify({ active: 'sp1', spaces: { sp1: 't1' } })
  on('fs.stat', async (_$: any, e: any) => {
    if (e.path === '/h/.config/herdr-app/view.json') return { value: { kind: 'file', size: view.length, mtimeMs: viewMtime, isLink: false } }
    if (e.path === '/x/events.jsonl') return { value: { kind: 'file', size: 100, mtimeMs: 100, isLink: false } }
    return { value: { kind: 'file', size: 0, mtimeMs: 0, isLink: false } }
  })
  on('fs.read', async (_$: any, e: any) => {
    if (e.path === '/h/.config/herdr-app/view.json') return { value: view }
    return { value: '' }
  })
  let hcOk = true
  const hc: string[][] = []
  on('process.run', async (_$: any, e: any) => {
    const a = e.argv as string[]
    if (a[0] === 'hc' && a[1] === 'get') { hc.push(a); return { value: { exitCode: hcOk ? 0 : 1, stdout: hcOk ? JSON.stringify({ labels: { 'herdr.space': 'sp1', 'herdr.tab': 't1' } }) : '', stderr: '' } } }
    if (a[0] === 'git' && a[1] === 'remote') return { value: { exitCode: 0, stdout: 'https://github.com/gonzalonicolasr/nerv.git', stderr: '' } }
    if (a[0] === 'gh') { if (a[1] === 'auth') return { value: { exitCode: 0, stdout: 'tok', stderr: '' } }; if (a[1] === 'api') return { value: { exitCode: 0, stdout: 'gonzalonicolasr', stderr: '' } }; return { value: { exitCode: 0, stdout: '[]', stderr: '' } } }
    if (a[0] === 'sh' && a[2]?.includes('awk')) return { value: { exitCode: 0, stdout: '2026-10-09\n1\n', stderr: '' } }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  expect((await state($)).away).toBe(false)
  hcOk = false
  view = JSON.stringify({ active: 'sp2', spaces: { sp1: 't1' } })
  viewMtime = 1
  await clock.advance(2100)
  expect((await state($)).away).toBe(false)
  expect(hc.length).toBe(2)
  hcOk = true
  await clock.advance(2100)
  expect((await state($)).away).toBe(true)
  expect(hc.length).toBe(3)
})

test('away no llama gh/sh y al volver lee cortex y refresca PRs; beat sigue escribiendo', async ($, on) => {
  mock.env(on, { HOME: '/h', HC_TERMINAL_ID: 't1', CORTEX_RECALL_EVENTS: '/x/events.jsonl' })
  const clock = mock.clock(on)
  const mem: Record<string, unknown> = {}
  const sets: string[] = []
  on('store.get', async (_$: any, e: any) => ({ value: mem[e.key] }))
  on('store.set', async (_$: any, e: any) => {
    sets.push(e.key)
    mem[e.key] = e.value
    return { value: undefined }
  })
  on('store.delete', async (_$: any, e: any) => {
    delete mem[e.key]
    return { value: undefined }
  })
  on('session.id', async () => ({ value: 's1' }))
  let cwdNow = ''
  on('session.cwd', async () => ({ value: cwdNow }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  let viewMtime = 0
  let view = JSON.stringify({ active: 'sp1', spaces: { sp1: 't1' } })
  let cxStat = 0
  on('fs.stat', async (_$: any, e: any) => {
    if (e.path === '/h/.config/herdr-app/view.json') return { value: { kind: 'file', size: view.length, mtimeMs: viewMtime, isLink: false } }
    if (e.path === '/x/events.jsonl') { cxStat += 1; return { value: { kind: 'file', size: 100 + cxStat, mtimeMs: 100 + cxStat, isLink: false } } }
    return { value: { kind: 'file', size: 0, mtimeMs: 0, isLink: false } }
  })
  on('fs.read', async (_$: any, e: any) => {
    if (e.path === '/h/.config/herdr-app/view.json') return { value: view }
    return { value: '' }
  })
  const gh: string[][] = []
  const awk: string[][] = []
  on('process.run', async (_$: any, e: any) => {
    const a = e.argv as string[]
    if (a[0] === 'hc' && a[1] === 'get') return { value: { exitCode: 0, stdout: JSON.stringify({ labels: { 'herdr.space': 'sp1', 'herdr.tab': 't1' } }), stderr: '' } }
    if (a[0] === 'git' && a[1] === 'remote') return { value: { exitCode: 0, stdout: 'https://github.com/gonzalonicolasr/nerv.git', stderr: '' } }
    if (a[0] === 'gh') { gh.push(a); if (a[1] === 'auth') return { value: { exitCode: 0, stdout: 'tok', stderr: '' } }; if (a[1] === 'api') return { value: { exitCode: 0, stdout: 'gonzalonicolasr', stderr: '' } }; return { value: { exitCode: 0, stdout: '[]', stderr: '' } } }
    if (a[0] === 'sh' && a[2]?.includes('awk')) { awk.push(a); return { value: { exitCode: 0, stdout: '2026-10-09\n1\n', stderr: '' } } }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  // oculta la terminal (space activo distinto)
  view = JSON.stringify({ active: 'sp2', spaces: { sp1: 't1' } })
  viewMtime = 1
  await clock.advance(2100)
  expect((await state($)).away).toBe(true)
  const ghAt = gh.length
  const awkAt = awk.length
  const sessionsAt = sets.filter((k) => k === 'sessions').length
  cwdNow = '/tmp'
  await clock.advance(181000)
  expect(gh.length).toBe(ghAt)
  expect(awk.length).toBe(awkAt)
  expect(sets.filter((k) => k === 'sessions').length).toBeGreaterThan(sessionsAt)
  // vuelve a la vista: un readCortexLog y un refreshPRs
  view = JSON.stringify({ active: 'sp1', spaces: { sp1: 't1' } })
  viewMtime = 2
  await clock.advance(2100)
  expect((await state($)).away).toBe(false)
  expect(awk.length).toBe(awkAt + 1)
  expect(gh.length).toBe(ghAt + 3)
})

test('away: al volver sin 180 s no refresca PRs (prsAt reciente) pero sí lee cortex', async ($, on) => {
  mock.env(on, { HOME: '/h', HC_TERMINAL_ID: 't1', CORTEX_RECALL_EVENTS: '/x/events.jsonl' })
  const clock = mock.clock(on)
  const mem: Record<string, unknown> = {}
  on('store.get', async (_$: any, e: any) => ({ value: mem[e.key] }))
  on('store.set', async (_$: any, e: any) => {
    mem[e.key] = e.value
    return { value: undefined }
  })
  on('store.delete', async (_$: any, e: any) => {
    delete mem[e.key]
    return { value: undefined }
  })
  on('session.id', async () => ({ value: 's1' }))
  on('session.cwd', async () => ({ value: '/tmp' }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  let viewMtime = 0
  let view = JSON.stringify({ active: 'sp1', spaces: { sp1: 't1' } })
  let cxStat = 0
  on('fs.stat', async (_$: any, e: any) => {
    if (e.path === '/h/.config/herdr-app/view.json') return { value: { kind: 'file', size: view.length, mtimeMs: viewMtime, isLink: false } }
    if (e.path === '/x/events.jsonl') { cxStat += 1; return { value: { kind: 'file', size: 100 + cxStat, mtimeMs: 100 + cxStat, isLink: false } } }
    return { value: { kind: 'file', size: 0, mtimeMs: 0, isLink: false } }
  })
  on('fs.read', async (_$: any, e: any) => {
    if (e.path === '/h/.config/herdr-app/view.json') return { value: view }
    return { value: '' }
  })
  const gh: string[][] = []
  const awk: string[][] = []
  on('process.run', async (_$: any, e: any) => {
    const a = e.argv as string[]
    if (a[0] === 'hc' && a[1] === 'get') return { value: { exitCode: 0, stdout: JSON.stringify({ labels: { 'herdr.space': 'sp1', 'herdr.tab': 't1' } }), stderr: '' } }
    if (a[0] === 'git' && a[1] === 'remote') return { value: { exitCode: 0, stdout: 'https://github.com/gonzalonicolasr/nerv.git', stderr: '' } }
    if (a[0] === 'gh') { gh.push(a); if (a[1] === 'auth') return { value: { exitCode: 0, stdout: 'tok', stderr: '' } }; if (a[1] === 'api') return { value: { exitCode: 0, stdout: 'gonzalonicolasr', stderr: '' } }; return { value: { exitCode: 0, stdout: '[]', stderr: '' } } }
    if (a[0] === 'sh' && a[2]?.includes('awk')) { awk.push(a); return { value: { exitCode: 0, stdout: '2026-10-09\n1\n', stderr: '' } } }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  view = JSON.stringify({ active: 'sp2', spaces: { sp1: 't1' } })
  viewMtime = 1
  await clock.advance(2100)
  expect((await state($)).away).toBe(true)
  expect(gh.length).toBeGreaterThan(0) // refreshPRs del start ya corrió y dejó prsAt reciente
  const ghAt = gh.length
  const awkAt = awk.length
  await clock.advance(20000)
  expect(gh.length).toBe(ghAt)
  expect(awk.length).toBe(awkAt)
  view = JSON.stringify({ active: 'sp1', spaces: { sp1: 't1' } })
  viewMtime = 2
  await clock.advance(2100)
  expect((await state($)).away).toBe(false)
  expect(awk.length).toBe(awkAt + 1)
  expect(gh.length).toBe(ghAt)
})

const ORQ_JSON = {
  orquestador: 'working',
  workers: [
    { nombre: 'login', tipo: 'coding', estado: 'working', signo: '●', texto: 'trabaja', tiempo: '2 min', skills: [{ nombre: 'git-workflow', cargada: true, reciente: false }, { nombre: 'test-driven-fix', cargada: false, reciente: true }] },
    { nombre: 'carrito', tipo: 'review', estado: 'done', signo: '✓', texto: 'terminó', tiempo: 'en 1 min', skills: [] },
  ],
}
const orqText = (ancho: number, st: any, cuadro = 0) => orqDraw(ancho, st, cuadro).rows.map((r) => r.map((c) => c.ch).join('').trimEnd())

test('orqParse lee el contrato, corta en 3 workers y descarta lo que no entiende', () => {
  const st = orqParse(JSON.stringify(ORQ_JSON))!
  expect(st.orquestador).toBe('working')
  expect(st.workers.map((w) => w.nombre)).toEqual(['login', 'carrito'])
  expect(st.workers[0].skills[1]).toEqual({ nombre: 'test-driven-fix', cargada: false, reciente: true })
  expect(orqParse('no es json')).toBeUndefined()
  expect(orqParse('{"orquestador":"idle"}')).toBeUndefined()
  expect(orqParse('[]')).toBeUndefined()
  const raro = orqParse(JSON.stringify({ orquestador: 'volando', workers: [{ nombre: 'a', estado: 7 }, { tipo: 'sin nombre' }, { nombre: 'b' }, { nombre: 'c' }, { nombre: 'd' }] }))!
  expect(raro.orquestador).toBe('unknown')
  expect(raro.workers.map((w) => w.nombre)).toEqual(['a', 'b', 'c'])
  expect(raro.workers[0]).toEqual({ nombre: 'a', tipo: '', estado: 'unknown', signo: '', texto: '', tiempo: '', skills: [] })
})

test('orqLive sólo es verdad con algo trabajando o bloqueado', () => {
  expect(orqLive(undefined)).toBe(false)
  expect(orqLive({ orquestador: 'idle', workers: [] })).toBe(false)
  expect(orqLive({ orquestador: 'working', workers: [] })).toBe(true)
  const w = (estado: any) => ({ orquestador: 'idle' as const, workers: [{ nombre: 'a', tipo: '', estado, signo: '', texto: '', tiempo: '', skills: [] }] })
  expect(orqLive(w('done'))).toBe(false)
  expect(orqLive(w('working'))).toBe(true)
  expect(orqLive(w('blocked'))).toBe(true)
})

test('el paquete baja del conector por el tronco y entra a la tarjeta, con un pulso de 3 celdas', () => {
  expect(orqPath(3, 2, 4)).toEqual([[3, 2], [3, 3], [3, 4], [4, 4], [5, 4]])
  expect(orqPath(3, 2, 11).slice(-3)).toEqual([[3, 11], [4, 11], [5, 11]])
  expect(orqPulse(6, 0)).toEqual([0])
  expect(orqPulse(6, 3)).toEqual([1, 2, 3])
  expect(orqPulse(6, 7)).toEqual([5])
  expect(orqPulse(6, 8)).toEqual([])
  expect(orqPulse(6, 10)).toEqual([0])
})

test('la barra de actividad va y vuelve, y el resumen cuenta por estado', () => {
  expect(orqBar(6, 0)).toBe('▰▰▰▰▱▱')
  expect(orqBar(6, 2)).toBe('▱▱▰▰▰▰')
  expect(orqBar(6, 3)).toBe('▱▰▰▰▰▱')
  expect(orqBar(6, 4)).toBe('▰▰▰▰▱▱')
  expect(orqBar(3, 5)).toBe('▰▰▰')
  expect(orqBar(0, 1)).toBe('')
  const w = (estado: any) => ({ nombre: estado, tipo: '', estado, signo: '', texto: '', tiempo: '', skills: [] })
  expect(orqResumen({ orquestador: 'idle', workers: [] })).toBe('sin workers')
  expect(orqResumen({ orquestador: 'idle', workers: [w('working'), w('working'), w('done'), w('done'), w('blocked'), w('idle')] })).toBe('2 trabajando · 1 te necesita · 2 listos · 1 en espera')
})

test('orqDraw: cartel arriba, tronco con una rama por worker y cada worker en su tarjeta', () => {
  const st = orqParse(JSON.stringify(ORQ_JSON))!
  const { rows, hits } = orqDraw(44, st, 0)
  expect(orqText(44, st)).toEqual([
    ' ╭─ ◆ orquestador ───────────────────── ⠋ ╮',
    ' │ pensando · 1 trabajando · 1 listo      │',
    ' ╰─┬──────────────────────────────────────╯',
    '   ┃',
    '   ┣━▶╭─ ● login ────────────────── 2 min ╮',
    '   ┃  │ coding · trabaja                  │',
    '   ┃  │ ▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱ │',
    '   ┃  │ ┄ git-workflow                    │',
    '   ┃  │ ┄ test-driven-fix                 │',
    '   ┃  ╰───────────────────────────────────╯',
    '   ┃',
    '   ┗━▶╭─ ✓ carrito ───────────── en 1 min ╮',
    '      │ review · terminó                  │',
    '      ╰───────────────────────────────────╯',
  ])
  expect(hits).toEqual([{ nombre: 'login', y: 4, x0: 9, x1: 16 }, { nombre: 'carrito', y: 11, x0: 9, x1: 18 }])
  expect(rows[4][9]).toEqual({ ch: '●', tone: 'work', bold: true })
  expect(rows[4][6].tone).toBe('work')
  expect(rows[11][6].tone).toBe('ok')
  expect(rows[5][8].tone).toBe('dim')
  expect(rows[5][17]).toEqual({ ch: 't', tone: 'work', bold: false })
  expect(rows[6][8].tone).toBe('work')
  expect(rows[7][8]).toEqual({ ch: '┄', tone: 'text', bold: false })
  expect(rows[8][8]).toEqual({ ch: '┄', tone: 'hot', bold: true })
  const largo = { ...st, workers: [{ ...st.workers[1], nombre: 'un-nombre-que-no-entra-ni-a-palos' }] }
  expect(orqText(30, largo)[4]).toBe('   ┗━▶╭─ ✓ un-nom… en 1 min ╮')
  expect(orqDraw(30, largo, 0).hits[0]).toEqual({ nombre: 'un-nombre-que-no-entra-ni-a-palos', y: 4, x0: 9, x1: 18 })
})

test('orqDraw: el cartel brilla mientras piensa, baja un paquete por worker que trabaja y el bloqueado parpadea', () => {
  const st = orqParse(JSON.stringify(ORQ_JSON))!
  const lit = (s: any, cuadro: number, tone: string) => orqDraw(44, s, cuadro).rows.flatMap((r, y) => r.flatMap((c, x) => (c.tone === tone && y > 2 ? [[x, y]] : [])))
  // Paquete de login: baja por el tronco (columna 3) y entra a la tarjeta por la fila 4.
  expect(lit(st, 1, 'pulse')).toEqual([[3, 3]])
  expect(orqDraw(44, st, 1).rows[3][3].ch).toBe('●')
  expect(lit(st, 4, 'pulse')).toEqual([[5, 4]])
  expect(lit(st, 4, 'tail')).toEqual([[3, 4], [4, 4]])
  expect(lit(st, 7, 'pulse')).toEqual([])
  // Brillo del cartel: tres celdas del borde, la última más fuerte.
  const borde = orqDraw(44, st, 0).rows.slice(0, 3).flatMap((r, y) => r.flatMap((c, x) => (c.tone === 'pulse' || c.tone === 'tail' ? [[x, y, c.tone]] : [])))
  // (3, 2) es el conector: de ahí sale el paquete de login.
  expect(borde).toEqual([[1, 0, 'tail'], [2, 0, 'tail'], [3, 0, 'pulse'], [3, 2, 'pulse']])
  const quieto = { ...st, orquestador: 'idle' as const, workers: [st.workers[1]] }
  expect(orqDraw(44, quieto, 0).rows.flat().some((c) => c.tone === 'pulse' || c.tone === 'tail')).toBe(false)
  const bloq = { ...st, workers: [{ ...st.workers[1], estado: 'blocked' as const }] }
  expect(orqText(44, bloq, 3)[6]).toBe('      │ ⚠ te necesita · tocá para ir      │')
  expect(orqDraw(44, bloq, 0).rows[4][9].tone).toBe('dim')
  expect(orqDraw(44, bloq, 3).rows[4][9].tone).toBe('bad')
  expect(orqDraw(44, bloq, 3).rows[4][6].tone).toBe('bad')
})

test('orqDraw sin datos, sin workers y con muchas skills', () => {
  expect(orqText(44, undefined)).toEqual([' ╭─ ◆ orquestador ────────────────────────╮', ' │ sin datos                              │', ' ╰────────────────────────────────────────╯'])
  expect(orqText(44, { orquestador: 'idle', workers: [] }).slice(1)).toEqual([
    ' │ sin workers                            │',
    ' ╰─┬──────────────────────────────────────╯',
    '   ┆',
    '   ┆  pedile algo al orquestador',
    '   ┆  y acá vas a ver el flujo',
  ])
  const sk = 'abcdef'.split('').map((nombre) => ({ nombre, cargada: false, reciente: false }))
  const txt = orqText(44, { orquestador: 'idle', workers: [{ nombre: 'a', tipo: '', estado: 'idle', signo: '', texto: '', tiempo: '', skills: sk }] })
  expect(txt.slice(4, 10).map((l) => l.slice(0, 15).trimEnd())).toEqual(['   ┗━▶╭─ a ────', '      │ ┄ a', '      │ ┄ b', '      │ ┄ c', '      │ ┄ +3 má', '      ╰────────'])
})

const orqSession = async ($: any, on: any, env: Record<string, string>, stdout: () => string, sesion = '') => {
  mock.env(on, { HOME: '/h', ...env })
  if (sesion) on('session.id', async () => ({ value: sesion }))
  mock.store(on)
  const clock = mock.clock(on)
  const asked: string[][] = []
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  on('process.run', async (_$: any, e: any) => {
    asked.push(e.argv)
    return e.argv[0] === '/x/estado' || e.argv[0] === 'orq' ? { value: { exitCode: 0, stdout: stdout(), stderr: '' } } : { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  return { m, clock, asked }
}

test('la sesión del orquestador arranca en la solapa ORQ: sólo solapas y flujo, que se refresca solo', async ($, on) => {
  let out = JSON.stringify(ORQ_JSON)
  const { m, clock, asked } = await orqSession($, on, { ORQ_ROL: 'orquestador', ORQ_ESTADO_CMD: '/x/estado --json' }, () => out)
  const estados = () => asked.filter((a) => a.join(' ') === '/x/estado --json').length
  expect(estados()).toBe(1)
  let text = JSON.stringify(await m.drawn())
  expect(await m.find({ key: 'flap-nerv' })).toBeDefined()
  expect(text).toContain('◆ ORQ')
  expect(await m.find({ key: 'orq-flow' })).toBeDefined()
  expect(text).toContain('◆ orquestador')
  expect(text).toContain('login')
  expect(text).toContain('git-workflow')
  // La fila del botón sigue después del nombre: el borde y el tiempo de la tarjeta también se dibujan.
  expect(text).toContain('en 1 min')
  for (const k of ['g0n', 'tab-magi', 'tab-git', 'effort-foot']) expect(await m.find({ key: k })).toBeUndefined()
  expect(text).toMatch(/assets\/orq\/eva01\/\d\d\.png/)
  expect(text).not.toContain('g0n-img')
  expect(text.indexOf('flap-orq')).toBeLessThan(text.indexOf('orq-img'))
  expect(text.indexOf('orq-img')).toBeLessThan(text.indexOf('orq-flow'))
  expect(text).not.toContain('メルキオール')
  expect(text).not.toContain('EFFORT')
  await m.press({ key: 'orq-w-carrito' })
  expect(asked.some((a) => a.join(' ') === 'orq enfocar carrito')).toBe(true)
  out = 'roto'
  await clock.advance(1000)
  expect(estados()).toBe(2)
  text = JSON.stringify(await m.drawn())
  expect(text).toContain('sin datos')
  expect(text).not.toContain('login')
})

test('la solapa NERV muestra NERV entero sin flujo ni pedidos de estado, y ORQ vuelve con un pedido al entrar', async ($, on) => {
  const { m, clock, asked } = await orqSession($, on, { ORQ_ROL: 'orquestador', ORQ_ESTADO_CMD: '/x/estado --json' }, () => JSON.stringify(ORQ_JSON))
  const estados = () => asked.filter((a) => a[0] === '/x/estado').length
  await m.press({ key: 'flap-nerv' })
  let text = JSON.stringify(await m.drawn())
  expect(text).toContain('◆ NERV')
  expect(text).not.toContain('◆ ORQ')
  expect(await m.find({ key: 'orq-flow' })).toBeUndefined()
  expect(text).not.toContain('◆ orquestador')
  expect(text).toContain('メルキオール')
  expect(text).toContain('g0n-img')
  expect(text).not.toContain('orq-img')
  expect(await m.find({ key: 'tab-git' })).toBeDefined()
  expect(await m.find({ key: 'effort-foot' })).toBeDefined()
  const antes = estados()
  await clock.advance(3000)
  expect(estados()).toBe(antes)
  await m.press({ key: 'flap-orq' })
  expect(estados()).toBe(antes + 1)
  expect(await m.find({ key: 'orq-flow' })).toBeDefined()
  expect(await m.find({ key: 'tab-git' })).toBeUndefined()
  await $.command.run({ command: 'nerv', args: 'git' })
  expect(await m.find({ key: 'orq-flow' })).toBeUndefined()
  expect(JSON.stringify(await m.drawn())).toContain('◆ GIT')
  await $.command.run({ command: 'nerv', args: 'orq' })
  expect(await m.find({ key: 'orq-flow' })).toBeDefined()
})

test('solapas: arriba sólo NERV | ORQ; adentro de ORQ, FLUJO | MODELOS con FLUJO siempre por defecto', async ($, on) => {
  const { m, asked } = await orqSession($, on, { ORQ_ROL: 'orquestador', ORQ_ESTADO_CMD: '/x/estado --json' }, () => JSON.stringify(ORQ_JSON))
  const fila = (tree: any, key: string) => JSON.stringify(ytFind(tree, (k) => k === key)[0] ?? null)
  let tree = await m.drawn()
  // Arriba: dos solapas, ORQ marcada; MODELOS ya no está ahí.
  expect(await m.find({ key: 'flap-nerv' })).toBeDefined()
  expect(await m.find({ key: 'flap-modelos' })).toBeUndefined()
  expect(fila(tree, 'flaps')).toContain('◆ ORQ')
  expect(fila(tree, 'flaps')).not.toContain('MODELOS')
  // Adentro: FLUJO (marcada, la de arranque) y MODELOS, numeradas como las de NERV.
  expect(fila(tree, 'orqtabs')).toContain('◆ FLUJO')
  expect(fila(tree, 'orqtabs')).toContain('MODELOS')
  expect(fila(tree, 'orqtabs')).not.toContain('◆ MODELOS')
  expect((await m.find({ key: 'orqtab-flujo' })).props.hotkey).toBe('1')
  expect((await m.find({ key: 'orqtab-modelos' })).props.hotkey).toBe('2')
  expect(await m.find({ key: 'orq-flow' })).toBeDefined()
  await m.press({ key: 'orqtab-modelos' })
  tree = await m.drawn()
  expect(fila(tree, 'orqtabs')).toContain('◆ MODELOS')
  expect(fila(tree, 'flaps')).toContain('◆ ORQ')
  expect(await m.find({ key: 'orq-flow' })).toBeUndefined()
  expect(asked.some((a) => a.join(' ') === 'orq modelos --json')).toBe(true)
  await m.press({ key: 'orqtab-flujo' })
  expect(await m.find({ key: 'orq-flow' })).toBeDefined()
  // Salir a NERV y volver a ORQ abre siempre FLUJO, aunque la última vez quedó en MODELOS.
  await m.press({ key: 'orqtab-modelos' })
  await m.press({ key: 'flap-nerv' })
  expect(await m.find({ key: 'orqtabs' })).toBeUndefined()
  await m.press({ key: 'flap-orq' })
  expect(fila(await m.drawn(), 'orqtabs')).toContain('◆ FLUJO')
  expect(await m.find({ key: 'orq-flow' })).toBeDefined()
  await m.press({ key: 'orqtab-modelos' })
  await $.command.run({ command: 'nerv', args: 'orq' })
  expect(await m.find({ key: 'orq-flow' })).toBeDefined()
})

test('en una superficie sin imagen la solapa ORQ muestra el flujo sin cartel', async ($, on) => {
  const { m } = await orqSession($, on, { ORQ_ROL: 'orquestador', ORQ_ESTADO_CMD: '/x/estado --json' }, () => JSON.stringify(ORQ_JSON))
  await m.unmount()
  const d: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'desktop', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  const text = JSON.stringify(await d.drawn())
  expect(text).not.toContain('orq-img')
  expect(text).toContain('◆ ORQ')
  expect(text).toContain('◆ orquestador')
  expect(text).toContain('login')
})

test('en cualquier sesión, si orq contesta aparecen las solapas: arranca en NERV y el estado se pide sólo al entrar a ORQ', async ($, on) => {
  const { m, clock, asked } = await orqSession($, on, {}, () => JSON.stringify(ORQ_JSON))
  const estados = () => asked.filter((a) => a.join(' ') === 'orq estado --json').length
  await clock.advance(3000)
  expect(estados()).toBe(1)
  expect(await m.find({ key: 'flap-orq' })).toBeDefined()
  // Arriba sólo NERV | ORQ: MODELOS vive adentro de ORQ.
  expect(await m.find({ key: 'flap-modelos' })).toBeUndefined()
  expect(await m.find({ key: 'orqtabs' })).toBeUndefined()
  expect(await m.find({ key: 'orq-flow' })).toBeUndefined()
  let text = JSON.stringify(await m.drawn())
  expect(text).toContain('◆ NERV')
  expect(text).toContain('メルキオール')
  await $.command.run({ command: 'nerv', args: 'orq' })
  expect(await m.find({ key: 'orq-flow' })).toBeDefined()
  expect(estados()).toBe(2)
  text = JSON.stringify(await m.drawn())
  expect(text).toContain('◆ orquestador')
  expect(text).toContain('login')
})

test('en la Herdr app el cartel de ORQ queda quieto y guarda su lugar mientras carga', async ($, on) => {
  const leidos: string[] = []
  // PNG mínimo de 1x1 (la cabecera tiene que ser de PNG de verdad).
  const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  on('fs.read', async (_$: any, e: any) => {
    leidos.push(e.path)
    return e.path.endsWith('.png') ? { value: { base64: PNG } } : { value: '' }
  })
  const { m, clock } = await orqSession($, on, { ORQ_ROL: 'orquestador', ORQ_ESTADO_CMD: '/x/estado --json', HC_TERMINAL_ID: 't1' }, () => JSON.stringify(ORQ_JSON))
  expect(await m.find({ key: 'orq-banner' })).toBeDefined()
  const fuentes = new Set<string>()
  for (let i = 0; i < 12; i++) {
    await clock.advance(140)
    expect(await m.find({ key: 'orq-banner' })).toBeDefined()
    for (const f of leidos.filter((x) => x.includes('/assets/orq/'))) fuentes.add(f)
  }
  expect([...fuentes].map((f) => f.split('/').pop())).toEqual(['00.png'])
})

test('cada sesión pide sólo sus workers y es su propio orquestador', async ($, on) => {
  const { m, clock, asked } = await orqSession($, on, {}, () => JSON.stringify({ ...ORQ_JSON, orquestador: 'idle' }), 'ses-1')
  await clock.advance(3000)
  await $.command.run({ command: 'nerv', args: 'orq' })
  const pedidos = asked.filter((a) => a[0] === 'orq')
  expect(pedidos.length).toBeGreaterThan(0)
  for (const a of pedidos) expect(a).toEqual(['orq', 'estado', '--json', '--sesion', 'ses-1'])
  expect(JSON.stringify(await m.drawn())).toContain('login')
})

test('orqVista: en modo propio el orquestador piensa cuando la sesión trabaja; con comando propio no se toca', () => {
  const st = orqParse(JSON.stringify({ ...ORQ_JSON, orquestador: 'working' }))!
  expect(orqVista(st, true, false)!.orquestador).toBe('idle')
  expect(orqVista(st, true, true)!.orquestador).toBe('working')
  expect(orqVista({ ...st, orquestador: 'idle' }, false, true)!.orquestador).toBe('idle')
  expect(orqVista(undefined, true, true)).toBeUndefined()
})

const orqApagado = async ($: any, on: any, env: Record<string, string>, out: string) => {
  const { m, clock, asked } = await orqSession($, on, env, () => out)
  await clock.advance(3000)
  await $.command.run({ command: 'nerv', args: 'orq' })
  for (const k of ['flaps', 'flap-orq', 'orqtabs', 'orq-flow']) expect(await m.find({ key: k })).toBeUndefined()
  const text = JSON.stringify(await m.drawn())
  expect(text).not.toContain('◆ orquestador')
  expect(text).not.toContain('assets/orq')
  expect(text).toContain('メルキオール')
  return asked
}

test('sin orq que conteste no hay solapas ni flujo y /nerv orq no hace nada', async ($, on) => {
  await orqApagado($, on, {}, 'no hay orq')
})

test('con NERV_ORQ=0 no hay solapas ni se le pregunta a orq', async ($, on) => {
  const asked = await orqApagado($, on, { NERV_ORQ: '0' }, JSON.stringify(ORQ_JSON))
  expect(asked.some((a: string[]) => a[0] === 'orq')).toBe(false)
})

// MODELOS del orquestador con un orq simulado: `orq modelos --json` según el contrato y set/reset con el código que se pida.
const OM_JSON = {
  tipos: ['backend', 'coding', 'frontend'],
  efforts: ['auto', 'low', 'medium', 'high', 'xhigh', 'max'],
  config: {
    '*': { modelo: 'sonnet', effort: 'medium', origen: 'tipo' },
    backend: { modelo: 'priv8/claude-opus-5-5', effort: 'high', origen: 'tipo' },
    coding: { modelo: 'sonnet', effort: 'medium', origen: 'default' },
    frontend: { modelo: 'wibond/claude-opus-5-5', effort: '', origen: 'tipo' },
  },
  aliases: ['opus', 'sonnet', 'haiku', 'fable'],
}
const OM_IDS = ['priv8/claude-opus-5-5', 'priv8/claude-sonnet-5-5', 'wibond/claude-opus-5-5', 'ag3/gemini-3.8-flash-high', 'claude-sonnet-5', ...Array.from({ length: 13 }, (_, i) => `nan/m${i}`)]
// Perfiles simulados con estado, como los guarda orq: usar/guardar/duplicar/borrar cambian lo que se relee después.
const OP_FABRICA = [
  { nombre: 'turbo', descripcion: 'Lo más rápido.', config: {} },
  { nombre: 'barato', descripcion: 'Barato: Gemini construye.', config: {} },
  { nombre: 'solo-claude', descripcion: 'Opus, Sonnet y Haiku.', config: {} },
]
type OpEstado = { activo: string | null; modificado: boolean; mios: string[] }
const omSession = async ($: any, on: any, opts: { code?: number; stderr?: string; json?: any; perfiles?: Partial<OpEstado>; nombre?: string; aviso?: string; perfilesRoto?: boolean } = {}) => {
  mock.env(on, { HOME: '/h' })
  mock.store(on)
  const clock = mock.clock(on)
  const asked: string[][] = []
  const pedidos: any[] = []
  const st: OpEstado = { activo: 'turbo', modificado: false, mios: ['mio'], ...opts.perfiles }
  const fab = (n: string) => OP_FABRICA.some((p) => p.nombre === n)
  const perfilesJson = () => ({ activo: st.activo, modificado: st.modificado, fabrica: OP_FABRICA, mios: st.mios.map((nombre) => ({ nombre, config: {} })) })
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  // $.ui.ask llega como la herramienta AskUserQuestion: se contesta con el nombre pedido o el sugerido.
  on('tool.call', { tool: 'AskUserQuestion' }, (_$: any, e: any) => {
    const q = e.questions[0]
    pedidos.push({ question: q.question, options: q.options.map((o: any) => o.label) })
    return { result: { answers: { [q.question]: opts.nombre ?? q.options[0].label } } }
  })
  on('fs.read', async () => ({ value: '' }))
  on('process.run', async (_$: any, e: any) => {
    const a: string[] = e.argv
    asked.push(a)
    const ok = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '' } })
    if (a[0] === 'sh' && a[2]?.includes('/v1/models')) return ok(JSON.stringify({ data: OM_IDS.map((id) => ({ id })) }))
    if (a[0] === 'orq' && a[1] === 'estado') return ok(JSON.stringify(ORQ_JSON))
    if (a.join(' ') === 'orq modelos --json') return ok(JSON.stringify(opts.json ?? { ...OM_JSON, perfil: { activo: st.activo, modificado: st.modificado } }))
    if (a.join(' ') === 'orq perfiles --json') return ok(opts.perfilesRoto ? 'no es el contrato' : JSON.stringify(perfilesJson()))
    if (a[0] === 'orq' && a[1] === 'perfiles') {
      const no = (code: number, error: string) => ({ value: { exitCode: code, stdout: JSON.stringify({ ok: false, error }), stderr: error } })
      const [, , verbo, x, y] = a
      if (verbo === 'usar') {
        if (!fab(x) && !st.mios.includes(x)) return no(2, `No existe el perfil '${x}'.`)
        Object.assign(st, { activo: x, modificado: false })
      } else if (verbo === 'guardar') {
        if (fab(x)) return no(3, `'${x}' es un perfil de fábrica: no se puede pisar. Usá otro nombre.`)
        if (!st.mios.includes(x)) st.mios.push(x)
        Object.assign(st, { activo: x, modificado: false })
      } else if (verbo === 'duplicar') {
        if (fab(y) || st.mios.includes(y)) return no(3, `'${y}' ya existe.`)
        st.mios.push(y)
      } else if (verbo === 'borrar') {
        if (!st.mios.includes(x)) return no(2, `No existe el perfil propio '${x}'.`)
        st.mios = st.mios.filter((n) => n !== x)
        if (st.activo === x) st.activo = null
      } else return no(1, 'verbo raro')
      return ok(JSON.stringify({ ok: true, perfil: x, activo: st.activo, ...(opts.aviso ? { aviso: opts.aviso } : {}) }))
    }
    if (a[0] === 'orq' && a[1] === 'modelos' && (a[2] === 'set' || a[2] === 'reset')) {
      // Con uno de fábrica activo, tocar un modelo lo deja "modificado" (contrato 3).
      if (!opts.code && st.activo && fab(st.activo)) st.modificado = true
      return opts.code ? { value: { exitCode: opts.code, stdout: '', stderr: opts.stderr || '' } } : ok(JSON.stringify({ ok: true, tipo: a[3] }))
    }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props: PANE_PROPS })
  await clock.advance(3000)
  const hasta = async (key: string) => {
    for (let i = 0; i < 50 && !(await m.find({ key })); i++) await new Promise((r) => setTimeout(r, 10))
    expect(await m.find({ key })).toBeDefined()
  }
  const texto = async () => JSON.stringify(await m.drawn())
  return { m, asked, hasta, texto, clock, st, pedidos }
}
const opRuns = (asked: string[][]) => asked.filter((a) => a[0] === 'orq' && a[1] === 'perfiles' && a[2] !== '--json')
const lecturas = (asked: string[][], que: 'modelos' | 'perfiles') => asked.filter((a) => a.join(' ') === `orq ${que} --json`).length
// Espera a que el aviso del perfil diga algo distinto de "… guardando".
const opListo = async (texto: () => Promise<string>, aguja: string) => {
  for (let i = 0; i < 80 && !(await texto()).includes(aguja); i++) await new Promise((r) => setTimeout(r, 10))
  expect(await texto()).toContain(aguja)
}
const enModelos = async (m: any, hasta: (k: string) => Promise<void>) => {
  await m.press({ key: 'flap-orq' })
  await m.press({ key: 'orqtab-modelos' })
  await hasta('op-p-turbo')
  await hasta('om-t-backend')
}
const omRuns = (asked: string[][], verbo: string) => asked.filter((a) => a[0] === 'orq' && a[1] === 'modelos' && a[2] === verbo)

test('orqModelosParse lee el contrato y completa lo que falta; orqMdlCuentas deja sólo las cuentas con prefijo', () => {
  const p = orqModelosParse(JSON.stringify(OM_JSON))!
  expect(p.tipos).toEqual(['backend', 'coding', 'frontend'])
  expect(p.config.backend).toEqual({ modelo: 'priv8/claude-opus-5-5', effort: 'high', origen: 'tipo' })
  expect(p.config.frontend.effort).toBe('')
  const flaco = orqModelosParse(JSON.stringify({ tipos: ['a', '*'], config: { a: { origen: 'raro' } } }))!
  expect(flaco.tipos).toEqual(['a'])
  expect(flaco.efforts).toEqual(['auto', 'low', 'medium', 'high', 'xhigh', 'max'])
  expect(flaco.aliases).toEqual(['opus', 'sonnet', 'haiku', 'fable'])
  expect(flaco.config.a).toEqual({ modelo: '', effort: '', origen: 'ninguno' })
  expect(orqModelosParse('nada')).toBeUndefined()
  expect(orqModelosParse('{"config":{}}')).toBeUndefined()
  expect(orqModelosSet('*', 'opus', 'auto')).toEqual(['orq', 'modelos', 'set', '*', '--modelo', 'opus', '--effort', 'auto'])
  expect(orqMdlCuentas(['nan/a', 'claude-sonnet-5', 'wibond/x']).map((g) => g.prefix)).toEqual(['nan', 'wibond'])
  expect(orqMdlError({ exitCode: 3, stderr: 'effort inválido: mucho\nmás' })).toBe('✗ error de orq (código 3): effort inválido: mucho')
  expect(orqMdlError({ exitCode: 1, stdout: '{"ok":false,"error":"no hay archivo"}' })).toBe('✗ error de orq (código 1): no hay archivo')
  expect(orqMdlError({ exitCode: 2 })).toBe('✗ error de orq (código 2)')
})

test('MODELOS de orq: la lista muestra cada tipo con su modelo, effort y de dónde sale', async ($, on) => {
  const { m, asked, hasta, texto } = await omSession($, on)
  await m.press({ key: 'flap-orq' })
  await m.press({ key: 'orqtab-modelos' })
  await hasta('om-t-backend')
  expect(asked.some((a) => a.join(' ') === 'orq modelos --json')).toBe(true)
  const text = await texto()
  expect(text).toContain('◆ MODELOS')
  expect(await m.find({ key: 'orq-flow' })).toBeUndefined()
  expect(await m.find({ key: 'tab-magi' })).toBeUndefined()
  expect(text).toContain('* default para todos')
  expect(text.indexOf('om-t-*')).toBeLessThan(text.indexOf('om-t-backend'))
  for (const s of ['priv8/claude-opus-5-5 · high', 'sonnet · medium', 'propio', 'default', '⚠ wibond/claude-opus-5-5 · auto']) expect(text).toContain(s)
  // Volver a ORQ deja ver el flujo de nuevo.
  await m.press({ key: 'flap-orq' })
  expect(await m.find({ key: 'orq-flow' })).toBeDefined()
  expect(await m.find({ key: 'om-list' })).toBeUndefined()
})

test('MODELOS de orq: cuenta → modelo → effort termina en el argv exacto de orq modelos set y vuelve a la lista', async ($, on) => {
  const { m, asked, hasta, texto } = await omSession($, on)
  await m.press({ key: 'flap-orq' })
  await m.press({ key: 'orqtab-modelos' })
  await hasta('om-t-coding')
  await m.press({ key: 'om-t-coding' })
  await hasta('om-c-priv8')
  let text = await texto()
  expect(text).toContain('paso 1 · cuenta')
  expect(text).toContain('Claude (tu plan)')
  expect(text).toContain('opus · sonnet · haiku · fable')
  for (const k of ['om-c-claude', 'om-c-wibond', 'om-c-ag3', 'om-c-nan']) expect(await m.find({ key: k })).toBeDefined()
  // Los ids sin prefijo no son una cuenta del CPAM: orq los correría con el plan de Claude.
  expect(text).not.toContain('om-c-claude-sonnet')
  // coding sale del default: no hay nada propio que borrar.
  expect(await m.find({ key: 'om-reset' })).toBeUndefined()
  await m.press({ key: 'om-c-priv8' })
  text = await texto()
  expect(text).toContain('paso 2 · modelo')
  expect(await m.find({ key: 'om-q' })).toBeUndefined()
  await m.press({ key: 'om-m-priv8/claude-sonnet-5-5' })
  text = await texto()
  expect(text).toContain('paso 3 · effort')
  for (const lvl of ['auto', 'low', 'medium', 'high', 'xhigh', 'max']) expect(await m.find({ key: 'om-e-' + lvl })).toBeDefined()
  // ‹ volver retrocede un paso por vez.
  await m.press({ key: 'om-back' })
  expect(await texto()).toContain('paso 2 · modelo')
  await m.press({ key: 'om-m-priv8/claude-sonnet-5-5' })
  await m.press({ key: 'om-e-xhigh' })
  await hasta('om-list')
  expect(omRuns(asked, 'set')).toEqual([['orq', 'modelos', 'set', 'coding', '--modelo', 'priv8/claude-sonnet-5-5', '--effort', 'xhigh']])
  text = await texto()
  expect(text).toContain('✓ guardado: coding → priv8/claude-sonnet-5-5 · xhigh')
  // Después de guardar relee lo que quedó.
  expect(asked.filter((a) => a.join(' ') === 'orq modelos --json').length).toBeGreaterThanOrEqual(2)
  // Con el plan de Claude: los alias, y "* default para todos" guarda en "*".
  await m.press({ key: 'om-t-*' })
  await m.press({ key: 'om-c-claude' })
  for (const a of ['opus', 'sonnet', 'haiku', 'fable']) expect(await m.find({ key: 'om-m-' + a })).toBeDefined()
  await m.press({ key: 'om-m-opus' })
  await m.press({ key: 'om-e-auto' })
  await hasta('om-list')
  expect(omRuns(asked, 'set')[1]).toEqual(['orq', 'modelos', 'set', '*', '--modelo', 'opus', '--effort', 'auto'])
})

test('MODELOS de orq: una cuenta con muchos modelos trae el filtro y ‹ volver desde la cuenta vuelve a la lista', async ($, on) => {
  const { m, hasta, texto } = await omSession($, on)
  await m.press({ key: 'flap-orq' })
  await m.press({ key: 'orqtab-modelos' })
  await hasta('om-t-backend')
  await m.press({ key: 'om-t-backend' })
  await hasta('om-c-nan')
  await m.press({ key: 'om-c-nan' })
  expect(await m.find({ key: 'om-q' })).toBeDefined()
  expect(await m.find({ key: 'om-m-nan/m12' })).toBeDefined()
  await m.press({ key: 'om-back' })
  expect(await texto()).toContain('paso 1 · cuenta')
  await m.press({ key: 'om-back' })
  expect(await m.find({ key: 'om-list' })).toBeDefined()
})

test('MODELOS de orq: un tipo con config propia tiene "volver al default", que corre orq modelos reset', async ($, on) => {
  const { m, asked, hasta, texto } = await omSession($, on)
  await m.press({ key: 'flap-orq' })
  await m.press({ key: 'orqtab-modelos' })
  await hasta('om-t-backend')
  await m.press({ key: 'om-t-backend' })
  expect(await texto()).toContain('volver al default')
  await m.press({ key: 'om-reset' })
  await hasta('om-list')
  expect(omRuns(asked, 'reset')).toEqual([['orq', 'modelos', 'reset', 'backend']])
  expect(omRuns(asked, 'set')).toEqual([])
  expect(await texto()).toContain('✓ backend: vuelve al default')
})

test('MODELOS de orq: si orq sale con código distinto de 0 avisa el error y no dice guardado', async ($, on) => {
  const { m, hasta, texto } = await omSession($, on, { code: 3, stderr: 'effort inválido' })
  await m.press({ key: 'flap-orq' })
  await m.press({ key: 'orqtab-modelos' })
  await hasta('om-t-backend')
  await m.press({ key: 'om-t-backend' })
  await hasta('om-c-ag3')
  await m.press({ key: 'om-c-ag3' })
  await m.press({ key: 'om-m-ag3/gemini-3.8-flash-high' })
  await m.press({ key: 'om-e-max' })
  await hasta('om-list')
  const text = await texto()
  expect(text).toContain('✗ error de orq (código 3): effort inválido')
  expect(text).not.toContain('✓ guardado')
})

test('MODELOS de orq: la cuenta wibond avisa en rojo que es la de TRABAJO en cada paso', async ($, on) => {
  const { m, hasta, texto } = await omSession($, on)
  await m.press({ key: 'flap-orq' })
  await m.press({ key: 'orqtab-modelos' })
  await hasta('om-t-coding')
  await m.press({ key: 'om-t-coding' })
  await hasta('om-c-wibond')
  let text = await texto()
  expect(text).toContain('⚠ usa la cuenta de TRABAJO (Wibond)')
  expect(text).toContain('Wibond (trabajo)')
  await m.press({ key: 'om-c-wibond' })
  expect(await texto()).toContain('cuenta de TRABAJO')
  await m.press({ key: 'om-m-wibond/claude-opus-5-5' })
  text = await texto()
  expect(text).toContain('paso 3 · effort')
  expect(text).toContain('cuenta de TRABAJO')
  // En otra cuenta el aviso no aparece.
  await m.press({ key: 'om-back' })
  await m.press({ key: 'om-back' })
  await m.press({ key: 'om-c-priv8' })
  expect(await texto()).not.toContain('cuenta de TRABAJO')
})

test('MODELOS de orq: si orq modelos --json no contesta lo dice en vez de quedarse en blanco', async ($, on) => {
  const { m, texto } = await omSession($, on, { json: 'no es el contrato' })
  await m.press({ key: 'flap-orq' })
  await m.press({ key: 'orqtab-modelos' })
  for (let i = 0; i < 50 && !(await texto()).includes('no contestó'); i++) await new Promise((r) => setTimeout(r, 10))
  expect(await texto()).toContain('✗ orq modelos --json no contestó')
})

test('orqPerfilesParse lee el contrato y descarta lo que no entiende; orqPerfilLibre no pisa nombres', () => {
  const p = orqPerfilesParse(JSON.stringify({ activo: 'turbo', modificado: true, fabrica: OP_FABRICA, mios: [{ nombre: 'mio', config: {} }, { config: {} }] }))!
  expect(p.activo).toBe('turbo')
  expect(p.modificado).toBe(true)
  expect(p.fabrica.map((x) => x.nombre)).toEqual(['turbo', 'barato', 'solo-claude'])
  expect(p.fabrica[0].descripcion).toBe('Lo más rápido.')
  expect(p.mios).toEqual([{ nombre: 'mio', descripcion: '' }])
  const flaco = orqPerfilesParse(JSON.stringify({ activo: null, fabrica: [] }))!
  expect(flaco).toEqual({ activo: null, modificado: false, fabrica: [], mios: [] })
  expect(orqPerfilesParse('nada')).toBeUndefined()
  expect(orqPerfilesParse('{"activo":"x"}')).toBeUndefined()
  expect(orqPerfilArgv('duplicar', 'turbo', 'turbo-copia')).toEqual(['orq', 'perfiles', 'duplicar', 'turbo', 'turbo-copia'])
  expect(orqPerfilLibre('mio', ['mio', 'mio-2'])).toBe('mio-3')
  expect(orqPerfilLibre('turbo-copia', ['turbo'])).toBe('turbo-copia')
  expect(orqModelosParse(JSON.stringify({ ...OM_JSON, perfil: { activo: 'barato', modificado: true } }))!.perfil).toEqual({ activo: 'barato', modificado: true })
  expect(orqModelosParse(JSON.stringify({ ...OM_JSON, perfil: { activo: null } }))!.perfil).toEqual({ activo: null, modificado: false })
  expect(orqModelosParse(JSON.stringify(OM_JSON))!.perfil).toBeUndefined()
})

test('PERFILES de orq: arriba de los tipos, fábrica y míos como chips, el activo con ● y su descripción', async ($, on) => {
  const { m, asked, hasta, texto, clock } = await omSession($, on)
  await enModelos(m, hasta)
  const text = await texto()
  expect(lecturas(asked, 'perfiles')).toBeGreaterThanOrEqual(1)
  expect(text.indexOf('op-perfiles')).toBeLessThan(text.indexOf('om-list'))
  for (const s of ['◈ PERFIL · turbo', 'FÁBRICA', ' · 3', 'MÍOS', ' · 1', '● turbo', 'Lo más rápido.', '+ guardar como…', '⧉ duplicar', '✕ borrar']) expect(text).toContain(s)
  for (const k of ['op-p-turbo', 'op-p-barato', 'op-p-solo-claude', 'op-p-mio', 'op-del-mio', 'op-save', 'op-dup']) expect(await m.find({ key: k })).toBeDefined()
  // Los de fábrica no se borran.
  expect(await m.find({ key: 'op-del-turbo' })).toBeUndefined()
  expect(text).not.toContain('(modificado)')
  expect(text).not.toContain('● barato')
  // Con la pestaña a la vista y sin tocar nada, no se vuelve a preguntar a orq.
  const antes = [lecturas(asked, 'perfiles'), lecturas(asked, 'modelos')]
  await clock.advance(5000)
  expect([lecturas(asked, 'perfiles'), lecturas(asked, 'modelos')]).toEqual(antes)
})

test('PERFILES de orq: "(modificado)" sale de orq modelos --json y tocar el activo lo vuelve a usar', async ($, on) => {
  const { m, asked, hasta, texto } = await omSession($, on, { perfiles: { activo: 'barato', modificado: true } })
  await enModelos(m, hasta)
  expect(await texto()).toContain('(modificado)')
  expect(await texto()).toContain('● barato')
  await m.press({ key: 'op-p-barato' })
  await opListo(texto, '✓ usando barato')
  expect(opRuns(asked)).toEqual([['orq', 'perfiles', 'usar', 'barato']])
  expect(await texto()).not.toContain('(modificado)')
})

test('PERFILES de orq: cambiar un modelo con un perfil de fábrica activo lo muestra (modificado) al volver a la lista', async ($, on) => {
  const { m, asked, hasta, texto } = await omSession($, on)
  await enModelos(m, hasta)
  const perfilesAntes = lecturas(asked, 'perfiles')
  await m.press({ key: 'om-t-backend' })
  await hasta('om-c-claude')
  await m.press({ key: 'om-c-claude' })
  await m.press({ key: 'om-m-opus' })
  await m.press({ key: 'om-e-high' })
  await hasta('om-list')
  await opListo(texto, '(modificado)')
  expect(await texto()).toContain('● turbo')
  // Alcanza con releer orq modelos --json: trae el perfil activo y si se tocó.
  expect(lecturas(asked, 'perfiles')).toBe(perfilesAntes)
})

test('PERFILES de orq: usar corre el argv exacto, relee modelos y perfiles y marca el nuevo activo', async ($, on) => {
  const { m, asked, hasta, texto } = await omSession($, on, { aviso: 'No pude verificar los modelos: el CPAM no respondió.' })
  await enModelos(m, hasta)
  const antes = [lecturas(asked, 'modelos'), lecturas(asked, 'perfiles')]
  await m.press({ key: 'op-p-solo-claude' })
  await opListo(texto, '✓ usando solo-claude')
  expect(opRuns(asked)).toEqual([['orq', 'perfiles', 'usar', 'solo-claude']])
  expect(lecturas(asked, 'modelos')).toBeGreaterThan(antes[0])
  expect(lecturas(asked, 'perfiles')).toBeGreaterThan(antes[1])
  const text = await texto()
  expect(text).toContain('● solo-claude')
  expect(text).not.toContain('● turbo')
  expect(text).toContain('⚠ No pude verificar los modelos')
})

test('PERFILES de orq: + guardar como… pide el nombre, guarda y lo deja activo', async ($, on) => {
  const { m, asked, hasta, texto, pedidos } = await omSession($, on)
  await enModelos(m, hasta)
  await m.press({ key: 'op-save' })
  await opListo(texto, '✓ guardado como turbo-mio (activo)')
  expect(pedidos[0].options).toEqual(['turbo-mio', 'Cancelar'])
  expect(opRuns(asked)).toEqual([['orq', 'perfiles', 'guardar', 'turbo-mio']])
  const text = await texto()
  expect(text).toContain('● turbo-mio')
  expect(text).toContain(' · 2')
  expect(await m.find({ key: 'op-del-turbo-mio' })).toBeDefined()
})

test('PERFILES de orq: guardar con Cancelar no corre nada', async ($, on) => {
  const c = await omSession($, on, { nombre: 'Cancelar' })
  await enModelos(c.m, c.hasta)
  await c.m.press({ key: 'op-save' })
  await new Promise((r) => setTimeout(r, 30))
  expect(opRuns(c.asked)).toEqual([])
  expect(await c.texto()).not.toContain('✓')
})

test('PERFILES de orq: guardar sobre un nombre de fábrica avisa el error de orq y no dice guardado', async ($, on) => {
  const { m, asked, hasta, texto } = await omSession($, on, { nombre: 'barato' })
  await enModelos(m, hasta)
  await m.press({ key: 'op-save' })
  await opListo(texto, '✗ error de orq (código 3)')
  expect(opRuns(asked)).toEqual([['orq', 'perfiles', 'guardar', 'barato']])
  const text = await texto()
  expect(text).toContain('es un perfil de fábrica')
  expect(text).not.toContain('✓ guardado')
  expect(text).toContain('● turbo')
})

test('PERFILES de orq: ⧉ duplicar copia el activo a uno propio sin activarlo', async ($, on) => {
  const { m, asked, hasta, texto, pedidos } = await omSession($, on)
  await enModelos(m, hasta)
  await m.press({ key: 'op-dup' })
  await opListo(texto, '✓ duplicado: turbo → turbo-copia')
  expect(pedidos[0].options[0]).toBe('turbo-copia')
  expect(opRuns(asked)).toEqual([['orq', 'perfiles', 'duplicar', 'turbo', 'turbo-copia']])
  expect(await m.find({ key: 'op-p-turbo-copia' })).toBeDefined()
  expect(await texto()).toContain('● turbo')
  expect(await texto()).not.toContain('● turbo-copia')
})

test('PERFILES de orq: borrar pide un segundo toque; otro botón en el medio cancela la confirmación', async ($, on) => {
  const { m, asked, hasta, texto, st } = await omSession($, on, { perfiles: { activo: 'mio', mios: ['mio', 'otro'] } })
  await enModelos(m, hasta)
  await m.press({ key: 'op-del-otro' })
  let text = await texto()
  expect(opRuns(asked)).toEqual([])
  expect(text).toContain('✕ ¿seguro?')
  expect(text).toContain('tocá ✕ otra vez para borrar otro')
  // Tocar el ✕ de otro perfil cambia cuál se confirma, sin borrar nada.
  await m.press({ key: 'op-del-mio' })
  expect(opRuns(asked)).toEqual([])
  expect(await texto()).toContain('tocá ✕ otra vez para borrar mio')
  // Usar un perfil en el medio cancela: el próximo ✕ vuelve a pedir confirmación.
  await m.press({ key: 'op-p-barato' })
  await opListo(texto, '✓ usando barato')
  await m.press({ key: 'op-del-mio' })
  expect(opRuns(asked).filter((a) => a[2] === 'borrar')).toEqual([])
  await m.press({ key: 'op-del-mio' })
  await opListo(texto, '✓ borrado: mio')
  expect(opRuns(asked).filter((a) => a[2] === 'borrar')).toEqual([['orq', 'perfiles', 'borrar', 'mio']])
  expect(st.mios).toEqual(['otro'])
  text = await texto()
  expect(await m.find({ key: 'op-p-mio' })).toBeUndefined()
  expect(text).not.toContain('tocá ✕ otra vez')
})

test('PERFILES de orq: borrar el activo lo deja sin perfil y sin ⧉ duplicar', async ($, on) => {
  const { m, hasta, texto } = await omSession($, on, { perfiles: { activo: 'mio' } })
  await enModelos(m, hasta)
  await m.press({ key: 'op-del-mio' })
  await m.press({ key: 'op-del-mio' })
  await opListo(texto, '✓ borrado: mio')
  const text = await texto()
  expect(text).toContain('sin perfil')
  expect(text).toContain('◈ PERFIL · ninguno')
  expect(text).toContain('ninguno todavía')
  expect(await m.find({ key: 'op-dup' })).toBeUndefined()
})

test('PERFILES de orq: si orq perfiles --json no contesta lo dice y la lista de tipos sigue andando', async ($, on) => {
  const { m, hasta, texto } = await omSession($, on, { perfilesRoto: true })
  await m.press({ key: 'flap-orq' })
  await m.press({ key: 'orqtab-modelos' })
  await hasta('om-t-backend')
  await opListo(texto, '✗ orq perfiles --json no contestó')
  expect(await m.find({ key: 'op-save' })).toBeUndefined()
  await m.press({ key: 'om-t-backend' })
  await hasta('om-c-priv8')
})

// YOUTUBE con un reproductor simulado: la cola sale de lo que contesta mpv por el socket.
const YT_TITLES = ['Small Town Kid - When the Feeling Is Gone (Lyric Video)', 'Bronski Beat - Smalltown Boy (Official Video) 🎵🎵', '久石譲 - 人生のメリーゴーランド ハウルの動く城 サウンドトラック', 'corto']
const ytSession = async ($: any, on: any, props: any, pause = false) => {
  mock.env(on, { HOME: '/h', XDG_RUNTIME_DIR: '/r' })
  mock.store(on)
  const clock = mock.clock(on)
  const ran: string[][] = []
  const sent: any[][] = []
  const items = Object.fromEntries(YT_TITLES.map((title, i) => ['idid' + i + 'xx', { id: 'idid' + i + 'xx', title, ch: 'Canal', d: i === 0 ? 3723 : 158 }]))
  const answers: Record<string, any> = { 'time-pos': 14, duration: 156, pause, 'playlist-pos': 0, 'ao-volume': 35, 'media-title': YT_TITLES[0], playlist: YT_TITLES.map((_, i) => ({ filename: 'https://youtu.be/idid' + i + 'xx' })) }
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  on('fs.stat', async (_$: any, e: any) => {
    if (e.path === '/r/nerv-yt.sock' || e.path === '/r/nerv-yt.json') return { value: { kind: 'file', size: 10, mtimeMs: 1, isLink: false } }
    throw new Error('ENOENT')
  })
  on('fs.read', async (_$: any, e: any) => ({ value: e.path === '/r/nerv-yt.json' ? JSON.stringify({ items }) : '' }))
  on('process.run', async (_$: any, e: any) => {
    const argv: string[] = e.argv
    ran.push(argv)
    if (argv[0] === 'socat') {
      const cmds = String(e.init?.stdin || '').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
      if (!cmds.length) return { value: { exitCode: 1, stdout: '', stderr: '' } }
      for (const c of cmds) sent.push(c.command)
      return { value: { exitCode: 0, stderr: '', stdout: cmds.map((c: any) => JSON.stringify({ request_id: c.request_id, error: 'success', data: c.command[0] === 'get_property' ? answers[c.command[1]] : null })).join('\n') } }
    }
    if (argv[0] === 'yt-dlp' && argv.includes('--flat-playlist'))
      return { value: { exitCode: 0, stderr: '', stdout: JSON.stringify({ entries: YT_TITLES.map((title, i) => ({ id: 'res' + i + 'xxxx', title, duration: i === 0 ? 3723 : 158 })) }) } }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  await $.command.run({ command: 'nerv', args: 'yt algo' })
  await clock.advance(1500)
  const m: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props })
  return { m, clock, ran, sent }
}
// Ancho mínimo que necesita un elemento del dibujo si nada se parte en dos renglones.
const ytText = (el: any): string => (typeof el === 'string' ? el : !el || typeof el !== 'object' ? '' : (el.props?.label ?? '') + [el.children ?? []].flat().map(ytText).join(''))
const ytWidth = (el: any): number => {
  if (!el || typeof el !== 'object') return typeof el === 'string' ? ytCells(el) : 0
  const p = el.props || {}
  const kids = [el.children ?? []].flat()
  // ▶ ★ y los íconos de la interfaz son de una celda; ytCells los cuenta de más porque está pensado para títulos.
  if (el.type !== 'Box') return ytCells(ytText(el).replace(/^ ▶ /, ' > '))
  const pad = 2 * (p.paddingX ?? 0) + (p.paddingLeft ?? 0) + (p.paddingRight ?? 0) + (p.marginLeft ?? 0) + (p.borderStyle ? 2 : 0)
  if (typeof p.width === 'number') return p.width + (p.marginLeft ?? 0)
  const ws = kids.map(ytWidth)
  return pad + (p.flexDirection === 'row' ? ws.reduce((a, b) => a + b, 0) + (p.columnGap ?? 0) * Math.max(0, ws.length - 1) : Math.max(0, ...ws))
}
const ytFind = (el: any, pred: (k: string) => boolean, out: any[] = []): any[] => {
  if (!el || typeof el !== 'object') return out
  if (Array.isArray(el)) return el.forEach((x) => ytFind(x, pred, out)), out
  const key = String(el.key ?? el.props?.key ?? '')
  if (key && pred(key)) out.push(el)
  ytFind(el.children, pred, out)
  return out
}
const ytRows = (tree: any) => ytFind(tree, (k) => /^(yq-\d+|yt-r-res\dxxxx|yt-next-row|yt-transport|yt-vol)$/.test(k))

test('ytClip corta por celdas: kanji y emojis valen 2', () => {
  expect(ytCells('abc')).toBe(3)
  expect(ytCells('久石譲')).toBe(6)
  expect(ytCells('a🎵b')).toBe(4)
  expect(ytCells('❤️')).toBe(2)
  expect(ytClip('corto', 10)).toBe('corto')
  expect(ytClip('Bronski Beat - Smalltown Boy', 12)).toBe('Bronski Bea…')
  expect(ytClip('久石譲 - 人生のメリーゴーランド', 12)).toBe('久石譲 - 人…')
  expect(ytCells(ytClip('久石譲 - 人生のメリーゴーランド', 12))).toBeLessThanOrEqual(12)
  expect(ytCells(ytClip('🎵🎵🎵🎵🎵🎵🎵', 6))).toBeLessThanOrEqual(6)
})

for (const [name, props, inner] of [
  ['44 columnas', PANE_PROPS, 39],
  ['angosto', { ...PANE_PROPS, bodyColumns: 34, placement: 'inline', scroll: { offset: 0, bodyRows: 17, contentRows: 40 } }, 30],
] as [string, any, number][])
  test(`YOUTUBE a ${name}: ninguna fila se pasa del ancho y cada ✕ va en la fila de su tema`, async ($, on) => {
    const { m } = await ytSession($, on, props)
    const tree = await m.drawn()
    const rows = ytRows(tree)
    const keys = rows.map((r: any) => String(r.key ?? r.props?.key))
    for (const k of ['yq-0', 'yq-1', 'yq-2', 'yq-3', 'yt-next-row', 'yt-transport', 'yt-vol', 'yt-r-res0xxxx', 'yt-r-res2xxxx']) expect(keys).toContain(k)
    for (const r of rows) expect([String(r.key ?? r.props?.key), ytWidth(r) <= inner]).toEqual([String(r.key ?? r.props?.key), true])
    for (const k of [1, 2, 3]) {
      const row = rows.find((r: any) => String(r.key ?? r.props?.key) === 'yq-' + k)
      expect(ytFind(row, (x) => x === 'yq-go-' + k)).toHaveLength(1)
      expect(ytFind(row, (x) => x === 'yq-rm-' + k)).toHaveLength(1)
    }
    const text = JSON.stringify(tree)
    for (const emoji of ['⏮', '⏸', '⏭', '♥']) expect(text).not.toContain(emoji)
    expect(text).toContain(inner >= 38 ? '✕ limpiar cola' : '✕ limpiar"')
    expect(ytText(ytFind(tree, (x) => x === 'yq-go-0')[0]).slice(0, 3)).toBe(' ▶ ')
    expect(ytText(ytFind(tree, (x) => x === 'yq-go-1')[0]).slice(0, 3)).toBe(' 2 ')
    const chips = ytFind(tree, (x) => x === 'yt-chips')[0]
    expect(chips.props.columnGap).toBe(1)
    expect(chips.props.flexWrap).toBe('wrap')
  })

for (const [name, props, inner] of [
  ['44 columnas', PANE_PROPS, 39],
  ['angosto', { ...PANE_PROPS, bodyColumns: 34, placement: 'inline', scroll: { offset: 0, bodyRows: 17, contentRows: 40 } }, 30],
] as [string, any, number][])
  test(`MODELOS de orq a ${name}: las filas de tipos, cuentas y solapas entran en el ancho`, async ($, on) => {
    const { m } = await omSession($, on)
    await m.unmount()
    const n: any = await ($ as any).ui.mount({ plugin: 'nerv', surface: 'terminal', component: 'Pane', requestId: 'nerv', props })
    await n.press({ key: 'flap-orq' })
  await n.press({ key: 'orqtab-modelos' })
    for (let i = 0; i < 50 && !(await n.find({ key: 'om-t-backend' })); i++) await new Promise((r) => setTimeout(r, 10))
    const filas = (tree: any, re: RegExp) => ytFind(tree, (k) => re.test(k))
    let tree = await n.drawn()
    const lista = filas(tree, /^om-head-/)
    expect(lista.length).toBe(4)
    for (const r of lista) expect([r.key ?? r.props?.key, ytWidth(r) <= inner]).toEqual([r.key ?? r.props?.key, true])
    const perfiles = filas(tree, /^op-(bar|fab-\d+|sec-mios|mio-.*)$/)
    expect(perfiles.length).toBe(5)
    for (const r of perfiles) expect([r.key ?? r.props?.key, ytWidth(r) <= inner]).toEqual([r.key ?? r.props?.key, true])
    expect(ytWidth(filas(tree, /^flaps$/)[0])).toBeLessThanOrEqual(inner + 4)
    expect(ytWidth(filas(tree, /^orqtabs$/)[0])).toBeLessThanOrEqual(inner + 4)
    await n.press({ key: 'om-t-backend' })
    for (let i = 0; i < 50 && !(await n.find({ key: 'om-c-wibond' })); i++) await new Promise((r) => setTimeout(r, 10))
    tree = await n.drawn()
    const cuentas = filas(tree, /^om-c-head-/)
    expect(cuentas.length).toBe(4)
    for (const r of cuentas) expect([r.key ?? r.props?.key, ytWidth(r) <= inner]).toEqual([r.key ?? r.props?.key, true])
  })

test('YOUTUBE: cada botón de la tarjeta manda a mpv lo que dice', async ($, on) => {
  const { m, sent } = await ytSession($, on, PANE_PROPS)
  await m.drawn()
  const last = async (key: string) => {
    sent.length = 0
    await m.press({ key })
    return sent.find((c) => c[0] !== 'get_property')
  }
  expect(await last('yt-prev')).toEqual(['playlist-prev'])
  expect(await last('yt-pause')).toEqual(['cycle', 'pause'])
  expect(await last('yt-next')).toEqual(['playlist-next'])
  expect(await last('yt-voldown')).toEqual(['add', 'ao-volume', -5])
  expect(await last('yt-volup')).toEqual(['add', 'ao-volume', 5])
  expect(await last('yq-go-2')).toEqual(['playlist-play-index', 2])
  expect(await last('yq-rm-1')).toEqual(['playlist-remove', 1])
  expect(await last('yt-stop')).toEqual(['quit'])
})

test('YOUTUBE: limpiar cola también corta la carga del resto de los temas', async ($, on) => {
  const { m, ran, sent } = await ytSession($, on, PANE_PROPS)
  await m.drawn()
  ran.length = 0
  await m.press({ key: 'yt-clear' })
  const stop = ran.findIndex((a) => a[0] === 'bash' && a.includes('nerv-yt-stop-fill'))
  const clear = ran.findIndex((a) => a[0] === 'socat')
  expect(stop).toBeGreaterThanOrEqual(0)
  expect(stop).toBeLessThan(clear)
  expect(ran[stop][2]).toContain('nerv-yt-fill')
  expect(ran[stop][2]).not.toContain('input-ipc-server')
  expect(sent).toContainEqual(['playlist-clear'])
})

