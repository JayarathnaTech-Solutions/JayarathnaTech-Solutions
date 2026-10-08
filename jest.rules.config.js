import { transform } from './jest.config.js'

// Firestore security-rules tests (`npm run test:rules`), run against the
// Firestore emulator. Kept out of the default `npm test` so that doesn't need
// the emulator up.
//
// Must run with --runInBand (the npm script passes it): firebase.json runs the
// emulator in singleProjectMode, so every test file's
// initializeTestEnvironment() shares one underlying Firestore project
// regardless of the projectId passed in — running files in parallel would let
// one file's clearFirestore() wipe another's in-flight data.

/** @type {import('jest').Config} */
export default {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/test/rules/**/*.test.ts'],
    testTimeout: 20000,
    transform,
}
