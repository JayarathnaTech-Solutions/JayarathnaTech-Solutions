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

// Client/partner logo shown in the "Trusted by" strip on the homepage.
export interface Company {
  id: string
  name: string
  logoUrl: string
  websiteUrl?: string
  createdAt: string
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

export type Currency = 'USD' | 'LKR'

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

// Blog post metadata — lives in src/content/blog/posts.ts (static, git-committed).
// The markdown body is a separate file at src/content/blog/posts/<slug>.md,
// loaded on demand via import.meta.glob (see src/lib/blog.ts) rather than
// embedded here, so listing pages don't pull every post's full body into memory.
export interface BlogPost {
    slug: string
    title: string
    description: string
    tags: string[]
    /** ISO date (yyyy-mm-dd) — drives display, sitemap lastmod, and sort order. */
    publishedAt: string
}

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

// Single global doc at settings/bankDetails — one bank account for the whole
// business, shown to every customer paying by bank transfer.
export interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  branchSwift: string
}

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
