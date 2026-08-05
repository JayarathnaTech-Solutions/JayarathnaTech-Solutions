import {Reveal, StaggerGroup} from "./motion.tsx";
import {itemTransition, staggerItem} from "../lib/motion.ts";
import {technologyGroups} from "../lib/technologyGroups.ts";
import { motion } from "motion/react";

export function TechStack() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <Reveal><h2 className="text-2xl font-bold sm:text-3xl">Technologies We Use</h2></Reveal>

            <StaggerGroup className="mt-8 grid gap-8 md:grid-cols-3">
                {technologyGroups.map((group) => (
                    <motion.div key={group.category} variants={staggerItem} transition={itemTransition}>
                        <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                            {group.category}
                        </h3>
                        <div className="mt-4 space-y-3">
                            {group.items.map((tech) => (
                                <div
                                    key={tech.name}
                                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600"
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${tech.color}`}
                                    >
                                        {tech.mono}
                                    </div>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{tech.name}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </StaggerGroup>
        </section>
    )
}
