import { describe, expect, it, jest } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDoc, getDocs, updateDoc, type DocumentData, type QuerySnapshot } from 'firebase/firestore'
import { AdminQuotes } from '../../admin/pages/Quotes'
import { exportQuotePdf } from '../../lib/quotePdf'

jest.mock('firebase/firestore', () => ({
    ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
    getDocs: jest.fn(async () => ({ docs: [] })),
    addDoc: jest.fn(async () => ({ id: 'new-quote' })),
    updateDoc: jest.fn(async () => undefined),
}))

// The PDF builder is the boundary: react-pdf can't render in jsdom, and what
// matters here is which quote the form hands it.
jest.mock('../../lib/quotePdf', () => ({
    exportQuotePdf: jest.fn(async () => undefined),
}))

const mockedGetDocs = jest.mocked(getDocs)
const mockedAddDoc = jest.mocked(addDoc)
const mockedUpdateDoc = jest.mocked(updateDoc)
const mockedExportQuotePdf = jest.mocked(exportQuotePdf)

// The quotes list is one getDocs call; each entry is the raw Firestore data
// for one quote, so a test can omit a field the way an older document would.
const listQuotes = (...quotes: DocumentData[]) => {
    const docs = quotes.map((data, index) => ({ id: `quote-${index}`, data: () => data }))
    mockedGetDocs.mockResolvedValue({ docs } as unknown as QuerySnapshot<DocumentData>)
}

const storedQuote = (overrides: DocumentData = {}): DocumentData => ({
    clientName: 'FinCorp',
    clientEmail: 'finance@fincorp.com',
    lineItems: [{ description: 'Web App', quantity: 1, unitPrice: 1000 }],
    status: 'draft',
    currency: 'USD',
    createdAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
})

const openStoredQuote = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByText('FinCorp'))
}

describe('AdminQuotes', () => {
    it('does not offer AI BRD & SRS generation on an accepted quote', async () => {
        listQuotes(storedQuote({ status: 'accepted', customerRequirements: 'A booking app' }))
        const user = userEvent.setup()
        render(<AdminQuotes />)

        await openStoredQuote(user)

        expect(screen.queryByRole('button', { name: /generate brd/i })).not.toBeInTheDocument()
        expect(screen.queryByText(/project documents/i)).not.toBeInTheDocument()
    })

    it('splits the payment 50/50 by default on a new quote', async () => {
        const user = userEvent.setup()
        render(<AdminQuotes />)

        await user.click(screen.getByRole('button', { name: /new quote/i }))

        expect(screen.getByRole('switch', { name: /split payment 50\/50/i })).toBeChecked()
        expect(screen.getByText(/deposit \(50%\)/i)).toBeInTheDocument()
        expect(screen.getByText(/balance \(50%\)/i)).toBeInTheDocument()
    })

    it('shows only the grand total once the split is turned off', async () => {
        const user = userEvent.setup()
        render(<AdminQuotes />)
        await user.click(screen.getByRole('button', { name: /new quote/i }))

        await user.click(screen.getByRole('switch', { name: /split payment 50\/50/i }))

        expect(screen.getByRole('switch', { name: /split payment 50\/50/i })).not.toBeChecked()
        expect(screen.queryByText(/deposit \(50%\)/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/balance \(50%\)/i)).not.toBeInTheDocument()
        expect(screen.getByText('Grand Total')).toBeInTheDocument()
        expect(screen.getByText(/single payment/i)).toBeInTheDocument()
    })

    it('saves a new quote with the full-payment decision', async () => {
        const user = userEvent.setup()
        render(<AdminQuotes />)
        await user.click(screen.getByRole('button', { name: /new quote/i }))
        await user.type(screen.getByLabelText(/client name/i), 'FinCorp')
        await user.click(screen.getByRole('switch', { name: /split payment 50\/50/i }))

        await user.click(screen.getByRole('button', { name: /save quote/i }))

        expect(mockedAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ splitPayment: false }))
    })

    it('reopens a full-payment quote with the split turned off', async () => {
        listQuotes(storedQuote({ splitPayment: false }))
        const user = userEvent.setup()
        render(<AdminQuotes />)

        await openStoredQuote(user)

        expect(screen.getByRole('switch', { name: /split payment 50\/50/i })).not.toBeChecked()
        expect(screen.queryByText(/deposit \(50%\)/i)).not.toBeInTheDocument()
    })

    it('treats a quote saved before the split option existed as split', async () => {
        listQuotes(storedQuote())
        const user = userEvent.setup()
        render(<AdminQuotes />)

        await openStoredQuote(user)

        expect(screen.getByRole('switch', { name: /split payment 50\/50/i })).toBeChecked()
    })

    it('saves the split decision when editing an existing quote', async () => {
        listQuotes(storedQuote())
        const user = userEvent.setup()
        render(<AdminQuotes />)
        await openStoredQuote(user)
        await user.click(screen.getByRole('switch', { name: /split payment 50\/50/i }))

        await user.click(screen.getByRole('button', { name: /save quote/i }))

        expect(mockedUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ splitPayment: false }))
    })

    it('exports the PDF with the full-payment decision', async () => {
        const user = userEvent.setup()
        render(<AdminQuotes />)
        await user.click(screen.getByRole('button', { name: /new quote/i }))
        await user.click(screen.getByRole('switch', { name: /split payment 50\/50/i }))

        await user.click(screen.getByRole('button', { name: /export pdf/i }))

        await waitFor(() => expect(mockedExportQuotePdf).toHaveBeenCalledWith(expect.objectContaining({ splitPayment: false })))
    })
})
