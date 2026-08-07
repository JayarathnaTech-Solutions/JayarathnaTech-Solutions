import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { collection, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { customerFromDoc } from '../../lib/firestore'
import { useEngagement, useInvoices } from '../../lib/useEngagementDetail'
import { calcBalance, calcDeposit, formatCurrency } from '../../lib/quote'
import { defaultPhaseTemplate, engagementStatusLabels, hasReachedDelivery, phaseDotClass, phaseStatusLabels } from '../../lib/engagement'
import { formatDateTime } from '../../lib/format'
import { useAuth } from '../AuthContext'
import { useDevelopers } from '../useDevelopers'
import { StatusBadge } from '../../components/StatusBadge'
import { ChatThread } from '../../components/ChatThread'
import { inputClass } from '../../lib/ui'
import { Skeleton } from '../../components/Skeleton'
import type { Currency, Engagement, Invoice, Phase, PhaseStatus, Sprint } from '../../types'

function useCustomerName(customerId: string) {
    const [name, setName] = useState<string | null>(null)

    useEffect(() => {
        // `doc()` throws synchronously (not a rejected promise) for an empty
        // id, which happens on the render before `engagement` has loaded.
        if (customerId === '') return

        getDoc(doc(db, 'customers', customerId))
            .then((snap) => setName(snap.exists() ? customerFromDoc(snap).name : null))
            .catch(() => setName(null))
    }, [customerId])

    return name
}

function SetContractValueForm({ engagement, onSaved }: { engagement: Engagement; onSaved: () => void }) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(false)

        const formData = new FormData(event.currentTarget)
        const totalValue = Number(formData.get('totalValue') ?? 0)
        const currency = String(formData.get('currency') ?? 'USD') as Currency

        try {
            const batch = writeBatch(db)
            const advanceRef = doc(collection(db, 'invoices'))
            const finalRef = doc(collection(db, 'invoices'))

            batch.set(advanceRef, {
                engagementId: engagement.id, customerId: engagement.customerId, type: 'advance',
                amount: calcDeposit(totalValue), currency, paymentMethod: 'bank_transfer', status: 'pending', createdAt: new Date(),
            })
            batch.set(finalRef, {
                engagementId: engagement.id, customerId: engagement.customerId, type: 'final',
                amount: calcBalance(totalValue), currency, paymentMethod: 'bank_transfer', status: 'pending', createdAt: new Date(),
            })
            batch.update(doc(db, 'engagements', engagement.id), {
                totalValue, currency, advanceInvoiceId: advanceRef.id, finalInvoiceId: finalRef.id, updatedAt: new Date(),
            })

            await batch.commit()
            onSaved()
        } catch {
            setError(true)
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Set Contract Value</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Generates a 50% advance and 50% final invoice. This can only be done once.
            </p>
            <div className="mt-4 grid grid-cols-[1fr_8rem] gap-3">
                <input name="totalValue" type="number" min={0} step="0.01" required placeholder="Total contract value" className={inputClass} />
                <select name="currency" defaultValue="USD" className={inputClass}>
                    <option value="USD">USD</option>
                    <option value="LKR">LKR</option>
                </select>
            </div>
            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">Something went wrong — please try again.</p>}
            <div className="mt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Generate Invoices'}
                </button>
            </div>
        </form>
    )
}

