import { expect, test } from 'claude-code/testing'

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
