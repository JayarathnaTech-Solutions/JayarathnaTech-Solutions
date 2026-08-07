import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase/config'
import { useCustomerAuthStatus } from '../useCustomerAuthStatus'
import { Logo } from '../../components/Logo'
import { Seo } from '../../components/Seo'
import { inputClass } from '../../lib/ui'

type SignInStatus = 'idle' | 'signing-in' | 'error'

export function PortalLogin() {
    const authStatus = useCustomerAuthStatus()
    const [signInStatus, setSignInStatus] = useState<SignInStatus>('idle')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSignInStatus('signing-in')

        const formData = new FormData(event.currentTarget)
        const email = String(formData.get('email') ?? '').trim()
        const password = String(formData.get('password') ?? '')

        try {
            await signInWithEmailAndPassword(auth, email, password)
            setSignInStatus('idle')
        } catch {
            setSignInStatus('error')
        }
    }

    if (authStatus.status === 'authorized') return <Navigate to="/portal" replace />

    return (
        <>
            <Seo title="Customer Portal Login — JayarathnaTech Solutions" description="Sign in to track your project." />

            <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
                <div className="w-full max-w-sm">
                    <div className="flex justify-center">
                        <Logo variant="dark" />
                    </div>

                    <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-8">
                        <h1 className="text-center text-xl font-semibold">Customer Portal</h1>
                        <p className="mt-1.5 text-center text-sm text-slate-400">Sign in to track your project</p>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                                    Email
                                </label>
                                <input id="email" name="email" type="email" required className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                                    Password
                                </label>
                                <input id="password" name="password" type="password" required className={inputClass} />
                            </div>

                            {signInStatus === 'error' && (
                                <p className="text-sm text-red-400">Incorrect email or password — please try again.</p>
                            )}

                            <button
                                type="submit"
                                disabled={signInStatus === 'signing-in'}
                                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                            >
                                {signInStatus === 'signing-in' ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-xs text-slate-500">
                        Accounts are set up by JayarathnaTech Solutions — contact us if you need access.
                    </p>
                </div>
            </div>
        </>
    )
}
