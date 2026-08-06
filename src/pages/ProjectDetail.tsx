import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { motion } from 'motion/react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { projectFromDoc } from '../lib/firestore'
import { Seo } from '../components/Seo'
import { Reveal } from '../components/motion'
import { MotionLink } from '../components/MotionLink'
import type { Project } from '../types'

function useProject(projectId: string | undefined) {
    const [project, setProject] = useState<Project | null | undefined>(undefined)

    useEffect(() => {
        if (!projectId) return
        let cancelled = false

        getDoc(doc(db, 'projects', projectId))
            .then((snapshot) => {
                if (cancelled) return
                setProject(snapshot.exists() ? projectFromDoc(snapshot) : null)
            })
            .catch(() => {
                if (!cancelled) setProject(null)
            })

        return () => {
            cancelled = true
        }
    }, [projectId])

    return project
}

function BackLink() {
    return (
        <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
            Back to Projects
        </Link>
    )
}

function ProjectInfo({ project }: { project: Project }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/40">
            <h3 className="text-lg font-semibold">Project Info</h3>

            <dl className="mt-4 space-y-4 text-sm">
                {project.client && (
                    <div>
                        <dt className="text-slate-500">Client</dt>
                        <dd className="mt-1 text-slate-700 dark:text-slate-200">{project.client}</dd>
                    </div>
                )}
                {project.category && (
                    <div>
                        <dt className="text-slate-500">Category</dt>
                        <dd className="mt-1 text-slate-700 dark:text-slate-200">{project.category}</dd>
                    </div>
                )}
                {project.technologies && project.technologies.length > 0 && (
                    <div>
                        <dt className="text-slate-500">Technologies</dt>
                        <dd className="mt-2 flex flex-wrap gap-2">
                            {project.technologies.map((tech) => (
                                <span
                                    key={tech}
                                    className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-300"
                                >
                                    {tech}
                                </span>
                            ))}
                        </dd>
                    </div>
                )}
            </dl>
        </div>
    )
}

function QuoteCta() {
    return (
        <div className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 p-6">
            <h3 className="text-lg font-semibold text-white">Have a similar project?</h3>
            <p className="mt-1 text-sm text-blue-100">Let&rsquo;s talk about what you&rsquo;re building.</p>
            <MotionLink
                to="/contact"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
            >
                Get a Quote
            </MotionLink>
        </div>
    )
}

function ProjectBody({ project }: { project: Project }) {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold sm:text-3xl">Project Overview</h2>
                <p className="mt-3 text-slate-600 dark:text-slate-300">{project.description}</p>
            </div>

            {project.challenge && (
                <div>
                    <h2 className="text-2xl font-bold sm:text-3xl">The Challenge</h2>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">{project.challenge}</p>
                </div>
            )}

            {project.solution && (
                <div>
                    <h2 className="text-2xl font-bold sm:text-3xl">Our Solution</h2>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">{project.solution}</p>
                </div>
            )}

            {project.keyFeatures && project.keyFeatures.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold sm:text-3xl">Key Features</h2>
                    <ul className="mt-3 space-y-2.5">
                        {project.keyFeatures.map((feature) => (
                            <li key={feature} className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                                </svg>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

function ProjectView({ project }: { project: Project }) {
    return (
        <motion.section
            className="mx-auto max-w-screen-2xl px-6 py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <BackLink />

            <motion.div
                className="relative mt-6 aspect-video overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                {project.coverImageUrl && (
                    <img src={project.coverImageUrl} alt="" className="h-full w-full object-cover" />
                )}
                {project.category && (
                    <span className="absolute left-4 top-4 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur">
                        {project.category}
                    </span>
                )}
            </motion.div>

            <motion.h1
                className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {project.title}
            </motion.h1>

            <div className="mt-10 grid gap-8 lg:grid-cols-3">
                <Reveal className="lg:col-span-2">
                    <ProjectBody project={project} />
                </Reveal>

                <Reveal delay={0.1} className="space-y-6">
                    <ProjectInfo project={project} />
                    <QuoteCta />
                </Reveal>
            </div>
        </motion.section>
    )
}

function NotFound() {
    return (
        <section className="mx-auto max-w-screen-2xl px-6 py-24 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Project not found</h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400">This project may have been removed or the link is incorrect.</p>
            <Link
                to="/projects"
                className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
                Back to Projects
            </Link>
        </section>
    )
}

function Loading() {
    return (
        <section className="mx-auto max-w-screen-2xl px-6 py-12">
            <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800/50" />
            <div className="mt-6 aspect-video animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800/50" />
            <div className="mt-8 h-9 w-72 animate-pulse rounded bg-slate-200 dark:bg-slate-800/50" />
        </section>
    )
}

export function ProjectDetail() {
    const { projectId } = useParams()
    const project = useProject(projectId)

    return (
        <>
            <Seo
                title={project ? `${project.title} — JayarathnaTech Solutions` : 'Project — JayarathnaTech Solutions'}
                description={project?.description ?? 'A project delivered by JayarathnaTech Solutions.'}
            />

            {project === undefined ? <Loading /> : project === null ? <NotFound /> : <ProjectView project={project} />}
        </>
    )
}
