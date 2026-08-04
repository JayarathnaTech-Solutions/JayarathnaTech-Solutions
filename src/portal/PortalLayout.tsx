import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useCustomerAuth } from './CustomerAuthContext'
import { EmailVerificationGate } from './components/EmailVerificationGate'
import { ForceChangePasswordForm } from './components/ForceChangePasswordForm'
import { Logo } from '../components/Logo'
import { ConfirmDialog } from '../components/ConfirmDialog'

function Topbar({ name }: { name: string }) {
    const [signOutOpen, setSignOutOpen] = useState(false)
    const initial = name.charAt(0).toUpperCase() || '?'

    return (
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-6 py-4">
            <NavLink to="/portal" className="px-2">
                <Logo />
            </NavLink>
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-400">
                    {initial}
                </div>
                <span className="hidden text-sm font-medium sm:inline">{name}</span>
                <button
                    type="button"
                    onClick={() => setSignOutOpen(true)}
                    className="text-sm font-medium text-slate-400 hover:text-white"
                >
                    Sign out
                </button>
            </div>

            <ConfirmDialog
                open={signOutOpen}
                title="Sign out?"
                message="You'll need to sign in again to access the portal."
                confirmLabel="Sign Out"
                onConfirm={() => signOut(auth)}
                onCancel={() => setSignOutOpen(false)}
            />
        </header>
    )
}

export function PortalLayout() {
    const { user, customer } = useCustomerAuth()

    if (!user.emailVerified) return <EmailVerificationGate user={user} />
    if (customer.mustChangePassword) {
        return <ForceChangePasswordForm user={user} onChanged={() => window.location.reload()} />
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-white">
            <Topbar name={customer.name} />
            <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
                <Outlet />
            </main>
        </div>
    )
}
