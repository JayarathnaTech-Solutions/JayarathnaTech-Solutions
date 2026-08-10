import { Seo } from '../components/Seo'
import { JsonLd } from '../components/JsonLd'
import { CtaBanner } from '../components/CtaBanner'
import {Mission} from "../components/Mission.tsx";
import {AboutHero} from "../components/AboutHero.tsx";
import {Process} from "../components/Process.tsx";
import {Team} from "../components/Team.tsx";
import {TechStack} from "../components/TechStack.tsx";
import {WhyChooseUs} from "../components/WhyChooseUs.tsx";
import { buildBreadcrumbSchema } from '../lib/siteInfo'


export function About() {
    return (
        <>
            <Seo
                title="About Us — Software Company in Sri Lanka | JayarathnaTech Solutions"
                description="Meet the team behind JayarathnaTech Solutions, a software company based in Sri Lanka building digital products for clients locally and around the world."
            />
            <JsonLd
                id="breadcrumb"
                data={buildBreadcrumbSchema([
                    { name: 'Home', url: '/' },
                    { name: 'About', url: '/about' },
                ])}
            />

            <AboutHero />
            <Mission />
            <Process />
            <WhyChooseUs />
            <TechStack />
            <Team />
            <CtaBanner />
        </>
    )
}