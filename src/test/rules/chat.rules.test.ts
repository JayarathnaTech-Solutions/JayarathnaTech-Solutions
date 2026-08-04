import { readFileSync } from 'node:fs'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore'

const ADMIN_EMAIL = 'admin@example.com'
const DEVELOPER_EMAIL = 'dev@example.com'
const OTHER_DEVELOPER_EMAIL = 'otherdev@example.com'
const CUSTOMER_UID = 'customer-1-uid'
const CUSTOMER_EMAIL = 'customer1@example.com'
const OTHER_CUSTOMER_UID = 'customer-2-uid'
const OTHER_CUSTOMER_EMAIL = 'customer2@example.com'
const ENGAGEMENT_ID = 'eng-1'

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
        await setDoc(doc(db, 'customers', OTHER_CUSTOMER_UID), { uid: OTHER_CUSTOMER_UID, email: OTHER_CUSTOMER_EMAIL, name: 'Customer Two', mustChangePassword: false, createdBy: ADMIN_EMAIL, createdAt: new Date() })

        await setDoc(doc(db, 'engagements', ENGAGEMENT_ID), {
            customerId: CUSTOMER_UID, customerEmail: CUSTOMER_EMAIL, title: 'Site rebuild', description: '',
            totalValue: 200, currency: 'USD', status: 'in_progress', assignedDeveloperEmails: [DEVELOPER_EMAIL],
            sprints: ['Sprint 1'], currentSprintIndex: 0, advanceInvoiceId: 'adv', finalInvoiceId: 'final',
            createdBy: ADMIN_EMAIL, createdAt: new Date(), updatedAt: new Date(),
        })

        await setDoc(doc(db, 'engagements', ENGAGEMENT_ID, 'messages', 'existing-message'), {
            senderId: 'admin-uid', senderEmail: ADMIN_EMAIL, senderName: 'Admin', senderRole: 'admin',
            text: 'Welcome aboard', createdAt: new Date(),
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
    return testEnv.authenticatedContext(OTHER_CUSTOMER_UID, { email: OTHER_CUSTOMER_EMAIL, email_verified: true }).firestore()
}
function unverifiedCustomerDb() {
    return testEnv.authenticatedContext(CUSTOMER_UID, { email: CUSTOMER_EMAIL, email_verified: false }).firestore()
}

function messageFrom(uid: string, email: string, role: 'admin' | 'developer' | 'customer') {
    return { senderId: uid, senderEmail: email, senderName: 'Someone', senderRole: role, text: 'hi', createdAt: new Date() }
}

function attachmentMessageFrom(uid: string, email: string, role: 'admin' | 'developer' | 'customer', attachmentUrl: string) {
    return { senderId: uid, senderEmail: email, senderName: 'Someone', senderRole: role, attachmentUrl, attachmentType: 'file', createdAt: new Date() }
}

describe('engagement chat', () => {
    it('lets admin, the assigned developer, and the owning customer read and post', async () => {
        await assertSucceeds(getDocs(collection(adminDb(), 'engagements', ENGAGEMENT_ID, 'messages')))
        await assertSucceeds(getDocs(collection(developerDb(), 'engagements', ENGAGEMENT_ID, 'messages')))
        await assertSucceeds(getDocs(collection(customerDb(), 'engagements', ENGAGEMENT_ID, 'messages')))

        await assertSucceeds(setDoc(doc(adminDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm1'), messageFrom('admin-uid', ADMIN_EMAIL, 'admin')))
        await assertSucceeds(setDoc(doc(developerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm2'), messageFrom('dev-uid', DEVELOPER_EMAIL, 'developer')))
        await assertSucceeds(setDoc(doc(customerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm3'), messageFrom(CUSTOMER_UID, CUSTOMER_EMAIL, 'customer')))
    })

    it('blocks an unassigned developer and a different customer from reading or posting', async () => {
        await assertFails(getDocs(collection(otherDeveloperDb(), 'engagements', ENGAGEMENT_ID, 'messages')))
        await assertFails(getDocs(collection(otherCustomerDb(), 'engagements', ENGAGEMENT_ID, 'messages')))

        await assertFails(setDoc(doc(otherDeveloperDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm4'), messageFrom('otherdev-uid', OTHER_DEVELOPER_EMAIL, 'developer')))
        await assertFails(setDoc(doc(otherCustomerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm5'), messageFrom(OTHER_CUSTOMER_UID, OTHER_CUSTOMER_EMAIL, 'customer')))
    })

    it('blocks an unverified customer from reading or posting even though they own the engagement', async () => {
        await assertFails(getDocs(collection(unverifiedCustomerDb(), 'engagements', ENGAGEMENT_ID, 'messages')))
        await assertFails(setDoc(doc(unverifiedCustomerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm6'), messageFrom(CUSTOMER_UID, CUSTOMER_EMAIL, 'customer')))
    })

    it('rejects a message with a spoofed senderId or senderEmail', async () => {
        await assertFails(setDoc(doc(customerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm7'), messageFrom('admin-uid', ADMIN_EMAIL, 'admin')))
        await assertFails(setDoc(doc(customerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm8'), messageFrom(CUSTOMER_UID, 'spoofed@example.com', 'customer')))
    })

    it('rejects a message with a spoofed senderRole, even with a correct senderId/senderEmail', async () => {
        await assertFails(setDoc(doc(customerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm9'), messageFrom(CUSTOMER_UID, CUSTOMER_EMAIL, 'admin')))
        await assertFails(setDoc(doc(developerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm10'), messageFrom('dev-uid', DEVELOPER_EMAIL, 'admin')))
    })

    it('rejects a non-https attachmentUrl and accepts an https one', async () => {
        await assertFails(
            setDoc(doc(customerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm11'), attachmentMessageFrom(CUSTOMER_UID, CUSTOMER_EMAIL, 'customer', 'javascript:alert(1)')),
        )
        await assertFails(
            setDoc(doc(customerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm12'), attachmentMessageFrom(CUSTOMER_UID, CUSTOMER_EMAIL, 'customer', 'data:text/html,evil')),
        )
        await assertSucceeds(
            setDoc(
                doc(customerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'm13'),
                attachmentMessageFrom(CUSTOMER_UID, CUSTOMER_EMAIL, 'customer', 'https://res.cloudinary.com/demo/receipt.png'),
            ),
        )
    })

    it('never allows editing or deleting a posted message, for any role', async () => {
        await assertFails(updateDoc(doc(adminDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'existing-message'), { text: 'edited' }))
        await assertFails(deleteDoc(doc(adminDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'existing-message')))
        await assertFails(deleteDoc(doc(customerDb(), 'engagements', ENGAGEMENT_ID, 'messages', 'existing-message')))
    })
})
