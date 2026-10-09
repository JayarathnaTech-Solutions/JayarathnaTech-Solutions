import { useState, type FormEvent } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useBankDetails } from '../../lib/useBankDetails'
import { Field } from '../../components/FormField'
import { Skeleton } from '../../components/Skeleton'

export function AdminSettings() {
    const bankDetails = useBankDetails()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(false)
    const [saved, setSaved] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(false)
        setSaved(false)

        const formData = new FormData(event.currentTarget)
        try {
            await setDoc(doc(db, 'settings', 'bankDetails'), {
                bankName: String(formData.get('bankName') ?? '').trim(),
                accountName: String(formData.get('accountName') ?? '').trim(),
                accountNumber: String(formData.get('accountNumber') ?? '').trim(),
                branchSwift: String(formData.get('branchSwift') ?? '').trim(),
            })
            setSaved(true)
        } catch {
            setError(true)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold">Settings</h1>

            <div className="mt-6 max-w-lg rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-slate-600">Bank Transfer Details</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Shown to customers paying an invoice by bank transfer, and printed on quote PDFs.
                </p>

                {bankDetails === undefined ? (
                    <div className="mt-4 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                        <Field label="Bank Name" name="bankName" required defaultValue={bankDetails?.bankName} placeholder="Commercial Bank of Ceylon" />
                        <Field label="Account Name" name="accountName" required defaultValue={bankDetails?.accountName} placeholder="JayarathnaTech Solutions" />
                        <Field label="Account Number" name="accountNumber" required defaultValue={bankDetails?.accountNumber} placeholder="0000000000" />
                        <Field label="Branch / SWIFT" name="branchSwift" required defaultValue={bankDetails?.branchSwift} placeholder="Colombo / CCEYLKLX" />

                        {error && <p className="text-sm text-red-600">Something went wrong — please try again.</p>}
                        {saved && !error && <p className="text-sm text-emerald-600">Saved.</p>}

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
                )}
            </div>
        </div>
    )
}
