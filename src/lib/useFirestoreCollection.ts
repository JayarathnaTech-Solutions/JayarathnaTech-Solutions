import { useEffect, useState, type DependencyList } from 'react'
import { getDocs, type DocumentData, type Query, type QueryDocumentSnapshot } from 'firebase/firestore'

// Shared shape for "fetch a Firestore collection, map each doc, expose a
// reload" — the same pattern was hand-rolled per page (customers, staff,
// projects, quotes, engagements, developers...). `buildQuery` is called fresh
// on every reload so it can close over whatever the caller's deps are.
export function useFirestoreCollection<T>(
    buildQuery: () => Query<DocumentData>,
    fromDoc: (doc: QueryDocumentSnapshot<DocumentData>) => T,
    deps: DependencyList = [],
) {
    const [data, setData] = useState<T[] | null>(null)

    const reload = () => {
        getDocs(buildQuery())
            .then((snapshot) => setData(snapshot.docs.map(fromDoc)))
            .catch(() => setData([]))
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(reload, deps)

    return { data, reload }
}
