const { spawn } = require('node:child_process')
const http = require('node:http')

const origin = 'http://127.0.0.1:3000'
const pnpmCommand = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'pnpm'

function pnpmArgs(args) {
  if (process.platform !== 'win32') return args
  return ['/d', '/s', '/c', `pnpm ${args.join(' ')}`]
}

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now()

  return new Promise((resolve, reject) => {
    const poll = () => {
      const req = http.get(url, (res) => {
        res.resume()
        resolve()
      })

      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`))
          return
        }
        setTimeout(poll, 500)
      })

      req.setTimeout(1000, () => {
        req.destroy()
      })
    }

    poll()
  })
}

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    })

    child.on('exit', (code, signal) => {
      resolve({ code: code ?? 0, signal })
    })
  })
}

async function main() {
  const server = spawn(process.execPath, ['scripts/start-e2e-server.cjs'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_ENABLE_DEMO_TOOLS: 'true',
    },
  })

  const stopServer = () => {
    if (!server.killed) {
      server.kill()
    }
  }

  process.on('SIGINT', () => {
    stopServer()
    process.exit(130)
  })
  process.on('SIGTERM', () => {
    stopServer()
    process.exit(143)
  })

  try {
    await waitForServer(origin)
    const result = await run(pnpmCommand, pnpmArgs(['exec', 'vitest', 'run', '--config', 'vitest.e2e.config.js']), {
      env: {
        ...process.env,
        VITE_ENABLE_DEMO_TOOLS: 'true',
      },
    })
    stopServer()
    process.exit(result.code)
  } catch (error) {
    stopServer()
    console.error(error.message)
    process.exit(1)
  }
}

main()
