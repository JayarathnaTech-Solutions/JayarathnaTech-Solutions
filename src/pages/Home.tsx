import { Seo } from '../components/Seo'
import { JsonLd } from '../components/JsonLd'
import { CtaBanner } from '../components/CtaBanner'
import {FeaturedTestimonials} from "../components/FeaturedTestimonials.tsx";
import {Services} from "../components/Services.tsx";
import {Hero} from "../components/Hero.tsx";
import {FeaturedProjects} from "../components/FeaturedProjects.tsx";
import {WhyChooseUs} from "../components/WhyChooseUs.tsx";
import {buildTestimonialsSchema} from "../lib/buildTestimonialsSchema.ts";
import {useFeaturedProjects} from "../lib/useFeaturedProjects.ts";
import {useApprovedTestimonials} from "../lib/useApprovedTestimonials.ts";

export function Home() {
    const projects = useFeaturedProjects()
    const testimonials = useApprovedTestimonials()
    const testimonialsSchema = testimonials ? buildTestimonialsSchema(testimonials) : null

    return (
        <>
            <Seo
                title="JayarathnaTech Solutions — Software Company in Sri Lanka & Worldwide"
                description="JayarathnaTech Solutions is a software company based in Sri Lanka building web applications, e-commerce platforms, and custom software for clients in Sri Lanka and internationally."
            />
            {testimonialsSchema && <JsonLd id="organization-reviews" data={testimonialsSchema} />}

            <Hero />
            <Services />
            <FeaturedProjects projects={projects} />
            <WhyChooseUs />
            <FeaturedTestimonials testimonials={testimonials?.slice(0, 3) ?? null} />
            <CtaBanner />
        </>
    )
}