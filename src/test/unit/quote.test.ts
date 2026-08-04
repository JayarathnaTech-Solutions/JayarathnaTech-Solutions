import { describe, expect, it } from 'vitest'
import {
    calcBalance,
    calcBufferAmount,
    calcDeposit,
    calcGrandTotal,
    calcProfitAmount,
    calcQuoteTotal,
    formatCurrency,
    lineItemTotal,
} from '../../lib/quote'

describe('lineItemTotal', () => {
    it('multiplies quantity by unit price', () => {
        expect(lineItemTotal({ description: 'Design', quantity: 3, unitPrice: 25.5 })).toBe(76.5)
    })

    it('returns 0 when quantity is 0', () => {
        expect(lineItemTotal({ description: 'Free consult', quantity: 0, unitPrice: 100 })).toBe(0)
    })
})

describe('calcQuoteTotal', () => {
    it('sums quantity * unitPrice across all line items', () => {
        expect(
            calcQuoteTotal([
                { description: 'Web App Development', quantity: 1, unitPrice: 1500 },
                { description: 'UI/UX Design', quantity: 2, unitPrice: 400 },
            ]),
        ).toBe(2300)
    })

    it('returns 0 for an empty list', () => {
        expect(calcQuoteTotal([])).toBe(0)
    })

    it('handles fractional unit prices without drifting', () => {
        expect(
            calcQuoteTotal([
                { description: 'Hosting', quantity: 3, unitPrice: 9.99 },
                { description: 'Domain', quantity: 1, unitPrice: 12.5 },
            ]),
        ).toBeCloseTo(42.47, 2)
    })
})

describe('calcGrandTotal / calcBufferAmount / calcProfitAmount', () => {
    it('applies buffer and profit percent together on top of the subtotal', () => {
        expect(calcGrandTotal(1000, 10, 20)).toBe(1300)
        expect(calcBufferAmount(1000, 10)).toBe(100)
        expect(calcProfitAmount(1000, 20)).toBe(200)
    })

    it('is a no-op at 0% buffer and 0% profit', () => {
        expect(calcGrandTotal(1000, 0, 0)).toBe(1000)
        expect(calcBufferAmount(1000, 0)).toBe(0)
        expect(calcProfitAmount(1000, 0)).toBe(0)
    })

    it('subtotal + buffer + profit reconciles to the grand total', () => {
        const subtotal = 2300
        expect(subtotal + calcBufferAmount(subtotal, 10) + calcProfitAmount(subtotal, 15)).toBeCloseTo(
            calcGrandTotal(subtotal, 10, 15),
            2,
        )
    })

    it('supports profit margin alone with no buffer', () => {
        expect(calcGrandTotal(1000, 0, 25)).toBe(1250)
    })
})

describe('calcDeposit / calcBalance', () => {
    it('splits an even total 50/50', () => {
        expect(calcDeposit(2300)).toBe(1150)
        expect(calcBalance(2300)).toBe(1150)
    })

    it('always adds back up to the original total, even with odd cents', () => {
        const total = 100.01
        expect(calcDeposit(total) + calcBalance(total)).toBeCloseTo(total, 2)
    })

    it('returns 0/0 for a zero total', () => {
        expect(calcDeposit(0)).toBe(0)
        expect(calcBalance(0)).toBe(0)
    })
})

describe('formatCurrency', () => {
    it('prefixes USD with a dollar sign', () => {
        expect(formatCurrency(1500, 'USD')).toBe('$1500.00')
    })

    it('prefixes LKR with Rs.', () => {
        expect(formatCurrency(2450, 'LKR')).toBe('Rs. 2450.00')
    })

    it('always shows two decimal places', () => {
        expect(formatCurrency(10, 'USD')).toBe('$10.00')
    })
})
