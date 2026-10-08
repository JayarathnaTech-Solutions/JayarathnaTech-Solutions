// Blog post metadata — lives in src/content/blog/posts.ts (static, git-committed).
// The markdown body is a separate file at src/content/blog/posts/<slug>.md,
// loaded on demand via import.meta.glob (see src/lib/blog.ts) rather than
// embedded here, so listing pages don't pull every post's full body into memory.
export interface BlogPost {
    slug: string
    title: string
    description: string
    tags: string[]
    /** ISO date (yyyy-mm-dd) — drives display, sitemap lastmod, and sort order. */
    publishedAt: string
}
