import type {Testimonial} from "../types";
import {buildOrganizationSchema} from "./siteInfo.ts";

export function buildTestimonialsSchema(testimonials: Testimonial[]) {
    const rated = testimonials.filter((t): t is Testimonial & { rating: number } => typeof t.rating === 'number')
    if (rated.length === 0) return null

    return {
        ...buildOrganizationSchema(),
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (rated.reduce((sum, t) => sum + t.rating, 0) / rated.length).toFixed(1),
            reviewCount: rated.length,
        },
        review: rated.map((t) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: t.clientName },
            reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: 5 },
            reviewBody: t.message,
        })),
    }
}