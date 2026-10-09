import type { Currency } from './currency'
import type { BankDetails } from './settings'

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type QuoteCurrency = Currency

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
  /** True: 50% deposit at project start + 50% balance on completion. False: the client pays the full amount at once. */
  splitPayment: boolean
  /** Whether the PDF prints the bank account from Settings. Only the choice is stored — the account itself is read live at export, so a changed account shows on the next PDF. */
  includeBankDetails: boolean
  /** Customer-facing requirements summary, optionally polished with AI from raw notes collected from the client. */
  customerRequirements?: string
  createdAt: string
}

/** One scheduled payment toward a quote's grand total, as printed on the quote. */
export interface IPaymentInstallment {
  label: string
  amount: number
}

/** Props for the react-pdf quote template; `bankDetails` is null when the bank account is left off the PDF. */
export interface IQuoteDocumentProps {
  quote: Quote
  bankDetails: BankDetails | null
}

/** Props for the bank-transfer block on the quote PDF. */
export interface IPaymentDetailsProps {
  bankDetails: BankDetails
  clientName: string
}
