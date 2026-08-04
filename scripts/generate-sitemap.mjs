import { writeFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { collection, getDocs, getFirestore } from 'firebase/firestore'

try {
    process.loadEnvFile()
} catch {
    // No .env file locally is fine — Vercel injects env vars directly at build time.
}

const SITE_URL = 'https://jayarathnatechsolutions.com'
const STATIC_ROUTES = ['/', '/about', '/services', '/projects', '/contact']

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
    projectRoutes = snapshot.docs.map((doc) => `/projects/${doc.id}`)
} catch (error) {
    console.warn('generate-sitemap: could not fetch projects, falling back to static routes only.', error)
}

const routes = [...STATIC_ROUTES, ...projectRoutes]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join('\n')}
</urlset>
`

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml)
console.log(`generate-sitemap: wrote ${routes.length} URLs to public/sitemap.xml`)

process.exit(0)
