import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { User } from 'firebase/auth'
import { RequireAuth } from '../../admin/RequireAuth'
import { useAuthStatus, type AuthStatus } from '../../admin/useAuthStatus'

vi.mock('../../admin/useAuthStatus')

const mockedUseAuthStatus = vi.mocked(useAuthStatus)

function renderWithStatus(status: AuthStatus) {
    mockedUseAuthStatus.mockReturnValue(status)

    return render(
        <MemoryRouter initialEntries={['/admin']}>
            <Routes>
                <Route path="/admin/login" element={<div>Login Page</div>} />
                <Route
                    path="/admin"
                    element={
                        <RequireAuth>
                            <div>Protected Content</div>
                        </RequireAuth>
                    }
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('RequireAuth', () => {
    it('renders nothing while checking auth state', () => {
        const { container } = renderWithStatus({ status: 'checking' })
        expect(container).toBeEmptyDOMElement()
    })

    it('redirects to /admin/login when signed out', () => {
        renderWithStatus({ status: 'signed-out' })
        expect(screen.getByText('Login Page')).toBeInTheDocument()
    })

    it('shows an access-restricted screen when signed in but not on the staff list', () => {
        renderWithStatus({ status: 'not-staff' })
        expect(screen.getByRole('heading', { name: /access restricted/i })).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('renders the protected children once authorized', () => {
        renderWithStatus({
            status: 'authorized',
            user: { email: 'admin@example.com' } as unknown as User,
            staff: {
                id: 'admin@example.com',
                email: 'admin@example.com',
                name: 'Admin',
                role: 'admin',
                invitedBy: 'bootstrap',
                createdAt: new Date().toISOString(),
            },
        })
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
})
