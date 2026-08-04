import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuthStatus } from './useAuthStatus'
import { AuthContext } from './AuthContext'

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

function NotStaff() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-950 px-6 text-center text-white">
            <h1 className="text-2xl font-bold">Access restricted</h1>
            <p className="max-w-sm text-sm text-slate-400">
                Your Google account isn&rsquo;t on the staff list. Admin access is invite-only — contact an
                administrator if you believe this is a mistake.
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

export function RequireAuth({ children }: { children: ReactNode }) {
    const authStatus = useAuthStatus()

    if (authStatus.status === 'checking') return <CheckingScreen />
    if (authStatus.status === 'signed-out') return <Navigate to="/admin/login" replace />
    if (authStatus.status === 'not-staff') return <NotStaff />

    return (
        <AuthContext.Provider value={{ user: authStatus.user, staff: authStatus.staff }}>
            {children}
        </AuthContext.Provider>
    )
}
