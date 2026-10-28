import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function getApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim()
  }

  // Dynamically check .env.local or .env without needing server restart
  const envFiles = ['.env.local', '.env']
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const match = content.match(/GEMINI_API_KEY\s*=\s*([^\r\n]+)/)
        if (match && match[1]) {
          const key = match[1].trim().replace(/^['"]|['"]$/g, '')
          if (key) {
            process.env.GEMINI_API_KEY = key
            return key
          }
        }
      } catch (e) {
        console.error('Error reading env file:', e)
      }
    }
  }

  return null
}

function apiMiddleware() {
  return {
    name: 'api-serverless-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (!url || !url.startsWith('/api/')) return next()

        // Ensure latest API key is loaded into environment
        getApiKey()

        // Provide Vercel-like response helpers for serverless handlers
        res.status = (statusCode) => {
          res.statusCode = statusCode
          return res
        }
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
          return res
        }

        if (url === '/api/health') {
          try {
            const { default: healthHandler } = await import('./api/health.js')
            return healthHandler(req, res)
          } catch (err) {
            return res.status(500).json({ ok: false, error: err.message })
          }
        }

        if (url === '/api/chat') {
          let bodyStr = ''
          req.on('data', (chunk) => {
            bodyStr += chunk
          })
          req.on('end', async () => {
            try {
              req.body = bodyStr ? JSON.parse(bodyStr) : {}
            } catch {
              req.body = {}
            }
            try {
              const { default: chatHandler } = await import('./api/chat.js')
              await chatHandler(req, res)
            } catch (err) {
              console.error('API execution error:', err)
              res.status(500).json({ ok: false, error: err.message })
            }
          })
          return
        }

        next()
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY
  }

  return {
    plugins: [react(), apiMiddleware()]
  }
})
