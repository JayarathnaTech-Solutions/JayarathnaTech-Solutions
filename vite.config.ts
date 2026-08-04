import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
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
