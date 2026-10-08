import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { AdminStaff } from '../../admin/pages/Staff'
import { useAuth } from '../../admin/AuthContext'
import type { StaffMember } from '../../types'

jest.mock('../../admin/AuthContext', () => ({
    ...jest.requireActual<typeof import('../../admin/AuthContext')>('../../admin/AuthContext'),
    useAuth: jest.fn(),
}))

jest.mock('firebase/firestore', () => ({
    ...jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore'),
    getDocs: jest.fn(async () => ({ docs: [] })),
}))

const mockedUseAuth = jest.mocked(useAuth)

function staffMember(overrides: Partial<StaffMember>): StaffMember {
    return {
        id: 'user@example.com',
        email: 'user@example.com',
        name: 'Test User',
        role: 'editor',
        invitedBy: 'admin@example.com',
        createdAt: new Date().toISOString(),
        ...overrides,
    }
}

describe('AdminStaff', () => {
    it('restricts the staff management screen to Admins and HR', () => {
        mockedUseAuth.mockReturnValue({ user: {} as User, staff: staffMember({ role: 'editor' }) })

        render(<AdminStaff />)

        expect(screen.getByRole('heading', { name: /restricted/i })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /invite staff/i })).not.toBeInTheDocument()
    })

    it('shows the staff management UI for Admins', () => {
        mockedUseAuth.mockReturnValue({ user: {} as User, staff: staffMember({ role: 'admin' }) })

        render(<AdminStaff />)

        expect(screen.getByRole('button', { name: /invite staff/i })).toBeInTheDocument()
    })

    it('shows the staff management UI for HR', () => {
        mockedUseAuth.mockReturnValue({ user: {} as User, staff: staffMember({ role: 'hr' }) })

        render(<AdminStaff />)

        expect(screen.getByRole('button', { name: /invite staff/i })).toBeInTheDocument()
    })
})
