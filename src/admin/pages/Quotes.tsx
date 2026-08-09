import { useState } from 'react'
import { addDoc, collection, doc, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { quoteFromDoc } from '../../lib/firestore'
import { useFirestoreCollection } from '../../lib/useFirestoreCollection'
import { formatDate } from '../../lib/format'
import {
    calcBalance,
    calcBufferAmount,
    calcDeposit,
    calcGrandTotal,
    calcProfitAmount,
    calcQuoteTotal,
    formatCurrency,
    lineItemTotal,
} from '../../lib/quote'
import { SlidePanel } from '../../components/SlidePanel'
import { StatusBadge } from '../../components/StatusBadge'
import { inputClass } from '../../lib/ui'
import { Skeleton } from '../../components/Skeleton'
import type { Quote, QuoteCurrency, QuoteLineItem, QuoteStatus } from '../../types'

const filterTabs: { value: QuoteStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
]

function useQuotes(filter: QuoteStatus | 'all') {
    const { data: quotes, reload } = useFirestoreCollection(
        () =>
            filter === 'all'
                ? query(collection(db, 'quotes'), orderBy('createdAt', 'desc'))
                : query(collection(db, 'quotes'), where('status', '==', filter), orderBy('createdAt', 'desc')),
        quoteFromDoc,
        [filter],
    )

    return { quotes, reload }
}

function LineItemsEditor({
    items,
    currency,
    onChange,
}: {
    items: QuoteLineItem[]
    currency: QuoteCurrency
    onChange: (items: QuoteLineItem[]) => void
}) {
    function updateItem(index: number, patch: Partial<QuoteLineItem>) {
        onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
    }

    function removeItem(index: number) {
        onChange(items.filter((_, i) => i !== index))
    }

    function addItem() {
        onChange([...items, { description: '', quantity: 1, unitPrice: 0 }])
    }

    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Line Items</label>
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-[1fr_4rem_5rem_5rem_1.5rem] items-start gap-2">
                        <input
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(event) => updateItem(index, { description: event.target.value })}
                            className={`min-w-0 ${inputClass}`}
                        />
                        <input
                            type="number"
                            min={0}
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
                            className={`min-w-0 ${inputClass}`}
                        />
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })}
                            className={`min-w-0 ${inputClass}`}
                        />
                        <span className="pt-2.5 text-right text-sm text-slate-500">
                            {formatCurrency(lineItemTotal(item), currency)}
                        </span>
                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            aria-label="Remove line item"
                            className="mt-2 justify-self-end text-slate-500 hover:text-red-600"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={addItem} className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500">
                + Add Line Item
            </button>
        </div>
    )
}

