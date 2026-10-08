import type { Currency } from './currency'

export type InvoiceType = 'advance' | 'final'
export type InvoiceStatus = 'pending' | 'proof_submitted' | 'verified'
export type PaymentMethod = 'bank_transfer' | 'paypal'

export interface InvoiceFeeLineItem {
  label: string
  amount: number
}

export interface Invoice {
  id: string
  engagementId: string
  customerId: string
  type: InvoiceType
  amount: number
  currency: Currency
  paymentMethod: PaymentMethod
  status: InvoiceStatus
  /** Reserved for a future PayPal processing fee — unused while PayPal checkout isn't implemented. */
  feeLineItem?: InvoiceFeeLineItem
  proofUrl?: string
  proofSubmittedAt?: string
  verifiedBy?: string
  verifiedAt?: string
  createdAt: string
}
