import {Reveal, StaggerGroup} from "./motion.tsx";
import {Link} from "react-router";
import {MotionLink} from "./MotionLink.tsx";
import {itemTransition, staggerItem} from "../lib/motion.ts";
import type {Project} from "../types";
import {EmptyState} from "./EmptyState.tsx";

export function FeaturedProjects({ projects }: { projects: Project[] | null }) {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
                <div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Our Work
          </span>
                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Featured Projects</h2>
                </div>
                <Link
                    to="/projects"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    View all projects
                </Link>
            </Reveal>

            {projects === null ? (
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-72 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <EmptyState
                    icon={
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M5 6h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1ZM3 11h18"
                        />
                    }
                    title="Projects coming soon"
                    message="We're just getting started — new work will appear here as we ship it."
                />
            ) : (
                <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3">
                    {projects.map((project) => (
                        <MotionLink
                            key={project.id}
                            to={`/projects/${project.id}`}
                            variants={staggerItem}
                            transition={itemTransition}
                            whileHover={{ y: -4 }}
                            className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600"
                        >
                            <div className="aspect-video overflow-hidden bg-slate-200 dark:bg-slate-800">
                                {project.coverImageUrl && (
                                    <img
                                        src={project.coverImageUrl}
                                        alt=""
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                )}
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-semibold">{project.title}</h3>
                                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{project.description}</p>
                            </div>
                        </MotionLink>
                    ))}
                </StaggerGroup>
            )}
        </section>
    )
}