import type { Currency } from './currency'

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
  /** Customer-facing requirements summary, optionally polished with AI from raw notes collected from the client. */
  customerRequirements?: string
  /** Business Requirements Document, AI-generated from customerRequirements once the quote is accepted. */
  brdContent?: string
  /** Software Requirements Specification, AI-generated from customerRequirements once the quote is accepted. */
  srsContent?: string
  /** Extra technical context, collected once accepted, that feeds the SRS diagram generation (tech stack, user roles, external integrations, data entities). */
  techStack?: string
  userRoles?: string
  externalIntegrations?: string
  dataEntities?: string
  /** Mermaid diagram syntax, AI-generated alongside the SRS. Rendered to images and embedded in the SRS PDF. */
  architectureDiagram?: string
  workflowDiagram?: string
  dfdDiagram?: string
  createdAt: string
}
