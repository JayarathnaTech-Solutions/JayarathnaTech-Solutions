import type { Transition, Variants } from 'motion/react'

const EASE = [0.16, 1, 0.3, 1] as const

export const itemTransition: Transition = { duration: 0.5, ease: EASE }

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
}

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
}

export const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
