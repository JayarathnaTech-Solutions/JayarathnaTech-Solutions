import { useEffect, useState } from 'react'
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { toIsoString } from '../../lib/firestore'
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
import { SlidePanel } from '../components/SlidePanel'
import { StatusBadge } from '../components/StatusBadge'
import type { Quote, QuoteCurrency, QuoteLineItem, QuoteStatus } from '../../types'

const inputClass =
    'w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none'

const filterTabs: { value: QuoteStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
]

function quoteFromDoc(id: string, data: Record<string, unknown>): Quote {
    return {
        id,
        clientName: data.clientName as string,
        clientEmail: data.clientEmail as string,
        lineItems: (data.lineItems as QuoteLineItem[] | undefined) ?? [],
        status: data.status as QuoteStatus,
        currency: (data.currency as QuoteCurrency | undefined) ?? 'USD',
        bufferPercent: (data.bufferPercent as number | undefined) ?? 0,
        profitPercent: (data.profitPercent as number | undefined) ?? 0,
        createdAt: toIsoString(data.createdAt),
    }
}

function useQuotes(filter: QuoteStatus | 'all') {
    const [quotes, setQuotes] = useState<Quote[] | null>(null)

    const reload = () => {
        const q =
            filter === 'all'
                ? query(collection(db, 'quotes'), orderBy('createdAt', 'desc'))
                : query(collection(db, 'quotes'), where('status', '==', filter), orderBy('createdAt', 'desc'))

        getDocs(q)
            .then((snapshot) => setQuotes(snapshot.docs.map((snap) => quoteFromDoc(snap.id, snap.data()))))
            .catch(() => setQuotes([]))
    }

    useEffect(reload, [filter])

    return { quotes, reload }
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Line Items</label>
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
                        <span className="pt-2.5 text-right text-sm text-slate-400">
                            {formatCurrency(lineItemTotal(item), currency)}
                        </span>
                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            aria-label="Remove line item"
                            className="mt-2 justify-self-end text-slate-500 hover:text-red-400"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={addItem} className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300">
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
    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [error, setError] = useState(false)

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
                <h3 className="text-sm font-semibold text-slate-300">Client Information</h3>
                <div>
                    <label htmlFor="clientName" className="mb-1.5 block text-sm font-medium text-slate-300">
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
                    <label htmlFor="clientEmail" className="mb-1.5 block text-sm font-medium text-slate-300">
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
                        <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-300">
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
                        <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-slate-300">
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

            <LineItemsEditor items={lineItems} currency={currency} onChange={setLineItems} />

            <div>
                <p className="mb-1.5 text-sm font-medium text-slate-300">
                    Internal Margin{' '}
                    <span className="font-normal text-slate-500">(rolled into the total, never shown to the client)</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bufferPercent" className="mb-1.5 block text-xs text-slate-400">
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
                        <label htmlFor="profitPercent" className="mb-1.5 block text-xs text-slate-400">
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

            <div className="space-y-2 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                {bufferPercent > 0 && (
                    <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Buffer ({bufferPercent}%)</span>
                        <span>{formatCurrency(bufferAmount, currency)}</span>
                    </div>
                )}
                {profitPercent > 0 && (
                    <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Profit Margin ({profitPercent}%)</span>
                        <span>{formatCurrency(profitAmount, currency)}</span>
                    </div>
                )}
                <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Deposit (50%) — Due at Project Start</span>
                    <span>{formatCurrency(calcDeposit(total), currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Balance (50%) — Due on Completion</span>
                    <span>{formatCurrency(calcBalance(total), currency)}</span>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
                    <span className="text-sm font-semibold text-slate-300">Grand Total</span>
                    <span className="text-xl font-bold text-blue-400">{formatCurrency(total, currency)}</span>
                </div>
            </div>

            {error && <p className="text-sm text-red-400">Something went wrong — please try again.</p>}

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-600 disabled:opacity-60"
                >
                    {exporting ? 'Exporting…' : 'Export PDF'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-600"
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
                        active === tab.value ? 'bg-blue-600 text-white' : 'border border-slate-800 text-slate-300 hover:border-slate-700'
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

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                {quotes === null ? (
                    <div className="p-6 text-sm text-slate-500">Loading…</div>
                ) : quotes.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">No quotes yet — create your first one.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-800 text-xs text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Client</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Total</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {quotes.map((quote) => (
                                <tr
                                    key={quote.id}
                                    onClick={() => openEdit(quote)}
                                    className="cursor-pointer hover:bg-slate-900/60"
                                >
                                    <td className="px-6 py-3 font-medium">{quote.clientName}</td>
                                    <td className="px-6 py-3 text-slate-400">{formatDate(quote.createdAt)}</td>
                                    <td className="px-6 py-3 text-slate-400">
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
