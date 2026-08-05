import { useRef, useState, type FormEvent } from 'react'
import { addDoc, collection, deleteDoc, doc, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { companyFromDoc } from '../../lib/firestore'
import { useFirestoreCollection } from '../../lib/useFirestoreCollection'
import { formatDate } from '../../lib/format'
import { uploadImage } from '../../lib/cloudinary'
import { SlidePanel } from '../../components/SlidePanel'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Field } from '../../components/FormField'
import { EditIcon, DeleteIcon } from '../../components/icons'
import { Skeleton } from '../../components/Skeleton'
import type { Company } from '../../types'

function useCompanies() {
    const { data: companies, reload } = useFirestoreCollection(
        () => query(collection(db, 'companies'), orderBy('createdAt', 'desc')),
        companyFromDoc,
    )

    return { companies, reload }
}

function LogoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    async function handleFile(file: File) {
        setUploading(true)
        setError(false)
        setProgress(0)
        try {
            const url = await uploadImage(file, setProgress)
            onChange(url)
        } catch {
            setError(true)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Logo</label>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void handleFile(file)
                }}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                    event.preventDefault()
                    setDragActive(true)
                }}
                onDragLeave={(event) => {
                    event.preventDefault()
                    setDragActive(false)
                }}
                onDrop={(event) => {
                    event.preventDefault()
                    setDragActive(false)
                    const file = event.dataTransfer.files?.[0]
                    if (file) void handleFile(file)
                }}
                className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 bg-slate-950/60 hover:border-slate-600'
                }`}
            >
                {value && !uploading ? (
                    <img src={value} alt="" className="h-16 w-full rounded object-contain" />
                ) : (
                    <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-slate-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                        </svg>
                        <span className="text-sm text-slate-400">Drag & drop logo here, or click to browse</span>
                    </>
                )}
            </button>

            {uploading && (
                <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Uploading… {progress}%</p>
                </div>
            )}
            {error && <p className="mt-2 text-sm text-red-400">Upload failed — please try again.</p>}
        </div>
    )
}

function CompanyForm({
    company,
    onSaved,
    onCancel,
}: {
    company: Company | null
    onSaved: () => void
    onCancel: () => void
}) {
    const [logoUrl, setLogoUrl] = useState(company?.logoUrl ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(false)

        const formData = new FormData(event.currentTarget)
        const websiteUrl = String(formData.get('websiteUrl') ?? '').trim()

        const data = {
            name: String(formData.get('name') ?? '').trim(),
            logoUrl,
            ...(websiteUrl ? { websiteUrl } : {}),
        }

        try {
            if (company) {
                await updateDoc(doc(db, 'companies', company.id), data)
            } else {
                await addDoc(collection(db, 'companies'), { ...data, createdAt: serverTimestamp() })
            }
            onSaved()
        } catch {
            setError(true)
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Name" name="name" placeholder="Company name" required defaultValue={company?.name} />
            <LogoUpload value={logoUrl} onChange={setLogoUrl} />
            <Field
                label="Website (optional)"
                name="websiteUrl"
                type="url"
                placeholder="https://example.com"
                defaultValue={company?.websiteUrl}
            />

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
                    disabled={saving || !logoUrl}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Save Company'}
                </button>
            </div>
        </form>
    )
}

export function AdminCompanies() {
    const { companies, reload } = useCompanies()
    const [panelOpen, setPanelOpen] = useState(false)
    const [editing, setEditing] = useState<Company | null>(null)
    const [deleting, setDeleting] = useState<Company | null>(null)

    function openCreate() {
        setEditing(null)
        setPanelOpen(true)
    }

    function openEdit(company: Company) {
        setEditing(company)
        setPanelOpen(true)
    }

    function handleSaved() {
        setPanelOpen(false)
        reload()
    }

    async function handleDelete() {
        if (!deleting) return
        await deleteDoc(doc(db, 'companies', deleting.id))
        setDeleting(null)
        reload()
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Companies</h1>
                <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    Add Company
                </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
                Logos shown in the "Trusted by" strip on the homepage, right after the hero section.
            </p>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                {companies === null ? (
                    <div className="divide-y divide-slate-800">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4">
                                <Skeleton className="h-10 w-16 shrink-0 rounded" />
                                <Skeleton className="h-3.5 w-40" />
                                <Skeleton className="ml-auto h-3.5 w-20" />
                            </div>
                        ))}
                    </div>
                ) : companies.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">No companies yet — add your first one.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-800 text-xs text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Company</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {companies.map((company) => (
                                <tr key={company.id}>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-800">
                                                {company.logoUrl && (
                                                    <img src={company.logoUrl} alt="" className="h-full w-full object-contain" />
                                                )}
                                            </div>
                                            <span className="font-medium">{company.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-slate-400">{formatDate(company.createdAt)}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(company)}
                                                aria-label={`Edit ${company.name}`}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleting(company)}
                                                aria-label={`Delete ${company.name}`}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <SlidePanel open={panelOpen} title={editing ? 'Edit Company' : 'Add Company'} onClose={() => setPanelOpen(false)}>
                <CompanyForm company={editing} onSaved={handleSaved} onCancel={() => setPanelOpen(false)} />
            </SlidePanel>

            <ConfirmDialog
                open={deleting !== null}
                title="Delete company?"
                message={`This will permanently remove "${deleting?.name}". This can't be undone.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
            />
        </div>
    )
}
