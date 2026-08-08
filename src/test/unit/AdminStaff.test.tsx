import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { AdminStaff } from '../../admin/pages/Staff'
import { useAuth } from '../../admin/AuthContext'
import type { StaffMember } from '../../types'

vi.mock('../../admin/AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../admin/AuthContext')>()
    return { ...actual, useAuth: vi.fn() }
})

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>()
    return { ...actual, getDocs: vi.fn().mockResolvedValue({ docs: [] }) }
})

const mockedUseAuth = vi.mocked(useAuth)

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
