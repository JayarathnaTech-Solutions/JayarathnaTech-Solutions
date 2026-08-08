import { useRef, useState } from 'react'
import { uploadImage, toDownloadUrl, NIC_UPLOAD_PRESET } from '../../lib/cloudinary'
import { ImageLightbox } from '../../components/ImageLightbox'

export function NicImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    async function handleFile(file: File) {
        setUploading(true)
        setError(false)
        setProgress(0)
        try {
            const url = await uploadImage(file, setProgress, NIC_UPLOAD_PRESET)
            onChange(url)
        } catch {
            setError(true)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">{label}</label>
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

            {value && !uploading ? (
                <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-slate-100 p-2">
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        className="shrink-0 overflow-hidden rounded"
                        aria-label={`View ${label}`}
                    >
                        <img src={value} alt={label} className="h-16 w-24 object-cover" />
                    </button>
                    <div className="flex flex-1 flex-col gap-1 text-sm">
                        <button type="button" onClick={() => inputRef.current?.click()} className="text-left font-medium text-blue-600 hover:text-blue-500">
                            Replace
                        </button>
                        <a href={toDownloadUrl(value)} className="text-left text-slate-500 hover:text-slate-900">
                            Download
                        </a>
                    </div>
                </div>
            ) : (
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
                        dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-300 bg-slate-100 hover:border-slate-400'
                    }`}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-slate-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                    </svg>
                    <span className="text-sm text-slate-500">Drag & drop {label.toLowerCase()} here, or click to browse</span>
                </button>
            )}

            {uploading && (
                <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Uploading… {progress}%</p>
                </div>
            )}
            {error && <p className="mt-2 text-sm text-red-600">Upload failed — please try again.</p>}

            <ImageLightbox open={lightboxOpen} src={value} alt={label} onClose={() => setLightboxOpen(false)} />
        </div>
    )
}
