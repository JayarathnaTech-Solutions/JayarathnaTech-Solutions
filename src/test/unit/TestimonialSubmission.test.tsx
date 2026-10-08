import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { TestimonialSubmission } from '../../pages/TestimonialSubmission'

// `mock` prefix lets babel-jest's hoisted jest.mock() factory reference these.
const mockAddDoc = jest.fn<(...args: unknown[]) => Promise<{ id: string }>>(async () => ({ id: 'testimonial1' }))
const mockUpdateDoc = jest.fn<(...args: unknown[]) => Promise<void>>(async () => undefined)

jest.mock('firebase/firestore', () => ({
    ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
    getDoc: jest.fn(async () => ({
        exists: () => true,
        id: 'invite1',
        data: () => ({ used: false, createdAt: new Date().toISOString() }),
    })),
    addDoc: (...args: unknown[]) => mockAddDoc(...args),
    updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
    collection: jest.fn(),
    doc: jest.fn(),
    serverTimestamp: jest.fn(),
}))

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
        mockAddDoc.mockClear()
        mockUpdateDoc.mockClear()
    })

    it('does not submit when required fields are empty', async () => {
        const user = userEvent.setup()
        renderPage()

        await user.click(await screen.findByRole('button', { name: /submit testimonial/i }))

        expect(mockAddDoc).not.toHaveBeenCalled()
    })

    it('writes the testimonial and marks the invite used on valid submission', async () => {
        const user = userEvent.setup()
        renderPage()

        await user.type(await screen.findByLabelText(/your name/i), 'Priya Fernando')
        await user.type(screen.getByLabelText(/your message/i), 'Great experience working with the team.')
        await user.click(screen.getByRole('button', { name: /submit testimonial/i }))

        expect(await screen.findByRole('heading', { name: /thank you/i })).toBeInTheDocument()
        expect(mockAddDoc).toHaveBeenCalledTimes(1)
        expect(mockAddDoc.mock.calls[0][1]).toMatchObject({
            clientName: 'Priya Fernando',
            message: 'Great experience working with the team.',
            status: 'pending',
        })
        expect(mockUpdateDoc).toHaveBeenCalledTimes(1)
    })
})
