import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useEscapeKey } from '../../lib/useEscapeKey'

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
    const closeButtonRef = useRef<HTMLButtonElement>(null)

    useEscapeKey(open, onClose)

    useEffect(() => {
        if (open) closeButtonRef.current?.focus()
    }, [open])

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <motion.div
                        className="absolute inset-0 bg-slate-950/70"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        className="relative flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 shadow-xl"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                            <h2 className="text-lg font-semibold">{title}</h2>
                            <button
                                ref={closeButtonRef}
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="text-slate-400 hover:text-white"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
