import {useEffect, useState} from "react";
import type {Project} from "../types";
import {collection, getDocs, limit, orderBy, query} from "firebase/firestore";
import {db} from "../firebase/config.ts";
import {projectFromDoc} from "./firestore.ts";

export function useFeaturedProjects() {
    const [projects, setProjects] = useState<Project[] | null>(null)

    useEffect(() => {
        let cancelled = false

        getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(3)))
            .then((snapshot) => {
                if (cancelled) return
                setProjects(snapshot.docs.map(projectFromDoc))
            })
            .catch(() => {
                if (!cancelled) setProjects([])
            })

        return () => {
            cancelled = true
        }
    }, [])

    return projects
}