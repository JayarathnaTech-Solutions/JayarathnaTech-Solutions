import { readFileSync } from 'node:fs'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'

const ADMIN_EMAIL = 'admin@example.com'
const EDITOR_EMAIL = 'editor@example.com'
const HR_EMAIL = 'hr@example.com'
const OUTSIDER_EMAIL = 'outsider@example.com'

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

async function seedStaff() {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'staff', ADMIN_EMAIL), {
            email: ADMIN_EMAIL,
            name: 'Admin',
            role: 'admin',
            invitedBy: 'bootstrap',
            createdAt: new Date(),
        })
        await setDoc(doc(db, 'staff', EDITOR_EMAIL), {
            email: EDITOR_EMAIL,
            name: 'Editor',
            role: 'editor',
            invitedBy: ADMIN_EMAIL,
            createdAt: new Date(),
        })
        await setDoc(doc(db, 'staff', HR_EMAIL), {
            email: HR_EMAIL,
            name: 'HR',
            role: 'hr',
            invitedBy: ADMIN_EMAIL,
            createdAt: new Date(),
        })
    })
}

beforeEach(seedStaff)

function adminDb() {
    return testEnv.authenticatedContext('admin-uid', { email: ADMIN_EMAIL }).firestore()
}
function editorDb() {
    return testEnv.authenticatedContext('editor-uid', { email: EDITOR_EMAIL }).firestore()
}
function hrDb() {
    return testEnv.authenticatedContext('hr-uid', { email: HR_EMAIL }).firestore()
}
// Signed in with Google, but never invited — not present in `staff`.
function outsiderDb() {
    return testEnv.authenticatedContext('outsider-uid', { email: OUTSIDER_EMAIL }).firestore()
}
function publicDb() {
    return testEnv.unauthenticatedContext().firestore()
}

describe('staff', () => {
    it('lets a staff member read their own doc', async () => {
        await assertSucceeds(getDoc(doc(editorDb(), 'staff', EDITOR_EMAIL)))
    })

    it('denies reading someone else\'s staff doc', async () => {
        await assertFails(getDoc(doc(editorDb(), 'staff', ADMIN_EMAIL)))
    })

    it('only allows admins to list all staff', async () => {
        await assertSucceeds(getDocs(collection(adminDb(), 'staff')))
        await assertFails(getDocs(collection(editorDb(), 'staff')))
        await assertFails(getDocs(collection(outsiderDb(), 'staff')))
    })

    it('only allows admins to create a new staff doc', async () => {
        await assertSucceeds(
            setDoc(doc(adminDb(), 'staff', 'new@example.com'), {
                email: 'new@example.com',
                name: '',
                role: 'editor',
                invitedBy: ADMIN_EMAIL,
                createdAt: new Date(),
            }),
        )
        await assertFails(
            setDoc(doc(editorDb(), 'staff', 'blocked@example.com'), {
                email: 'blocked@example.com',
                name: '',
                role: 'editor',
                invitedBy: EDITOR_EMAIL,
                createdAt: new Date(),
            }),
        )
    })

    it('lets a staff member update only their own name', async () => {
        await assertSucceeds(updateDoc(doc(editorDb(), 'staff', EDITOR_EMAIL), { name: 'New Name' }))
    })

    it('blocks a staff member from escalating their own role', async () => {
        await assertFails(updateDoc(doc(editorDb(), 'staff', EDITOR_EMAIL), { role: 'admin' }))
    })

    it('blocks a staff member from editing someone else\'s doc', async () => {
        await assertFails(updateDoc(doc(editorDb(), 'staff', ADMIN_EMAIL), { name: 'Hijacked' }))
    })

    it('lets an admin update any staff doc', async () => {
        await assertSucceeds(updateDoc(doc(adminDb(), 'staff', EDITOR_EMAIL), { role: 'admin' }))
    })

    it('only allows admins to delete a staff member', async () => {
        await assertFails(deleteDoc(doc(editorDb(), 'staff', ADMIN_EMAIL)))
        await assertSucceeds(deleteDoc(doc(adminDb(), 'staff', EDITOR_EMAIL)))
    })

    it('lets an admin create a developer', async () => {
        await assertSucceeds(
            setDoc(doc(adminDb(), 'staff', 'newdev@example.com'), {
                email: 'newdev@example.com', name: '', role: 'developer', invitedBy: ADMIN_EMAIL, createdAt: new Date(),
            }),
        )
    })

    it('rejects creating or promoting to an invalid role', async () => {
        await assertFails(
            setDoc(doc(adminDb(), 'staff', 'bogus@example.com'), {
                email: 'bogus@example.com', name: '', role: 'superadmin', invitedBy: ADMIN_EMAIL, createdAt: new Date(),
            }),
        )
        await assertFails(updateDoc(doc(adminDb(), 'staff', EDITOR_EMAIL), { role: 'superadmin' }))
    })

    it('gives hr staff-management parity with admin for non-admin staff', async () => {
        await assertSucceeds(getDocs(collection(hrDb(), 'staff')))
        await assertSucceeds(
            setDoc(doc(hrDb(), 'staff', 'newhrinvite@example.com'), {
                email: 'newhrinvite@example.com', name: '', role: 'editor', invitedBy: HR_EMAIL, createdAt: new Date(),
            }),
        )
        await assertSucceeds(updateDoc(doc(hrDb(), 'staff', EDITOR_EMAIL), { role: 'developer' }))
        await assertSucceeds(deleteDoc(doc(hrDb(), 'staff', 'newhrinvite@example.com')))
    })

    it('lets an admin create an hr staff member, and rejects invalid roles from hr too', async () => {
        await assertSucceeds(
            setDoc(doc(adminDb(), 'staff', 'newhr@example.com'), {
                email: 'newhr@example.com', name: '', role: 'hr', invitedBy: ADMIN_EMAIL, createdAt: new Date(),
            }),
        )
        await assertFails(
            setDoc(doc(hrDb(), 'staff', 'bogus2@example.com'), {
                email: 'bogus2@example.com', name: '', role: 'superadmin', invitedBy: HR_EMAIL, createdAt: new Date(),
            }),
        )
    })

    it('blocks hr from touching admin accounts at all', async () => {
        await assertFails(updateDoc(doc(hrDb(), 'staff', ADMIN_EMAIL), { role: 'editor' }))
        await assertFails(deleteDoc(doc(hrDb(), 'staff', ADMIN_EMAIL)))
        await assertFails(
            setDoc(doc(hrDb(), 'staff', 'newadmin@example.com'), {
                email: 'newadmin@example.com', name: '', role: 'admin', invitedBy: HR_EMAIL, createdAt: new Date(),
            }),
        )
    })

    it('blocks hr from promoting a non-admin to admin', async () => {
        await assertFails(updateDoc(doc(hrDb(), 'staff', EDITOR_EMAIL), { role: 'admin' }))
    })

    it('still lets admin fully manage admin accounts', async () => {
        await assertSucceeds(updateDoc(doc(adminDb(), 'staff', ADMIN_EMAIL), { role: 'admin' }))
    })
})

