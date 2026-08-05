import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { companyFromDoc } from './firestore'
import type { Company } from '../types'

export function useCompanies() {
    const [companies, setCompanies] = useState<Company[] | null>(null)

    useEffect(() => {
        let cancelled = false

        getDocs(query(collection(db, 'companies'), orderBy('createdAt', 'desc')))
            .then((snapshot) => {
                if (cancelled) return
                setCompanies(snapshot.docs.map(companyFromDoc))
            })
            .catch(() => {
                if (!cancelled) setCompanies([])
            })

        return () => {
            cancelled = true
        }
    }, [])

    return companies
}
