import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MotionLink } from './MotionLink'

const SCROLL_SHOW_THRESHOLD = 500

// Mobile-only persistent CTA — the hero's own "Get a Quote" button scrolls
// out of view quickly on small screens, so this keeps the primary
// conversion action reachable without following the visitor from the top.
export function StickyMobileCta() {
  const [isVisible, setIsVisible] = useState(() => window.scrollY > SCROLL_SHOW_THRESHOLD)

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > SCROLL_SHOW_THRESHOLD)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-sm md:hidden dark:border-slate-800 dark:bg-slate-900/95"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <MotionLink
            to="/contact"
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Get a Quote
          </MotionLink>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
