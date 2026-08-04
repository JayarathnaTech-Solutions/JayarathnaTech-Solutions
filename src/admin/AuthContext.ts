import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'
import type { StaffMember } from '../types'

export interface AuthContextValue {
    user: User
    staff: StaffMember
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within RequireAuth')
    return context
}
