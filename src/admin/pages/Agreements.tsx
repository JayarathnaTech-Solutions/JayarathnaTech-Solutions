import { useState } from 'react'
import { exportAgreementPdf } from '../../lib/agreementPdf'
import { inputClass } from '../../lib/ui'

function todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10)
}

export function AdminAgreements() {
    const [clientName, setClientName] = useState('')
    const [clientAddress, setClientAddress] = useState('')
    const [clientNic, setClientNic] = useState('')
    const [effectiveDate, setEffectiveDate] = useState(todayIsoDate())
    const [exporting, setExporting] = useState(false)

    async function handleExport() {
        setExporting(true)
        try {
            await exportAgreementPdf({ clientName, clientAddress, clientNic, effectiveDate })
        } finally {
            setExporting(false)
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold">Agreements</h1>
            <p className="mt-1 text-sm text-slate-500">
                Fill in the client details below to generate a Software Development Services Agreement PDF. Any field
                left blank prints as a bracketed placeholder (e.g. <span className="font-mono">[Client Address]</span>)
                so the document can still be filled in by hand.
            </p>

            <div className="mt-6 max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
                <div>
                    <label htmlFor="clientName" className="mb-1.5 block text-sm font-medium text-slate-600">
                        Client Company / Client Name
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
                    <label htmlFor="clientAddress" className="mb-1.5 block text-sm font-medium text-slate-600">
                        Client Address
                    </label>
                    <input
                        id="clientAddress"
                        value={clientAddress}
                        onChange={(event) => setClientAddress(event.target.value)}
                        placeholder="No. 12, Main Street, Colombo, Sri Lanka"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="clientNic" className="mb-1.5 block text-sm font-medium text-slate-600">
                        Client NIC <span className="font-normal text-slate-400">(optional — individual clients only)</span>
                    </label>
                    <input
                        id="clientNic"
                        value={clientNic}
                        onChange={(event) => setClientNic(event.target.value)}
                        placeholder="200012345678"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="effectiveDate" className="mb-1.5 block text-sm font-medium text-slate-600">
                        Effective Date
                    </label>
                    <input
                        id="effectiveDate"
                        type="date"
                        value={effectiveDate}
                        onChange={(event) => setEffectiveDate(event.target.value)}
                        className={inputClass}
                    />
                </div>

                <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-700">Payment terms</p>
                    <p className="mt-1">50% deposit due at project start, 50% balance due on project completion.</p>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={exporting}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                    >
                        {exporting ? 'Exporting…' : 'Export PDF'}
                    </button>
                </div>
            </div>
        </div>
    )
}
