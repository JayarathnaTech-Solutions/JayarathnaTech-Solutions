import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Contact } from '../../pages/Contact'

// `mock` prefix lets babel-jest's hoisted jest.mock() factory reference it.
const mockAddDoc = jest.fn<(...args: unknown[]) => Promise<{ id: string }>>(async () => ({ id: 'msg1' }))

jest.mock('firebase/firestore', () => ({
    ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
    addDoc: (...args: unknown[]) => mockAddDoc(...args),
    collection: jest.fn(),
    serverTimestamp: jest.fn(),
}))

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/^name$/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/^phone$/i), '+94 77 123 4567')
    await user.type(screen.getByLabelText(/message/i), 'I need a new website.')
}

describe('Contact form validation', () => {
    beforeEach(() => {
        mockAddDoc.mockClear()
        globalThis.fetch = jest.fn<typeof fetch>()
    })

    it('does not submit when required fields are empty', async () => {
        const user = userEvent.setup()
        render(<Contact />)

        await user.click(screen.getByRole('button', { name: /send message/i }))

        expect(fetch).not.toHaveBeenCalled()
    })

    it('shows a success state and mirrors the message to Firestore on success', async () => {
        jest.mocked(fetch).mockResolvedValue({ json: async () => ({ success: true }) } as Response)
        const user = userEvent.setup()
        render(<Contact />)

        await fillValidForm(user)
        await user.click(screen.getByRole('button', { name: /send message/i }))

        expect(await screen.findByText(/message sent/i)).toBeInTheDocument()
        await waitFor(() => expect(mockAddDoc).toHaveBeenCalledTimes(1))
        expect(mockAddDoc.mock.calls[0][1]).toMatchObject({
            name: 'Jane Doe',
            email: 'jane@example.com',
            phone: '+94 77 123 4567',
            message: 'I need a new website.',
            read: false,
        })
    })

    it('shows an error state when Web3Forms reports failure', async () => {
        jest.mocked(fetch).mockResolvedValue({ json: async () => ({ success: false }) } as Response)
        const user = userEvent.setup()
        render(<Contact />)

        await fillValidForm(user)
        await user.click(screen.getByRole('button', { name: /send message/i }))

        expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
        expect(mockAddDoc).not.toHaveBeenCalled()
    })

    it('shows an error state when the request throws', async () => {
        jest.mocked(fetch).mockRejectedValue(new Error('network down'))
        const user = userEvent.setup()
        render(<Contact />)

        await fillValidForm(user)
        await user.click(screen.getByRole('button', { name: /send message/i }))

        expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
    })
})
