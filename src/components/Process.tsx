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
                        className="rounded-xl border border-slate-800 bg-slate-900/40 p-6"
                    >
                        <span className="text-3xl font-bold text-blue-500/30">{item.step}</span>
                        <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                    </motion.div>
                ))}
            </StaggerGroup>
        </section>
    )
}