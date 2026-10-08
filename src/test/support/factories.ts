import type { StaffMember } from '../../types'

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
