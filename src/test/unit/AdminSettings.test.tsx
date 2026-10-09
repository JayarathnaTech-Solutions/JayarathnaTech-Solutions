import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { getDoc } from 'firebase/firestore'
import { AdminSettings } from '../../admin/pages/Settings'
import { buildBankDetails } from '../support/factories'
import { bankDetailsSnapshot } from '../support/firestoreFakes'

jest.mock('firebase/firestore', () => ({
    ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
    getDoc: jest.fn(),
}))

const mockedGetDoc = jest.mocked(getDoc)

describe('AdminSettings', () => {
    it('fills the form with the saved bank account', async () => {
        mockedGetDoc.mockResolvedValue(bankDetailsSnapshot(buildBankDetails({ accountNumber: '9876543210' })))

        render(<AdminSettings />)

        expect(await screen.findByLabelText(/account number/i)).toHaveValue('9876543210')
    })

    it('shows an empty form when no bank account has been set up', async () => {
        mockedGetDoc.mockResolvedValue(bankDetailsSnapshot(null))

        render(<AdminSettings />)

        expect(await screen.findByLabelText(/bank name/i)).toHaveValue('')
    })
})
