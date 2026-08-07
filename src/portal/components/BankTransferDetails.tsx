import { useEffect, useState, type ChangeEvent } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { bankDetailsFromDoc } from '../../lib/firestore'
import { uploadImage, RECEIPTS_UPLOAD_PRESET } from '../../lib/cloudinary'
import type { BankDetails, Invoice } from '../../types'

function useBankDetails() {
    const [bankDetails, setBankDetails] = useState<BankDetails | null | undefined>(undefined)

    useEffect(() => {
        getDoc(doc(db, 'settings', 'bankDetails'))
            .then((snap) => setBankDetails(snap.exists() ? bankDetailsFromDoc(snap) : null))
            .catch(() => setBankDetails(null))
    }, [])

    return bankDetails
}

export function BankTransferDetails({ invoice, onSubmitted }: { invoice: Invoice; onSubmitted: () => void }) {
    const bankDetails = useBankDetails()
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(false)

    async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError(false)
        setProgress(0)

        try {
            const url = await uploadImage(file, setProgress, RECEIPTS_UPLOAD_PRESET)
            await updateDoc(doc(db, 'invoices', invoice.id), {
                proofUrl: url,
                status: 'proof_submitted',
                proofSubmittedAt: new Date().toISOString(),
            })
            onSubmitted()
        } catch {
            setError(true)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Bank Transfer Details</h3>
            {bankDetails === undefined ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
            ) : bankDetails === null ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Bank details haven't been set up yet — please contact us directly to arrange payment.
                </p>
            ) : (
                <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-slate-500 dark:text-slate-400">Bank</dt>
                        <dd className="text-slate-600 dark:text-slate-300">{bankDetails.bankName}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-slate-500 dark:text-slate-400">Account Name</dt>
                        <dd className="text-slate-600 dark:text-slate-300">{bankDetails.accountName}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-slate-500 dark:text-slate-400">Account Number</dt>
                        <dd className="text-slate-600 dark:text-slate-300">{bankDetails.accountNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-slate-500 dark:text-slate-400">Branch / SWIFT</dt>
                        <dd className="text-slate-600 dark:text-slate-300">{bankDetails.branchSwift}</dd>
                    </div>
                </dl>
            )}

            <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-4">
                <label htmlFor={`proof-${invoice.id}`} className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    {invoice.status === 'proof_submitted' ? 'Replace payment proof' : 'Upload payment proof'}
                </label>
                <input
                    id={`proof-${invoice.id}`}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
                />
                {uploading && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Uploading… {progress}%</p>}
                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">Upload failed — please try again.</p>}
                {invoice.status === 'proof_submitted' && (
                    <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Proof submitted — awaiting verification.</p>
                )}
            </div>
        </div>
    )
}
