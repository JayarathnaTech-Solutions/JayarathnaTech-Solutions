import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getDocs, type DocumentData, type QuerySnapshot } from 'firebase/firestore'
import { AdminQuotes } from '../../admin/pages/Quotes'

jest.mock('firebase/firestore', () => ({
    ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
    getDocs: jest.fn(async () => ({ docs: [] })),
}))

const mockedGetDocs = jest.mocked(getDocs)

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

})
