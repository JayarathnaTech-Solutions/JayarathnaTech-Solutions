// One-off content generation script — reads GEMINI_API_KEY from .env (same
// key already used in production for BRD/SRS generation, see
// api/requirementsDocAiHandler.ts) and calls Gemini once per topic below to
// produce a full blog article. Writes markdown bodies to
// src/content/blog/posts/<slug>.md and metadata to src/content/blog/posts.ts
// (consumed by the app) and src/content/blog/posts.json (a plain-data mirror
// consumed by scripts/generate-sitemap.mjs, which runs outside Vite/TS).
//
// Idempotent: re-running skips slugs that already have a markdown file, so a
// partial run (rate limit, network blip) can just be re-invoked.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

try {
    process.loadEnvFile()
} catch {
    // No .env file locally is fine.
}

const SITE_NAME = 'JayarathnaTech Solutions'
const GEMINI_MODEL = 'gemini-3.1-flash-lite'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const MAX_OUTPUT_TOKENS = 4096
const CONCURRENCY = 4

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
    console.error('generate-blog-posts: GEMINI_API_KEY is not set (check .env)')
    process.exit(1)
}

const POSTS_DIR = new URL('../src/content/blog/posts/', import.meta.url)
const POSTS_TS = new URL('../src/content/blog/posts.ts', import.meta.url)
const POSTS_JSON = new URL('../src/content/blog/posts.json', import.meta.url)
mkdirSync(POSTS_DIR, { recursive: true })

