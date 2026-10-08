export interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  message: string
  read: boolean
  createdAt: string
  source?: 'contact-form' | 'chat'
}
