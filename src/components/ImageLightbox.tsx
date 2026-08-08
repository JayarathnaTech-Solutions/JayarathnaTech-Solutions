import { AnimatePresence, motion } from 'motion/react'
import { useEscapeKey } from '../lib/useEscapeKey'
import { toDownloadUrl } from '../lib/cloudinary'

export function ImageLightbox({
    open,
    src,
    alt,
    onClose,
}: {
    open: boolean
    src: string
    alt: string
    onClose: () => void
}) {
    useEscapeKey(open, onClose)

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10">
                    <motion.div
                        className="absolute inset-0 bg-slate-950/80"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={alt}
                        className="relative flex max-h-full max-w-3xl flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <img src={src} alt={alt} className="max-h-[75vh] w-auto rounded-lg object-contain shadow-2xl" />
                        <div className="flex items-center gap-3">
                            <a
                                href={toDownloadUrl(src)}
                                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
                            >
                                Download
                            </a>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
