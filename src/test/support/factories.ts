import type { BankDetails, StaffMember } from '../../types'

// Test data builders: set only the fields a test's assertion depends on and
// let the rest default.
export const buildStaffMember = (overrides: Partial<StaffMember> = {}): StaffMember => ({
    id: 'user@example.com',
    email: 'user@example.com',
    name: 'Test User',
    role: 'editor',
    invitedBy: 'admin@example.com',
    createdAt: new Date().toISOString(),
    ...overrides,
})

export const buildBankDetails = (overrides: Partial<BankDetails> = {}): BankDetails => ({
    bankName: 'Commercial Bank of Ceylon',
    accountName: 'JayarathnaTech Solutions (Pvt) Ltd',
    accountNumber: '1234567890',
    branchSwift: 'Colombo / CCEYLKLX',
    ...overrides,
})
