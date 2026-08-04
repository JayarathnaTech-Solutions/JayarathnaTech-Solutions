import { readFileSync } from 'node:fs'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const ADMIN_EMAIL = 'admin@example.com'
const DEVELOPER_EMAIL = 'dev@example.com'
const CUSTOMER_UID = 'customer-1-uid'
const CUSTOMER_EMAIL = 'customer1@example.com'
const OTHER_CUSTOMER_UID = 'customer-2-uid'
const OTHER_CUSTOMER_EMAIL = 'customer2@example.com'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: 'demo-jayarathnatech',
        firestore: {
            rules: readFileSync('firestore.rules', 'utf8'),
            host: '127.0.0.1',
            port: 8080,
        },
    })
})

afterAll(async () => {
    await testEnv.cleanup()
})

afterEach(async () => {
    await testEnv.clearFirestore()
})

beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'staff', ADMIN_EMAIL), { email: ADMIN_EMAIL, name: 'Admin', role: 'admin', invitedBy: 'bootstrap', createdAt: new Date() })
        await setDoc(doc(db, 'staff', DEVELOPER_EMAIL), { email: DEVELOPER_EMAIL, name: 'Dev', role: 'developer', invitedBy: ADMIN_EMAIL, createdAt: new Date() })
        await setDoc(doc(db, 'customers', CUSTOMER_UID), { uid: CUSTOMER_UID, email: CUSTOMER_EMAIL, name: 'Customer', mustChangePassword: false, createdBy: ADMIN_EMAIL, createdAt: new Date() })
        await setDoc(doc(db, 'customers', OTHER_CUSTOMER_UID), { uid: OTHER_CUSTOMER_UID, email: OTHER_CUSTOMER_EMAIL, name: 'Customer Two', mustChangePassword: false, createdBy: ADMIN_EMAIL, createdAt: new Date() })

        await setDoc(doc(db, 'invoices', 'inv-pending'), { engagementId: 'eng-1', customerId: CUSTOMER_UID, type: 'advance', amount: 100, currency: 'USD', paymentMethod: 'bank_transfer', status: 'pending', createdAt: new Date() })
        await setDoc(doc(db, 'invoices', 'inv-verified'), { engagementId: 'eng-1', customerId: CUSTOMER_UID, type: 'final', amount: 100, currency: 'USD', paymentMethod: 'bank_transfer', status: 'verified', createdAt: new Date() })
        await setDoc(doc(db, 'invoices', 'inv-paypal-pending'), { engagementId: 'eng-1', customerId: CUSTOMER_UID, type: 'advance', amount: 100, currency: 'USD', paymentMethod: 'paypal', status: 'pending', createdAt: new Date() })
        await setDoc(doc(db, 'invoices', 'inv-other-customer'), { engagementId: 'eng-2', customerId: OTHER_CUSTOMER_UID, type: 'advance', amount: 100, currency: 'USD', paymentMethod: 'bank_transfer', status: 'pending', createdAt: new Date() })
    })
})

function adminDb() {
    return testEnv.authenticatedContext('admin-uid', { email: ADMIN_EMAIL }).firestore()
}
function developerDb() {
    return testEnv.authenticatedContext('dev-uid', { email: DEVELOPER_EMAIL }).firestore()
}
function customerDb() {
    return testEnv.authenticatedContext(CUSTOMER_UID, { email: CUSTOMER_EMAIL, email_verified: true }).firestore()
}

const newInvoice = {
    engagementId: 'eng-1', customerId: CUSTOMER_UID, type: 'advance', amount: 100, currency: 'USD',
    paymentMethod: 'bank_transfer', status: 'pending', createdAt: new Date(),
}

describe('invoices — read scoping', () => {
    it('lets the owning customer get their invoice but not another customer\'s', async () => {
        await assertSucceeds(getDoc(doc(customerDb(), 'invoices', 'inv-pending')))
        await assertFails(getDoc(doc(customerDb(), 'invoices', 'inv-other-customer')))
    })

    it('gives a developer zero invoice access', async () => {
        await assertFails(getDoc(doc(developerDb(), 'invoices', 'inv-pending')))
    })

    it('lets admin read any invoice', async () => {
        await assertSucceeds(getDoc(doc(adminDb(), 'invoices', 'inv-pending')))
    })
})

