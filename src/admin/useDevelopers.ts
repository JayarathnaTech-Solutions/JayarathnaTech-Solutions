import { collection, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { staffMemberFromDoc } from '../lib/firestore'
import { useFirestoreCollection } from '../lib/useFirestoreCollection'

export function useDevelopers() {
    const { data } = useFirestoreCollection(
        () => query(collection(db, 'staff'), where('role', '==', 'developer')),
        staffMemberFromDoc,
    )

    return data
}
