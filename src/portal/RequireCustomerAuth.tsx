import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useCustomerAuthStatus } from './useCustomerAuthStatus'
import { CustomerAuthContext } from './CustomerAuthContext'

function CheckingScreen() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
            <div
                role="status"
                aria-label="Loading"
                className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400"
            />
        </div>
    )
}

function NotCustomer() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-950 px-6 text-center text-white">
            <h1 className="text-2xl font-bold">Access restricted</h1>
            <p className="max-w-sm text-sm text-slate-400">
                This account isn&rsquo;t set up as a customer portal account. Contact JayarathnaTech Solutions if you
                believe this is a mistake.
            </p>
            <button
                type="button"
                onClick={() => signOut(auth)}
                className="mt-4 text-sm font-medium text-blue-400 hover:text-blue-300"
            >
                Sign in with a different account
            </button>
        </div>
    )
}

export function RequireCustomerAuth({ children }: { children: ReactNode }) {
    const authStatus = useCustomerAuthStatus()

    if (authStatus.status === 'checking') return <CheckingScreen />
    if (authStatus.status === 'signed-out') return <Navigate to="/portal/login" replace />
    if (authStatus.status === 'not-customer') return <NotCustomer />

    return (
        <CustomerAuthContext.Provider value={{ user: authStatus.user, customer: authStatus.customer }}>
            {children}
        </CustomerAuthContext.Provider>
    )
}
