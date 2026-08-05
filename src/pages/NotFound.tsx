import { motion } from 'motion/react'
import { Seo } from '../components/Seo'
import { MotionLink } from '../components/MotionLink'
import { staggerItem, staggerContainer, itemTransition } from '../lib/motion'

export function NotFound() {
    return (
        <>
            <Seo
                title="Page Not Found — JayarathnaTech Solutions"
                description="The page you're looking for doesn't exist or has been moved."
            />

            <section className="relative overflow-hidden text-white">
                <div
                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-70"
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute inset-0 bg-linear-to-b from-slate-900/30 via-slate-900/60 to-slate-900"
                    aria-hidden="true"
                />

                <motion.div
                    className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-32 text-center md:py-44"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.p
                        variants={staggerItem}
                        transition={itemTransition}
                        className="bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-7xl font-black text-transparent sm:text-8xl"
                    >
                        404
                    </motion.p>
                    <motion.h1
                        variants={staggerItem}
                        transition={itemTransition}
                        className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl"
                    >
                        Page Not Found
                    </motion.h1>
                    <motion.p variants={staggerItem} transition={itemTransition} className="mt-5 max-w-md text-lg text-slate-300">
                        Oops! The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
                    </motion.p>
                    <MotionLink
                        to="/"
                        variants={staggerItem}
                        transition={itemTransition}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        className="mt-8 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    >
                        Back to Home
                    </MotionLink>
                </motion.div>
            </section>
        </>
    )
}
