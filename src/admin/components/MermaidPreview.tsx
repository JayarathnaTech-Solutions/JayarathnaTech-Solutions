import { useEffect, useState } from 'react'

export function MermaidPreview({ definition }: { definition: string }) {
    const [svg, setSvg] = useState<string | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        let cancelled = false
        const trimmed = definition.trim()
        if (!trimmed) return
        // Dynamic import keeps the ~100kB+ mermaid library out of the main
        // bundle — it's only needed on this admin-only diagram preview.
        import('../../lib/mermaidRender')
            .then(({ renderMermaidToSvg }) => renderMermaidToSvg(trimmed))
            .then((result) => {
                if (!cancelled) {
                    setSvg(result)
                    setError(false)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSvg(null)
                    setError(true)
                }
            })
        return () => {
            cancelled = true
        }
    }, [definition])

    if (error) {
        return <p className="text-sm text-red-600">Couldn't render this diagram — check the Mermaid syntax below.</p>
    }

    if (!svg) return null

    return (
        <div
            className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    )
}
