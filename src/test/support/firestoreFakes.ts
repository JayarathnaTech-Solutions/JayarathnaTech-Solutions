import type { DocumentData, DocumentSnapshot } from 'firebase/firestore'
import type { BankDetails } from '../../types'

// What getDoc resolves with for settings/bankDetails: pass null for a
// business that hasn't set up a bank account yet.
export const bankDetailsSnapshot = (bankDetails: BankDetails | null) =>
    ({
        id: 'bankDetails',
        exists: () => bankDetails !== null,
        data: () => (bankDetails ? { ...bankDetails } : undefined),
    }) as unknown as DocumentSnapshot<DocumentData>
