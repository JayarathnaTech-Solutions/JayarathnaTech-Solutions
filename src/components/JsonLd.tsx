import { useEffect } from 'react'

// Injects a <script type="application/ld+json"> tag into <head>, keyed by
// `id` so multiple structured-data blocks (e.g. sitewide Organization plus a
// page-specific one) can coexist without clobbering each other.
export function JsonLd({ id, data }: { id: string; data: object }) {
    const json = JSON.stringify(data)

    useEffect(() => {
        let script = document.querySelector<HTMLScriptElement>(`script[data-jsonld="${id}"]`)
        if (!script) {
            script = document.createElement('script')
            script.type = 'application/ld+json'
            script.dataset.jsonld = id
            document.head.appendChild(script)
        }
        script.textContent = json

        return () => {
            script?.remove()
        }
    }, [id, json])

    return null
}
