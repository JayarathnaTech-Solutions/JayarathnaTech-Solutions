import { Timestamp, type DocumentData, type QueryDocumentSnapshot, type DocumentSnapshot } from 'firebase/firestore'
import type {
    BankDetails,
    ChatMessage,
    ContactMessage,
    Customer,
    Engagement,
    Invoice,
    Phase,
    PhaseStatus,
    Project,
    Quote,
    QuoteCurrency,
    QuoteLineItem,
    QuoteStatus,
    Sprint,
    StaffMember,
    Testimonial,
    TestimonialInvite,
} from '../types'

export function toIsoString(value: unknown): string {
    if (value instanceof Timestamp) return value.toDate().toISOString()
    if (typeof value === 'string') return value
    return new Date().toISOString()
}

export function projectFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Project {
    const data = doc.data()
    if (!data) throw new Error(`Project document ${doc.id} does not exist`)
    return {
        id: doc.id,
        title: data.title,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        createdAt: toIsoString(data.createdAt),
        category: data.category,
        client: data.client,
        technologies: data.technologies,
        challenge: data.challenge,
        solution: data.solution,
        keyFeatures: data.keyFeatures,
    }
}

export function testimonialInviteFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): TestimonialInvite {
    const data = doc.data()
    if (!data) throw new Error(`Testimonial invite ${doc.id} does not exist`)
    return {
        id: doc.id,
        token: data.token ?? doc.id,
        used: data.used ?? false,
        createdAt: toIsoString(data.createdAt),
    }
}

export function staffMemberFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): StaffMember {
    const data = doc.data()
    if (!data) throw new Error(`Staff member ${doc.id} does not exist`)
    return {
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role,
        invitedBy: data.invitedBy,
        createdAt: toIsoString(data.createdAt),
    }
}

export function customerFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Customer {
    const data = doc.data()
    if (!data) throw new Error(`Customer ${doc.id} does not exist`)
    return {
        id: doc.id,
        uid: data.uid ?? doc.id,
        email: data.email,
        name: data.name,
        company: data.company,
        mustChangePassword: data.mustChangePassword ?? false,
        createdBy: data.createdBy,
        createdAt: toIsoString(data.createdAt),
    }
}

// `sprints` has gone through two earlier shapes on this feature: originally
// `string[]` + a separate `currentSprintIndex` pointer, then briefly a flat
// `{ name, status }[]` (one status per phase, no grouping). Now sprints are
// nested — each sprint has its own name and its own phase checklist — so
// reads translate whichever old shape they find into that: a flat legacy
// list becomes a single "Sprint 1" group; a bare string list derives each
// phase's status from the old index pointer first.
function parsePhase(raw: unknown): Phase {
    if (typeof raw === 'string') return { name: raw, status: 'not_started' }
    const item = raw as { name?: string; status?: PhaseStatus } | null | undefined
    return { name: item?.name ?? '', status: item?.status ?? 'not_started' }
}

function parseSprints(rawSprints: unknown, legacyCurrentIndex: unknown): Sprint[] {
    if (!Array.isArray(rawSprints) || rawSprints.length === 0) return []

    const first = rawSprints[0] as { phases?: unknown } | string
    if (typeof first === 'object' && first !== null && Array.isArray(first.phases)) {
        // Already the current nested shape.
        return rawSprints.map((group, index) => {
            const g = group as { name?: string; phases?: unknown[] }
            return { name: g?.name ?? `Sprint ${index + 1}`, phases: (g?.phases ?? []).map(parsePhase) }
        })
    }

    // Flat legacy shape (string[] with currentSprintIndex, or {name,status}[])
    // — becomes the single "Sprint 1" group.
    const legacyIndex = typeof legacyCurrentIndex === 'number' ? legacyCurrentIndex : -1
    const phases: Phase[] = rawSprints.map((item, index) => {
        if (typeof item === 'string') {
            const status: PhaseStatus = index < legacyIndex ? 'completed' : index === legacyIndex ? 'in_progress' : 'not_started'
            return { name: item, status }
        }
        return parsePhase(item)
    })
    return [{ name: 'Sprint 1', phases }]
}

export function engagementFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Engagement {
    const data = doc.data()
    if (!data) throw new Error(`Engagement ${doc.id} does not exist`)
    return {
        id: doc.id,
        customerId: data.customerId,
        customerEmail: data.customerEmail,
        title: data.title,
        description: data.description ?? '',
        totalValue: data.totalValue ?? 0,
        currency: data.currency ?? 'USD',
        status: data.status,
        assignedDeveloperEmails: data.assignedDeveloperEmails ?? [],
        sprints: parseSprints(data.sprints, data.currentSprintIndex),
        advanceInvoiceId: data.advanceInvoiceId ?? '',
        finalInvoiceId: data.finalInvoiceId ?? '',
        createdBy: data.createdBy,
        createdAt: toIsoString(data.createdAt),
        updatedAt: toIsoString(data.updatedAt),
    }
}

export function bankDetailsFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): BankDetails | null {
    const data = doc.data()
    if (!data) return null
    return {
        bankName: data.bankName ?? '',
        accountName: data.accountName ?? '',
        accountNumber: data.accountNumber ?? '',
        branchSwift: data.branchSwift ?? '',
    }
}

export function chatMessageFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): ChatMessage {
    const data = doc.data()
    if (!data) throw new Error(`Chat message ${doc.id} does not exist`)
    return {
        id: doc.id,
        senderId: data.senderId,
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        senderRole: data.senderRole,
        text: data.text,
        attachmentUrl: data.attachmentUrl,
        attachmentType: data.attachmentType,
        createdAt: toIsoString(data.createdAt),
    }
}

export function invoiceFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Invoice {
    const data = doc.data()
    if (!data) throw new Error(`Invoice ${doc.id} does not exist`)
    return {
        id: doc.id,
        engagementId: data.engagementId,
        customerId: data.customerId,
        type: data.type,
        amount: data.amount,
        currency: data.currency ?? 'USD',
        paymentMethod: data.paymentMethod,
        status: data.status,
        feeLineItem: data.feeLineItem,
        proofUrl: data.proofUrl,
        proofSubmittedAt: data.proofSubmittedAt ? toIsoString(data.proofSubmittedAt) : undefined,
        verifiedBy: data.verifiedBy,
        verifiedAt: data.verifiedAt ? toIsoString(data.verifiedAt) : undefined,
        createdAt: toIsoString(data.createdAt),
    }
}

export function quoteFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Quote {
    const data = doc.data()
    if (!data) throw new Error(`Quote ${doc.id} does not exist`)
    return {
        id: doc.id,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        lineItems: (data.lineItems as QuoteLineItem[] | undefined) ?? [],
        status: data.status as QuoteStatus,
        currency: (data.currency as QuoteCurrency | undefined) ?? 'USD',
        bufferPercent: data.bufferPercent ?? 0,
        profitPercent: data.profitPercent ?? 0,
        createdAt: toIsoString(data.createdAt),
    }
}

export function testimonialFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Testimonial {
    const data = doc.data()
    if (!data) throw new Error(`Testimonial ${doc.id} does not exist`)
    return {
        id: doc.id,
        clientName: data.clientName,
        message: data.message,
        rating: data.rating,
        status: data.status,
        createdAt: toIsoString(data.createdAt),
    }
}

export function contactMessageFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): ContactMessage {
    const data = doc.data()
    if (!data) throw new Error(`Contact message ${doc.id} does not exist`)
    return {
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        read: data.read,
        createdAt: toIsoString(data.createdAt),
    }
}
