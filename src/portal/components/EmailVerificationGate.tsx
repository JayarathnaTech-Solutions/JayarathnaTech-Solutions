import { useState } from 'react'
import { sendEmailVerification, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '../../firebase/config'

export function EmailVerificationGate({ user }: { user: User }) {
    const [sent, setSent] = useState(false)
    const [sending, setSending] = useState(false)

    async function handleResend() {
        setSending(true)
        try {
            await sendEmailVerification(user)
            setSent(true)
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center text-slate-900">
            <h1 className="text-2xl font-bold">Verify your email</h1>
            <p className="max-w-sm text-sm text-slate-500">
                We sent a verification link to <span className="text-slate-600">{user.email}</span>. Click it, then
                come back here.
            </p>
            <div className="mt-4 flex flex-col items-center gap-3">
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    I&rsquo;ve verified — refresh
                </button>
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={sending}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-60"
                >
                    {sent ? 'Verification email sent' : sending ? 'Sending…' : 'Resend verification email'}
                </button>
                <button type="button" onClick={() => signOut(auth)} className="text-sm text-slate-500 hover:text-slate-700">
                    Sign out
                </button>
            </div>
        </div>
    )
}
