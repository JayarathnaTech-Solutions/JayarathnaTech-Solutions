import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['src/test/rules/**/*.test.ts'],
        environment: 'node',
        testTimeout: 20000,
    },
})