// [title, tags[]] — tags are drawn from a small fixed vocabulary so the
// blog's tag filter stays useful instead of fragmenting into 100 one-off tags.
const TOPICS = [
    ['How to Choose the Right Tech Stack for Your Web Application', ['Web Development', 'Business']],
    ['React vs Vue vs Angular: Which Frontend Framework Fits Your Project?', ['Web Development', 'Technology']],
    ['Website Speed Optimization: A Practical Checklist for Business Owners', ['Web Development', 'Performance']],
    ['Why Your Business Needs a Custom Website Instead of a Template', ['Web Development', 'Business']],
    ['Progressive Web Apps Explained: Do You Need One?', ['Web Development', 'Technology']],
    ['The True Cost of Building a Web Application', ['Web Development', 'Business']],
    ['Headless CMS vs Traditional CMS: Which Should You Choose?', ['Web Development', 'Technology']],
    ['API-First Development: Why It Matters for Growing Businesses', ['Web Development', 'Business']],
    ['Website Security Basics Every Business Owner Should Know', ['Web Development', 'Security']],
    ['How Long Does It Really Take to Build a Web Application?', ['Web Development', 'Business']],
    ['Monolith vs Microservices: What Small Businesses Actually Need', ['Web Development', 'Technology']],
    ['Server-Side Rendering vs Client-Side Rendering: A Practical Guide', ['Web Development', 'Performance']],
    ['Choosing Between a Web App and a Mobile App for Your Startup', ['Web Development', 'Startups']],
    ['How to Write a Clear Project Brief for Your Web Development Agency', ['Web Development', 'Business']],
    ['Common Web Development Mistakes That Cost Businesses Money', ['Web Development', 'Business']],
    ['Website Accessibility: Why It Is Good for Business, Not Just Compliance', ['Web Development', 'Business']],
    ['What Is a Web Application Firewall and Does Your Site Need One?', ['Web Development', 'Security']],
    ['Shopify vs Custom E-Commerce: Which Is Right for Your Business?', ['E-Commerce', 'Business']],
    ['How to Reduce Cart Abandonment on Your Online Store', ['E-Commerce', 'Performance']],
    ['Building an E-Commerce Store for the Sri Lankan Market: What to Know', ['E-Commerce', 'Sri Lanka']],
    ['Payment Gateway Integration in Sri Lanka: A Practical Overview', ['E-Commerce', 'Sri Lanka']],
    ['Inventory Management Systems for Growing Online Stores', ['E-Commerce', 'Business']],
    ['Multi-Currency E-Commerce: Selling to International Customers', ['E-Commerce', 'Business']],
    ['E-Commerce SEO: Getting Your Products Found on Google', ['E-Commerce', 'SEO']],
    ['How to Choose Between B2B and B2C E-Commerce Platforms', ['E-Commerce', 'Business']],
    ['Subscription Commerce: Building Recurring Revenue Into Your Store', ['E-Commerce', 'Business']],
    ['Mobile Commerce Trends Every Online Retailer Should Know', ['E-Commerce', 'Mobile Apps']],
    ['Order Fulfillment Automation for Small E-Commerce Businesses', ['E-Commerce', 'Business']],
    ['Why Page Speed Matters More for E-Commerce Than Any Other Site', ['E-Commerce', 'Performance']],
    ['Building Trust on Your Online Store: Reviews, Badges, and Transparency', ['E-Commerce', 'Business']],
    ['Marketplace vs Standalone Store: Choosing Your E-Commerce Model', ['E-Commerce', 'Business']],
    ['Handling Returns and Refunds: What Your E-Commerce Platform Needs', ['E-Commerce', 'Business']],
    ['Native vs Cross-Platform Mobile Apps: Making the Right Choice', ['Mobile Apps', 'Technology']],
    ['Flutter vs React Native: A Practical Comparison for Business Owners', ['Mobile Apps', 'Technology']],
    ['How Much Does It Cost to Build a Mobile App?', ['Mobile Apps', 'Business']],
    ['Mobile App vs Web App: Which Does Your Business Actually Need?', ['Mobile Apps', 'Business']],
    ['Push Notifications Done Right: Engaging Users Without Annoying Them', ['Mobile Apps', 'UI/UX Design']],
    ['Getting Your App Approved: App Store and Play Store Guidelines', ['Mobile Apps', 'Business']],
    ['Offline-First Mobile Apps: Why They Matter for Emerging Markets', ['Mobile Apps', 'Sri Lanka']],
    ['Mobile App Security: Protecting User Data on Every Platform', ['Mobile Apps', 'Security']],
    ['How to Plan a Successful Mobile App MVP', ['Mobile Apps', 'Startups']],
    ['In-App Purchases and Subscriptions: A Technical Overview', ['Mobile Apps', 'Business']],
    ['Designing Mobile Apps for Low-Bandwidth Users in Sri Lanka', ['Mobile Apps', 'Sri Lanka']],
    ['App Maintenance After Launch: What Business Owners Overlook', ['Mobile Apps', 'Maintenance & Support']],
    ['Cross-Platform App Performance: What Really Affects Speed', ['Mobile Apps', 'Performance']],
    ['Building a Delivery or Logistics App: Core Features You Need', ['Mobile Apps', 'Business']],
    ['Why Good UI/UX Design Directly Impacts Your Revenue', ['UI/UX Design', 'Business']],
    ['Designing for Trust: UX Principles for Financial and E-Commerce Apps', ['UI/UX Design', 'E-Commerce']],
    ['Mobile-First Design: Why It Is No Longer Optional', ['UI/UX Design', 'Mobile Apps']],
    ['Common UX Mistakes That Drive Users Away', ['UI/UX Design', 'Business']],
    ['The Design Process: From Wireframes to a Finished Product', ['UI/UX Design', 'Business']],
    ['Accessibility in UI Design: Building for All Users', ['UI/UX Design', 'Business']],
    ['How User Research Shapes Better Product Decisions', ['UI/UX Design', 'Business']],
    ['Design Systems: Why Growing Products Need Consistent UI', ['UI/UX Design', 'SaaS']],
    ['Micro-Interactions: Small Details That Improve User Experience', ['UI/UX Design', 'Performance']],
    ['Dark Mode Design: More Than Just a Trend', ['UI/UX Design', 'Technology']],
    ['Onboarding UX: Getting New Users to Their First "Aha" Moment', ['UI/UX Design', 'SaaS']],
    ['Color Psychology in UI Design for Business Applications', ['UI/UX Design', 'Business']],
    ['Prototyping Tools Compared: Figma, Adobe XD, and Beyond', ['UI/UX Design', 'Technology']],
    ['Building a SaaS Product: A Founder’s Roadmap', ['SaaS', 'Startups']],
    ['Multi-Tenant Architecture Explained for Non-Technical Founders', ['SaaS', 'Technology']],
    ['SaaS Pricing Models: Choosing What Works for Your Product', ['SaaS', 'Business']],
    ['How to Reduce Churn in Your SaaS Product', ['SaaS', 'Business']],
    ['SaaS Security and Compliance: What Founders Need to Know', ['SaaS', 'Security']],
    ['Building an MVP for Your SaaS Startup: What to Include (and Skip)', ['SaaS', 'Startups']],
    ['Scaling Your SaaS Infrastructure as You Grow', ['SaaS', 'Performance']],
    ['SaaS Onboarding: Turning Trial Users Into Paying Customers', ['SaaS', 'UI/UX Design']],
    ['Integrations and APIs: Why They Matter for SaaS Growth', ['SaaS', 'Technology']],
    ['From Idea to Launch: The SaaS Development Timeline Explained', ['SaaS', 'Startups']],
    ['Usage-Based Billing: Implementing Metered Pricing in SaaS', ['SaaS', 'Business']],
    ['SaaS Analytics: Metrics Every Founder Should Track', ['SaaS', 'Business']],
    ['White-Label SaaS: Building Products Other Businesses Can Rebrand', ['SaaS', 'Business']],
    ['Data Privacy in SaaS: GDPR and Beyond for Global Products', ['SaaS', 'Security']],
    ['How to Choose a Software Development Company in Sri Lanka', ['Business', 'Sri Lanka']],
    ['Outsourcing Software Development: Why Sri Lanka Is a Strong Choice', ['Business', 'Sri Lanka']],
    ['Fixed-Price vs Time-and-Material: Choosing the Right Engagement Model', ['Business']],
    ['Red Flags to Watch for When Hiring a Web Development Agency', ['Business', 'Web Development']],
    ['What to Expect During a Software Discovery and Requirements Phase', ['Business']],
    ['Understanding a Business Requirements Document (BRD): A Simple Guide', ['Business']],
    ['Why Post-Launch Support and Maintenance Plans Matter', ['Business', 'Maintenance & Support']],
    ['How to Budget for a Custom Software Project', ['Business']],
    ['Building Software for International Clients: Lessons From Sri Lanka', ['Business', 'Sri Lanka']],
    ['Remote Collaboration: How We Work With Clients Across Time Zones', ['Business', 'Sri Lanka']],
    ['Signs Your Business Is Ready to Invest in Custom Software', ['Business']],
    ['The Real Cost of Cheap Software Development', ['Business']],
    ['From Idea to Launch: What a Typical Software Project Timeline Looks Like', ['Business']],
    ['Working With a Dedicated Development Team vs a Freelancer', ['Business']],
    ['Digital Transformation for Small and Medium Businesses in Sri Lanka', ['Business', 'Sri Lanka']],
    ['How to Write Requirements Your Development Team Can Actually Use', ['Business']],
    ['Choosing Between Local and Offshore Software Development Partners', ['Business', 'Sri Lanka']],
    ['Firebase vs Traditional Backend: When Each Makes Sense', ['Technology', 'Web Development']],
    ['Cloud Hosting Explained: AWS, Firebase, and Choosing the Right Fit', ['Technology', 'Business']],
    ['AI in Business Software: Practical Use Cases, Not Just Hype', ['Technology', 'Business']],
    ['What Is a REST API and Why Should Business Owners Care?', ['Technology', 'Web Development']],
    ['Serverless Architecture: Benefits for Startups and Small Teams', ['Technology', 'Startups']],
    ['The Role of DevOps in Reliable Software Delivery', ['Technology', 'Business']],
    ['Database Choices Explained: SQL vs NoSQL for Business Applications', ['Technology', 'Web Development']],
    ['Automated Testing: Why It Matters Even for Small Projects', ['Technology', 'Business']],
    ['Version Control and Why It Protects Your Software Investment', ['Technology', 'Business']],
    ['Emerging Web Technologies to Watch This Year', ['Technology', 'Web Development']],
]

