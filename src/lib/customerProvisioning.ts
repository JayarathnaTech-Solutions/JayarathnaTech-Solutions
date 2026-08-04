import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { secondaryAuth } from '../firebase/secondaryApp'
import { db } from '../firebase/config'

export class CustomerAlreadyExistsError extends Error {}

/** A one-time password the admin copies and relays to the customer out-of-band — never persisted anywhere. */
export function generateTempPassword(): string {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

export async function createCustomerAccount({
    email,
    name,
    company,
    tempPassword,
    createdBy,
}: {
    email: string
    name: string
    company?: string
    tempPassword: string
    createdBy: string
}): Promise<string> {
    let uid: string
    try {
        const credential = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword)
        uid = credential.user.uid
        await sendEmailVerification(credential.user)
    } catch (err) {
        if ((err as { code?: string }).code === 'auth/email-already-in-use') {
            throw new CustomerAlreadyExistsError(`${email} already has an account`)
        }
        throw err
    } finally {
        // The secondary session is only ever transient — never leave a
        // customer signed in on it, even if verification email sending failed.
        await signOut(secondaryAuth)
    }

    // This write goes through the PRIMARY db, so Firestore rules see the
    // ADMIN's token here (matching the isAdmin()-gated create rule on
    // /customers), not the customer's.
    await setDoc(doc(db, 'customers', uid), {
        uid,
        email,
        name,
        company: company ?? '',
        mustChangePassword: true,
        createdBy,
        createdAt: serverTimestamp(),
    })

    return uid
}
