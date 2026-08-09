// This module builds a PDF document (not a React UI component) and pairs a
// react-pdf template with an export function, so it doesn't fit the
// component-only-exports shape Fast Refresh expects.
/* eslint-disable react-refresh/only-export-components */
import { Document, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { calcBalance, calcDeposit, calcQuoteTotal, formatCurrency, lineItemTotal } from './quote'
import { siteContact, siteLetterhead } from './siteInfo'
import logo from '../assets/logo.png'
import signature from '../assets/signature.png'
import type { Quote, QuoteLineItem } from '../types'

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#0f172a' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30, borderBottom: '1 solid #e2e8f0', paddingBottom: 16 },
    logo: { width: 130, height: 34 },
    brand: { fontSize: 15, fontFamily: 'Helvetica-Bold' },
    letterhead: { alignItems: 'flex-end' },
    letterheadBrand: { alignItems: 'flex-end', marginBottom: 10 },
    letterheadLine: { fontSize: 8, color: '#64748b', textAlign: 'right', marginTop: 2 },
    letterheadContact: { fontSize: 8, color: '#2563eb', textAlign: 'right', marginTop: 3 },
    quoteTitle: { fontSize: 24, fontFamily: 'Helvetica-Bold', textAlign: 'center', letterSpacing: 2, marginBottom: 24 },
    section: { marginBottom: 20 },
    label: { fontSize: 9, color: '#64748b', marginBottom: 2 },
    value: { fontSize: 12, marginBottom: 8 },
    table: { marginTop: 10, borderTop: '1 solid #e2e8f0' },
    tableRow: { flexDirection: 'row', borderBottom: '1 solid #e2e8f0', paddingVertical: 8 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 8, fontSize: 9, color: '#64748b' },
    colDescription: { flex: 3 },
    colQty: { flex: 1, textAlign: 'right' },
    colPrice: { flex: 1, textAlign: 'right' },
    colTotal: { flex: 1, textAlign: 'right' },
    summaryRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, gap: 12 },
    summaryLabel: { fontSize: 10, color: '#64748b' },
    summaryValue: { fontSize: 10, color: '#0f172a', width: 70, textAlign: 'right' },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, gap: 12, borderTop: '1 solid #e2e8f0', paddingTop: 10 },
    totalLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
    totalValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#2563eb', width: 70, textAlign: 'right' },
    requirementsText: { fontSize: 10, lineHeight: 1.5, color: '#334155' },
    requirementsNote: { fontSize: 8, fontFamily: 'Helvetica-Oblique', color: '#94a3b8', marginTop: 6 },
    footer: { position: 'absolute', bottom: 40, left: 40, right: 40, fontSize: 9, color: '#94a3b8', textAlign: 'center' },
    signatureSection: { marginTop: 36, alignItems: 'flex-end' },
    signatureColumn: { width: '45%', alignItems: 'center' },
    signatureHeading: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
    signatureImage: { width: 130, height: 40, marginTop: 2, marginBottom: -6, objectFit: 'contain' },
    signatureLine: { width: '100%', borderBottom: '1 dotted #0f172a', marginTop: 4 },
    signatureLabel: { fontSize: 9, color: '#334155', textAlign: 'center', marginTop: 6 },
})

function SignatureBlock() {
    return (
        <View style={styles.signatureSection}>
            <View style={styles.signatureColumn}>
                <Text style={styles.signatureHeading}>JAYARATHNATECH SOLUTIONS{'\n'}(PVT) LTD</Text>
                <Image src={signature} style={styles.signatureImage} />
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Managing Director</Text>
            </View>
        </View>
    )
}

// Buffer/contingency and profit margin % are never shown as their own lines
// to the client — they're folded into each line item's displayed price so the
// printed rows sum cleanly to the Grand Total, the same way a normal
// marked-up price list would.
function applyMarkup(lineItems: QuoteLineItem[], bufferPercent: number, profitPercent: number): QuoteLineItem[] {
    const multiplier = 1 + (bufferPercent + profitPercent) / 100
    return lineItems.map((item) => ({ ...item, unitPrice: item.unitPrice * multiplier }))
}

function QuoteDocument({ quote }: { quote: Quote }) {
    const lineItems = applyMarkup(quote.lineItems, quote.bufferPercent, quote.profitPercent)
    const total = calcQuoteTotal(lineItems)
    const deposit = calcDeposit(total)
    const balance = calcBalance(total)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
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

                <Text style={styles.quoteTitle}>QUOTE</Text>

                <View style={styles.section}>
                    <Text style={styles.label}>CLIENT</Text>
                    <Text style={styles.value}>{quote.clientName}</Text>
                    <Text style={styles.label}>EMAIL</Text>
                    <Text style={styles.value}>{quote.clientEmail}</Text>
                    <Text style={styles.label}>DATE</Text>
                    <Text style={styles.value}>
                        {new Date(quote.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                </View>

                {quote.customerRequirements && (
                    <View style={styles.section}>
                        <Text style={styles.label}>PROJECT REQUIREMENTS</Text>
                        <Text style={styles.requirementsText}>{quote.customerRequirements}</Text>
                        <Text style={styles.requirementsNote}>
                            Note: Any requirements beyond those listed above may increase the cost and will be quoted separately.
                        </Text>
                    </View>
                )}

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colDescription}>DESCRIPTION</Text>
                        <Text style={styles.colQty}>QTY</Text>
                        <Text style={styles.colPrice}>UNIT PRICE</Text>
                        <Text style={styles.colTotal}>TOTAL</Text>
                    </View>
                    {lineItems.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.colDescription}>{item.description}</Text>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colPrice}>{formatCurrency(item.unitPrice, quote.currency)}</Text>
                            <Text style={styles.colTotal}>{formatCurrency(lineItemTotal(item), quote.currency)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Deposit (50%) — Due at Project Start</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(deposit, quote.currency)}</Text>
                </View>
                <View style={{ ...styles.summaryRow, marginTop: 4 }}>
                    <Text style={styles.summaryLabel}>Balance (50%) — Due on Completion</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(balance, quote.currency)}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Grand Total  </Text>
                    <Text style={styles.totalValue}>{formatCurrency(total, quote.currency)}</Text>
                </View>

                <SignatureBlock />

                <Text style={styles.footer}>JayarathnaTech Solutions — {siteContact.email}</Text>
            </Page>
        </Document>
    )
}

export async function exportQuotePdf(quote: Quote) {
    const blob = await pdf(<QuoteDocument quote={quote} />).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `quote-${quote.clientName.trim().replace(/\s+/g, '-').toLowerCase() || 'untitled'}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
