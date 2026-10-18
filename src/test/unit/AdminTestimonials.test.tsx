import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDoc, getCountFromServer, getDocs } from 'firebase/firestore'
import type { AggregateQuerySnapshot, DocumentReference, QuerySnapshot } from 'firebase/firestore'
import { AdminTestimonials } from '../../admin/pages/Testimonials'

jest.mock('firebase/firestore', () => ({
    ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
    addDoc: jest.fn(),
    getDocs: jest.fn(),
    getCountFromServer: jest.fn(),
}))

const mockedAddDoc = jest.mocked(addDoc)
const mockedGetDocs = jest.mocked(getDocs)
const mockedGetCountFromServer = jest.mocked(getCountFromServer)

describe('AdminTestimonials', () => {
    // The admin panel runs on the admin subdomain, which only serves admin
    // routes, so a link built from the current origin 404s for the customer.
    it('generates an invite link on the public site, not the admin subdomain', async () => {
        mockedGetDocs.mockResolvedValue({ docs: [] } as unknown as QuerySnapshot)
        mockedGetCountFromServer.mockResolvedValue({ data: () => ({ count: 0 }) } as unknown as AggregateQuerySnapshot<{ count: never }>)
        mockedAddDoc.mockResolvedValue({ id: 'invite1' } as DocumentReference)
        const user = userEvent.setup()
        render(<AdminTestimonials />)

        await user.click(screen.getByRole('button', { name: /generate invite link/i }))

        expect(await screen.findByText('https://www.jayarathnatechsolutions.com/testimonial/invite1')).toBeInTheDocument()
    })
})