describe('staffRecords', () => {
    async function seedStaffRecord() {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), 'staffRecords', EDITOR_EMAIL), {
                nic: '901234567V',
                birthday: '1990-01-01',
                address: '123 Main St',
                phone1: '+94771234567',
                phone2: '',
                nicFrontUrl: 'https://res.cloudinary.com/demo/image/upload/front.jpg',
                nicBackUrl: '',
                updatedAt: new Date(),
                updatedBy: ADMIN_EMAIL,
            })
        })
    }

    it('lets admin and hr read a staff record, denies everyone else', async () => {
        await seedStaffRecord()
        await assertSucceeds(getDoc(doc(adminDb(), 'staffRecords', EDITOR_EMAIL)))
        await assertSucceeds(getDoc(doc(hrDb(), 'staffRecords', EDITOR_EMAIL)))
        await assertFails(getDoc(doc(editorDb(), 'staffRecords', EDITOR_EMAIL)))
        await assertFails(getDoc(doc(outsiderDb(), 'staffRecords', EDITOR_EMAIL)))
        await assertFails(getDoc(doc(publicDb(), 'staffRecords', EDITOR_EMAIL)))
    })

    it('lets admin and hr list staff records, denies everyone else', async () => {
        await seedStaffRecord()
        await assertSucceeds(getDocs(collection(adminDb(), 'staffRecords')))
        await assertSucceeds(getDocs(collection(hrDb(), 'staffRecords')))
        await assertFails(getDocs(collection(editorDb(), 'staffRecords')))
    })

    it('lets admin and hr create/update a staff record, denies everyone else', async () => {
        const payload = {
            nic: '901234567V',
            birthday: '1990-01-01',
            address: '123 Main St',
            phone1: '+94771234567',
            phone2: '',
            nicFrontUrl: '',
            nicBackUrl: '',
            updatedAt: new Date(),
            updatedBy: ADMIN_EMAIL,
        }
        await assertSucceeds(setDoc(doc(adminDb(), 'staffRecords', EDITOR_EMAIL), payload))
        await assertSucceeds(setDoc(doc(hrDb(), 'staffRecords', EDITOR_EMAIL), { ...payload, updatedBy: HR_EMAIL }))
        await assertFails(setDoc(doc(editorDb(), 'staffRecords', EDITOR_EMAIL), payload))
        await assertFails(setDoc(doc(outsiderDb(), 'staffRecords', EDITOR_EMAIL), payload))
    })

    it('rejects a non-https NIC image URL', async () => {
        await assertFails(
            setDoc(doc(adminDb(), 'staffRecords', EDITOR_EMAIL), {
                nic: '', birthday: '', address: '', phone1: '', phone2: '',
                nicFrontUrl: 'javascript:alert(1)',
                nicBackUrl: '',
                updatedAt: new Date(),
                updatedBy: ADMIN_EMAIL,
            }),
        )
    })

    it('rejects a write that touches a field outside the allowlist', async () => {
        await assertFails(
            setDoc(doc(adminDb(), 'staffRecords', EDITOR_EMAIL), {
                nic: '', birthday: '', address: '', phone1: '', phone2: '',
                nicFrontUrl: '', nicBackUrl: '',
                updatedAt: new Date(), updatedBy: ADMIN_EMAIL,
                role: 'admin',
            }),
        )
    })

    it('lets admin and hr delete a staff record, denies everyone else', async () => {
        await seedStaffRecord()
        await assertFails(deleteDoc(doc(editorDb(), 'staffRecords', EDITOR_EMAIL)))
        await assertSucceeds(deleteDoc(doc(hrDb(), 'staffRecords', EDITOR_EMAIL)))
    })

    it('blocks hr from reading or writing the admin staff record, but admin still can', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), 'staffRecords', ADMIN_EMAIL), {
                nic: '901234567V', birthday: '', address: '', phone1: '', phone2: '',
                nicFrontUrl: '', nicBackUrl: '', updatedAt: new Date(), updatedBy: ADMIN_EMAIL,
            })
        })
        await assertFails(getDoc(doc(hrDb(), 'staffRecords', ADMIN_EMAIL)))
        await assertFails(deleteDoc(doc(hrDb(), 'staffRecords', ADMIN_EMAIL)))
        await assertFails(
            updateDoc(doc(hrDb(), 'staffRecords', ADMIN_EMAIL), { nic: 'hijacked' }),
        )
        await assertSucceeds(getDoc(doc(adminDb(), 'staffRecords', ADMIN_EMAIL)))
    })
})

