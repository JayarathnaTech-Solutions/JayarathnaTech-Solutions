import type { ReactNode } from 'react'

export function SlidePanel({
    open,
    title,
    onClose,
    children,
}: {
    open: boolean
    title: string
    onClose: () => void
    children: ReactNode
}) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-950/70" onClick={onClose} />
            <div className="relative flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            </div>
        </div>
    )
}
