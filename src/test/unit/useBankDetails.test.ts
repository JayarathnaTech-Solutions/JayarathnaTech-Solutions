import { describe, expect, it, jest } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'
import { getDoc } from 'firebase/firestore'
import { useBankDetails } from '../../lib/useBankDetails'
import { buildBankDetails } from '../support/factories'
import { bankDetailsSnapshot } from '../support/firestoreFakes'

jest.mock('firebase/firestore', () => ({
    ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
    getDoc: jest.fn(),
}))

const mockedGetDoc = jest.mocked(getDoc)

describe('useBankDetails', () => {
    it('is undefined while the settings document is loading', () => {
        mockedGetDoc.mockReturnValue(new Promise(() => {}))

        const { result } = renderHook(() => useBankDetails())

        expect(result.current).toBeUndefined()
    })

    it('returns the bank account saved in Settings', async () => {
        const bankDetails = buildBankDetails()
        mockedGetDoc.mockResolvedValue(bankDetailsSnapshot(bankDetails))

        const { result } = renderHook(() => useBankDetails())

        await waitFor(() => expect(result.current).toEqual(bankDetails))
    })

    it('returns null when no bank account has been set up', async () => {
        mockedGetDoc.mockResolvedValue(bankDetailsSnapshot(null))

        const { result } = renderHook(() => useBankDetails())

        await waitFor(() => expect(result.current).toBeNull())
    })

    it('returns null when the settings document cannot be read', async () => {
        mockedGetDoc.mockRejectedValue(new Error('permission-denied'))

        const { result } = renderHook(() => useBankDetails())

        await waitFor(() => expect(result.current).toBeNull())
    })
})
