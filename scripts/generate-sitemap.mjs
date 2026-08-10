import { writeFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { collection, getDocs, getFirestore } from 'firebase/firestore'

try {
    process.loadEnvFile()
} catch {
    // No .env file locally is fine — Vercel injects env vars directly at build time.
}

const SITE_URL = 'https://www.jayarathnatechsolutions.com'
const BUILD_DATE = new Date().toISOString().split('T')[0]

// changefreq/priority reflect how often each page's content actually changes
// and how central it is to the site, so crawlers spend their budget on the
// pages that matter most (home/services first, static legal-style pages last).
const STATIC_ROUTES = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/services', changefreq: 'monthly', priority: '0.9' },
    { path: '/projects', changefreq: 'weekly', priority: '0.8' },
    { path: '/about', changefreq: 'monthly', priority: '0.7' },
    { path: '/contact', changefreq: 'monthly', priority: '0.7' },
]

const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
})
const db = getFirestore(app)

let projectRoutes = []
try {
    const snapshot = await getDocs(collection(db, 'projects'))
    projectRoutes = snapshot.docs.map((doc) => {
        const createdAt = doc.data().createdAt
        return {
            path: `/projects/${doc.id}`,
            changefreq: 'monthly',
            priority: '0.6',
            // Firestore Timestamp -> YYYY-MM-DD; falls back to the build date
            // for docs written before createdAt was backfilled, or if the
            // field is missing/malformed.
            lastmod: typeof createdAt?.toDate === 'function' ? createdAt.toDate().toISOString().split('T')[0] : BUILD_DATE,
        }
    })
} catch (error) {
    console.warn('generate-sitemap: could not fetch projects, falling back to static routes only.', error)
}

const routes = [
    ...STATIC_ROUTES.map((route) => ({ ...route, lastmod: BUILD_DATE })),
    ...projectRoutes,
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
    .map(
        (route) =>
            `  <url><loc>${SITE_URL}${route.path}</loc><lastmod>${route.lastmod}</lastmod><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority></url>`,
    )
    .join('\n')}
</urlset>
`

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml)
console.log(`generate-sitemap: wrote ${routes.length} URLs to public/sitemap.xml`)

process.exit(0)
