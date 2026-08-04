export type StaffRole = 'admin' | 'editor'

export interface StaffMember {
  id: string
  email: string
  name: string
  role: StaffRole
  invitedBy: string
  createdAt: string
}

export interface Project {
  id: string
  title: string
  description: string
  coverImageUrl: string
  createdAt: string
  category?: string
  client?: string
  technologies?: string[]
  challenge?: string
  solution?: string
  keyFeatures?: string[]
}

export type TestimonialStatus = 'pending' | 'approved' | 'rejected'

export interface Testimonial {
  id: string
  clientName: string
  message: string
  rating?: number
  status: TestimonialStatus
  createdAt: string
}

export interface TestimonialInvite {
  id: string
  token: string
  used: boolean
  createdAt: string
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type QuoteCurrency = 'USD' | 'LKR'

export interface QuoteLineItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface Quote {
  id: string
  clientName: string
  clientEmail: string
  lineItems: QuoteLineItem[]
  status: QuoteStatus
  currency: QuoteCurrency
  /** Internal buffer/contingency % and profit margin %, both rolled silently into the client-facing total — never shown to the client. */
  bufferPercent: number
  profitPercent: number
  createdAt: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  message: string
  read: boolean
  createdAt: string
}