describe('invoices — create is admin-only', () => {
    it('blocks a customer or developer from creating an invoice', async () => {
        await assertFails(setDoc(doc(customerDb(), 'invoices', 'hack'), newInvoice))
        await assertFails(setDoc(doc(developerDb(), 'invoices', 'hack'), newInvoice))
    })

    it('lets admin create a valid pending advance/final invoice', async () => {
        await assertSucceeds(setDoc(doc(adminDb(), 'invoices', 'new-inv'), newInvoice))
    })

    it('rejects admin creating an invoice with a non-initial status', async () => {
        await assertFails(setDoc(doc(adminDb(), 'invoices', 'new-inv'), { ...newInvoice, status: 'verified' }))
    })
})

describe('invoices — the core anti-self-verification guarantee', () => {
    it('never lets a customer set status to verified, no matter what else is in the write', async () => {
        await assertFails(updateDoc(doc(customerDb(), 'invoices', 'inv-pending'), { status: 'verified' }))
        await assertFails(
            updateDoc(doc(customerDb(), 'invoices', 'inv-pending'), {
                status: 'verified', proofUrl: 'https://example.com/receipt.png', verifiedBy: CUSTOMER_EMAIL,
            }),
        )
    })

    it('lets a customer submit proof of a bank transfer on a pending invoice', async () => {
        await assertSucceeds(
            updateDoc(doc(customerDb(), 'invoices', 'inv-pending'), {
                proofUrl: 'https://example.com/receipt.png',
                status: 'proof_submitted',
                proofSubmittedAt: new Date().toISOString(),
            }),
        )
    })

    it('rejects a non-https proofUrl (e.g. javascript: or data:)', async () => {
        await assertFails(
            updateDoc(doc(customerDb(), 'invoices', 'inv-pending'), {
                proofUrl: 'javascript:alert(1)', status: 'proof_submitted', proofSubmittedAt: new Date().toISOString(),
            }),
        )
        await assertFails(
            updateDoc(doc(customerDb(), 'invoices', 'inv-pending'), {
                proofUrl: 'data:text/html,evil', status: 'proof_submitted', proofSubmittedAt: new Date().toISOString(),
            }),
        )
    })

    it('blocks a customer from sneaking other fields into the proof-submission write', async () => {
        await assertFails(
            updateDoc(doc(customerDb(), 'invoices', 'inv-pending'), {
                proofUrl: 'https://example.com/receipt.png', status: 'proof_submitted', amount: 1,
            }),
        )
        await assertFails(
            updateDoc(doc(customerDb(), 'invoices', 'inv-pending'), {
                proofUrl: 'https://example.com/receipt.png', status: 'proof_submitted', verifiedBy: CUSTOMER_EMAIL,
            }),
        )
    })

    it('blocks proof submission on a paypal invoice (bank_transfer only for v1)', async () => {
        await assertFails(
            updateDoc(doc(customerDb(), 'invoices', 'inv-paypal-pending'), {
                proofUrl: 'https://example.com/receipt.png', status: 'proof_submitted',
            }),
        )
    })

    it('blocks re-submitting proof on an already-verified invoice', async () => {
        await assertFails(
            updateDoc(doc(customerDb(), 'invoices', 'inv-verified'), {
                proofUrl: 'https://example.com/new-receipt.png', status: 'proof_submitted',
            }),
        )
    })

    it('lets admin verify an invoice', async () => {
        await assertSucceeds(
            updateDoc(doc(adminDb(), 'invoices', 'inv-pending'), {
                status: 'verified', verifiedBy: ADMIN_EMAIL, verifiedAt: new Date().toISOString(),
            }),
        )
    })

    it('never allows deleting an invoice, even for admin', async () => {
        await assertFails(deleteDoc(doc(adminDb(), 'invoices', 'inv-pending')))
    })
})
