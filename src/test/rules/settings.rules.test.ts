import { readFileSync } from 'node:fs'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const ADMIN_EMAIL = 'admin@example.com'
const EDITOR_EMAIL = 'editor@example.com'
const CUSTOMER_UID = 'customer-1-uid'
const CUSTOMER_EMAIL = 'customer1@example.com'

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
        await setDoc(doc(db, 'staff', EDITOR_EMAIL), { email: EDITOR_EMAIL, name: 'Editor', role: 'editor', invitedBy: ADMIN_EMAIL, createdAt: new Date() })
        await setDoc(doc(db, 'customers', CUSTOMER_UID), { uid: CUSTOMER_UID, email: CUSTOMER_EMAIL, name: 'Customer', mustChangePassword: false, createdBy: ADMIN_EMAIL, createdAt: new Date() })
        await setDoc(doc(db, 'settings', 'bankDetails'), {
            bankName: 'Commercial Bank of Ceylon', accountName: 'JayarathnaTech Solutions', accountNumber: '1234567890', branchSwift: 'Colombo / CCEYLKLX',
        })
    })
})

function adminDb() {
    return testEnv.authenticatedContext('admin-uid', { email: ADMIN_EMAIL }).firestore()
}
function editorDb() {
    return testEnv.authenticatedContext('editor-uid', { email: EDITOR_EMAIL }).firestore()
}
function customerDb() {
    return testEnv.authenticatedContext(CUSTOMER_UID, { email: CUSTOMER_EMAIL, email_verified: true }).firestore()
}
function publicDb() {
    return testEnv.unauthenticatedContext().firestore()
}

describe('settings/bankDetails', () => {
    it('lets any signed-in staff or customer read it', async () => {
        await assertSucceeds(getDoc(doc(adminDb(), 'settings', 'bankDetails')))
        await assertSucceeds(getDoc(doc(editorDb(), 'settings', 'bankDetails')))
        await assertSucceeds(getDoc(doc(customerDb(), 'settings', 'bankDetails')))
    })

    it('blocks an unauthenticated read', async () => {
        await assertFails(getDoc(doc(publicDb(), 'settings', 'bankDetails')))
    })

    it('only allows admin to write it', async () => {
        await assertFails(
            setDoc(doc(editorDb(), 'settings', 'bankDetails'), { bankName: 'Hacked', accountName: '', accountNumber: '', branchSwift: '' }),
        )
        await assertFails(
            setDoc(doc(customerDb(), 'settings', 'bankDetails'), { bankName: 'Hacked', accountName: '', accountNumber: '', branchSwift: '' }),
        )
        await assertSucceeds(
            setDoc(doc(adminDb(), 'settings', 'bankDetails'), { bankName: 'Real Bank', accountName: 'JayarathnaTech', accountNumber: '9999', branchSwift: 'Colombo' }),
        )
    })
})
