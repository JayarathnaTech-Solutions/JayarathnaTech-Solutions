import { useState, type FormEvent } from 'react'
import { updatePassword, type User } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { inputClass } from '../../lib/ui'

export function ForceChangePasswordForm({ user, onChanged }: { user: User; onChanged: () => void }) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)

        const formData = new FormData(event.currentTarget)
        const password = String(formData.get('password') ?? '')
        const confirm = String(formData.get('confirm') ?? '')

        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }
        if (password !== confirm) {
            setError('Passwords don’t match.')
            return
        }

        setSaving(true)
        try {
            await updatePassword(user, password)
            await updateDoc(doc(db, 'customers', user.uid), { mustChangePassword: false })
            onChanged()
        } catch {
            setError('Something went wrong — please try signing in again and retrying.')
            setSaving(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8">
                <h1 className="text-xl font-semibold">Set a new password</h1>
                <p className="mt-1.5 text-sm text-slate-500">You're using a temporary password — set your own to continue.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-600">
                            New Password
                        </label>
                        <input id="password" name="password" type="password" required minLength={8} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-slate-600">
                            Confirm Password
                        </label>
                        <input id="confirm" name="confirm" type="password" required minLength={8} className={inputClass} />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                    >
                        {saving ? 'Saving…' : 'Set Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
