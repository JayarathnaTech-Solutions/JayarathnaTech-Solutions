import { useEffect, useState, type FormEvent } from 'react'
import { collection, deleteDoc, doc, getDoc, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { staffMemberFromDoc, staffPersonalInfoFromDoc } from '../../lib/firestore'
import { useFirestoreCollection } from '../../lib/useFirestoreCollection'
import { formatDate } from '../../lib/format'
import { useAuth } from '../AuthContext'
import { SlidePanel } from '../../components/SlidePanel'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { StatusBadge } from '../../components/StatusBadge'
import { Avatar } from '../../components/Avatar'
import { EditIcon, DeleteIcon, IdCardIcon } from '../../components/icons'
import { Field, TextAreaField } from '../../components/FormField'
import { NicImageUpload } from '../components/NicImageUpload'
import { inputClass } from '../../lib/ui'
import { Skeleton } from '../../components/Skeleton'
import type { StaffMember, StaffPersonalInfo, StaffRole } from '../../types'

function useStaff() {
    const { data: staff, reload } = useFirestoreCollection(
        () => query(collection(db, 'staff'), orderBy('createdAt', 'desc')),
        staffMemberFromDoc,
    )

    return { staff, reload }
}

function InviteForm({
    editing,
    invitedBy,
    showAdminOption,
    onSaved,
    onCancel,
}: {
    editing: StaffMember | null
    invitedBy: string
    showAdminOption: boolean
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
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-600">
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
                    className={`${inputClass} disabled:opacity-50`}
                />
            </div>

            <div>
                <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-600">
                    Role
                </label>
                <select
                    id="role"
                    name="role"
                    required
                    defaultValue={editing?.role ?? ''}
                    className={inputClass}
                >
                    <option value="" disabled>
                        Select role
                    </option>
                    {showAdminOption && <option value="admin">Admin</option>}
                    <option value="editor">Editor</option>
                    <option value="developer">Developer</option>
                    <option value="qa">QA</option>
                    <option value="intern">Intern</option>
                    <option value="uiux">UI/UX Designer</option>
                    <option value="hr">HR Manager</option>
                </select>
            </div>

            {error && <p className="text-sm text-red-600">Something went wrong — please try again.</p>}

            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-400"
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

const emptyPersonalInfo: Omit<StaffPersonalInfo, 'id' | 'updatedAt' | 'updatedBy'> = {
    nic: '',
    birthday: '',
    address: '',
    phone1: '',
    phone2: '',
    nicFrontUrl: '',
    nicBackUrl: '',
}

function PersonalInfoForm({ member, updatedBy, onSaved }: { member: StaffMember; updatedBy: string; onSaved: () => void }) {
    const [loading, setLoading] = useState(true)
    const [record, setRecord] = useState(emptyPersonalInfo)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(false)

    useEffect(() => {
        let cancelled = false

        getDoc(doc(db, 'staffRecords', member.id))
            .then((snapshot) => {
                if (cancelled) return
                if (snapshot.exists()) {
                    const info = staffPersonalInfoFromDoc(snapshot)
                    setRecord({
                        nic: info.nic,
                        birthday: info.birthday,
                        address: info.address,
                        phone1: info.phone1,
                        phone2: info.phone2,
                        nicFrontUrl: info.nicFrontUrl,
                        nicBackUrl: info.nicBackUrl,
                    })
                } else {
                    setRecord(emptyPersonalInfo)
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [member.id])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(false)

        const formData = new FormData(event.currentTarget)

        try {
            await setDoc(
                doc(db, 'staffRecords', member.id),
                {
                    nic: String(formData.get('nic') ?? '').trim(),
                    birthday: String(formData.get('birthday') ?? ''),
                    address: String(formData.get('address') ?? '').trim(),
                    phone1: String(formData.get('phone1') ?? '').trim(),
                    phone2: String(formData.get('phone2') ?? '').trim(),
                    nicFrontUrl: record.nicFrontUrl,
                    nicBackUrl: record.nicBackUrl,
                    updatedAt: serverTimestamp(),
                    updatedBy,
                },
                { merge: true },
            )
            onSaved()
        } catch {
            setError(true)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="NIC Number" name="nic" placeholder="XXXXXXXXXVX" defaultValue={record.nic} />
            <Field label="Birthday" name="birthday" type="date" defaultValue={record.birthday} />
            <TextAreaField label="Address" name="address" placeholder="Full residential address" defaultValue={record.address} />
            <Field label="Phone Number 1" name="phone1" type="tel" placeholder="+94 7X XXX XXXX" defaultValue={record.phone1} />
            <Field label="Phone Number 2" name="phone2" type="tel" placeholder="+94 7X XXX XXXX" defaultValue={record.phone2} />

            <NicImageUpload
                label="NIC Front"
                value={record.nicFrontUrl}
                onChange={(url) => setRecord((prev) => ({ ...prev, nicFrontUrl: url }))}
            />
            <NicImageUpload
                label="NIC Back"
                value={record.nicBackUrl}
                onChange={(url) => setRecord((prev) => ({ ...prev, nicBackUrl: url }))}
            />

            {error && <p className="text-sm text-red-600">Something went wrong — please try again.</p>}

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    )
}

export function AdminStaff() {
    const { staff: currentStaff } = useAuth()
    const { staff, reload } = useStaff()
    const [panelOpen, setPanelOpen] = useState(false)
    const [editing, setEditing] = useState<StaffMember | null>(null)
    const [removing, setRemoving] = useState<StaffMember | null>(null)
    const [personalMember, setPersonalMember] = useState<StaffMember | null>(null)

    if (currentStaff.role !== 'admin' && currentStaff.role !== 'hr') {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                <h1 className="text-lg font-semibold">Restricted</h1>
                <p className="mt-2 text-sm text-slate-500">Staff management is restricted to Admin and HR accounts.</p>
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
        await deleteDoc(doc(db, 'staffRecords', removing.id)).catch(() => {})
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

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {staff === null ? (
                    <div className="divide-y divide-slate-200">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4">
                                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                                <Skeleton className="h-3.5 w-32" />
                                <Skeleton className="h-3.5 w-40" />
                                <Skeleton className="ml-auto h-5 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : staff.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">No staff yet — invite your first teammate.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 text-xs text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Staff</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Role</th>
                                <th className="px-6 py-3 font-medium">Invited Date</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {staff.map((member) => {
                                // HR has full parity with admin except it can never touch an
                                // admin account — matches the firestore.rules boundary exactly.
                                const blockedForHr = currentStaff.role === 'hr' && member.role === 'admin'
                                // Neither admin nor hr can change their own role — a self-demotion
                                // could lock the account out with no one else around to undo it.
                                const isSelf = member.id === currentStaff.id
                                return (
                                <tr key={member.id}>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar label={member.name || member.email} />
                                            <span className="font-medium">{member.name || '(pending sign-in)'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500">{member.email}</td>
                                    <td className="px-6 py-3">
                                        <StatusBadge status={member.role} />
                                    </td>
                                    <td className="px-6 py-3 text-slate-500">{formatDate(member.createdAt)}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPersonalMember(member)}
                                                disabled={blockedForHr}
                                                aria-label={`Personal info for ${member.email}`}
                                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30"
                                            >
                                                <IdCardIcon />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEdit(member)}
                                                disabled={blockedForHr || isSelf}
                                                aria-label={`Edit ${member.email}`}
                                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRemoving(member)}
                                                disabled={isSelf || blockedForHr}
                                                aria-label={`Remove ${member.email}`}
                                                className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-30"
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <SlidePanel open={panelOpen} title={editing ? 'Edit Staff Member' : 'Invite Staff'} onClose={() => setPanelOpen(false)}>
                <InviteForm
                    editing={editing}
                    invitedBy={currentStaff.email}
                    showAdminOption={currentStaff.role === 'admin'}
                    onSaved={handleSaved}
                    onCancel={() => setPanelOpen(false)}
                />
            </SlidePanel>

            <SlidePanel
                open={personalMember !== null}
                title={`Personal Information — ${personalMember?.name || personalMember?.email || ''}`}
                onClose={() => setPersonalMember(null)}
            >
                {personalMember && (
                    <PersonalInfoForm
                        key={personalMember.id}
                        member={personalMember}
                        updatedBy={currentStaff.email}
                        onSaved={() => setPersonalMember(null)}
                    />
                )}
            </SlidePanel>

            <ConfirmDialog
                open={removing !== null}
                title="Remove staff member?"
                message={`${removing?.email} will lose staff access immediately.`}
                confirmLabel="Remove"
                onConfirm={handleRemove}
                onCancel={() => setRemoving(null)}
            />
        </div>
    )
}
