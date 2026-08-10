import { useState } from 'react'
import { Seo } from '../components/Seo'
import { JsonLd } from '../components/JsonLd'
import { CtaBanner } from '../components/CtaBanner'
import { EmptyState } from '../components/EmptyState'
import { Reveal, StaggerGroup } from '../components/motion'
import { MotionLink } from '../components/MotionLink'
import { staggerItem, itemTransition } from '../lib/motion'
import { buildBreadcrumbSchema } from '../lib/siteInfo'
import { getAllPosts, getAllTags } from '../lib/blog'
import { chunk } from '../lib/chunk'
import type { BlogPost } from '../types'

const PAGE_SIZE = 12

function formatDate(iso: string) {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    })
}

function BookIcon() {
    return (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.25C10.5 5 8.5 4.25 6.25 4.25c-1 0-2 .15-2.9.43a.5.5 0 0 0-.35.48v13a.5.5 0 0 0 .68.47c.8-.28 1.66-.42 2.57-.42 2.25 0 4.25.75 5.75 2m0-16c1.5-1.25 3.5-2 5.75-2 1 0 2 .15 2.9.43a.5.5 0 0 1 .35.48v13a.5.5 0 0 1-.68.47c-.8-.28-1.66-.42-2.57-.42-2.25 0-4.25.75-5.75 2m0-16v16"
        />
    )
}

function Hero() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-24">
            <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Insights
                </span>

                <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">The JayarathnaTech Solutions Blog</h1>

                <p className="mt-5 max-w-xl text-lg text-slate-600">
                    Practical guides and perspectives on web development, e-commerce, mobile apps, and building
                    software for clients in Sri Lanka and around the world.
                </p>
            </Reveal>
        </section>
    )
}

function TagFilter({ tags, active, onSelect }: { tags: string[]; active: string; onSelect: (tag: string) => void }) {
    return (
        <div className="flex flex-wrap gap-3">
            {['All', ...tags].map((tag) => (
                <button
                    key={tag}
                    type="button"
                    onClick={() => onSelect(tag)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        active === tag
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 text-slate-600 hover:border-slate-400'
                    }`}
                >
                    {tag}
                </button>
            ))}
        </div>
    )
}

function PostCard({ post }: { post: BlogPost }) {
    return (
        <MotionLink
            to={`/blog/${post.slug}`}
            variants={staggerItem}
            transition={itemTransition}
            whileHover={{ y: -4 }}
            className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
        >
            <div className="flex flex-wrap gap-2">
                {post.tags.slice(0, 2).map((tag) => (
                    <span
                        key={tag}
                        className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600"
                    >
                        {tag}
                    </span>
                ))}
            </div>
            <h3 className="mt-4 text-lg font-semibold group-hover:text-blue-600">{post.title}</h3>
            <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{post.description}</p>
            <time dateTime={post.publishedAt} className="mt-4 text-xs text-slate-400">
                {formatDate(post.publishedAt)}
            </time>
        </MotionLink>
    )
}

function BlogGrid() {
    const allPosts = getAllPosts()
    const tags = getAllTags()
    const [activeTag, setActiveTag] = useState('All')
    const [page, setPage] = useState(1)

    const filteredPosts = activeTag === 'All' ? allPosts : allPosts.filter((post) => post.tags.includes(activeTag))
    const visiblePosts = filteredPosts.slice(0, page * PAGE_SIZE)
    const hasMore = visiblePosts.length < filteredPosts.length

    const handleSelectTag = (tag: string) => {
        setActiveTag(tag)
        setPage(1)
    }

    return (
        <section className="mx-auto max-w-7xl px-6 pb-16">
            {allPosts.length > 0 && <TagFilter tags={tags} active={activeTag} onSelect={handleSelectTag} />}

            {allPosts.length === 0 ? (
                <EmptyState
                    icon={<BookIcon />}
                    title="New articles coming soon"
                    message="We're putting together our first posts. Check back soon, or get in touch if there's a topic you'd like us to cover."
                    action={{ label: 'Get in Touch', to: '/contact' }}
                />
            ) : filteredPosts.length === 0 ? (
                <EmptyState
                    icon={<BookIcon />}
                    title={`No posts tagged "${activeTag}" yet`}
                    message="Try a different tag, or check back soon as we publish more articles."
                />
            ) : (
                <div className="mt-8 space-y-6">
                    {chunk(visiblePosts, PAGE_SIZE).map((postsPage, pageIndex) => (
                        <StaggerGroup
                            key={`${activeTag}-${pageIndex}`}
                            immediate={pageIndex > 0}
                            className="grid gap-6 md:grid-cols-3"
                        >
                            {postsPage.map((post) => (
                                <PostCard key={post.slug} post={post} />
                            ))}
                        </StaggerGroup>
                    ))}
                </div>
            )}

            {hasMore && (
                <div className="mt-10 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium text-slate-900 transition-colors hover:border-slate-400"
                    >
                        Load More Articles
                    </button>
                </div>
            )}
        </section>
    )
}

export function Blog() {
    return (
        <>
            <Seo
                title="Blog — Web Development & Software Insights | JayarathnaTech Solutions"
                description="Guides, tips, and perspectives on web development, e-commerce, mobile apps, and software delivery from JayarathnaTech Solutions, a software company serving Sri Lanka and international clients."
            />
            <JsonLd
                id="breadcrumb"
                data={buildBreadcrumbSchema([
                    { name: 'Home', url: '/' },
                    { name: 'Blog', url: '/blog' },
                ])}
            />

            <Hero />
            <BlogGrid />
            <CtaBanner />
        </>
    )
}