describe('projects', () => {
    it('allows anyone to read', async () => {
        await assertSucceeds(getDocs(collection(publicDb(), 'projects')))
    })

    it('only allows staff to write', async () => {
        await assertFails(setDoc(doc(publicDb(), 'projects', 'p1'), { title: 'Hack', description: '', coverImageUrl: '', createdAt: new Date() }))
        await assertFails(setDoc(doc(outsiderDb(), 'projects', 'p1'), { title: 'Hack', description: '', coverImageUrl: '', createdAt: new Date() }))
        await assertSucceeds(
            setDoc(doc(editorDb(), 'projects', 'p1'), { title: 'Real Project', description: '', coverImageUrl: '', createdAt: new Date() }),
        )
    })
})

describe('quotes', () => {
    it('is staff-only for read and write', async () => {
        await assertFails(getDocs(collection(publicDb(), 'quotes')))
        await assertFails(getDocs(collection(outsiderDb(), 'quotes')))
        await assertSucceeds(getDocs(collection(editorDb(), 'quotes')))

        await assertFails(
            setDoc(doc(publicDb(), 'quotes', 'q1'), { clientName: 'x', clientEmail: 'x', lineItems: [], status: 'draft', currency: 'USD', bufferPercent: 0, profitPercent: 0, createdAt: new Date() }),
        )
        await assertSucceeds(
            setDoc(doc(editorDb(), 'quotes', 'q1'), { clientName: 'x', clientEmail: 'x', lineItems: [], status: 'draft', currency: 'USD', bufferPercent: 0, profitPercent: 0, createdAt: new Date() }),
        )
    })
})

