import { Link, useParams } from 'react-router'
import { formatCurrency } from '../../lib/quote'
import { engagementStatusLabels, hasReachedDelivery, phaseDotClass } from '../../lib/engagement'
import { useEngagement, useInvoices } from '../../lib/useEngagementDetail'
import { useCustomerAuth } from '../CustomerAuthContext'
import { StatusBadge } from '../../components/StatusBadge'
import { Skeleton } from '../../components/Skeleton'
import { ChatThread } from '../../components/ChatThread'
import { BankTransferDetails } from '../components/BankTransferDetails'
import type { Invoice } from '../../types'

function InvoiceSection({ invoice, onSubmitted }: { invoice: Invoice; onSubmitted: () => void }) {
    return (
        <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold capitalize text-slate-600">{invoice.type} Payment</h3>
                    <StatusBadge status={invoice.status} />
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(invoice.amount, invoice.currency)}</p>
            </div>
            {invoice.paymentMethod === 'bank_transfer' && invoice.status !== 'verified' && (
                <BankTransferDetails invoice={invoice} onSubmitted={onSubmitted} />
            )}
        </div>
    )
}

export function PortalEngagementDetail() {
    const { engagementId } = useParams<{ engagementId: string }>()
    const { user, customer } = useCustomerAuth()
    const { engagement, reload } = useEngagement(engagementId ?? '')
    const { invoices, reload: reloadInvoices } = useInvoices(engagement?.advanceInvoiceId ?? '', engagement?.finalInvoiceId ?? '')

    function refreshAll() {
        reload()
        reloadInvoices()
    }

    if (engagement === undefined || invoices === null) {
        return <Skeleton className="h-64 w-full" />
    }

    if (engagement === null) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                <h1 className="text-lg font-semibold">Project not found</h1>
                <Link to="/portal" className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-500">
                    Back to Dashboard
                </Link>
            </div>
        )
    }

    const advanceInvoice = invoices.find((i) => i.id === engagement.advanceInvoiceId)
    const finalInvoice = invoices.find((i) => i.id === engagement.finalInvoiceId)
    // The final 50% isn't shown until the project actually reaches delivery —
    // showing it upfront would ask the customer to think about a payment
    // that isn't due yet.
    const showFinalInvoice = hasReachedDelivery(engagement.sprints) || engagement.status === 'delivered'

    return (
        <div>
            <Link to="/portal" className="text-sm text-slate-500 hover:text-slate-900">
                Your Projects
            </Link>
            <div className="mt-3 flex items-center justify-between">
                <h1 className="text-2xl font-bold">{engagement.title}</h1>
                <StatusBadge status={engagementStatusLabels[engagement.status]} />
            </div>
            {engagement.description && <p className="mt-4 text-sm text-slate-500">{engagement.description}</p>}

            {engagement.status === 'delivered' && (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-500/10 p-6 text-sm text-emerald-700">
                    This project has been delivered. Thank you for working with us!
                </div>
            )}

            {engagement.status === 'pending_advance' && (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-500/10 p-6 text-sm text-amber-700">
                    Your project will begin once the advance payment below is verified.
                </div>
            )}

            {engagement.sprints.length > 0 && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
                    <h2 className="text-sm font-semibold text-slate-600">Progress</h2>
                    <div className="mt-4 space-y-5">
                        {engagement.sprints.map((sprint, sprintIndex) => (
                            <div key={sprintIndex}>
                                <h3 className="text-sm font-semibold text-slate-900">{sprint.name}</h3>
                                <ol className="mt-2 space-y-2">
                                    {sprint.phases.map((phase, phaseIndex) => (
                                        <li key={phaseIndex} className="flex items-center gap-3 text-sm">
                                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${phaseDotClass[phase.status]}`}>
                                                {phaseIndex + 1}
                                            </span>
                                            <span className={phase.status !== 'not_started' ? 'font-medium text-slate-900' : 'text-slate-500'}>
                                                {phase.name}
                                                {sprintIndex === engagement.sprints.length - 1 &&
                                                    phaseIndex === sprint.phases.length - 1 &&
                                                    phase.status !== 'not_started' &&
                                                    ' (final delivery)'}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(advanceInvoice || (finalInvoice && showFinalInvoice)) && (
                <div className="mt-6 space-y-6">
                    <h2 className="text-sm font-semibold text-slate-600">Payments</h2>
                    {advanceInvoice && <InvoiceSection invoice={advanceInvoice} onSubmitted={refreshAll} />}
                    {finalInvoice && showFinalInvoice && <InvoiceSection invoice={finalInvoice} onSubmitted={refreshAll} />}
                </div>
            )}

            <div className="mt-6">
                <ChatThread
                    engagementId={engagement.id}
                    senderId={user.uid}
                    senderEmail={customer.email}
                    senderName={customer.name}
                    senderRole="customer"
                />
            </div>
        </div>
    )
}
