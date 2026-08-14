// This module builds a PDF document (not a React UI component) and pairs a
// react-pdf template with export functions, so it doesn't fit the
// component-only-exports shape Fast Refresh expects.
/* eslint-disable react-refresh/only-export-components */
import { Document, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { signatureImageUrl, siteContact, siteLetterhead } from './siteInfo'
import logo from '../assets/logo.png'
import type { Quote } from '../types'

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#0f172a' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30, borderBottom: '1 solid #e2e8f0', paddingBottom: 16 },
    logo: { width: 130, height: 34 },
    brand: { fontSize: 15, fontFamily: 'Helvetica-Bold' },
    letterhead: { alignItems: 'flex-end' },
    letterheadBrand: { alignItems: 'flex-end', marginBottom: 10 },
    letterheadLine: { fontSize: 8, color: '#64748b', textAlign: 'right', marginTop: 2 },
    letterheadContact: { fontSize: 8, color: '#2563eb', textAlign: 'right', marginTop: 3 },
    docTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'center', letterSpacing: 1, marginBottom: 4 },
    docSubtitle: { fontSize: 10, color: '#64748b', textAlign: 'center', marginBottom: 24 },
    section: { marginBottom: 18 },
    label: { fontSize: 9, color: '#64748b', marginBottom: 2 },
    value: { fontSize: 12, marginBottom: 8 },
    sectionBlock: { marginBottom: 14 },
    heading: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 4 },
    body: { fontSize: 10, lineHeight: 1.5, color: '#334155' },
    diagramTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 16 },
    // No flex-grow: the box should only be as tall as the image itself so the
    // signature block (rendered on the last diagram page) sits right below it
    // instead of being pushed off the page by an empty, space-filling box.
    diagramBody: { alignItems: 'center', marginTop: 8 },
    // maxHeight keeps the image within one page's usable height — without it,
    // a tall (portrait) diagram scaled to width: '100%' can exceed the page
    // and react-pdf pushes the overflow onto a near-empty extra page.
    diagramImage: { width: '100%', maxHeight: 580, objectFit: 'contain' },
    footer: { position: 'absolute', bottom: 40, left: 40, right: 40, fontSize: 9, color: '#94a3b8', textAlign: 'center' },
    signatureSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 36 },
    signatureColumn: { width: '45%', alignItems: 'center' },
    signatureHeading: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
    signatureImage: { width: 130, height: 40, marginTop: 2, marginBottom: -6, objectFit: 'contain' },
    signatureImagePlaceholder: { height: 40, marginTop: 2, marginBottom: -6 },
    signatureLine: { width: '100%', borderBottom: '1 dotted #0f172a', marginTop: 4 },
    signatureLabel: { fontSize: 9, color: '#334155', textAlign: 'center', marginTop: 6 },
})

export interface SrsDiagramImages {
    architecture?: string
    workflow?: string
    dfd?: string
}

function isHeadingLine(line: string): boolean {
    const trimmed = line.trim()
    return trimmed.length > 0 && trimmed === trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase()
}

function parseSections(content: string): { heading?: string; body: string }[] {
    return content
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block) => {
            const lines = block.split('\n')
            if (isHeadingLine(lines[0])) {
                return { heading: lines[0].trim(), body: lines.slice(1).join('\n').trim() }
            }
            return { body: block }
        })
}

function LetterheadHeader() {
    return (
        <View style={styles.header} fixed>
            <Image src={logo} style={styles.logo} />
            <View style={styles.letterhead}>
                <View style={styles.letterheadBrand}>
                    <Text style={styles.brand}>JayarathnaTech Solutions</Text>
                </View>
                <Text style={styles.letterheadLine}>{siteLetterhead.address}</Text>
                <Text style={styles.letterheadLine}>Tel: {siteLetterhead.phone}  |  {siteLetterhead.phoneAlt}</Text>
                <Text style={styles.letterheadContact}>{siteLetterhead.website}   •   {siteLetterhead.email}</Text>
            </View>
        </View>
    )
}

