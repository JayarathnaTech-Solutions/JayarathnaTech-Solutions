import {Reveal, StaggerGroup} from "./motion.tsx";
import {missionItems} from "../lib/missionItems.tsx";
import {motion} from "motion/react";
import {itemTransition, staggerItem} from "../lib/motion.ts";

export function Mission() {
    return (
        <section className="mx-auto max-w-screen-2xl px-6 py-16">
            <Reveal><h2 className="text-2xl font-bold sm:text-3xl">Our Mission</h2></Reveal>

            <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3">
                {missionItems.map((item) => (
                    <motion.div
                        key={item.title}
                        variants={staggerItem}
                        transition={itemTransition}
                        className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/40"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                {item.icon}
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                    </motion.div>
                ))}
            </StaggerGroup>
        </section>
    )
}