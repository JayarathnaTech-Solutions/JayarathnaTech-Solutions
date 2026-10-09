import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDoc, getDoc, getDocs, updateDoc, type DocumentData, type QuerySnapshot } from 'firebase/firestore'
import { AdminQuotes } from '../../admin/pages/Quotes'
import { exportQuotePdf } from '../../lib/quotePdf'
import { buildBankDetails } from '../support/factories'
import { bankDetailsSnapshot } from '../support/firestoreFakes'

jest.mock('firebase/firestore', () => ({
    ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
    getDoc: jest.fn(),
    getDocs: jest.fn(async () => ({ docs: [] })),
    addDoc: jest.fn(async () => ({ id: 'new-quote' })),
    updateDoc: jest.fn(async () => undefined),
}))

// The PDF builder is the boundary: react-pdf can't render in jsdom, and what
// matters here is which quote the form hands it.
jest.mock('../../lib/quotePdf', () => ({
    exportQuotePdf: jest.fn(async () => undefined),
}))

const mockedGetDoc = jest.mocked(getDoc)
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

// The bank account set up in Settings (settings/bankDetails, read with getDoc).
const companyBankAccount = buildBankDetails({ bankName: 'Sampath Bank', accountNumber: '0011223344' })
const setUpBankAccount = (bankDetails = companyBankAccount) => mockedGetDoc.mockResolvedValue(bankDetailsSnapshot(bankDetails))

const bankDetailsTick = () => screen.getByRole('checkbox', { name: /include bank transfer details in pdf/i })

describe('AdminQuotes', () => {
    beforeEach(() => {
        mockedGetDoc.mockResolvedValue(bankDetailsSnapshot(null))
    })

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

        await waitFor(() => expect(mockedExportQuotePdf).toHaveBeenCalledWith(expect.objectContaining({ splitPayment: false }), null))
    })

    it('ticks bank details by default and previews the account that will print', async () => {
        setUpBankAccount()
        const user = userEvent.setup()
        render(<AdminQuotes />)

        await user.click(screen.getByRole('button', { name: /new quote/i }))

        expect(await screen.findByText(/sampath bank/i)).toBeInTheDocument()
        expect(screen.getByText(/0011223344/)).toBeInTheDocument()
        expect(bankDetailsTick()).toBeChecked()
    })

    it('disables the bank details tick until a bank account is set up in Settings', async () => {
        const user = userEvent.setup()
        render(<AdminQuotes />)

        await user.click(screen.getByRole('button', { name: /new quote/i }))

        expect(await screen.findByText(/no bank account set up yet/i)).toBeInTheDocument()
        expect(bankDetailsTick()).toBeDisabled()
        expect(bankDetailsTick()).not.toBeChecked()
    })

    it('holds the bank details tick while the bank account is loading', async () => {
        mockedGetDoc.mockReturnValue(new Promise(() => {}))
        const user = userEvent.setup()
        render(<AdminQuotes />)

        await user.click(screen.getByRole('button', { name: /new quote/i }))

        expect(screen.getByText(/loading the bank account/i)).toBeInTheDocument()
        expect(bankDetailsTick()).toBeDisabled()
    })

    it('exports the PDF with the bank account currently saved in Settings', async () => {
        listQuotes(storedQuote())
        setUpBankAccount(buildBankDetails({ bankName: 'Hatton National Bank', accountNumber: '5566778899' }))
        const user = userEvent.setup()
        render(<AdminQuotes />)
        await openStoredQuote(user)
        await screen.findByText(/hatton national bank/i)

        await user.click(screen.getByRole('button', { name: /export pdf/i }))

        await waitFor(() =>
            expect(mockedExportQuotePdf).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ bankName: 'Hatton National Bank', accountNumber: '5566778899' }),
            ),
        )
    })

    it('leaves the bank account off the PDF when the tick is cleared', async () => {
        setUpBankAccount()
        const user = userEvent.setup()
        render(<AdminQuotes />)
        await user.click(screen.getByRole('button', { name: /new quote/i }))
        await screen.findByText(/sampath bank/i)
        await user.click(bankDetailsTick())

        await user.click(screen.getByRole('button', { name: /export pdf/i }))

        await waitFor(() => expect(mockedExportQuotePdf).toHaveBeenCalledWith(expect.anything(), null))
    })

    it('saves the bank details choice without copying the bank account onto the quote', async () => {
        setUpBankAccount()
        const user = userEvent.setup()
        render(<AdminQuotes />)
        await user.click(screen.getByRole('button', { name: /new quote/i }))
        await screen.findByText(/sampath bank/i)
        await user.type(screen.getByLabelText(/client name/i), 'FinCorp')
        await user.click(bankDetailsTick())

        await user.click(screen.getByRole('button', { name: /save quote/i }))

        const savedQuote = mockedAddDoc.mock.calls[0][1]
        expect(savedQuote).toEqual(expect.objectContaining({ includeBankDetails: false }))
        expect(savedQuote).not.toHaveProperty('accountNumber')
        expect(savedQuote).not.toHaveProperty('bankDetails')
    })

    it('reopens a quote with the bank details tick cleared when it was saved that way', async () => {
        listQuotes(storedQuote({ includeBankDetails: false }))
        setUpBankAccount()
        const user = userEvent.setup()
        render(<AdminQuotes />)

        await openStoredQuote(user)

        await waitFor(() => expect(bankDetailsTick()).toBeEnabled())
        expect(bankDetailsTick()).not.toBeChecked()
        expect(screen.queryByText(/0011223344/)).not.toBeInTheDocument()
    })

    it('ticks bank details on a quote saved before the option existed', async () => {
        listQuotes(storedQuote())
        setUpBankAccount()
        const user = userEvent.setup()
        render(<AdminQuotes />)

        await openStoredQuote(user)

        await waitFor(() => expect(bankDetailsTick()).toBeChecked())
    })
})