function Footer() {
    return <Text style={styles.footer} fixed>JayarathnaTech Solutions — {siteContact.email}</Text>
}

function SignatureBlock() {
    return (
        <View style={styles.signatureSection}>
            <View style={styles.signatureColumn}>
                <Text style={styles.signatureHeading}>JAYARATHNATECH SOLUTIONS{'\n'}(PVT) LTD</Text>
                <Image src={signatureImageUrl} style={styles.signatureImage} />
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Managing Director</Text>
            </View>
            <View style={styles.signatureColumn}>
                <Text style={styles.signatureHeading}>CLIENT</Text>
                <View style={styles.signatureImagePlaceholder} />
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Authorized Signatory</Text>
            </View>
        </View>
    )
}

const DIAGRAM_TITLES: Record<keyof SrsDiagramImages, string> = {
    architecture: 'HIGH-LEVEL SYSTEM ARCHITECTURE',
    workflow: 'PROCESS / WORKFLOW FLOW CHART',
    dfd: 'DATA FLOW DIAGRAM (DFD)',
}

function RequirementsDocument({
    quote,
    title,
    subtitle,
    content,
    diagramImages,
}: {
    quote: Quote
    title: string
    subtitle: string
    content: string
    diagramImages?: SrsDiagramImages
}) {
    const sections = parseSections(content)
    const diagramEntries = diagramImages
        ? (Object.entries(diagramImages).filter(([, src]) => Boolean(src)) as [keyof SrsDiagramImages, string][])
        : []

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <LetterheadHeader />

                <Text style={styles.docTitle}>{title}</Text>
                <Text style={styles.docSubtitle}>{subtitle}</Text>

                <View style={styles.section}>
                    <Text style={styles.label}>CLIENT</Text>
                    <Text style={styles.value}>{quote.clientName}</Text>
                    <Text style={styles.label}>DATE</Text>
                    <Text style={styles.value}>
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                </View>

                {sections.map((section, index) => (
                    <View key={index} style={styles.sectionBlock}>
                        {section.heading && <Text style={styles.heading}>{section.heading}</Text>}
                        <Text style={styles.body}>{section.body}</Text>
                    </View>
                ))}

                {diagramEntries.length === 0 && <SignatureBlock />}

                <Footer />
            </Page>

            {diagramEntries.map(([key, src], index) => (
                <Page key={key} size="A4" style={styles.page}>
                    <LetterheadHeader />
                    <Text style={styles.diagramTitle}>{DIAGRAM_TITLES[key]}</Text>
                    <View style={styles.diagramBody}>
                        <Image src={src} style={styles.diagramImage} />
                    </View>

                    {index === diagramEntries.length - 1 && <SignatureBlock />}

                    <Footer />
                </Page>
            ))}
        </Document>
    )
}

function downloadPdf(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export async function exportBrdPdf(quote: Quote) {
    if (!quote.brdContent) return
    const blob = await pdf(
        <RequirementsDocument quote={quote} title="BUSINESS REQUIREMENTS DOCUMENT" subtitle="BRD" content={quote.brdContent} />,
    ).toBlob()
    downloadPdf(blob, `brd-${quote.clientName.trim().replace(/\s+/g, '-').toLowerCase() || 'untitled'}.pdf`)
}

export async function exportSrsPdf(quote: Quote, diagramImages?: SrsDiagramImages) {
    if (!quote.srsContent) return
    const blob = await pdf(
        <RequirementsDocument
            quote={quote}
            title="SOFTWARE REQUIREMENTS SPECIFICATION"
            subtitle="SRS"
            content={quote.srsContent}
            diagramImages={diagramImages}
        />,
    ).toBlob()
    downloadPdf(blob, `srs-${quote.clientName.trim().replace(/\s+/g, '-').toLowerCase() || 'untitled'}.pdf`)
}
