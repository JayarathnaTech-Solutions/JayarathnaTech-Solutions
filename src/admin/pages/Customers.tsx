import { useEffect, useState, type FormEvent } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { customerFromDoc } from '../../lib/firestore'
import { CustomerAlreadyExistsError, createCustomerAccount, generateTempPassword } from '../../lib/customerProvisioning'
import { useAuth } from '../AuthContext'
import { SlidePanel } from '../../components/SlidePanel'
import { StatusBadge } from '../../components/StatusBadge'
import { inputClass } from '../../lib/ui'
import { Skeleton } from '../../components/Skeleton'
import type { Customer } from '../../types'

function useCustomers() {
    const [customers, setCustomers] = useState<Customer[] | null>(null)

    const reload = () => {
        getDocs(query(collection(db, 'customers'), orderBy('createdAt', 'desc')))
            .then((snapshot) => setCustomers(snapshot.docs.map(customerFromDoc)))
            .catch(() => setCustomers([]))
    }

    useEffect(reload, [])

    return { customers, reload }
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CreatedPanel({ email, tempPassword, onDone }: { email: string; tempPassword: string; onDone: () => void }) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        await navigator.clipboard.writeText(tempPassword)
        setCopied(true)
    }

    return (
        <div className="space-y-5">
            <p className="text-sm text-slate-400">
                Account created for <span className="font-medium text-white">{email}</span>. Share this temporary password
                with them yourself — it won't be shown again.
            </p>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                <code className="text-sm font-medium text-white">{tempPassword}</code>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600"
                >
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <p className="text-xs text-slate-500">
                A verification email has also been sent to {email}. They must verify it and change this password on first
                login.
            </p>
            <div className="flex justify-end pt-2">
                <button
                    type="button"
                    onClick={onDone}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    Done
                </button>
            </div>
        </div>
    )
}

function CustomerForm({
    createdBy,
    onCreated,
    onCancel,
}: {
    createdBy: string
    onCreated: (email: string, tempPassword: string) => void
    onCancel: () => void
}) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const name = String(formData.get('name') ?? '').trim()
        const email = String(formData.get('email') ?? '').trim().toLowerCase()
        const company = String(formData.get('company') ?? '').trim()
        const tempPassword = generateTempPassword()

        try {
            await createCustomerAccount({ email, name, company: company || undefined, tempPassword, createdBy })
            onCreated(email, tempPassword)
        } catch (err) {
            setError(err instanceof CustomerAlreadyExistsError ? err.message : 'Something went wrong — please try again.')
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Name
                </label>
                <input id="name" name="name" type="text" required placeholder="Jane Perera" className={inputClass} />
            </div>
            <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Email
                </label>
                <input id="email" name="email" type="email" required placeholder="jane@client.com" className={inputClass} />
            </div>
            <div>
                <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Company <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input id="company" name="company" type="text" placeholder="FinCorp (Pvt) Ltd" className={inputClass} />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

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
                    {saving ? 'Creating…' : 'Create Customer'}
                </button>
            </div>
        </form>
    )
}

export function AdminCustomers() {
    const { staff } = useAuth()
    const { customers, reload } = useCustomers()
    const [panelOpen, setPanelOpen] = useState(false)
    const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null)

    function openCreate() {
        setCreated(null)
        setPanelOpen(true)
    }

    function handleCreated(email: string, tempPassword: string) {
        setCreated({ email, tempPassword })
        reload()
    }

    function closePanel() {
        setPanelOpen(false)
        setCreated(null)
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Customers</h1>
                <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    New Customer
                </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                {customers === null ? (
                    <div className="divide-y divide-slate-800">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4">
                                <Skeleton className="h-3.5 w-32" />
                                <Skeleton className="h-3.5 w-40" />
                                <Skeleton className="ml-auto h-5 w-24 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : customers.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">No customers yet — create your first one.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-800 text-xs text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Customer</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Company</th>
                                <th className="px-6 py-3 font-medium">Created</th>
                                <th className="px-6 py-3 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td className="px-6 py-3 font-medium">{customer.name}</td>
                                    <td className="px-6 py-3 text-slate-400">{customer.email}</td>
                                    <td className="px-6 py-3 text-slate-400">{customer.company || '—'}</td>
                                    <td className="px-6 py-3 text-slate-400">{formatDate(customer.createdAt)}</td>
                                    <td className="px-6 py-3 text-right">
                                        <StatusBadge status={customer.mustChangePassword ? 'pending' : 'approved'} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <SlidePanel open={panelOpen} title={created ? 'Customer Created' : 'New Customer'} onClose={closePanel}>
                {created ? (
                    <CreatedPanel email={created.email} tempPassword={created.tempPassword} onDone={closePanel} />
                ) : (
                    <CustomerForm createdBy={staff.email} onCreated={handleCreated} onCancel={closePanel} />
                )}
            </SlidePanel>
        </div>
    )
}
