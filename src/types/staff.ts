export type StaffRole = 'admin' | 'editor' | 'developer' | 'hr' | 'qa' | 'intern' | 'uiux'

export interface StaffMember {
  id: string
  email: string
  name: string
  role: StaffRole
  invitedBy: string
  createdAt: string
}

// Sensitive personal data, kept in a separate `staffRecords` collection (not
// on StaffMember/`staff`) so it never rides along with the `staff` doc reads
// that power isAdmin()/isStaff()/nav gating everywhere else in the app.
export interface StaffPersonalInfo {
  id: string // == staff doc id (lowercased email)
  nic: string
  birthday: string // ISO date, yyyy-mm-dd
  address: string
  phone1: string
  phone2: string
  nicFrontUrl: string
  nicBackUrl: string
  updatedAt: string
  updatedBy: string
}