function QuoteForm({ quote, onSaved, onClose }: { quote: Quote | null; onSaved: () => void; onClose: () => void }) {
    const [clientName, setClientName] = useState(quote?.clientName ?? '')
    const [clientEmail, setClientEmail] = useState(quote?.clientEmail ?? '')
    const [status, setStatus] = useState<QuoteStatus>(quote?.status ?? 'draft')
    const [currency, setCurrency] = useState<QuoteCurrency>(quote?.currency ?? 'USD')
    const [bufferPercent, setBufferPercent] = useState(quote?.bufferPercent ?? 0)
    const [profitPercent, setProfitPercent] = useState(quote?.profitPercent ?? 0)
    const [lineItems, setLineItems] = useState<QuoteLineItem[]>(
        quote?.lineItems && quote.lineItems.length > 0 ? quote.lineItems : [{ description: '', quantity: 1, unitPrice: 0 }],
    )
    const [customerRequirements, setCustomerRequirements] = useState(quote?.customerRequirements ?? '')
    const [beautifying, setBeautifying] = useState(false)
    const [beautifyError, setBeautifyError] = useState(false)
    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [error, setError] = useState(false)

    async function handleBeautify() {
        if (!customerRequirements.trim()) return
        setBeautifying(true)
        setBeautifyError(false)
        try {
            const response = await fetch('/api/quoteAi', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ notes: customerRequirements }),
            })
            const data = (await response.json()) as { result?: string; error?: string }
            if (!response.ok || !data.result) throw new Error(data.error ?? 'AI beautify failed')
            setCustomerRequirements(data.result)
        } catch {
            setBeautifyError(true)
        } finally {
            setBeautifying(false)
        }
    }

    const subtotal = calcQuoteTotal(lineItems)
    const bufferAmount = calcBufferAmount(subtotal, bufferPercent)
    const profitAmount = calcProfitAmount(subtotal, profitPercent)
    const total = calcGrandTotal(subtotal, bufferPercent, profitPercent)

    async function handleExport() {
        setExporting(true)
        try {
            const { exportQuotePdf } = await import('../../lib/quotePdf')
            await exportQuotePdf({
                id: quote?.id ?? 'draft',
                clientName,
                clientEmail,
                lineItems,
                status,
                currency,
                bufferPercent,
                profitPercent,
                customerRequirements: customerRequirements.trim() || undefined,
                createdAt: quote?.createdAt ?? new Date().toISOString(),
            })
        } finally {
            setExporting(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        setError(false)
        const cleanedItems = lineItems.filter((item) => item.description.trim().length > 0)
        const data = {
            clientName: clientName.trim(),
            clientEmail: clientEmail.trim(),
            lineItems: cleanedItems,
            status,
            currency,
            bufferPercent,
            profitPercent,
            customerRequirements: customerRequirements.trim(),
        }

        try {
            if (quote) {
                await updateDoc(doc(db, 'quotes', quote.id), data)
            } else {
                await addDoc(collection(db, 'quotes'), { ...data, createdAt: serverTimestamp() })
            }
            onSaved()
        } catch {
            setError(true)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-600">Client Information</h3>
                <div>
                    <label htmlFor="clientName" className="mb-1.5 block text-sm font-medium text-slate-600">
                        Client Name
                    </label>
                    <input
                        id="clientName"
                        value={clientName}
                        onChange={(event) => setClientName(event.target.value)}
                        placeholder="FinCorp (Pvt) Ltd"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="clientEmail" className="mb-1.5 block text-sm font-medium text-slate-600">
                        Email
                    </label>
                    <input
                        id="clientEmail"
                        type="email"
                        value={clientEmail}
                        onChange={(event) => setClientEmail(event.target.value)}
                        placeholder="finance@fincorp.com"
                        className={inputClass}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-600">
                            Status
                        </label>
                        <select
                            id="status"
                            value={status}
                            onChange={(event) => setStatus(event.target.value as QuoteStatus)}
                            className={inputClass}
                        >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-slate-600">
                            Currency
                        </label>
                        <select
                            id="currency"
                            value={currency}
                            onChange={(event) => setCurrency(event.target.value as QuoteCurrency)}
                            className={inputClass}
                        >
                            <option value="USD">USD</option>
                            <option value="LKR">LKR</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="customerRequirements" className="text-sm font-medium text-slate-600">
                        Customer Requirements
                    </label>
                    <button
                        type="button"
                        onClick={handleBeautify}
                        disabled={beautifying || !customerRequirements.trim()}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                        {beautifying ? 'Beautifying…' : 'Beautify with AI'}
                    </button>
                </div>
                <textarea
                    id="customerRequirements"
                    rows={5}
                    value={customerRequirements}
                    onChange={(event) => setCustomerRequirements(event.target.value)}
                    placeholder="Paste the raw notes you collected from the customer, then click Beautify with AI to turn them into a clean summary."
                    className={inputClass}
                />
                {beautifyError && <p className="mt-1.5 text-sm text-red-600">Couldn't beautify the text — please try again.</p>}
            </div>

            <LineItemsEditor items={lineItems} currency={currency} onChange={setLineItems} />

            <div>
                <p className="mb-1.5 text-sm font-medium text-slate-600">
                    Internal Margin{' '}
                    <span className="font-normal text-slate-500">(rolled into the total, never shown to the client)</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bufferPercent" className="mb-1.5 block text-xs text-slate-500">
                            Buffer / Contingency %
                        </label>
                        <input
                            id="bufferPercent"
                            type="number"
                            min={0}
                            step="0.5"
                            value={bufferPercent}
                            onChange={(event) => setBufferPercent(Number(event.target.value))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="profitPercent" className="mb-1.5 block text-xs text-slate-500">
                            Profit Margin %
                        </label>
                        <input
                            id="profitPercent"
                            type="number"
                            min={0}
                            step="0.5"
                            value={profitPercent}
                            onChange={(event) => setProfitPercent(Number(event.target.value))}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                {bufferPercent > 0 && (
                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Buffer ({bufferPercent}%)</span>
                        <span>{formatCurrency(bufferAmount, currency)}</span>
                    </div>
                )}
                {profitPercent > 0 && (
                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Profit Margin ({profitPercent}%)</span>
                        <span>{formatCurrency(profitAmount, currency)}</span>
                    </div>
                )}
                <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Deposit (50%) — Due at Project Start</span>
                    <span>{formatCurrency(calcDeposit(total), currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Balance (50%) — Due on Completion</span>
                    <span>{formatCurrency(calcBalance(total), currency)}</span>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3">
                    <span className="text-sm font-semibold text-slate-600">Grand Total</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(total, currency)}</span>
                </div>
            </div>

            {error && <p className="text-sm text-red-600">Something went wrong — please try again.</p>}

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-400 disabled:opacity-60"
                >
                    {exporting ? 'Exporting…' : 'Export PDF'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-400"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Save Quote'}
                </button>
            </div>
        </div>
    )
}

function FilterTabs({ active, onChange }: { active: QuoteStatus | 'all'; onChange: (value: QuoteStatus | 'all') => void }) {
    return (
        <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
                <button
                    key={tab.value}
                    type="button"
                    onClick={() => onChange(tab.value)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        active === tab.value ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

export function AdminQuotes() {
    const [filter, setFilter] = useState<QuoteStatus | 'all'>('all')
    const { quotes, reload } = useQuotes(filter)
    const [panelOpen, setPanelOpen] = useState(false)
    const [editing, setEditing] = useState<Quote | null>(null)

    function openCreate() {
        setEditing(null)
        setPanelOpen(true)
    }

    function openEdit(quote: Quote) {
        setEditing(quote)
        setPanelOpen(true)
    }

    function handleSaved() {
        setPanelOpen(false)
        reload()
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Quotes</h1>
                <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    New Quote
                </button>
            </div>

            <div className="mt-6">
                <FilterTabs active={filter} onChange={setFilter} />
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {quotes === null ? (
                    <div className="divide-y divide-slate-200">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4">
                                <Skeleton className="h-3.5 w-32" />
                                <Skeleton className="h-3.5 w-24" />
                                <Skeleton className="h-3.5 w-20" />
                                <Skeleton className="ml-auto h-5 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : quotes.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">No quotes yet — create your first one.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 text-xs text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Client</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Total</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {quotes.map((quote) => (
                                <tr
                                    key={quote.id}
                                    onClick={() => openEdit(quote)}
                                    className="cursor-pointer hover:bg-slate-100"
                                >
                                    <td className="px-6 py-3 font-medium">{quote.clientName}</td>
                                    <td className="px-6 py-3 text-slate-500">{formatDate(quote.createdAt)}</td>
                                    <td className="px-6 py-3 text-slate-500">
                                        {formatCurrency(
                                            calcGrandTotal(calcQuoteTotal(quote.lineItems), quote.bufferPercent, quote.profitPercent),
                                            quote.currency,
                                        )}
                                    </td>
                                    <td className="px-6 py-3">
                                        <StatusBadge status={quote.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <SlidePanel open={panelOpen} title={editing ? 'Edit Quote' : 'Create Quote'} onClose={() => setPanelOpen(false)}>
                <QuoteForm quote={editing} onSaved={handleSaved} onClose={() => setPanelOpen(false)} />
            </SlidePanel>
        </div>
    )
}
