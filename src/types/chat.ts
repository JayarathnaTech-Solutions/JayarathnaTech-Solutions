export type ChatSenderRole = 'admin' | 'developer' | 'customer'

export interface ChatMessage {
  id: string
  senderId: string
  senderEmail: string
  senderName: string
  senderRole: ChatSenderRole
  text?: string
  attachmentUrl?: string
  attachmentType?: 'image' | 'file'
  createdAt: string
}
