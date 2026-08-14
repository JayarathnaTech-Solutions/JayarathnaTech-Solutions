// This module builds a PDF document (not a React UI component) and pairs a
// react-pdf template with an export function, so it doesn't fit the
// component-only-exports shape Fast Refresh expects.
/* eslint-disable react-refresh/only-export-components */
import { Document, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { signatureImageUrl, siteContact, siteLetterhead } from './siteInfo'
import logo from '../assets/logo.png'

const styles = StyleSheet.create({
    // Extra bottom padding reserves room for the fixed footer so flowing
    // content never lands underneath it when a section spills onto a new
    // page — without this gap the last line of body text and the footer
    // text render at the same y-position and visually overlap.
    page: { paddingTop: 40, paddingHorizontal: 40, paddingBottom: 68, fontSize: 11, fontFamily: 'Helvetica', color: '#0f172a' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '1 solid #e2e8f0', paddingBottom: 16 },
    logo: { width: 130, height: 34 },
    letterhead: { alignItems: 'flex-end' },
    letterheadBrand: { alignItems: 'flex-end', marginBottom: 10 },
    brand: { fontSize: 15, fontFamily: 'Helvetica-Bold' },
    letterheadLine: { fontSize: 8, color: '#64748b', textAlign: 'right', marginTop: 2 },
    letterheadContact: { fontSize: 8, color: '#2563eb', textAlign: 'right', marginTop: 3 },
    docTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'center', letterSpacing: 1, marginBottom: 4 },
    docSubtitle: { fontSize: 10, color: '#64748b', textAlign: 'center', marginBottom: 20 },
    infoBox: { flexDirection: 'row', border: '1 solid #e2e8f0', borderRadius: 6, marginBottom: 20 },
    infoCell: { flex: 1, paddingVertical: 10, paddingHorizontal: 14, borderLeft: '1 solid #e2e8f0' },
    infoCellFirst: { flex: 1, paddingVertical: 10, paddingHorizontal: 14 },
    infoLabel: { fontSize: 8, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    infoValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
    salutation: { fontSize: 11, marginBottom: 14 },
    sectionBlock: { marginBottom: 14 },
    heading: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 4 },
    body: { fontSize: 10, lineHeight: 1.5, color: '#334155' },
    footer: { position: 'absolute', bottom: 28, left: 40, right: 40, fontSize: 9, color: '#94a3b8', textAlign: 'center' },
    signatureSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
    signatureColumn: { width: '45%', alignItems: 'center' },
    signatureHeading: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
    signatureImage: { width: 130, height: 40, marginTop: 2, marginBottom: -6, objectFit: 'contain' },
    signatureImagePlaceholder: { height: 40, marginTop: 2, marginBottom: -6 },
    signatureLine: { width: '100%', borderBottom: '1 dotted #0f172a', marginTop: 4 },
    signatureLabel: { fontSize: 9, color: '#334155', textAlign: 'center', marginTop: 6 },
    signatureLineSmall: { width: '60%', borderBottom: '1 dotted #0f172a', marginTop: 16 },
    signatureSmallLabel: { fontSize: 8, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
    signatureDateValue: { fontSize: 9, color: '#334155', textAlign: 'center', marginTop: 12 },
})

export interface AgreementInput {
    clientName: string
    clientAddress: string
    clientNic?: string
    effectiveDate: string
}

// Renders the entered value, or a literal bracketed placeholder (matching
// the client's original agreement template) when the field was left blank —
// so an incomplete form still produces a printable, hand-fillable document.
function field(value: string | undefined, placeholder: string): string {
    const trimmed = value?.trim()
    return trimmed ? trimmed : `[${placeholder}]`
}

function formatEffectiveDate(effectiveDate: string): string {
    if (!effectiveDate) return '[Effective Date]'
    const date = new Date(`${effectiveDate}T00:00:00`)
    if (Number.isNaN(date.getTime())) return '[Effective Date]'
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// The developer's signature is a pre-set image, so its date is stamped as
// the day the PDF is generated rather than left blank for a wet signature.
function formatExportDate(): string {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function buildSections(input: AgreementInput): { heading: string; body: string }[] {
    const clientName = field(input.clientName, 'Client Company / Client Name')
    const clientAddress = field(input.clientAddress, 'Client Address')

    return [
        {
            heading: 'PARTIES',
            body: `This Agreement is made and entered into as of the date of final signature below (the "Effective Date"), by and between:\n\nDeveloper / Service Provider: ${siteLetterhead.registeredName} (hereinafter referred to as "JayarathnaTech Solutions"), and\n\nClient: ${clientName}, located at ${clientAddress} (hereinafter referred to as the "Client").`,
        },
        {
            heading: 'SCOPE OF WORK & SRS',
            body: 'The specific deliverables, technical features, and project requirements shall be strictly governed by the Software Requirement Specification (SRS) document agreed upon and signed by both parties prior to the commencement of development.\n\nThe approved SRS document shall act as the ultimate guidance and source of truth in case of any conflict regarding deliverables.',
        },
        {
            heading: 'DEVELOPMENT & MILESTONES',
            body: 'JayarathnaTech Solutions shall complete the software development according to the milestones agreed upon with the Client.\n\nThe Client shall provide a User Acceptance Test (UAT) based on the SRS. The Client is granted 15 days after the delivery of each milestone or deliverable to review, test, and request any necessary adjustments conforming to the SRS.\n\nIf the Client causes a delay in providing necessary information, credentials, or resources, the delivery date shall be extended accordingly by the number of delayed days, and the Client will be notified in writing.',
        },
        {
            heading: 'FINANCIAL TERMS, PAYMENT STRUCTURE, AND CURRENCY',
            body: 'Payments shall be processed as per the project proposal (in USD or LKR). If invoiced in Sri Lankan Rupees (LKR) for a project priced in United States Dollars (USD), the conversion rate shall be calculated based on the prevailing official exchange rate on the exact date of payment.\n\nPayment Schedule:\nDeposit — 50% of the total project cost is due upon the signing of this Agreement, before project execution begins. This deposit is strictly non-refundable once project execution has commenced.\nBalance — the remaining 50% of the total project cost is due upon completion of the project, prior to final delivery and system sign-off.\n\nOvertime & Extra Expenses: If the Client requests expedited work requiring overtime, an overtime invoice will be issued. Any expenses outside the agreed project budget shall be borne entirely by the Client.',
        },
        {
            heading: 'INTELLECTUAL PROPERTY & OWNERSHIP',
            body: 'Full Settlement Requirement: Custom code, specific databases, and application architectures built exclusively for the Client will transfer in ownership only upon full settlement of all project fees. Until the final payment is cleared, all intellectual property remains with JayarathnaTech Solutions.\n\nProprietary Assets: JayarathnaTech Solutions permanently retains ownership of all pre-existing templates, core utility libraries, generalized design frameworks, and proprietary tools.\n\nDeveloper Portfolio: JayarathnaTech Solutions reserves the right to use the completed project’s screenshots, descriptions, and links for its official website portfolio and marketing purposes after successful project delivery and full payment.',
        },
        {
            heading: 'CONFIDENTIALITY',
            body: 'Each party agrees to keep confidential all non-public business, technical, and financial information disclosed by the other party in connection with this Agreement, and to use such information solely for the purpose of fulfilling its obligations hereunder.\n\nThis obligation shall not apply to information that is publicly available, independently developed, or required to be disclosed by law. The confidentiality obligations under this clause shall survive termination of this Agreement for a period of 2 years.',
        },
        {
            heading: 'BRANDING, CREDITS, AND WHITE-LABEL MODIFICATIONS',
            body: 'Developer Credit: Applications or websites developed by JayarathnaTech Solutions may include a subtle credit or logo (e.g., "Developed by JayarathnaTech Solutions").\n\nBranding Removal Option: If the Client wishes to remove, replace, or white-label the developer logo/credit from the product, the Client may do so by paying a one-time Branding Removal Fee of $20 USD (converted to LKR at the prevailing exchange rate on the payment date).',
        },
        {
            heading: 'TRAINING, SUPPORT, AND MAINTENANCE',
            body: 'Initial Training: JayarathnaTech Solutions shall provide initial training necessary for the Client to operate the software.\n\nWarranty Support: JayarathnaTech Solutions provides a free bug-fix and maintenance period conforming to the SRS for 6 months post-delivery. Any added features or functional modifications requested after launch will be billed separately.',
        },
        {
            heading: 'LIMITATION OF LIABILITY',
            body: 'JayarathnaTech Solutions builds systems using industry best practices. However, software is delivered "as is." JayarathnaTech Solutions shall not be liable for any indirect, incidental, or consequential damages, unauthorized data tampering, or server downtimes outside its direct control.',
        },
        {
            heading: 'FORCE MAJEURE',
            body: 'Neither party shall be liable for any failure or delay in performance under this Agreement resulting from causes beyond its reasonable control, including but not limited to acts of God, natural disasters, war, civil unrest, government action, internet or power outages, or pandemics.\n\nThe affected party shall notify the other in writing as soon as reasonably possible, and the time for performance shall be extended by a period equal to the duration of the force majeure event.',
        },
        {
            heading: 'TERMINATION',
            body: 'Either party may terminate this Agreement by providing 15 days written notice in the event of a material breach that remains unresolved. If the Client terminates the Agreement without a valid contractual breach, the Client shall compensate JayarathnaTech Solutions for the full project amount prior to executing the termination.',
        },
        {
            heading: 'DISPUTE RESOLUTION',
            body: 'In the event of any dispute, controversy, or claim arising out of or relating to this Agreement, both parties shall first attempt to resolve the matter amicably through good-faith negotiation.\n\nIf the dispute cannot be resolved within 30 days of written notice, either party may refer the matter to mediation or arbitration in Sri Lanka before pursuing any other legal remedy.',
        },
        {
            heading: 'GOVERNING LAW',
            body: 'This Agreement shall be governed by and construed in accordance with the laws of Sri Lanka.',
        },
        {
            heading: 'GENERAL PROVISIONS',
            body: 'Notices: Any notice required under this Agreement shall be delivered in writing via email or courier to the addresses/contacts specified by each party, and shall be deemed received upon confirmed delivery.\n\nEntire Agreement: This Agreement, together with the approved SRS document, constitutes the entire understanding between the parties and supersedes all prior discussions, proposals, or agreements relating to its subject matter.\n\nSeverability: If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.',
        },
    ]
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
                <Text style={styles.signatureDateValue}>Date: {formatExportDate()}</Text>
            </View>
            <View style={styles.signatureColumn}>
                <Text style={styles.signatureHeading}>CLIENT</Text>
                <View style={styles.signatureImagePlaceholder} />
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Name &amp; Authorized Signatory</Text>
                <View style={styles.signatureLineSmall} />
                <Text style={styles.signatureSmallLabel}>Date</Text>
            </View>
        </View>
    )
}

function AgreementDocument({ input }: { input: AgreementInput }) {
    const sections = buildSections(input)
    const clientName = field(input.clientName, 'Client Company / Client Name')

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <LetterheadHeader />

                <Text style={styles.docTitle}>SOFTWARE DEVELOPMENT SERVICES AGREEMENT</Text>
                <Text style={styles.docSubtitle}>Service Agreement</Text>

                <View style={styles.infoBox}>
                    <View style={styles.infoCellFirst}>
                        <Text style={styles.infoLabel}>Client</Text>
                        <Text style={styles.infoValue}>{clientName}</Text>
                    </View>
                    <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Address</Text>
                        <Text style={styles.infoValue}>{field(input.clientAddress, 'Client Address')}</Text>
                    </View>
                    {input.clientNic?.trim() && (
                        <View style={styles.infoCell}>
                            <Text style={styles.infoLabel}>NIC</Text>
                            <Text style={styles.infoValue}>{input.clientNic.trim()}</Text>
                        </View>
                    )}
                    <View style={styles.infoCell}>
                        <Text style={styles.infoLabel}>Effective Date</Text>
                        <Text style={styles.infoValue}>{formatEffectiveDate(input.effectiveDate)}</Text>
                    </View>
                </View>

                <Text style={styles.salutation}>Dear {clientName},</Text>

                {sections.map((section, index) => (
                    <View key={index} style={styles.sectionBlock} wrap={false}>
                        <Text style={styles.heading}>{section.heading}</Text>
                        <Text style={styles.body}>{section.body}</Text>
                    </View>
                ))}

                <View wrap={false}>
                    <Text style={styles.heading}>SIGNATURES</Text>
                    <SignatureBlock />
                </View>

                <Footer />
            </Page>
        </Document>
    )
}

export async function exportAgreementPdf(input: AgreementInput) {
    const blob = await pdf(<AgreementDocument input={input} />).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `agreement-${input.clientName.trim().replace(/\s+/g, '-').toLowerCase() || 'untitled'}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
