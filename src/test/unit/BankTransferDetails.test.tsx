import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { getDoc } from 'firebase/firestore'
import { BankTransferDetails } from '../../portal/components/BankTransferDetails'
import { buildBankDetails } from '../support/factories'
import { bankDetailsSnapshot } from '../support/firestoreFakes'
import type { Invoice } from '../../types'

jest.mock('firebase/firestore', () => ({
    ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
    getDoc: jest.fn(),
}))

const mockedGetDoc = jest.mocked(getDoc)

const pendingInvoice = { id: 'invoice-1', status: 'pending', paymentMethod: 'bank_transfer' } as Invoice

describe('BankTransferDetails', () => {
    it('shows the bank account customers should pay into', async () => {
        mockedGetDoc.mockResolvedValue(bankDetailsSnapshot(buildBankDetails({ accountNumber: '9876543210' })))

        render(<BankTransferDetails invoice={pendingInvoice} onSubmitted={() => {}} />)

        expect(await screen.findByText('9876543210')).toBeInTheDocument()
    })

    it('asks the customer to get in touch when no bank account has been set up', async () => {
        mockedGetDoc.mockResolvedValue(bankDetailsSnapshot(null))

        render(<BankTransferDetails invoice={pendingInvoice} onSubmitted={() => {}} />)

        expect(await screen.findByText(/haven't been set up yet/i)).toBeInTheDocument()
    })
})
