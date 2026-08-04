import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'
import type { Customer } from '../types'

export interface CustomerAuthContextValue {
    user: User
    customer: Customer
}

export const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null)

export function useCustomerAuth() {
    const context = useContext(CustomerAuthContext)
    if (!context) throw new Error('useCustomerAuth must be used within RequireCustomerAuth')
    return context
}
