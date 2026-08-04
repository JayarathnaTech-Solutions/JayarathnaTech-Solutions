import { useEffect, useState, type FormEvent } from 'react'
import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { staffMemberFromDoc } from '../../lib/firestore'
import { useAuth } from '../AuthContext'
import { SlidePanel } from '../components/SlidePanel'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { StatusBadge } from '../components/StatusBadge'
import type { StaffMember, StaffRole } from '../../types'

function useStaff() {
    const [staff, setStaff] = useState<StaffMember[] | null>(null)

    const reload = () => {
        getDocs(query(collection(db, 'staff'), orderBy('createdAt', 'desc')))
            .then((snapshot) => setStaff(snapshot.docs.map(staffMemberFromDoc)))
            .catch(() => setStaff([]))
    }

    useEffect(reload, [])

    return { staff, reload }
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Avatar({ name, email }: { name: string; email: string }) {
    const initial = (name || email).charAt(0).toUpperCase() || '?'
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
            {initial}
        </div>
    )
}

function InviteForm({
    editing,
    invitedBy,
    onSaved,
    onCancel,
}: {
    editing: StaffMember | null
    invitedBy: string
    onSaved: () => void
    onCancel: () => void
}) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(false)

        const formData = new FormData(event.currentTarget)
        const role = String(formData.get('role') ?? 'editor') as StaffRole

        try {
            if (editing) {
                await updateDoc(doc(db, 'staff', editing.id), { role })
            } else {
                const email = String(formData.get('email') ?? '').trim().toLowerCase()
                await setDoc(doc(db, 'staff', email), {
                    email,
                    name: '',
                    role,
                    invitedBy,
                    createdAt: serverTimestamp(),
                })
            }
            onSaved()
        } catch {
            setError(true)
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    disabled={!!editing}
                    defaultValue={editing?.email}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
            </div>

            <div>
                <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Role
                </label>
                <select
                    id="role"
                    name="role"
                    required
                    defaultValue={editing?.role ?? ''}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                    <option value="" disabled>
                        Select role
                    </option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                </select>
            </div>

            {error && <p className="text-sm text-red-400">Something went wrong — please try again.</p>}

            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-600"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? 'Saving…' : editing ? 'Save Changes' : 'Send Invite'}
                </button>
            </div>
        </form>
    )
}

function EditIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
        </svg>
    )
}

function DeleteIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
        </svg>
    )
}

export function AdminStaff() {
    const { staff: currentStaff } = useAuth()
    const { staff, reload } = useStaff()
    const [panelOpen, setPanelOpen] = useState(false)
    const [editing, setEditing] = useState<StaffMember | null>(null)
    const [removing, setRemoving] = useState<StaffMember | null>(null)

    if (currentStaff.role !== 'admin') {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-10 text-center">
                <h1 className="text-lg font-semibold">Admins only</h1>
                <p className="mt-2 text-sm text-slate-400">Staff management is restricted to Admin accounts.</p>
            </div>
        )
    }

    function openInvite() {
        setEditing(null)
        setPanelOpen(true)
    }

    function openEdit(member: StaffMember) {
        setEditing(member)
        setPanelOpen(true)
    }

    function handleSaved() {
        setPanelOpen(false)
        reload()
    }

    async function handleRemove() {
        if (!removing) return
        await deleteDoc(doc(db, 'staff', removing.id))
        setRemoving(null)
        reload()
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Staff</h1>
                <button
                    type="button"
                    onClick={openInvite}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    Invite Staff
                </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                {staff === null ? (
                    <div className="p-6 text-sm text-slate-500">Loading…</div>
                ) : staff.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">No staff yet — invite your first teammate.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-800 text-xs text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Staff</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Role</th>
                                <th className="px-6 py-3 font-medium">Invited Date</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {staff.map((member) => (
                                <tr key={member.id}>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={member.name} email={member.email} />
                                            <span className="font-medium">{member.name || '(pending sign-in)'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-slate-400">{member.email}</td>
                                    <td className="px-6 py-3">
                                        <StatusBadge status={member.role} />
                                    </td>
                                    <td className="px-6 py-3 text-slate-400">{formatDate(member.createdAt)}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(member)}
                                                aria-label={`Edit ${member.email}`}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRemoving(member)}
                                                disabled={member.id === currentStaff.id}
                                                aria-label={`Remove ${member.email}`}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <SlidePanel open={panelOpen} title={editing ? 'Edit Staff Member' : 'Invite Staff'} onClose={() => setPanelOpen(false)}>
                <InviteForm editing={editing} invitedBy={currentStaff.email} onSaved={handleSaved} onCancel={() => setPanelOpen(false)} />
            </SlidePanel>

            <ConfirmDialog
                open={removing !== null}
                title="Remove staff member?"
                message={`${removing?.email} will lose admin access immediately.`}
                confirmLabel="Remove"
                onConfirm={handleRemove}
                onCancel={() => setRemoving(null)}
            />
        </div>
    )
}