describe('contactMessages', () => {
    it('allows a public create with valid required fields and read: false', async () => {
        await assertSucceeds(
            setDoc(doc(publicDb(), 'contactMessages', 'm1'), {
                name: 'Jane',
                email: 'jane@example.com',
                message: 'Hello',
                read: false,
                createdAt: new Date(),
            }),
        )
    })

    it('rejects a public create missing a required field', async () => {
        await assertFails(
            setDoc(doc(publicDb(), 'contactMessages', 'm2'), {
                name: '',
                email: 'jane@example.com',
                message: 'Hello',
                read: false,
                createdAt: new Date(),
            }),
        )
    })

    it('rejects a public create that claims to already be read', async () => {
        await assertFails(
            setDoc(doc(publicDb(), 'contactMessages', 'm3'), {
                name: 'Jane',
                email: 'jane@example.com',
                message: 'Hello',
                read: true,
                createdAt: new Date(),
            }),
        )
    })

    it('is staff-only for read', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), 'contactMessages', 'm4'), {
                name: 'Jane',
                email: 'jane@example.com',
                message: 'Hello',
                read: false,
                createdAt: new Date(),
            })
        })

        await assertFails(getDoc(doc(publicDb(), 'contactMessages', 'm4')))
        await assertSucceeds(getDoc(doc(editorDb(), 'contactMessages', 'm4')))
    })
})

describe('testimonials', () => {
    async function seedTestimonial(id: string, status: 'pending' | 'approved') {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), 'testimonials', id), {
                clientName: 'Jane',
                message: 'Great work',
                status,
                createdAt: new Date(),
            })
        })
    }

    it('lets anyone read approved testimonials but not pending ones', async () => {
        await seedTestimonial('approved1', 'approved')
        await seedTestimonial('pending1', 'pending')

        await assertSucceeds(getDoc(doc(publicDb(), 'testimonials', 'approved1')))
        await assertFails(getDoc(doc(publicDb(), 'testimonials', 'pending1')))
        await assertSucceeds(getDoc(doc(editorDb(), 'testimonials', 'pending1')))
    })

    it('allows a public create with valid pending data', async () => {
        await assertSucceeds(
            setDoc(doc(publicDb(), 'testimonials', 't1'), {
                clientName: 'Jane',
                message: 'Great work',
                rating: 5,
                status: 'pending',
                createdAt: new Date(),
            }),
        )
    })

    it('rejects a create with an out-of-range rating', async () => {
        await assertFails(
            setDoc(doc(publicDb(), 'testimonials', 't2'), {
                clientName: 'Jane',
                message: 'Great work',
                rating: 6,
                status: 'pending',
                createdAt: new Date(),
            }),
        )
    })

    it('rejects a create missing clientName', async () => {
        await assertFails(
            setDoc(doc(publicDb(), 'testimonials', 't3'), {
                clientName: '',
                message: 'Great work',
                status: 'pending',
                createdAt: new Date(),
            }),
        )
    })

    it('only allows staff to approve/reject', async () => {
        await seedTestimonial('pending2', 'pending')
        await assertFails(updateDoc(doc(publicDb(), 'testimonials', 'pending2'), { status: 'approved' }))
        await assertSucceeds(updateDoc(doc(editorDb(), 'testimonials', 'pending2'), { status: 'approved' }))
    })
})

describe('testimonialInvites', () => {
    async function seedInvite(id: string, used: boolean) {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), 'testimonialInvites', id), { used, createdAt: new Date() })
        })
    }

    it('allows a public get-by-id but not list', async () => {
        await seedInvite('invite1', false)
        await assertSucceeds(getDoc(doc(publicDb(), 'testimonialInvites', 'invite1')))
        await assertFails(getDocs(collection(publicDb(), 'testimonialInvites')))
        await assertSucceeds(getDocs(collection(editorDb(), 'testimonialInvites')))
    })

    it('only allows staff to generate a new invite', async () => {
        await assertFails(setDoc(doc(publicDb(), 'testimonialInvites', 'invite2'), { used: false, createdAt: new Date() }))
        await assertSucceeds(setDoc(doc(editorDb(), 'testimonialInvites', 'invite2'), { used: false, createdAt: new Date() }))
    })

    it('allows the public to mark an unused invite as used, and nothing else', async () => {
        await seedInvite('invite3', false)
        await assertSucceeds(updateDoc(doc(publicDb(), 'testimonialInvites', 'invite3'), { used: true }))
    })

    it('rejects reusing an already-used invite', async () => {
        await seedInvite('invite4', true)
        await assertFails(updateDoc(doc(publicDb(), 'testimonialInvites', 'invite4'), { used: true }))
    })

    it('rejects updating fields other than `used`', async () => {
        await seedInvite('invite5', false)
        await assertFails(updateDoc(doc(publicDb(), 'testimonialInvites', 'invite5'), { used: true, token: 'hacked' }))
    })
})

describe('everything else', () => {
    it('denies access to an undeclared collection by default', async () => {
        await assertFails(getDocs(collection(adminDb(), 'somethingUnrelated')))
    })
})
