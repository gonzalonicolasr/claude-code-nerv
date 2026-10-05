import { expect, test, mock } from 'claude-code/testing'

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
  })
  on('process.run', async () => ({ exitCode: 1, stdout: '', stderr: '' }))
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
  on('process.run', async () => ({ exitCode: 1, stdout: '', stderr: '' }))
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
  for (const s of ['ENTRY PLUG', 'EXPLORE', 'VEREDICTO', 'OPERANDO', 'R 1/3', 'Gemini 3.7 Flash', 'Claude Sonnet 5.5']) expect(drawn).toContain(s)
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
  on('process.run', async () => ({ exitCode: 1, stdout: '', stderr: '' }))
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
  on('process.run', async () => ({ exitCode: 1, stdout: '', stderr: '' }))
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
  for (const x of ['PRENDIDO', 'chau-txt', 'classify', 'pendiente', '3 calls']) expect(drawn).toContain(x)
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
