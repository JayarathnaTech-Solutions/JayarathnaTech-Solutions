import { readFileSync } from 'node:fs'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore'

const ADMIN_EMAIL = 'admin@example.com'
const DEVELOPER_EMAIL = 'dev@example.com'
const OTHER_DEVELOPER_EMAIL = 'otherdev@example.com'
const CUSTOMER_UID = 'customer-1-uid'
const CUSTOMER_EMAIL = 'customer1@example.com'
const OTHER_CUSTOMER_UID = 'customer-2-uid'

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
        await setDoc(doc(db, 'staff', OTHER_DEVELOPER_EMAIL), { email: OTHER_DEVELOPER_EMAIL, name: 'Other Dev', role: 'developer', invitedBy: ADMIN_EMAIL, createdAt: new Date() })
        await setDoc(doc(db, 'customers', CUSTOMER_UID), { uid: CUSTOMER_UID, email: CUSTOMER_EMAIL, name: 'Customer', mustChangePassword: false, createdBy: ADMIN_EMAIL, createdAt: new Date() })

        await setDoc(doc(db, 'invoices', 'adv-pending'), { engagementId: 'eng-pending-advance', customerId: CUSTOMER_UID, type: 'advance', amount: 100, currency: 'USD', paymentMethod: 'bank_transfer', status: 'pending', createdAt: new Date() })
        await setDoc(doc(db, 'invoices', 'adv-verified'), { engagementId: 'eng-advance-verified', customerId: CUSTOMER_UID, type: 'advance', amount: 100, currency: 'USD', paymentMethod: 'bank_transfer', status: 'verified', createdAt: new Date() })
        await setDoc(doc(db, 'invoices', 'final-pending'), { engagementId: 'eng-advance-verified', customerId: CUSTOMER_UID, type: 'final', amount: 100, currency: 'USD', paymentMethod: 'bank_transfer', status: 'pending', createdAt: new Date() })
        await setDoc(doc(db, 'invoices', 'final-verified'), { engagementId: 'eng-final-verified', customerId: CUSTOMER_UID, type: 'final', amount: 100, currency: 'USD', paymentMethod: 'bank_transfer', status: 'verified', createdAt: new Date() })

        await setDoc(doc(db, 'engagements', 'eng-pending-advance'), {
            customerId: CUSTOMER_UID, customerEmail: CUSTOMER_EMAIL, title: 'Site rebuild', description: '',
            totalValue: 200, currency: 'USD', status: 'pending_advance', assignedDeveloperEmails: [DEVELOPER_EMAIL],
            sprints: [], currentSprintIndex: -1, advanceInvoiceId: 'adv-pending', finalInvoiceId: 'final-pending',
            createdBy: ADMIN_EMAIL, createdAt: new Date(), updatedAt: new Date(),
        })
        await setDoc(doc(db, 'engagements', 'eng-advance-verified'), {
            customerId: CUSTOMER_UID, customerEmail: CUSTOMER_EMAIL, title: 'Site rebuild', description: '',
            totalValue: 200, currency: 'USD', status: 'pending_advance', assignedDeveloperEmails: [DEVELOPER_EMAIL],
            sprints: [], currentSprintIndex: -1, advanceInvoiceId: 'adv-verified', finalInvoiceId: 'final-pending',
            createdBy: ADMIN_EMAIL, createdAt: new Date(), updatedAt: new Date(),
        })
        await setDoc(doc(db, 'engagements', 'eng-in-progress-final-pending'), {
            customerId: CUSTOMER_UID, customerEmail: CUSTOMER_EMAIL, title: 'Site rebuild', description: '',
            totalValue: 200, currency: 'USD', status: 'in_progress', assignedDeveloperEmails: [DEVELOPER_EMAIL],
            sprints: ['Sprint 1', 'Delivery'], currentSprintIndex: 1, advanceInvoiceId: 'adv-verified', finalInvoiceId: 'final-pending',
            createdBy: ADMIN_EMAIL, createdAt: new Date(), updatedAt: new Date(),
        })
        await setDoc(doc(db, 'engagements', 'eng-final-verified'), {
            customerId: CUSTOMER_UID, customerEmail: CUSTOMER_EMAIL, title: 'Site rebuild', description: '',
            totalValue: 200, currency: 'USD', status: 'in_progress', assignedDeveloperEmails: [DEVELOPER_EMAIL],
            sprints: ['Sprint 1', 'Delivery'], currentSprintIndex: 1, advanceInvoiceId: 'adv-verified', finalInvoiceId: 'final-verified',
            createdBy: ADMIN_EMAIL, createdAt: new Date(), updatedAt: new Date(),
        })
    })
})

function adminDb() {
    return testEnv.authenticatedContext('admin-uid', { email: ADMIN_EMAIL }).firestore()
}
function developerDb() {
    return testEnv.authenticatedContext('dev-uid', { email: DEVELOPER_EMAIL }).firestore()
}
function otherDeveloperDb() {
    return testEnv.authenticatedContext('otherdev-uid', { email: OTHER_DEVELOPER_EMAIL }).firestore()
}
function customerDb() {
    return testEnv.authenticatedContext(CUSTOMER_UID, { email: CUSTOMER_EMAIL, email_verified: true }).firestore()
}
function otherCustomerDb() {
    return testEnv.authenticatedContext(OTHER_CUSTOMER_UID, { email: 'customer2@example.com', email_verified: true }).firestore()
}

