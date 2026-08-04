import type { QuoteCurrency, QuoteLineItem } from '../types'

export function lineItemTotal(item: QuoteLineItem): number {
    return item.quantity * item.unitPrice
}

export function calcQuoteTotal(lineItems: QuoteLineItem[]): number {
    return lineItems.reduce((sum, item) => sum + lineItemTotal(item), 0)
}

// Internal buffer/contingency and profit margin on top of the line-item
// subtotal. Both are rolled silently into the Grand Total on the client-facing
// PDF — never broken out as their own lines there, only visible in the admin
// quote form.
export function calcGrandTotal(subtotal: number, bufferPercent: number, profitPercent: number): number {
    return Math.round(subtotal * (1 + (bufferPercent + profitPercent) / 100) * 100) / 100
}

export function calcBufferAmount(subtotal: number, bufferPercent: number): number {
    return Math.round(subtotal * (bufferPercent / 100) * 100) / 100
}

export function calcProfitAmount(subtotal: number, profitPercent: number): number {
    return Math.round(subtotal * (profitPercent / 100) * 100) / 100
}

// Standard payment terms: 50% deposit at project start, balance on completion.
// The balance is derived as total-minus-rounded-deposit (rather than rounded
// independently) so the two halves always add back up to the total exactly.
export function calcDeposit(total: number): number {
    return Math.round((total / 2) * 100) / 100
}

export function calcBalance(total: number): number {
    return Math.round((total - calcDeposit(total)) * 100) / 100
}

const currencyPrefixes: Record<QuoteCurrency, string> = {
    USD: '$',
    LKR: 'Rs. ',
}

export function formatCurrency(amount: number, currency: QuoteCurrency): string {
    return `${currencyPrefixes[currency]}${amount.toFixed(2)}`
}