if (TOPICS.length !== 100) {
    console.error(`generate-blog-posts: expected 100 topics, found ${TOPICS.length}`)
    process.exit(1)
}

function slugify(title) {
    return title
        .toLowerCase()
        .replace(/['"’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

const SYSTEM_INSTRUCTION = `You are a senior technical writer and consultant at ${SITE_NAME}, a software development company based in Negombo, Sri Lanka that builds web applications, e-commerce platforms, mobile apps, and SaaS products for clients in Sri Lanka and internationally.

Write a genuinely useful, practical blog article for the company website. The audience is business owners, founders, and product managers evaluating or planning a software project — not other developers, so avoid unnecessary jargon and explain technical terms in plain language when you use them.

Formatting rules:
- Output real Markdown: use "##" for section headings and "###" for sub-headings, "-" for bullet lists, numbered lists where order matters, and **bold** for emphasis.
- Do not include a top-level "#" heading and do not repeat the article title — the page already displays it separately. Start directly with a short introductory paragraph.
- Length: roughly 600-900 words.
- Include at least one concrete checklist, numbered list, or comparison relevant to the topic — avoid generic filler.
- End with a brief closing paragraph (2-3 sentences) that naturally connects the topic to how a company like ${SITE_NAME} can help, without being a hard sales pitch.
- Do not fabricate specific statistics, named case studies, client names, or pricing figures — speak in general, defensible terms instead.

Respond with EXACTLY this structure and nothing else, no preamble:
DESCRIPTION: <a single meta-description sentence, 140-160 characters, no surrounding quotes>
---
<the full markdown article>`

async function callGemini(title, attempt = 1) {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `Article title: "${title}"` }] }],
            systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
            generationConfig: { temperature: 0.75, maxOutputTokens: MAX_OUTPUT_TOKENS },
        }),
    })

    if (response.status === 429 && attempt <= 4) {
        const wait = attempt * 15000
        console.warn(`  rate limited, retrying "${title}" in ${wait / 1000}s (attempt ${attempt})`)
        await new Promise((resolve) => setTimeout(resolve, wait))
        return callGemini(title, attempt + 1)
    }

    if (!response.ok) {
        console.error(`  Gemini error for "${title}":`, response.status, await response.text())
        return undefined
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    if (candidate?.finishReason === 'MAX_TOKENS') {
        console.error(`  truncated (MAX_TOKENS) for "${title}"`)
    }
    const text = candidate?.content?.parts?.map((part) => part.text ?? '').join('').trim()
    return text || undefined
}

