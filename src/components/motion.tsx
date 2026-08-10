import { motion, type HTMLMotionProps } from 'motion/react'
import { fadeUp, itemTransition, staggerContainer } from '../lib/motion'

/** Fades/slides an element up once it scrolls into view. */
export function Reveal({ delay = 0, transition, ...props }: HTMLMotionProps<'div'> & { delay?: number }) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            transition={{ ...itemTransition, delay, ...transition }}
            {...props}
        />
    )
}

/**
 * Orchestrates staggerItem-variant children to reveal in sequence as the group scrolls into view.
 *
 * Pass `immediate` for groups that mount already inside the viewport (e.g. a batch appended by a
 * "Load More" click) — `whileInView` only fires once per instance, so a group added post-mount
 * would otherwise never receive its "visible" trigger and its children would stay at opacity 0.
 */
export function StaggerGroup({ immediate, ...props }: HTMLMotionProps<'div'> & { immediate?: boolean }) {
    const trigger = immediate
        ? { animate: 'visible' as const }
        : { whileInView: 'visible' as const, viewport: { once: true, margin: '-80px' } }

    return (
        <motion.div
            initial="hidden"
            variants={staggerContainer}
            {...trigger}
            {...props}
        />
    )
}
