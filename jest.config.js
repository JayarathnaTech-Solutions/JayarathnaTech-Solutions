import { fileURLToPath } from 'node:url'

// Babel config is inline (not a root babel.config.*) so it only ever applies to
// Jest — Vite/plugin-react never pick it up.
export const transform = {
    '^.+\\.[cm]?[jt]sx?$': [
        'babel-jest',
        {
            babelrc: false,
            configFile: false,
            // Some transformed node_modules files are CommonJS — don't force
            // ESM semantics (strict mode, interop) onto them.
            sourceType: 'unambiguous',
            plugins: [fileURLToPath(new URL('./jest/babel-plugin-vite-meta.cjs', import.meta.url))],
            presets: [
                ['@babel/preset-env', { targets: { node: 'current' } }],
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
            ],
        },
    ],
}

// Many deps are ESM-only (react-router, react-markdown + the unified/remark
// tree, @react-pdf, ...) and Jest runs CommonJS, so node_modules
// get transformed by default. Only packages known to ship working CommonJS are
// skipped, which keeps the (cached) first run from being slower than it needs
// to be.
export const transformIgnorePatterns = [
    '/node_modules/(?:react|react-dom|scheduler|firebase|@firebase|@grpc|protobufjs|@testing-library|jsdom|@babel|core-js)/',
]

/** @type {import('jest').Config} */
export default {
    testEnvironment: '<rootDir>/jest/jsdom-environment.cjs',
    testMatch: ['<rootDir>/src/test/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['<rootDir>/jest/env.cjs'],
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    transform,
    transformIgnorePatterns,
    moduleNameMapper: {
        '\\.(css|png|jpe?g|webp|gif|svg)$': '<rootDir>/jest/file-stub.cjs',
    },
}
