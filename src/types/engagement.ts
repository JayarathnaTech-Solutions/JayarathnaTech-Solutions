import type { Currency } from './currency'

export type EngagementStatus = 'pending_advance' | 'in_progress' | 'delivered'

export type PhaseStatus = 'not_started' | 'in_progress' | 'completed'

// A phase within a sprint (e.g. Analysis, Design, Development, Testing,
// Deploy). Tracked independently — more than one phase can be in_progress at
// once, within a sprint or across sprints.
export interface Phase {
  name: string
  status: PhaseStatus
}

// A sprint is a named group of phases (e.g. "Sprint 1" containing its own
// Analysis→Deploy checklist). Admin can add more sprints as the project
// grows, each with its own phase checklist.
export interface Sprint {
  name: string
  /** The last phase of the last sprint is conventionally "Deploy"/delivery. */
  phases: Phase[]
}

export interface Engagement {
  id: string
  customerId: string
  customerEmail: string
  title: string
  description: string
  totalValue: number
  currency: Currency
  status: EngagementStatus
  assignedDeveloperEmails: string[]
  sprints: Sprint[]
  advanceInvoiceId: string
  finalInvoiceId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}
