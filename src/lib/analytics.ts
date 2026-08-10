const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-E8R3K6DBC2'

declare global {
    interface Window {
        dataLayer: unknown[]
        gtag: (...args: unknown[]) => void
    }
}

// Ensure gtag script is loaded (loads from index.html, fallback injects if missing)
export function initAnalytics() {
    if (!GA_MEASUREMENT_ID) return
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
    window.gtag('config', GA_MEASUREMENT_ID)
}

export function trackPageview(path: string) {
    if (!GA_MEASUREMENT_ID || !window.gtag) return
    window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
    })
}

