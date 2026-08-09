import mermaid from 'mermaid'

let initialized = false

function ensureInitialized() {
    if (initialized) return
    // htmlLabels: false forces plain SVG <text> labels instead of
    // <foreignObject>-embedded HTML — foreignObject content taints the
    // canvas when svgToPngDataUrl rasterizes the diagram below, which makes
    // canvas.toDataURL() throw and silently drops the diagram from the PDF.
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'neutral',
        // Top-level htmlLabels takes priority over flowchart.htmlLabels in
        // mermaid's config resolution — set both so this reliably applies.
        htmlLabels: false,
        flowchart: { htmlLabels: false },
    })
    initialized = true
}

let renderCounter = 0

export async function renderMermaidToSvg(definition: string): Promise<string> {
    ensureInitialized()
    renderCounter += 1
    const { svg } = await mermaid.render(`mermaid-diagram-${renderCounter}`, definition)
    return svg
}

// react-pdf's <Image> needs a raster format it can decode (PNG), not an SVG
// string — rasterize via an offscreen canvas so diagrams can be embedded in
// the exported PDF.
export async function svgToPngDataUrl(svgMarkup: string, scale = 3): Promise<string> {
    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    try {
        const image = new Image()
        const loaded = new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error('Failed to load diagram SVG for rasterization'))
        })
        image.src = url
        await loaded

        const width = image.naturalWidth || image.width || 800
        const height = image.naturalHeight || image.height || 400

        const canvas = document.createElement('canvas')
        canvas.width = width * scale
        canvas.height = height * scale
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas 2D context unavailable')

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.scale(scale, scale)
        ctx.drawImage(image, 0, 0, width, height)

        return canvas.toDataURL('image/png')
    } finally {
        URL.revokeObjectURL(url)
    }
}
