import {Reveal, StaggerGroup} from "./motion.tsx";
import {team} from "../lib/team.ts";
import {motion} from "motion/react";
import {itemTransition, staggerItem} from "../lib/motion.ts";

export function Team() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <Reveal><h2 className="text-2xl font-bold sm:text-3xl">Meet the Team</h2></Reveal>

            <StaggerGroup className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                {team.map((member) => (
                    <motion.div
                        key={member.name}
                        variants={staggerItem}
                        transition={itemTransition}
                        className="group rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-black/20"
                    >
                        <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-xl font-semibold text-slate-300 ring-4 ring-slate-800/80 transition-all duration-300 group-hover:ring-blue-500/30">
                            {member.img ? (
                                <img src={member.img} alt={member.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                member.name
                                    .split(' ')
                                    .map((part) => part[0])
                                    .join('')
                            )}
                        </div>
                        <h3 className="mt-5 text-lg font-semibold">{member.name}</h3>
                        <span className="mt-2 inline-block rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                            {member.role}
                        </span>
                    </motion.div>
                ))}
            </StaggerGroup>
        </section>
    )
}