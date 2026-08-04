import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { TestimonialSubmission } from '../../pages/TestimonialSubmission'

const addDocMock = vi.fn().mockResolvedValue({ id: 'testimonial1' })
const updateDocMock = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>()
    return {
        ...actual,
        getDoc: vi.fn().mockResolvedValue({
            exists: () => true,
            id: 'invite1',
            data: () => ({ used: false, createdAt: new Date().toISOString() }),
        }),
        addDoc: (...args: unknown[]) => addDocMock(...args),
        updateDoc: (...args: unknown[]) => updateDocMock(...args),
        collection: vi.fn(),
        doc: vi.fn(),
        serverTimestamp: vi.fn(),
    }
})

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/testimonial/invite1']}>
            <Routes>
                <Route path="/testimonial/:token" element={<TestimonialSubmission />} />
            </Routes>
        </MemoryRouter>,
    )
}

describe('Testimonial submission form validation', () => {
    beforeEach(() => {
        addDocMock.mockClear()
        updateDocMock.mockClear()
    })

    it('does not submit when required fields are empty', async () => {
        const user = userEvent.setup()
        renderPage()

        await user.click(await screen.findByRole('button', { name: /submit testimonial/i }))

        expect(addDocMock).not.toHaveBeenCalled()
    })

    it('writes the testimonial and marks the invite used on valid submission', async () => {
        const user = userEvent.setup()
        renderPage()

        await user.type(await screen.findByLabelText(/your name/i), 'Priya Fernando')
        await user.type(screen.getByLabelText(/your message/i), 'Great experience working with the team.')
        await user.click(screen.getByRole('button', { name: /submit testimonial/i }))

        expect(await screen.findByRole('heading', { name: /thank you/i })).toBeInTheDocument()
        expect(addDocMock).toHaveBeenCalledTimes(1)
        expect(addDocMock.mock.calls[0][1]).toMatchObject({
            clientName: 'Priya Fernando',
            message: 'Great experience working with the team.',
            status: 'pending',
        })
        expect(updateDocMock).toHaveBeenCalledTimes(1)
    })
})
