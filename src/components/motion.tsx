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

/** Orchestrates staggerItem-variant children to reveal in sequence as the group scrolls into view. */
export function StaggerGroup(props: HTMLMotionProps<'div'>) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            {...props}
        />
    )
}