function SprintsForm({ engagement, onSaved }: { engagement: Engagement; onSaved: () => void }) {
    const [phaseNames, setPhaseNames] = useState<string[]>(defaultPhaseTemplate)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(false)

    function updatePhase(index: number, value: string) {
        setPhaseNames((current) => current.map((s, i) => (i === index ? value : s)))
    }
    function removePhase(index: number) {
        setPhaseNames((current) => current.filter((_, i) => i !== index))
    }
    function addPhase() {
        setPhaseNames((current) => [...current.slice(0, -1), `Phase ${current.length}`, current[current.length - 1]])
    }

    async function handleStart() {
        const cleaned = phaseNames.map((s) => s.trim()).filter((s) => s.length > 0)
        if (cleaned.length < 1) return
        const phases: Phase[] = cleaned.map((name, index) => ({ name, status: index === 0 ? 'in_progress' : 'not_started' }))
        const sprints: Sprint[] = [{ name: 'Sprint 1', phases }]
        setSaving(true)
        setError(false)
        try {
            await updateDoc(doc(db, 'engagements', engagement.id), {
                sprints, status: 'in_progress', updatedAt: new Date(),
            })
            onSaved()
        } catch {
            setError(true)
            setSaving(false)
        }
    }

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Define Sprint 1 &amp; Start Project</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Advance payment verified. Lay out Sprint 1's phase checklist — the last phase is the delivery phase.
                More sprints can be added later.
            </p>
            <div className="mt-4 space-y-2">
                {phaseNames.map((phase, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            value={phase}
                            onChange={(event) => updatePhase(index, event.target.value)}
                            placeholder={index === phaseNames.length - 1 ? 'Deploy' : `Phase ${index + 1}`}
                            className={`min-w-0 ${inputClass}`}
                        />
                        <button
                            type="button"
                            onClick={() => removePhase(index)}
                            aria-label="Remove phase"
                            className="shrink-0 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={addPhase} className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                + Add Phase
            </button>
            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">Something went wrong — please try again.</p>}
            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={handleStart}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? 'Starting…' : 'Start Project'}
                </button>
            </div>
        </div>
    )
}

// Each sprint has its own phase checklist, tracked independently — admin can
// add more phases within a sprint, or add whole new sprints (each starting
// from the default phase template).
function SprintsPanel({ engagement, isAdmin, onSaved }: { engagement: Engagement; isAdmin: boolean; onSaved: () => void }) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(false)
    const [newPhaseNames, setNewPhaseNames] = useState<Record<number, string>>({})
    const [newSprintName, setNewSprintName] = useState('')

    async function persist(sprints: Sprint[]) {
        setSaving(true)
        setError(false)
        try {
            await updateDoc(doc(db, 'engagements', engagement.id), { sprints, updatedAt: new Date() })
            onSaved()
        } catch {
            setError(true)
        } finally {
            setSaving(false)
        }
    }

    function handlePhaseStatus(sprintIndex: number, phaseIndex: number, status: PhaseStatus) {
        const sprints = engagement.sprints.map((sprint, si) =>
            si !== sprintIndex ? sprint : { ...sprint, phases: sprint.phases.map((p, pi) => (pi === phaseIndex ? { ...p, status } : p)) },
        )
        void persist(sprints)
    }

    function handleAddPhase(sprintIndex: number) {
        const name = (newPhaseNames[sprintIndex] ?? '').trim()
        if (!name) return
        const sprints = engagement.sprints.map((sprint, si) =>
            si !== sprintIndex ? sprint : { ...sprint, phases: [...sprint.phases, { name, status: 'not_started' as const }] },
        )
        setNewPhaseNames((current) => ({ ...current, [sprintIndex]: '' }))
        void persist(sprints)
    }

    function handleAddSprint() {
        const name = newSprintName.trim()
        if (!name) return
        const sprint: Sprint = { name, phases: defaultPhaseTemplate.map((n) => ({ name: n, status: 'not_started' })) }
        setNewSprintName('')
        void persist([...engagement.sprints, sprint])
    }

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Sprints</h2>
            {isAdmin && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Each sprint has its own phase checklist, tracked independently.</p>}

            <div className="mt-4 space-y-6">
                {engagement.sprints.map((sprint, sprintIndex) => (
                    <div key={sprintIndex} className={sprintIndex > 0 ? 'border-t border-slate-200 dark:border-slate-800 pt-6' : ''}>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{sprint.name}</h3>
                        <ol className="mt-3 space-y-2">
                            {sprint.phases.map((phase, phaseIndex) => (
                                <li key={phaseIndex} className="flex items-center gap-3 text-sm">
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${phaseDotClass[phase.status]}`}>
                                        {phaseIndex + 1}
                                    </span>
                                    <span className={`flex-1 ${phase.status !== 'not_started' ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {phase.name}
                                    </span>
                                    {isAdmin ? (
                                        <select
                                            value={phase.status}
                                            onChange={(event) => handlePhaseStatus(sprintIndex, phaseIndex, event.target.value as PhaseStatus)}
                                            disabled={saving}
                                            className="shrink-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950/60 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-60"
                                        >
                                            {(['not_started', 'in_progress', 'completed'] as const).map((status) => (
                                                <option key={status} value={status}>
                                                    {phaseStatusLabels[status]}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <StatusBadge status={phase.status.replace('_', ' ')} />
                                    )}
                                </li>
                            ))}
                        </ol>

                        {isAdmin && (
                            <div className="mt-3 flex items-center gap-2">
                                <input
                                    value={newPhaseNames[sprintIndex] ?? ''}
                                    onChange={(event) => setNewPhaseNames((current) => ({ ...current, [sprintIndex]: event.target.value }))}
                                    placeholder="New phase name"
                                    className={`min-w-0 ${inputClass}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddPhase(sprintIndex)}
                                    disabled={saving || !(newPhaseNames[sprintIndex] ?? '').trim()}
                                    className="shrink-0 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-60"
                                >
                                    Add Phase
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isAdmin && (
                <div className="mt-6 flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <input
                        value={newSprintName}
                        onChange={(event) => setNewSprintName(event.target.value)}
                        placeholder={`Sprint ${engagement.sprints.length + 1}`}
                        className={`min-w-0 ${inputClass}`}
                    />
                    <button
                        type="button"
                        onClick={handleAddSprint}
                        disabled={saving || !newSprintName.trim()}
                        className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                    >
                        Add Sprint
                    </button>
                </div>
            )}
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">Something went wrong — please try again.</p>}
        </div>
    )
}

function DeliverAction({
    engagement,
    finalVerified,
    onSaved,
}: {
    engagement: Engagement
    finalVerified: boolean
    onSaved: () => void
}) {
    const [saving, setSaving] = useState(false)

    async function handleDeliver() {
        setSaving(true)
        try {
            await updateDoc(doc(db, 'engagements', engagement.id), { status: 'delivered', updatedAt: new Date() })
            onSaved()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Delivery</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {finalVerified
                    ? 'The final payment is verified — this engagement can be marked delivered.'
                    : 'Waiting on the final payment to be verified before this can be marked delivered.'}
            </p>
            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={handleDeliver}
                    disabled={saving || !finalVerified}
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
                >
                    {saving ? 'Marking…' : 'Mark Delivered'}
                </button>
            </div>
        </div>
    )
}

function AssignedDevelopers({ engagement, onSaved }: { engagement: Engagement; onSaved: () => void }) {
    const developers = useDevelopers()
    const [selected, setSelected] = useState<string[]>(engagement.assignedDeveloperEmails)
    const [saving, setSaving] = useState(false)

    function toggle(email: string) {
        setSelected((current) => (current.includes(email) ? current.filter((e) => e !== email) : [...current, email]))
    }

    async function handleSave() {
        setSaving(true)
        try {
            await updateDoc(doc(db, 'engagements', engagement.id), { assignedDeveloperEmails: selected, updatedAt: new Date() })
            onSaved()
        } finally {
            setSaving(false)
        }
    }

    if (developers === null) return <Skeleton className="h-24 w-full" />

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Assigned Developers</h2>
            {developers.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No developer accounts yet — add one in Staff.</p>
            ) : (
                <div className="mt-3 space-y-2">
                    {developers.map((dev) => (
                        <label key={dev.id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={selected.includes(dev.email)}
                                onChange={() => toggle(dev.email)}
                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                            />
                            {dev.name || dev.email}
                        </label>
                    ))}
                </div>
            )}
            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Save Assignments'}
                </button>
            </div>
        </div>
    )
}

function InvoiceCard({
    invoice,
    engagement,
    customerName,
    isAdmin,
    onVerified,
}: {
    invoice: Invoice
    engagement: Engagement
    customerName: string
    isAdmin: boolean
    onVerified: () => void
}) {
    const [verifying, setVerifying] = useState(false)
    const [exporting, setExporting] = useState(false)
    const { staff } = useAuth()

    async function handleVerify() {
        setVerifying(true)
        try {
            await updateDoc(doc(db, 'invoices', invoice.id), {
                status: 'verified', verifiedBy: staff.email, verifiedAt: new Date().toISOString(),
            })
            onVerified()
        } finally {
            setVerifying(false)
        }
    }

    async function handleExport() {
        setExporting(true)
        try {
            const { exportInvoicePdf } = await import('../../lib/invoicePdf')
            await exportInvoicePdf(invoice, engagement, customerName)
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold capitalize text-slate-600 dark:text-slate-300">{invoice.type} Invoice</h3>
                <StatusBadge status={invoice.status} />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(invoice.amount, invoice.currency)}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 capitalize">{invoice.paymentMethod.replace('_', ' ')}</p>

            {invoice.proofUrl && (
                <a
                    href={invoice.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                    View payment proof
                </a>
            )}

            {invoice.status === 'verified' && invoice.verifiedBy && invoice.verifiedAt && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Verified by {invoice.verifiedBy} on {formatDateTime(invoice.verifiedAt)}
                </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-60"
                >
                    {exporting ? 'Exporting…' : 'Export PDF'}
                </button>
                {isAdmin && invoice.status !== 'verified' && (
                    <button
                        type="button"
                        onClick={handleVerify}
                        disabled={verifying}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
                    >
                        {verifying ? 'Verifying…' : 'Mark Verified'}
                    </button>
                )}
            </div>
        </div>
    )
}

export function AdminEngagementDetail() {
    const { engagementId } = useParams<{ engagementId: string }>()
    const { user, staff } = useAuth()
    const { engagement, reload } = useEngagement(engagementId ?? '')
    const { invoices, reload: reloadInvoices } = useInvoices(engagement?.advanceInvoiceId ?? '', engagement?.finalInvoiceId ?? '')
    const customerName = useCustomerName(engagement?.customerId ?? '')
    const isAdmin = staff.role === 'admin'

    function refreshAll() {
        reload()
        reloadInvoices()
    }

    if (engagement === undefined || invoices === null) {
        return <Skeleton className="h-64 w-full" />
    }

    if (engagement === null) {
        return (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-10 text-center">
                <h1 className="text-lg font-semibold">Engagement not found</h1>
                <Link to="/admin/engagements" className="mt-3 inline-block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                    Back to Engagements
                </Link>
            </div>
        )
    }

    const advanceInvoice = invoices.find((i) => i.id === engagement.advanceInvoiceId)
    const finalInvoice = invoices.find((i) => i.id === engagement.finalInvoiceId)
    const advanceVerified = advanceInvoice?.status === 'verified'
    const finalVerified = finalInvoice?.status === 'verified'
    const lastSprintStarted = hasReachedDelivery(engagement.sprints)

    return (
        <div>
            <Link to="/admin/engagements" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                Engagements
            </Link>
            <div className="mt-3 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{engagement.title}</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{engagement.customerEmail}</p>
                </div>
                <StatusBadge status={engagementStatusLabels[engagement.status]} />
            </div>
            {engagement.description && <p className="mt-4 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{engagement.description}</p>}

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    {!engagement.advanceInvoiceId && isAdmin && (
                        <SetContractValueForm engagement={engagement} onSaved={refreshAll} />
                    )}

                    {engagement.status === 'pending_advance' && advanceInvoice && isAdmin && engagement.sprints.length === 0 && (
                        advanceVerified ? (
                            <SprintsForm engagement={engagement} onSaved={refreshAll} />
                        ) : (
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 text-sm text-slate-500 dark:text-slate-400">
                                Waiting on the advance payment to be verified before sprints can be planned and the project started.
                            </div>
                        )
                    )}

                    {engagement.sprints.length > 0 && (
                        <SprintsPanel engagement={engagement} isAdmin={isAdmin} onSaved={refreshAll} />
                    )}

                    {engagement.status === 'in_progress' && lastSprintStarted && isAdmin && (
                        <DeliverAction engagement={engagement} finalVerified={finalVerified} onSaved={refreshAll} />
                    )}

                    {isAdmin && <AssignedDevelopers engagement={engagement} onSaved={refreshAll} />}
                </div>

                <div className="space-y-6">
                    <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Invoices</h2>
                    {!advanceInvoice && !finalInvoice ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No invoices yet — set the contract value to generate them.</p>
                    ) : (
                        <div className="space-y-4">
                            {advanceInvoice && (
                                <InvoiceCard
                                    invoice={advanceInvoice}
                                    engagement={engagement}
                                    customerName={customerName ?? engagement.customerEmail}
                                    isAdmin={isAdmin}
                                    onVerified={refreshAll}
                                />
                            )}
                            {finalInvoice && (
                                <InvoiceCard
                                    invoice={finalInvoice}
                                    engagement={engagement}
                                    customerName={customerName ?? engagement.customerEmail}
                                    isAdmin={isAdmin}
                                    onVerified={refreshAll}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <ChatThread
                    engagementId={engagement.id}
                    senderId={user.uid}
                    senderEmail={staff.email}
                    senderName={staff.name || staff.email}
                    senderRole={staff.role === 'developer' ? 'developer' : 'admin'}
                />
            </div>
        </div>
    )
}
