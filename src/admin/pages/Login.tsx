import { useState } from 'react'
import { Navigate } from 'react-router'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../../firebase/config'
import { useAuthStatus } from '../useAuthStatus'
import { Logo } from '../../components/Logo'
import { Seo } from '../../components/Seo'

type SignInStatus = 'idle' | 'signing-in' | 'error'

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18">
            <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
            />
            <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
            />
            <path
                fill="#FBBC05"
                d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
            />
            <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
            />
        </svg>
    )
}

export function Login() {
    const authStatus = useAuthStatus()
    const [signInStatus, setSignInStatus] = useState<SignInStatus>('idle')

    async function handleSignIn() {
        setSignInStatus('signing-in')
        try {
            await signInWithPopup(auth, new GoogleAuthProvider())
            setSignInStatus('idle')
        } catch {
            setSignInStatus('error')
        }
    }

    if (authStatus.status === 'authorized') return <Navigate to="/admin" replace />

    return (
        <>
            <Seo title="Admin Login — JayarathnaTech Solutions" description="Staff sign-in for JayarathnaTech Solutions." />

            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900 dark:bg-slate-950 dark:text-white">
                <div className="w-full max-w-sm">
                    <div className="flex justify-center">
                        <Logo />
                    </div>

                    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/40">
                        <h1 className="text-xl font-semibold">Admin Sign In</h1>
                        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Staff access only</p>

                        <button
                            type="button"
                            onClick={handleSignIn}
                            disabled={signInStatus === 'signing-in'}
                            className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-60"
                        >
                            <GoogleIcon />
                            {signInStatus === 'signing-in' ? 'Signing in…' : 'Sign in with Google'}
                        </button>

                        {signInStatus === 'error' && (
                            <p className="mt-4 text-sm text-red-600 dark:text-red-400">Sign-in failed — please try again.</p>
                        )}

                        {authStatus.status === 'not-staff' && (
                            <div className="mt-4 space-y-2">
                                <p className="text-sm text-red-600 dark:text-red-400">This Google account isn&rsquo;t on the staff list.</p>
                                <button
                                    type="button"
                                    onClick={() => signOut(auth)}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Try a different account
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">Access is invite-only</p>
                </div>
            </div>
        </>
    )
}
