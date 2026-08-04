import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { staffMemberFromDoc } from '../lib/firestore'
import type { StaffMember } from '../types'

export function useDevelopers() {
    const [developers, setDevelopers] = useState<StaffMember[] | null>(null)

    useEffect(() => {
        getDocs(query(collection(db, 'staff'), where('role', '==', 'developer')))
            .then((snapshot) => setDevelopers(snapshot.docs.map(staffMemberFromDoc)))
            .catch(() => setDevelopers([]))
    }, [])

    return developers
}
