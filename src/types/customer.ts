// `customers` doc id is the Auth uid — unlike `staff` (keyed by email, since
// invites predate sign-in), a customer's uid is already known at the moment
// the admin action that creates them runs (see src/lib/customerProvisioning.ts).
export interface Customer {
  id: string
  uid: string
  email: string
  name: string
  company?: string
  mustChangePassword: boolean
  createdBy: string
  createdAt: string
}
