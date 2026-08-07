import {useEffect, useState} from "react";
import heroBackground from '../assets/background-image1.webp'
import heroBackground2 from '../assets/background-image2.webp'
import heroBackground3 from '../assets/background-image3.webp'
import {itemTransition, staggerContainer, staggerItem} from "../lib/motion.ts";
import { motion, AnimatePresence } from "motion/react";
import { MotionLink } from "./MotionLink.tsx";
import {HeroBackdrop} from "./HeroBackdrop.tsx";

const heroImages = [heroBackground, heroBackground2, heroBackground3]
export function Hero() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length)
        }, 7000)

        return () => clearInterval(timer)
    }, [])

    return (
        <section className="relative flex min-h-[73vh] items-center overflow-hidden text-white">
            <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900">
                <AnimatePresence initial={false}>
                    <motion.div
                        key={currentImageIndex}
                        className="absolute inset-0"
                        initial={{ opacity: 0, x: 32 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -32 }}
                        transition={{ duration: 1.9, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <HeroBackdrop image={heroImages[currentImageIndex]} fadeClassName="h-56" />
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-6 py-24 md:grid-cols-[3fr_2fr] md:items-center">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="[text-shadow:0_2px_16px_rgba(0,0,0,0.55)]"
                >
                    <motion.span
                        variants={staggerItem}
                        transition={itemTransition}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        Building the Future, Together
                    </motion.span>

                    <motion.h1
                        variants={staggerItem}
                        transition={itemTransition}
                        className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl"
                    >
                        We Build Digital Solutions <br/> That Drive Real Business{' '}
                        <span className="bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            Growth
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={staggerItem}
                        transition={itemTransition}
                        className="mt-5 max-w-xl text-lg text-slate-300"
                    >
                        From powerful web applications to scalable software systems, we turn ideas into
                        high-performance digital products.
                    </motion.p>

                    <motion.div variants={staggerItem} transition={itemTransition} className="mt-8 flex flex-wrap gap-4">
                        <MotionLink
                            to="/contact"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                        >
                            Get a Quote
                        </MotionLink>
                        <MotionLink
                            to="/projects"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-slate-400"
                        >
                            View Projects
                        </MotionLink>
                    </motion.div>
                </motion.div>
            </div>

            <motion.div
                className="absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 text-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                transition={{ opacity: { duration: 0.6, delay: 1 }, y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
            >
                <span className="text-xs font-medium tracking-wide uppercase">Scroll</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
            </motion.div>
        </section>
    )
}