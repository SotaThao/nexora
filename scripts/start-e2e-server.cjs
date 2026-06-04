const { spawn } = require('node:child_process')

const command = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'pnpm'
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'pnpm exec vite --host 127.0.0.1 --port 3000']
  : ['exec', 'vite', '--host', '127.0.0.1', '--port', '3000']

const child = spawn(
  command,
  args,
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_ENABLE_DEMO_TOOLS: 'true',
    },
  },
)

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
