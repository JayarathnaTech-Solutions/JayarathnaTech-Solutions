import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { staffMemberFromDoc } from '../lib/firestore'
import type { StaffMember } from '../types'

export type AuthStatus =
    | { status: 'checking' }
    | { status: 'signed-out' }
    | { status: 'not-staff' }
    | { status: 'authorized'; user: User; staff: StaffMember }

export function useAuthStatus(): AuthStatus {
    const [state, setState] = useState<AuthStatus>({ status: 'checking' })

    useEffect(() => {
        return onAuthStateChanged(auth, (user) => {
            if (!user) {
                setState({ status: 'signed-out' })
                return
            }

            getDoc(doc(db, 'staff', user.uid))
                .then((snapshot) => {
                    setState(
                        snapshot.exists()
                            ? { status: 'authorized', user, staff: staffMemberFromDoc(snapshot) }
                            : { status: 'not-staff' },
                    )
                })
                .catch(() => setState({ status: 'not-staff' }))
        })
    }, [])

    return state
}
