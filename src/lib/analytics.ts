const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

declare global {
    interface Window {
        dataLayer: unknown[]
        gtag: (...args: unknown[]) => void
    }
}

// Loads gtag.js and configures GA4, but skips entirely in dev/preview builds
// so local testing doesn't pollute production analytics data.
export function initAnalytics() {
    if (!GA_MEASUREMENT_ID || !import.meta.env.PROD) return
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) return

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer.push(args)
    }
    window.gtag('js', new Date())
    // send_page_view is disabled here because this is an SPA — page views are
    // reported manually per route change via trackPageview() instead.
    window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })
}

export function trackPageview(path: string) {
    if (!GA_MEASUREMENT_ID || !import.meta.env.PROD || !window.gtag) return
    window.gtag('event', 'page_view', {
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
    })
}
