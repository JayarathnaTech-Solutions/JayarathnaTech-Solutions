export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Delete',
    onConfirm,
    onCancel,
}: {
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    onConfirm: () => void
    onCancel: () => void
}) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-slate-950/70" onClick={onCancel} />
            <div className="relative w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-slate-400">{message}</p>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
