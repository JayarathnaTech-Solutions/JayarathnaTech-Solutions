import {Reveal, StaggerGroup} from "./motion.tsx";
import {processSteps} from "../lib/processSteps.ts";
import {itemTransition, staggerItem} from "../lib/motion.ts";
import { motion } from "motion/react";

export function Process() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <Reveal><h2 className="text-2xl font-bold sm:text-3xl">Our Process</h2></Reveal>

            <StaggerGroup className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                {processSteps.map((item) => (
                    <motion.div
                        key={item.step}
                        variants={staggerItem}
                        transition={itemTransition}
                        className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/40"
                    >
                        <span className="text-3xl font-bold text-blue-600/30 dark:text-blue-400/30">{item.step}</span>
                        <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                    </motion.div>
                ))}
            </StaggerGroup>
        </section>
    )
}