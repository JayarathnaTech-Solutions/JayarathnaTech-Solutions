import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { bankDetailsFromDoc } from './firestore'
import type { BankDetails } from '../types'

// The business's one bank account, from settings/bankDetails. `undefined`
// while loading, `null` when none is set up. A failed read also reads as
// `null` (see Known gaps: swallowed errors), so callers show the "not set up"
// state rather than a blank one.
export const useBankDetails = () => {
    const [bankDetails, setBankDetails] = useState<BankDetails | null | undefined>(undefined)

    useEffect(() => {
        getDoc(doc(db, 'settings', 'bankDetails'))
            .then((snapshot) => setBankDetails(snapshot.exists() ? bankDetailsFromDoc(snapshot) : null))
            .catch(() => setBankDetails(null))
    }, [])

    return bankDetails
}
