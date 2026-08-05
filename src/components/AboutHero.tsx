import {HeroBackdrop} from "./HeroBackdrop.tsx";
import heroBackground from '../assets/about-background-image.jpg'
import {itemTransition, staggerContainer, staggerItem} from "../lib/motion.ts";
import { motion } from "motion/react";

export function AboutHero() {
    return (
        <section className="relative overflow-hidden text-white">
            <HeroBackdrop image={heroBackground} />

            <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-36">
                <motion.div className="max-w-2xl" initial="hidden" animate="visible" variants={staggerContainer}>
                    <motion.span
                        variants={staggerItem}
                        transition={itemTransition}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        Our Story
                    </motion.span>

                    <motion.h1
                        variants={staggerItem}
                        transition={itemTransition}
                        className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl"
                    >
                        Building the Future,
                        <br />
                        <span className="bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Together</span>
                    </motion.h1>

                    <motion.p
                        variants={staggerItem}
                        transition={itemTransition}
                        className="mt-5 max-w-xl text-lg text-slate-300"
                    >
                        We are a team of passionate developers, designers, and problem solvers helping
                        businesses turn ideas into powerful digital products.
                    </motion.p>
                </motion.div>
            </div>
        </section>
    )
}