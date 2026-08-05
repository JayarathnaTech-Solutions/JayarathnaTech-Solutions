import {Reveal, StaggerGroup} from "./motion.tsx";
import {motion} from "motion/react";
import {itemTransition, staggerItem} from "../lib/motion.ts";

export function WhyChooseUs() {
    const whyChooseUsItems = [
        {
            title: 'Faster Time-to-Market',
            description: 'Streamlined development gets your product to market quickly without cutting corners.',
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="m3 17 6-6 4 4 8-8M15 7h6v6" />,
        },
        {
            title: 'Scalable by Design',
            description: 'Architecture built to grow with your business, from first launch to enterprise scale.',
            icon: (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m12 3 8 4-8 4-8-4 8-4ZM4 12l8 4 8-4M4 16l8 4 8-4"
                />
            ),
        },
        {
            title: 'End-to-End Ownership',
            description: 'From first sketch to production deployment, one team owns your entire product.',
            icon: (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Zm-3 9 2 2 4-4"
                />
            ),
        },
        {
            title: 'Transparent Pricing',
            description: 'Clear scopes and honest quotes — no hidden fees or scope creep.',
            icon: (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 2h7a1 1 0 0 1 1 1v7a1 1 0 0 1-.3.7l-9 9a1 1 0 0 1-1.4 0l-6.3-6.3a1 1 0 0 1 0-1.4l9-9A1 1 0 0 1 12 2Zm4.5 5.5h.01"
                />
            ),
        },
    ]

    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <Reveal>
      <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        Why Choose Us
      </span>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Built for Your Business Goals</h2>
            </Reveal>

            <StaggerGroup className="mt-8 grid gap-6 sm:grid-cols-2">
                {whyChooseUsItems.map((item) => (
                    <motion.div
                        key={item.title}
                        variants={staggerItem}
                        transition={itemTransition}
                        className="rounded-xl border border-slate-800 bg-slate-900/40 p-6"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                {item.icon}
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                    </motion.div>
                ))}
            </StaggerGroup>
        </section>
    )
}