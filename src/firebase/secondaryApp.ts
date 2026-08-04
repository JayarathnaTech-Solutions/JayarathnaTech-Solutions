import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { firebaseConfig } from './config'

// A second, isolated Firebase App instance used ONLY to create a customer's
// Auth user from the admin panel. firebase/auth's client SDK signs in as
// whatever user createUserWithEmailAndPassword() just created — if that ran
// on the app's normal `auth` instance, it would silently replace the admin's
// active session with the new customer's session mid-click. A second named
// app + its own getAuth() keeps that sign-in fully sandboxed: the admin's
// primary auth (src/firebase/config.ts) never observes it. See
// src/lib/customerProvisioning.ts for the flow that uses this.
const secondaryApp = getApps().some((existing) => existing.name === 'secondary')
    ? getApp('secondary')
    : initializeApp(firebaseConfig, 'secondary')

export const secondaryAuth = getAuth(secondaryApp)

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(secondaryAuth, 'http://127.0.0.1:9099', { disableWarnings: true })
}
