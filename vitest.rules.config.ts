import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['src/test/rules/**/*.test.ts'],
        environment: 'node',
        testTimeout: 20000,
        // firebase.json runs the emulator in singleProjectMode, so every test
        // file's initializeTestEnvironment() shares one underlying Firestore
        // project regardless of the projectId passed in — running files in
        // parallel would let one file's clearFirestore() wipe another's
        // in-flight data.
        fileParallelism: false,
    },
})
