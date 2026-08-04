import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
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
            if (!user || !user.email) {
                setState({ status: 'signed-out' })
                return
            }

            const staffRef = doc(db, 'staff', user.email)

            getDoc(staffRef)
                .then((snapshot) => {
                    if (!snapshot.exists()) {
                        setState({ status: 'not-staff' })
                        return
                    }

                    const staff = staffMemberFromDoc(snapshot)
                    setState({ status: 'authorized', user, staff })

                    // Invites are created with only an email + role — backfill the
                    // display name from Google on the invitee's first sign-in.
                    if (!staff.name && user.displayName) {
                        void updateDoc(staffRef, { name: user.displayName })
                    }
                })
                .catch(() => setState({ status: 'not-staff' }))
        })
    }, [])

    return state
}
