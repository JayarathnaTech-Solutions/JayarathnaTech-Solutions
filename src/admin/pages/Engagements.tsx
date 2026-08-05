import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { addDoc, collection, orderBy, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { customerFromDoc, engagementFromDoc } from '../../lib/firestore'
import { useFirestoreCollection } from '../../lib/useFirestoreCollection'
import { formatCurrency } from '../../lib/quote'
import { engagementStatusLabels } from '../../lib/engagement'
import { useAuth } from '../AuthContext'
import { useDevelopers } from '../useDevelopers'
import { SlidePanel } from '../../components/SlidePanel'
import { StatusBadge } from '../../components/StatusBadge'
import { inputClass } from '../../lib/ui'
import { Skeleton } from '../../components/Skeleton'
import type { Customer, StaffMember } from '../../types'

function useEngagements() {
    const { staff } = useAuth()
    const { data: engagements, reload } = useFirestoreCollection(
        () =>
            staff.role === 'admin'
                ? query(collection(db, 'engagements'), orderBy('createdAt', 'desc'))
                : query(collection(db, 'engagements'), where('assignedDeveloperEmails', 'array-contains', staff.email), orderBy('createdAt', 'desc')),
        engagementFromDoc,
        [staff.role, staff.email],
    )

    return { engagements, reload }
}

function useCustomers() {
    const { data } = useFirestoreCollection(
        () => query(collection(db, 'customers'), orderBy('createdAt', 'desc')),
        customerFromDoc,
    )

    return data
}

function NewEngagementForm({
    customers,
    developers,
    createdBy,
    onSaved,
    onCancel,
}: {
    customers: Customer[]
    developers: StaffMember[]
    createdBy: string
    onSaved: () => void
    onCancel: () => void
}) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(false)
    const [assignedEmails, setAssignedEmails] = useState<string[]>([])

    function toggleDeveloper(email: string) {
        setAssignedEmails((current) => (current.includes(email) ? current.filter((e) => e !== email) : [...current, email]))
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(false)

        const formData = new FormData(event.currentTarget)
        const customerId = String(formData.get('customerId') ?? '')
        const customer = customers.find((c) => c.id === customerId)
        if (!customer) {
            setError(true)
            setSaving(false)
            return
        }

        try {
            await addDoc(collection(db, 'engagements'), {
                customerId: customer.id,
                customerEmail: customer.email,
                title: String(formData.get('title') ?? '').trim(),
                description: String(formData.get('description') ?? '').trim(),
                totalValue: 0,
                currency: 'USD',
                status: 'pending_advance',
                assignedDeveloperEmails: assignedEmails,
                sprints: [],
                advanceInvoiceId: '',
                finalInvoiceId: '',
                createdBy,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            })
            onSaved()
        } catch {
            setError(true)
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="customerId" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Customer
                </label>
                <select id="customerId" name="customerId" required defaultValue="" className={inputClass}>
                    <option value="" disabled>
                        Select customer
                    </option>
                    {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                            {customer.name} ({customer.email})
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Title
                </label>
                <input id="title" name="title" type="text" required placeholder="Website Rebuild" className={inputClass} />
            </div>
            <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Description
                </label>
                <textarea id="description" name="description" rows={3} className={inputClass} />
            </div>
            <div>
                <p className="mb-1.5 block text-sm font-medium text-slate-300">Assign Developers</p>
                {developers.length === 0 ? (
                    <p className="text-sm text-slate-500">No developer accounts yet — add one in Staff first.</p>
                ) : (
                    <div className="space-y-2">
                        {developers.map((dev) => (
                            <label key={dev.id} className="flex items-center gap-2 text-sm text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={assignedEmails.includes(dev.email)}
                                    onChange={() => toggleDeveloper(dev.email)}
                                    className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                                />
                                {dev.name || dev.email}
                            </label>
                        ))}
                    </div>
                )}
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
                    {saving ? 'Creating…' : 'Create Engagement'}
                </button>
            </div>
        </form>
    )
}

export function AdminEngagements() {
    const { staff } = useAuth()
    const { engagements, reload } = useEngagements()
    const customers = useCustomers()
    const developers = useDevelopers()
    const navigate = useNavigate()
    const [panelOpen, setPanelOpen] = useState(false)

    function handleSaved() {
        setPanelOpen(false)
        reload()
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Engagements</h1>
                {staff.role === 'admin' && (
                    <button
                        type="button"
                        onClick={() => setPanelOpen(true)}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    >
                        New Engagement
                    </button>
                )}
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                {engagements === null ? (
                    <div className="divide-y divide-slate-800">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4">
                                <Skeleton className="h-3.5 w-32" />
                                <Skeleton className="h-3.5 w-40" />
                                <Skeleton className="ml-auto h-5 w-24 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : engagements.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">No engagements yet.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-800 text-xs text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Title</th>
                                <th className="px-6 py-3 font-medium">Customer</th>
                                <th className="px-6 py-3 font-medium">Total Value</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {engagements.map((engagement) => (
                                <tr
                                    key={engagement.id}
                                    onClick={() => navigate(`/admin/engagements/${engagement.id}`)}
                                    className="cursor-pointer hover:bg-slate-900/60"
                                >
                                    <td className="px-6 py-3 font-medium">{engagement.title}</td>
                                    <td className="px-6 py-3 text-slate-400">{engagement.customerEmail}</td>
                                    <td className="px-6 py-3 text-slate-400">
                                        {engagement.totalValue > 0 ? formatCurrency(engagement.totalValue, engagement.currency) : '—'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <StatusBadge status={engagementStatusLabels[engagement.status]} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <SlidePanel open={panelOpen} title="New Engagement" onClose={() => setPanelOpen(false)}>
                {customers === null || developers === null ? (
                    <Skeleton className="h-40 w-full" />
                ) : (
                    <NewEngagementForm
                        customers={customers}
                        developers={developers}
                        createdBy={staff.email}
                        onSaved={handleSaved}
                        onCancel={() => setPanelOpen(false)}
                    />
                )}
            </SlidePanel>
        </div>
    )
}
