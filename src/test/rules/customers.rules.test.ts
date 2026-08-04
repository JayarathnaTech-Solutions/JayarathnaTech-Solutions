import { readFileSync } from 'node:fs'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'

const ADMIN_EMAIL = 'admin@example.com'
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
        await setDoc(doc(db, 'staff', ADMIN_EMAIL), {
            email: ADMIN_EMAIL, name: 'Admin', role: 'admin', invitedBy: 'bootstrap', createdAt: new Date(),
        })
        await setDoc(doc(db, 'customers', CUSTOMER_UID), {
            uid: CUSTOMER_UID, email: CUSTOMER_EMAIL, name: 'Customer One', mustChangePassword: true,
            createdBy: ADMIN_EMAIL, createdAt: new Date(),
        })
        await setDoc(doc(db, 'customers', OTHER_CUSTOMER_UID), {
            uid: OTHER_CUSTOMER_UID, email: OTHER_CUSTOMER_EMAIL, name: 'Customer Two', mustChangePassword: false,
            createdBy: ADMIN_EMAIL, createdAt: new Date(),
        })
    })
})

function adminDb() {
    return testEnv.authenticatedContext('admin-uid', { email: ADMIN_EMAIL }).firestore()
}
function customerDb() {
    return testEnv.authenticatedContext(CUSTOMER_UID, { email: CUSTOMER_EMAIL, email_verified: true }).firestore()
}

describe('customers', () => {
    it('lets a customer get their own doc but not another customer\'s', async () => {
        await assertSucceeds(getDoc(doc(customerDb(), 'customers', CUSTOMER_UID)))
        await assertFails(getDoc(doc(customerDb(), 'customers', OTHER_CUSTOMER_UID)))
    })

    it('only allows admin to list customers', async () => {
        await assertSucceeds(getDoc(doc(adminDb(), 'customers', CUSTOMER_UID)))
        await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), 'customers', CUSTOMER_UID)))
    })

    it('only allows admin to create or delete a customer doc', async () => {
        await assertFails(
            setDoc(doc(customerDb(), 'customers', 'new-uid'), {
                uid: 'new-uid', email: 'new@example.com', name: 'New', mustChangePassword: true,
                createdBy: CUSTOMER_EMAIL, createdAt: new Date(),
            }),
        )
        await assertSucceeds(
            setDoc(doc(adminDb(), 'customers', 'new-uid'), {
                uid: 'new-uid', email: 'new@example.com', name: 'New', mustChangePassword: true,
                createdBy: ADMIN_EMAIL, createdAt: new Date(),
            }),
        )
        await assertFails(deleteDoc(doc(customerDb(), 'customers', OTHER_CUSTOMER_UID)))
        await assertSucceeds(deleteDoc(doc(adminDb(), 'customers', OTHER_CUSTOMER_UID)))
    })

    it('lets a customer clear mustChangePassword and edit their own name only', async () => {
        await assertSucceeds(updateDoc(doc(customerDb(), 'customers', CUSTOMER_UID), { mustChangePassword: false }))
        await assertSucceeds(updateDoc(doc(customerDb(), 'customers', CUSTOMER_UID), { name: 'New Name' }))
    })

    it('blocks a customer from editing their own email or another field', async () => {
        await assertFails(updateDoc(doc(customerDb(), 'customers', CUSTOMER_UID), { email: 'hacked@example.com' }))
        await assertFails(updateDoc(doc(customerDb(), 'customers', CUSTOMER_UID), { createdBy: 'hacked' }))
    })

    it('blocks a customer from editing another customer\'s doc', async () => {
        await assertFails(updateDoc(doc(customerDb(), 'customers', OTHER_CUSTOMER_UID), { name: 'Hijacked' }))
    })
})
