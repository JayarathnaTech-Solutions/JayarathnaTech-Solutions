import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Contact } from '../../pages/Contact'

const addDocMock = vi.fn().mockResolvedValue({ id: 'msg1' })

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>()
    return {
        ...actual,
        addDoc: (...args: unknown[]) => addDocMock(...args),
        collection: vi.fn(),
        serverTimestamp: vi.fn(),
    }
})

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/^name$/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/message/i), 'I need a new website.')
}

describe('Contact form validation', () => {
    beforeEach(() => {
        addDocMock.mockClear()
        vi.stubGlobal('fetch', vi.fn())
    })

    it('does not submit when required fields are empty', async () => {
        const user = userEvent.setup()
        render(<Contact />)

        await user.click(screen.getByRole('button', { name: /send message/i }))

        expect(fetch).not.toHaveBeenCalled()
    })

    it('shows a success state and mirrors the message to Firestore on success', async () => {
        vi.mocked(fetch).mockResolvedValue({ json: async () => ({ success: true }) } as Response)
        const user = userEvent.setup()
        render(<Contact />)

        await fillValidForm(user)
        await user.click(screen.getByRole('button', { name: /send message/i }))

        expect(await screen.findByText(/message sent/i)).toBeInTheDocument()
        await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
        expect(addDocMock.mock.calls[0][1]).toMatchObject({
            name: 'Jane Doe',
            email: 'jane@example.com',
            message: 'I need a new website.',
            read: false,
        })
    })

    it('shows an error state when Web3Forms reports failure', async () => {
        vi.mocked(fetch).mockResolvedValue({ json: async () => ({ success: false }) } as Response)
        const user = userEvent.setup()
        render(<Contact />)

        await fillValidForm(user)
        await user.click(screen.getByRole('button', { name: /send message/i }))

        expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
        expect(addDocMock).not.toHaveBeenCalled()
    })

    it('shows an error state when the request throws', async () => {
        vi.mocked(fetch).mockRejectedValue(new Error('network down'))
        const user = userEvent.setup()
        render(<Contact />)

        await fillValidForm(user)
        await user.click(screen.getByRole('button', { name: /send message/i }))

        expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
    })
})
