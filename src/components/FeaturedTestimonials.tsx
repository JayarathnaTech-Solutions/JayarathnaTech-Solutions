import {Reveal, StaggerGroup} from "./motion.tsx";
import {EmptyState} from "./EmptyState.tsx";
import { motion } from "motion/react";
import {itemTransition, staggerItem} from "../lib/motion.ts";
import type {Testimonial} from "../types";
import {StarRating} from "./StarRating.tsx";


export function FeaturedTestimonials({ testimonials }: { testimonials: Testimonial[] | null }) {
    return (
        <section className="mx-auto max-w-screen-2xl px-6 py-16">
            <Reveal>
      <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        Testimonials
      </span>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">What Our Clients Say</h2>
            </Reveal>

            {testimonials === null ? (
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-48 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50" />
                    ))}
                </div>
            ) : testimonials.length === 0 ? (
                <EmptyState
                    icon={
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
                        />
                    }
                    title="Testimonials coming soon"
                    message="We're collecting feedback from our early clients — check back soon."
                />
            ) : (
                <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3">
                    {testimonials.map((testimonial) => (
                        <motion.div
                            key={testimonial.id}
                            variants={staggerItem}
                            transition={itemTransition}
                            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/40"
                        >
                            <p className="text-2xl leading-none text-blue-600 dark:text-blue-400">&ldquo;</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{testimonial.message}</p>
                            <div className="mt-4">
                                <StarRating rating={testimonial.rating} />
                            </div>
                            <p className="mt-4 font-semibold">{testimonial.clientName}</p>
                        </motion.div>
                    ))}
                </StaggerGroup>
            )}
        </section>
    )
}