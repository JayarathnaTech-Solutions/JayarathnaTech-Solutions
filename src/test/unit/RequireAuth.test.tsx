import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import type { User } from 'firebase/auth'
import { RequireAuth } from '../../admin/RequireAuth'
import { useAuthStatus, type AuthStatus } from '../../admin/useAuthStatus'
import { renderAtRoute } from '../support/render'
import { buildStaffMember } from '../support/factories'

jest.mock('../../admin/useAuthStatus')

const mockedUseAuthStatus = jest.mocked(useAuthStatus)

const renderWithStatus = (status: AuthStatus) => {
    mockedUseAuthStatus.mockReturnValue(status)

    return renderAtRoute(
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
        </Routes>,
        '/admin',
    )
}

describe('RequireAuth', () => {
    it('shows a loading spinner while checking auth state', () => {
        renderWithStatus({ status: 'checking' })
        expect(screen.getByRole('status')).toBeInTheDocument()
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
            staff: buildStaffMember({ role: 'admin' }),
        })
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
})
