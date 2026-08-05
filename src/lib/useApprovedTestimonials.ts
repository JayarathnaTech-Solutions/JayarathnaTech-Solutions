import {useEffect, useState} from "react";
import type {Testimonial} from "../types";
import {collection, getDocs, query, where} from "firebase/firestore";
import {db} from "../firebase/config.ts";
import {testimonialFromDoc} from "./firestore.ts";

export function useApprovedTestimonials() {
    const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null)

    useEffect(() => {
        let cancelled = false

        getDocs(query(collection(db, 'testimonials'), where('status', '==', 'approved')))
            .then((snapshot) => {
                if (cancelled) return
                setTestimonials(snapshot.docs.map(testimonialFromDoc))
            })
            .catch(() => {
                if (!cancelled) setTestimonials([])
            })

        return () => {
            cancelled = true
        }
    }, [])

    return testimonials
}