import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { engagementFromDoc, invoiceFromDoc } from './firestore'
import type { Engagement, Invoice } from '../types'

// Shared by the admin and customer-portal engagement detail pages — both
// fetch the same document shapes, just under a different auth context.
export function useEngagement(id: string) {
    const [engagement, setEngagement] = useState<Engagement | null | undefined>(undefined)

    const reload = () => {
        getDoc(doc(db, 'engagements', id))
            .then((snap) => setEngagement(snap.exists() ? engagementFromDoc(snap) : null))
            .catch(() => setEngagement(null))
    }

    useEffect(reload, [id])

    return { engagement, reload }
}

// Fetched by id (from the engagement's advanceInvoiceId/finalInvoiceId)
// rather than a `where('engagementId', ...)` query: Firestore can't prove a
// `list` query is safe under the customer-scoped rule (which checks
// `customerId`, a different field than the query filter), so a query would
// silently return nothing for a signed-in customer even though `get` on a
// known id works. The admin rule branch is unconstrained, but fetching by id
// here too avoids relying on that and needs no composite index.
export function useInvoices(advanceInvoiceId: string, finalInvoiceId: string) {
    const [invoices, setInvoices] = useState<Invoice[] | null>(null)

    const reload = () => {
        const ids = [advanceInvoiceId, finalInvoiceId].filter((id) => id !== '')
        Promise.all(ids.map((id) => getDoc(doc(db, 'invoices', id))))
            .then((snapshots) => setInvoices(snapshots.filter((snap) => snap.exists()).map(invoiceFromDoc)))
            .catch(() => setInvoices([]))
    }

    useEffect(reload, [advanceInvoiceId, finalInvoiceId])

    return { invoices, reload }
}
