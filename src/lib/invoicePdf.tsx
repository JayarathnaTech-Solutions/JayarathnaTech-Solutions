    // This module builds a PDF document (not a React UI component) and pairs a
// react-pdf template with an export function, so it doesn't fit the
// component-only-exports shape Fast Refresh expects.
/* eslint-disable react-refresh/only-export-components */
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { formatCurrency } from './quote'
import { siteContact } from './siteInfo'
import type { Engagement, Invoice } from '../types'

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#0f172a' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
    brand: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
    invoiceLabel: { fontSize: 20, fontFamily: 'Helvetica-Bold' },
    section: { marginBottom: 20 },
    label: { fontSize: 9, color: '#64748b', marginBottom: 2 },
    value: { fontSize: 12, marginBottom: 8 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1 solid #e2e8f0' },
    summaryLabel: { fontSize: 10, color: '#64748b' },
    summaryValue: { fontSize: 10, color: '#0f172a' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1 solid #e2e8f0' },
    totalLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
    totalValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#2563eb' },
    footer: { position: 'absolute', bottom: 40, left: 40, right: 40, fontSize: 9, color: '#94a3b8', textAlign: 'center' },
})

function InvoiceDocument({ invoice, engagement, customerName }: { invoice: Invoice; engagement: Engagement; customerName: string }) {
    const feeAmount = invoice.feeLineItem?.amount ?? 0
    const total = invoice.amount + feeAmount

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>JayarathnaTech Solutions</Text>
                    </View>
                    <Text style={styles.invoiceLabel}>INVOICE</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>CLIENT</Text>
                    <Text style={styles.value}>{customerName}</Text>
                    <Text style={styles.label}>EMAIL</Text>
                    <Text style={styles.value}>{engagement.customerEmail}</Text>
                    <Text style={styles.label}>PROJECT</Text>
                    <Text style={styles.value}>{engagement.title}</Text>
                    <Text style={styles.label}>DATE</Text>
                    <Text style={styles.value}>
                        {new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                        {invoice.type === 'advance' ? 'Advance Payment (50%)' : 'Final Payment (50%)'}
                    </Text>
                    <Text style={styles.summaryValue}>{formatCurrency(invoice.amount, invoice.currency)}</Text>
                </View>
                {invoice.feeLineItem && (
                    <View style={{ ...styles.summaryRow, borderTop: 'none', marginTop: 4, paddingTop: 0 }}>
                        <Text style={styles.summaryLabel}>{invoice.feeLineItem.label}</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(invoice.feeLineItem.amount, invoice.currency)}</Text>
                    </View>
                )}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Due</Text>
                    <Text style={styles.totalValue}>{formatCurrency(total, invoice.currency)}</Text>
                </View>

                <View style={{ ...styles.section, marginTop: 20 }}>
                    <Text style={styles.label}>PAYMENT METHOD</Text>
                    <Text style={styles.value}>{invoice.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'PayPal'}</Text>
                    <Text style={styles.label}>STATUS</Text>
                    <Text style={styles.value}>{invoice.status === 'verified' ? 'Paid' : 'Pending'}</Text>
                </View>

                <Text style={styles.footer}>JayarathnaTech Solutions — {siteContact.email}</Text>
            </Page>
        </Document>
    )
}

export async function exportInvoicePdf(invoice: Invoice, engagement: Engagement, customerName: string) {
    const blob = await pdf(<InvoiceDocument invoice={invoice} engagement={engagement} customerName={customerName} />).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${engagement.title.trim().replace(/\s+/g, '-').toLowerCase() || 'untitled'}-${invoice.type}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
