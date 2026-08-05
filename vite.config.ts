import { defineConfig, type Plugin } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { handleChatRequest } from './api/chatHandler'

// Vite only loads VITE_-prefixed vars into import.meta.env for client code —
// it does not populate process.env from .env for us, so pull GEMINI_API_KEY
// in ourselves (same approach as scripts/generate-sitemap.mjs) for the dev
// chat middleware below.
try {
  process.loadEnvFile()
} catch {
  // No .env file locally is fine — Vercel injects env vars directly at build/runtime.
}

// Serves api/chat.ts's logic under `vite dev` too — Vercel only runs the
// api/ folder as serverless functions in production/`vercel dev`, so
// without this, the chat widget would 404 during local development.
function devChatApi(): Plugin {
  return {
    name: 'dev-chat-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)

        let parsedBody: unknown
        try {
          parsedBody = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')
        } catch {
          res.statusCode = 400
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
          return
        }

        const result = await handleChatRequest(process.env.GEMINI_API_KEY, (parsedBody as { messages?: unknown }).messages)
        res.statusCode = result.status
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(result.body))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devChatApi()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Firestore rules tests live under src/test/rules and need the Firestore
    // emulator running — they have their own config (vitest.rules.config.ts)
    // and npm script (`npm run test:rules`) so the default `npm test` doesn't
    // require the emulator to be up.
    exclude: [...configDefaults.exclude, 'src/test/rules/**'],
  },
})
