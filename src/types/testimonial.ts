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
