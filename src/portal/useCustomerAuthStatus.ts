import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { customerFromDoc } from '../lib/firestore'
import type { Customer } from '../types'

export type CustomerAuthStatus =
    | { status: 'checking' }
    | { status: 'signed-out' }
    | { status: 'not-customer' }
    | { status: 'authorized'; user: User; customer: Customer }

export function useCustomerAuthStatus(): CustomerAuthStatus {
    const [state, setState] = useState<CustomerAuthStatus>({ status: 'checking' })

    useEffect(() => {
        return onAuthStateChanged(auth, (user) => {
            if (!user) {
                setState({ status: 'signed-out' })
                return
            }

            getDoc(doc(db, 'customers', user.uid))
                .then((snapshot) => {
                    if (!snapshot.exists()) {
                        setState({ status: 'not-customer' })
                        return
                    }
                    setState({ status: 'authorized', user, customer: customerFromDoc(snapshot) })
                })
                .catch(() => setState({ status: 'not-customer' }))
        })
    }, [])

    return state
}
