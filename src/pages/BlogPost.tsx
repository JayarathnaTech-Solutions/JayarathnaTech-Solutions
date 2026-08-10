import { Link, useParams } from 'react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Seo } from '../components/Seo'
import { JsonLd } from '../components/JsonLd'
import { CtaBanner } from '../components/CtaBanner'
import { Reveal } from '../components/motion'
import { MotionLink } from '../components/MotionLink'
import { buildBreadcrumbSchema, buildBlogPostingSchema, buildPageTitle } from '../lib/siteInfo'
import { getPostBySlug, getRelatedPosts } from '../lib/blog'

function formatDate(iso: string) {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    })
}

function BackLink() {
    return (
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
            Back to Blog
        </Link>
    )
}

function NotFound() {
    return (
        <section className="mx-auto max-w-screen-2xl px-6 py-24 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Article not found</h1>
            <p className="mt-3 text-slate-500">This article may have been removed or the link is incorrect.</p>
            <Link to="/blog" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-500">
                Back to Blog
            </Link>
        </section>
    )
}

function RelatedPosts({ slug }: { slug: string }) {
    const related = getRelatedPosts(slug)
    if (related.length === 0) return null

    return (
        <section className="mx-auto max-w-7xl px-6 pb-16">
            <h2 className="text-2xl font-bold">Related Articles</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
                {related.map((post) => (
                    <MotionLink
                        key={post.slug}
                        to={`/blog/${post.slug}`}
                        whileHover={{ y: -4 }}
                        className="rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
                    >
                        <h3 className="text-base font-semibold">{post.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{post.description}</p>
                    </MotionLink>
                ))}
            </div>
        </section>
    )
}

export function BlogPost() {
    const { slug } = useParams()
    const post = slug ? getPostBySlug(slug) : undefined

    if (!post) {
        return (
            <>
                <Seo title="Article Not Found — JayarathnaTech Solutions" description="The article you're looking for doesn't exist or has been moved." noindex />
                <NotFound />
            </>
        )
    }

    return (
        <>
            <Seo
                title={buildPageTitle(post.title)}
                description={post.description}
            />
            <JsonLd
                id="breadcrumb"
                data={buildBreadcrumbSchema([
                    { name: 'Home', url: '/' },
                    { name: 'Blog', url: '/blog' },
                    { name: post.title, url: `/blog/${post.slug}` },
                ])}
            />
            <JsonLd id="blog-posting" data={buildBlogPostingSchema(post)} />

            <Reveal className="mx-auto max-w-7xl px-6 pt-24 pb-16">
                <BackLink />

                <div className="mt-6 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600">
                            {tag}
                        </span>
                    ))}
                </div>

                <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{post.title}</h1>

                <time dateTime={post.publishedAt} className="mt-4 block text-sm text-slate-500">
                    {formatDate(post.publishedAt)}
                </time>

                <div className="prose prose-slate mt-10 max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </div>
            </Reveal>

            <RelatedPosts slug={post.slug} />
            <CtaBanner />
        </>
    )
}
