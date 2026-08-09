import { collection, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { staffMemberFromDoc } from '../lib/firestore'
import { useFirestoreCollection } from '../lib/useFirestoreCollection'

// Named for the historical primary case (developers), but returns everyone
// who can be assigned to an engagement — qa/intern/uiux share the exact same
// assignedDeveloperEmails-based access (see firestore.rules'
// isAssignedToEngagement()), so they belong in the same assignable pool.
export function useDevelopers() {
    const { data } = useFirestoreCollection(
        () => query(collection(db, 'staff'), where('role', 'in', ['developer', 'qa', 'intern', 'uiux'])),
        staffMemberFromDoc,
    )

    return data
}
