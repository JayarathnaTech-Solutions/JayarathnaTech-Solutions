import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useEscapeKey } from '../lib/useEscapeKey'

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
    const cancelButtonRef = useRef<HTMLButtonElement>(null)

    useEscapeKey(open, onCancel)

    useEffect(() => {
        if (open) cancelButtonRef.current?.focus()
    }, [open])

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
                    <motion.div
                        className="absolute inset-0 bg-slate-950/50 dark:bg-slate-950/70"
                        onClick={onCancel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-dialog-title"
                        className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h2 id="confirm-dialog-title" className="text-lg font-semibold">
                            {title}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                onClick={onCancel}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