const newEngagement = {
    customerId: CUSTOMER_UID, customerEmail: CUSTOMER_EMAIL, title: 'New engagement', description: '',
    totalValue: 0, currency: 'USD', status: 'pending_advance', assignedDeveloperEmails: [],
    sprints: [], advanceInvoiceId: '', finalInvoiceId: '',
    createdBy: ADMIN_EMAIL, createdAt: new Date(), updatedAt: new Date(),
}

describe('engagements — read scoping', () => {
    it('lets the owning customer read their engagement but not another customer\'s', async () => {
        await assertSucceeds(getDoc(doc(customerDb(), 'engagements', 'eng-pending-advance')))
        await assertFails(getDoc(doc(otherCustomerDb(), 'engagements', 'eng-pending-advance')))
    })

    it('lets an assigned developer read but blocks an unassigned developer', async () => {
        await assertSucceeds(getDoc(doc(developerDb(), 'engagements', 'eng-pending-advance')))
        await assertFails(getDoc(doc(otherDeveloperDb(), 'engagements', 'eng-pending-advance')))
    })

    it('lets admin read any engagement', async () => {
        await assertSucceeds(getDoc(doc(adminDb(), 'engagements', 'eng-pending-advance')))
    })

    it('lets a customer list only their own engagements via a matching query', async () => {
        await assertSucceeds(getDocs(query(collection(customerDb(), 'engagements'), where('customerId', '==', CUSTOMER_UID))))
    })

    it('lets a developer list only their assigned engagements via a matching query', async () => {
        await assertSucceeds(getDocs(query(collection(developerDb(), 'engagements'), where('assignedDeveloperEmails', 'array-contains', DEVELOPER_EMAIL))))
    })

    it('lets admin list all engagements unfiltered', async () => {
        await assertSucceeds(getDocs(collection(adminDb(), 'engagements')))
    })
})

describe('engagements — writes are admin-only', () => {
    it('blocks a customer from creating, updating, or deleting an engagement', async () => {
        await assertFails(setDoc(doc(customerDb(), 'engagements', 'hack'), newEngagement))
        await assertFails(updateDoc(doc(customerDb(), 'engagements', 'eng-pending-advance'), { title: 'Hijacked' }))
        await assertFails(deleteDoc(doc(customerDb(), 'engagements', 'eng-pending-advance')))
    })

    it('blocks a developer from creating, updating, or deleting an engagement', async () => {
        await assertFails(setDoc(doc(developerDb(), 'engagements', 'hack'), newEngagement))
        await assertFails(updateDoc(doc(developerDb(), 'engagements', 'eng-pending-advance'), { title: 'Hijacked' }))
        await assertFails(deleteDoc(doc(developerDb(), 'engagements', 'eng-pending-advance')))
    })

    it('lets admin create an engagement with the required initial shape', async () => {
        await assertSucceeds(setDoc(doc(adminDb(), 'engagements', 'new-eng'), newEngagement))
    })

    it('rejects admin creating an engagement with a non-initial status', async () => {
        await assertFails(setDoc(doc(adminDb(), 'engagements', 'new-eng'), { ...newEngagement, status: 'in_progress' }))
    })

    it('lets admin edit non-status fields freely', async () => {
        await assertSucceeds(updateDoc(doc(adminDb(), 'engagements', 'eng-pending-advance'), { title: 'Renamed', assignedDeveloperEmails: [DEVELOPER_EMAIL, OTHER_DEVELOPER_EMAIL] }))
    })

    it('lets admin delete an engagement', async () => {
        await assertSucceeds(deleteDoc(doc(adminDb(), 'engagements', 'eng-pending-advance')))
    })
})

describe('engagements — payment gates', () => {
    it('blocks starting the project while the advance invoice is unverified', async () => {
        await assertFails(updateDoc(doc(adminDb(), 'engagements', 'eng-pending-advance'), { status: 'in_progress' }))
    })

    it('allows starting the project once the advance invoice is verified', async () => {
        await assertSucceeds(updateDoc(doc(adminDb(), 'engagements', 'eng-advance-verified'), { status: 'in_progress' }))
    })

    it('blocks marking delivered while the final invoice is unverified', async () => {
        await assertFails(updateDoc(doc(adminDb(), 'engagements', 'eng-in-progress-final-pending'), { status: 'delivered' }))
    })

    it('allows marking delivered once the final invoice is verified', async () => {
        await assertSucceeds(updateDoc(doc(adminDb(), 'engagements', 'eng-final-verified'), { status: 'delivered' }))
    })

    it('blocks skipping straight from pending_advance to delivered', async () => {
        await assertFails(updateDoc(doc(adminDb(), 'engagements', 'eng-advance-verified'), { status: 'delivered' }))
    })

    it('blocks admin from mutating advanceInvoiceId/finalInvoiceId once set', async () => {
        await assertFails(updateDoc(doc(adminDb(), 'engagements', 'eng-pending-advance'), { advanceInvoiceId: 'swapped' }))
        await assertFails(updateDoc(doc(adminDb(), 'engagements', 'eng-pending-advance'), { finalInvoiceId: 'swapped' }))
    })
})
