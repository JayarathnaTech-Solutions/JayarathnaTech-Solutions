import { useEffect, useRef, useState, type FormEvent } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { projectFromDoc } from '../../lib/firestore'
import { uploadImage } from '../../lib/cloudinary'
import { SlidePanel } from '../components/SlidePanel'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field, TextAreaField } from '../components/FormField'
import { Skeleton } from '../components/Skeleton'
import type { Project } from '../../types'

function useProjects() {
    const [projects, setProjects] = useState<Project[] | null>(null)

    const reload = () => {
        getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')))
            .then((snapshot) => setProjects(snapshot.docs.map(projectFromDoc)))
            .catch(() => setProjects([]))
    }

    useEffect(reload, [])

    return { projects, reload }
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CoverImageUpload({
    value,
    onChange,
}: {
    value: string
    onChange: (url: string) => void
}) {
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
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Cover Image</label>
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
                    <img src={value} alt="" className="h-24 w-full rounded object-cover" />
                ) : (
                    <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-slate-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                        </svg>
                        <span className="text-sm text-slate-400">Drag & drop image here, or click to browse</span>
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

function ProjectForm({
    project,
    onSaved,
    onCancel,
}: {
    project: Project | null
    onSaved: () => void
    onCancel: () => void
}) {
    const [coverImageUrl, setCoverImageUrl] = useState(project?.coverImageUrl ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        setError(false)

        const formData = new FormData(event.currentTarget)
        const technologies = String(formData.get('technologies') ?? '')
            .split(',')
            .map((tech) => tech.trim())
            .filter(Boolean)
        const keyFeatures = String(formData.get('keyFeatures') ?? '')
            .split('\n')
            .map((feature) => feature.trim())
            .filter(Boolean)

        const data = {
            title: String(formData.get('title') ?? '').trim(),
            description: String(formData.get('description') ?? '').trim(),
            coverImageUrl,
            category: String(formData.get('category') ?? '').trim(),
            client: String(formData.get('client') ?? '').trim(),
            challenge: String(formData.get('challenge') ?? '').trim(),
            solution: String(formData.get('solution') ?? '').trim(),
            ...(technologies.length > 0 ? { technologies } : {}),
            ...(keyFeatures.length > 0 ? { keyFeatures } : {}),
        }

        try {
            if (project) {
                await updateDoc(doc(db, 'projects', project.id), data)
            } else {
                await addDoc(collection(db, 'projects'), { ...data, createdAt: serverTimestamp() })
            }
            onSaved()
        } catch {
            setError(true)
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Title" name="title" placeholder="Project title" required defaultValue={project?.title} />
            <TextAreaField
                label="Description"
                name="description"
                placeholder="Write a short description..."
                required
                defaultValue={project?.description}
            />
            <CoverImageUpload value={coverImageUrl} onChange={setCoverImageUrl} />
            <Field label="Category" name="category" placeholder="Web Application" defaultValue={project?.category} />
            <Field label="Client" name="client" placeholder="Client name" defaultValue={project?.client} />
            <Field
                label="Technologies"
                name="technologies"
                placeholder="React, Node.js, PostgreSQL"
                defaultValue={project?.technologies?.join(', ')}
            />
            <TextAreaField label="Challenge" name="challenge" rows={3} defaultValue={project?.challenge} />
            <TextAreaField label="Solution" name="solution" rows={3} defaultValue={project?.solution} />
            <TextAreaField
                label="Key Features (one per line)"
                name="keyFeatures"
                rows={4}
                defaultValue={project?.keyFeatures?.join('\n')}
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
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Save Project'}
                </button>
            </div>
        </form>
    )
}

function EditIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
        </svg>
    )
}

function DeleteIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
        </svg>
    )
}

export function AdminProjects() {
    const { projects, reload } = useProjects()
    const [panelOpen, setPanelOpen] = useState(false)
    const [editing, setEditing] = useState<Project | null>(null)
    const [deleting, setDeleting] = useState<Project | null>(null)

    function openCreate() {
        setEditing(null)
        setPanelOpen(true)
    }

    function openEdit(project: Project) {
        setEditing(project)
        setPanelOpen(true)
    }

    function handleSaved() {
        setPanelOpen(false)
        reload()
    }

    async function handleDelete() {
        if (!deleting) return
        await deleteDoc(doc(db, 'projects', deleting.id))
        setDeleting(null)
        reload()
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Projects</h1>
                <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    Add Project
                </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                {projects === null ? (
                    <div className="divide-y divide-slate-800">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4">
                                <Skeleton className="h-10 w-16 shrink-0 rounded" />
                                <Skeleton className="h-3.5 w-40" />
                                <Skeleton className="h-3.5 w-24" />
                                <Skeleton className="ml-auto h-3.5 w-20" />
                            </div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">No projects yet — add your first one.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-800 text-xs text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Project</th>
                                <th className="px-6 py-3 font-medium">Category</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {projects.map((project) => (
                                <tr key={project.id}>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-slate-800">
                                                {project.coverImageUrl && (
                                                    <img src={project.coverImageUrl} alt="" className="h-full w-full object-cover" />
                                                )}
                                            </div>
                                            <span className="font-medium">{project.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-slate-400">{project.category || '—'}</td>
                                    <td className="px-6 py-3 text-slate-400">{formatDate(project.createdAt)}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(project)}
                                                aria-label={`Edit ${project.title}`}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleting(project)}
                                                aria-label={`Delete ${project.title}`}
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

            <SlidePanel open={panelOpen} title={editing ? 'Edit Project' : 'Add Project'} onClose={() => setPanelOpen(false)}>
                <ProjectForm project={editing} onSaved={handleSaved} onCancel={() => setPanelOpen(false)} />
            </SlidePanel>

            <ConfirmDialog
                open={deleting !== null}
                title="Delete project?"
                message={`This will permanently remove "${deleting?.title}". This can't be undone.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
            />
        </div>
    )
}
