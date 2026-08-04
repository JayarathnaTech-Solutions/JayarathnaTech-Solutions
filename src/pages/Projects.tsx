import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    type QueryDocumentSnapshot,
    type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { projectFromDoc } from '../lib/firestore'
import { Seo } from '../components/Seo'
import { CtaBanner } from '../components/CtaBanner'
import { EmptyState } from '../components/EmptyState'
import { Reveal, StaggerGroup } from '../components/motion'
import { MotionLink } from '../components/MotionLink'
import { staggerItem, itemTransition } from '../lib/motion'
import type { Project } from '../types'

const PAGE_SIZE = 6

function BriefcaseIcon() {
    return (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M5 6h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1ZM3 11h18"
        />
    )
}

function useProjects() {
    const [projects, setProjects] = useState<Project[] | null>(null)
    const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    useEffect(() => {
        let cancelled = false

        getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE)))
            .then((snapshot) => {
                if (cancelled) return
                setProjects(snapshot.docs.map(projectFromDoc))
                setCursor(snapshot.docs.at(-1) ?? null)
                setHasMore(snapshot.docs.length === PAGE_SIZE)
            })
            .catch(() => {
                if (!cancelled) {
                    setProjects([])
                    setHasMore(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [])

    const loadMore = () => {
        if (!cursor || loadingMore) return
        setLoadingMore(true)

        getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(PAGE_SIZE)))
            .then((snapshot) => {
                setProjects((prev) => [...(prev ?? []), ...snapshot.docs.map(projectFromDoc)])
                setCursor(snapshot.docs.at(-1) ?? null)
                setHasMore(snapshot.docs.length === PAGE_SIZE)
            })
            .catch(() => setHasMore(false))
            .finally(() => setLoadingMore(false))
    }

    return { projects, hasMore, loadingMore, loadMore }
}

function Hero() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
            <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Our Work
                </span>

                <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">Projects We&rsquo;ve Delivered</h1>

                <p className="mt-5 max-w-xl text-lg text-slate-300">
                    Explore some of the digital products we&rsquo;ve designed, built, and shipped for our clients.
                </p>
            </Reveal>
        </section>
    )
}

function CategoryTabs({
    categories,
    active,
    onSelect,
}: {
    categories: string[]
    active: string
    onSelect: (category: string) => void
}) {
    return (
        <div className="flex flex-wrap gap-3">
            {['All', ...categories].map((category) => (
                <button
                    key={category}
                    type="button"
                    onClick={() => onSelect(category)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        active === category
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                >
                    {category}
                </button>
            ))}
        </div>
    )
}

function ProjectCard({ project }: { project: Project }) {
    return (
        <MotionLink
            to={`/projects/${project.id}`}
            variants={staggerItem}
            transition={itemTransition}
            whileHover={{ y: -4 }}
            className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 transition-colors hover:border-slate-700"
        >
            <div className="relative aspect-video overflow-hidden bg-slate-800">
                {project.coverImageUrl && (
                    <img
                        src={project.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                )}
                {project.category && (
                    <span className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur">
                        {project.category}
                    </span>
                )}
            </div>
            <div className="p-5">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{project.description}</p>
            </div>
        </MotionLink>
    )
}

function ProjectsGrid() {
    const { projects, hasMore, loadingMore, loadMore } = useProjects()
    const [activeCategory, setActiveCategory] = useState('All')

    const categories = Array.from(
        new Set((projects ?? []).map((project) => project.category).filter((value): value is string => Boolean(value))),
    )

    const visibleProjects =
        activeCategory === 'All' ? projects : (projects ?? []).filter((project) => project.category === activeCategory)

    return (
        <section className="mx-auto max-w-7xl px-6 pb-16">
            {projects !== null && projects.length > 0 && (
                <CategoryTabs categories={categories} active={activeCategory} onSelect={setActiveCategory} />
            )}

            {projects === null ? (
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-72 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <EmptyState
                    icon={<BriefcaseIcon />}
                    title="New projects coming soon"
                    message="We're currently building out our portfolio. Check back soon, or get in touch to be one of our first case studies."
                    action={{ label: 'Get in Touch', to: '/contact' }}
                />
            ) : visibleProjects && visibleProjects.length === 0 ? (
                <EmptyState
                    icon={<BriefcaseIcon />}
                    title={`No ${activeCategory} projects yet`}
                    message="Try a different category, or check back soon as we publish more work."
                />
            ) : (
                <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3">
                    {visibleProjects?.map((project) => <ProjectCard key={project.id} project={project} />)}
                </StaggerGroup>
            )}

            {projects !== null && projects.length > 0 && activeCategory === 'All' && hasMore && (
                <div className="mt-10 flex justify-center">
                    <motion.button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-slate-500 disabled:opacity-50"
                    >
                        {loadingMore ? 'Loading…' : 'Load More Projects'}
                    </motion.button>
                </div>
            )}
        </section>
    )
}

export function Projects() {
    return (
        <>
            <Seo
                title="Projects — JayarathnaTech Solutions"
                description="Explore the web applications, e-commerce platforms, and digital products JayarathnaTech Solutions has designed and built for clients."
            />

            <Hero />
            <ProjectsGrid />
            <CtaBanner />
        </>
    )
}
