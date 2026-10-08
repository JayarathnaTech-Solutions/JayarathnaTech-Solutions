// Stand-in values for the `import.meta.env` vars app code reads at module load
// (rewritten to process.env by babel-plugin-vite-meta.cjs). Deliberately not
// loaded from .env: tests mock the Firebase SDK calls they care about, and
// shouldn't depend on — or ever point at — the live project.
const testEnv = {
    MODE: 'test',
    DEV: 'true',
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'demo-jayarathnatech.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'demo-jayarathnatech',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
    VITE_FIREBASE_APP_ID: '1:000000000000:web:test',
    VITE_USE_FIREBASE_EMULATORS: 'false',
    VITE_WEB3FORMS_ACCESS_KEY: 'test-web3forms-key',
}

for (const [key, value] of Object.entries(testEnv)) {
    process.env[key] ??= value
}
