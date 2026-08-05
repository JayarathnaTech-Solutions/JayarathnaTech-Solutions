import { useEffect, useState } from 'react'
import { collection, getCountFromServer } from 'firebase/firestore'
import { db } from '../firebase/config'

// Aggregate count query — cheap, doesn't download project documents, unlike
// useFeaturedProjects (which only fetches the latest 3 for display).
export function useProjectsCount() {
    const [count, setCount] = useState<number | null>(null)

    useEffect(() => {
        let cancelled = false

        getCountFromServer(collection(db, 'projects'))
            .then((snapshot) => {
                if (!cancelled) setCount(snapshot.data().count)
            })
            .catch(() => {
                if (!cancelled) setCount(0)
            })

        return () => {
            cancelled = true
        }
    }, [])

    return count
}
