import { blogPosts } from '../content/blog/posts'
import type { BlogPost } from '../types'

// Markdown bodies are separate files, loaded eagerly as raw strings at build
// time (there are only ~100, all small) and looked up by slug on demand.
const postBodies = import.meta.glob('../content/blog/posts/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>

function bodyForSlug(slug: string): string {
    return postBodies[`../content/blog/posts/${slug}.md`] ?? ''
}

export function getAllPosts(): BlogPost[] {
    return [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function getPostBySlug(slug: string): (BlogPost & { content: string }) | undefined {
    const post = blogPosts.find((p) => p.slug === slug)
    if (!post) return undefined
    return { ...post, content: bodyForSlug(slug) }
}

export function getAllTags(): string[] {
    return Array.from(new Set(blogPosts.flatMap((post) => post.tags))).sort()
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
    const post = blogPosts.find((p) => p.slug === slug)
    if (!post) return []
    return getAllPosts()
        .filter((p) => p.slug !== slug && p.tags.some((tag) => post.tags.includes(tag)))
        .slice(0, limit)
}