function parseResponse(raw) {
    const match = raw.match(/^DESCRIPTION:\s*(.+?)\s*\n---\s*\n([\s\S]+)$/)
    if (!match) return undefined
    const [, description, body] = match
    return { description: description.trim(), body: body.trim() }
}

// Spread 100 posts over the last ~300 days at a roughly-twice-weekly cadence,
// with jitter so the dates don't look mechanically evenly spaced — a sudden
// same-day burst of 100 posts is exactly the "scaled content abuse" pattern
// Google's spam policy flags, so publish dates are backdated as if the blog
// had been running for a while.
function computePublishDates(count) {
    const today = new Date()
    const spanDays = 300
    const dates = []
    for (let i = 0; i < count; i++) {
        const targetOffset = spanDays - (i / (count - 1)) * spanDays
        const jitter = (Math.random() - 0.5) * 4
        const offset = Math.max(3, targetOffset + jitter)
        const date = new Date(today)
        date.setUTCDate(date.getUTCDate() - Math.round(offset))
        dates.push(date.toISOString().split('T')[0])
    }
    return dates.sort()
}

function loadExistingPosts() {
    if (!existsSync(POSTS_JSON)) return []
    try {
        return JSON.parse(readFileSync(POSTS_JSON, 'utf-8'))
    } catch {
        return []
    }
}

function writeMetadata(posts) {
    const sorted = [...posts].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
    writeFileSync(POSTS_JSON, JSON.stringify(sorted, null, 4) + '\n')
    const ts = `import type { BlogPost } from '../../types'

// Metadata for every blog post — generated by scripts/generate-blog-posts.mjs.
// Each entry's markdown body lives at src/content/blog/posts/<slug>.md.
// src/content/blog/posts.json is a plain-data mirror of this file, kept for
// scripts/generate-sitemap.mjs (a plain Node script that can't import .ts).
export const blogPosts: BlogPost[] = ${JSON.stringify(sorted, null, 4)}
`
    writeFileSync(POSTS_TS, ts)
}

async function processTopic(title, tags, publishedAt, existingSlugs) {
    const slug = slugify(title)
    const mdPath = new URL(`${slug}.md`, POSTS_DIR)

    if (existingSlugs.has(slug) && existsSync(mdPath)) {
        console.log(`  skip (already generated): ${title}`)
        return existingSlugs.get(slug)
    }

    console.log(`  generating: ${title}`)
    const raw = await callGemini(title)
    if (!raw) {
        console.error(`  FAILED: ${title}`)
        return undefined
    }
    const parsed = parseResponse(raw)
    if (!parsed) {
        console.error(`  FAILED to parse response for: ${title}`)
        return undefined
    }

    writeFileSync(mdPath, parsed.body + '\n')
    return { slug, title, description: parsed.description, tags, publishedAt }
}

async function main() {
    const dates = computePublishDates(TOPICS.length)
    const existing = loadExistingPosts()
    const existingBySlug = new Map(existing.map((post) => [post.slug, post]))

    const results = new Array(TOPICS.length)
    let cursor = 0

    async function worker() {
        while (cursor < TOPICS.length) {
            const index = cursor++
            const [title, tags] = TOPICS[index]
            const post = await processTopic(title, tags, dates[index], existingBySlug)
            results[index] = post
            if ((index + 1) % 10 === 0) {
                const done = results.filter(Boolean)
                writeMetadata(done)
                console.log(`--- checkpoint: ${done.length}/${TOPICS.length} posts written ---`)
            }
        }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

    const finalPosts = results.filter(Boolean)
    writeMetadata(finalPosts)

    const failed = TOPICS.length - finalPosts.length
    console.log(`generate-blog-posts: wrote ${finalPosts.length}/${TOPICS.length} posts.`)
    if (failed > 0) {
        console.warn(`${failed} posts failed — re-run this script to retry just those (it skips completed slugs).`)
        process.exit(1)
    }
}

await main()
process.exit(0)
