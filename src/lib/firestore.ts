import { Timestamp, type DocumentData, type QueryDocumentSnapshot, type DocumentSnapshot } from 'firebase/firestore'
import type { Project } from '../types'

export function toIsoString(value: unknown): string {
    if (value instanceof Timestamp) return value.toDate().toISOString()
    if (typeof value === 'string') return value
    return new Date().toISOString()
}

export function projectFromDoc(
    doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Project {
    const data = doc.data()
    if (!data) throw new Error(`Project document ${doc.id} does not exist`)
    return {
        id: doc.id,
        title: data.title,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        createdAt: toIsoString(data.createdAt),
        category: data.category,
        client: data.client,
        technologies: data.technologies,
        challenge: data.challenge,
        solution: data.solution,
        keyFeatures: data.keyFeatures,
    }
}
