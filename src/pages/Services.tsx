import { Link } from 'react-router'
import { Seo } from '../components/Seo'
import { CtaBanner } from '../components/CtaBanner'
import heroBackground from '../assets/about-background-image.jpg'
import {HeroBackdrop} from "../components/HeroBackdrop.tsx";

const services = [
    {
        title: 'Custom Web Development',
        description: 'High-performance websites and web applications tailored to your exact business needs.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="m9 8-4 4 4 4M15 8l4 4-4 4" />,
    },
    {
        title: 'E-Commerce Solutions',
        description: 'Secure, scalable e-commerce platforms that turn visitors into paying customers.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4h2l.4 2M7 14h10l3-8H6.4M7 14 5.4 6M7 14l-1.5 6h11M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            />
        ),
    },
    {
        title: 'Mobile App Development',
        description: 'Cross-platform mobile apps that deliver seamless experiences on any device.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 15h2"
            />
        ),
    },
    {
        title: 'UI/UX Design',
        description: 'Beautiful, functional interfaces designed with your users and conversion in mind.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19 19 12l3 3-7 7-3-3Zm0 0-4 1 1-4L19 6l3 3-10 10Z"
            />
        ),
    },
    {
        title: 'SaaS Development',
        description: 'Scalable SaaS products built with modern architecture and industry best practices.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 18a4 4 0 1 1 .7-7.94A5.5 5.5 0 0 1 18 12a3.5 3.5 0 0 1 0 7H7Z"
            />
        ),
    },
    {
        title: 'Maintenance & Support',
        description: 'Ongoing monitoring, updates, and support to keep your systems running smoothly.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z"
            />
        ),
    },
]

const engagementModels = [
    {
        title: 'Fixed-Price Projects',
        description: 'Clear scope, timeline, and budget agreed upfront — ideal for well-defined projects with a fixed deliverable.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />,
    },
    {
        title: 'Dedicated Team',
        description: 'A committed team working exclusively on your product, scaling up or down as your roadmap evolves.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c0-3 2.5-5 6-5s6 2 6 5M10 20c0-3 2.5-5 6-5s6 2 6 5"
            />
        ),
    },
    {
        title: 'Time & Material',
        description: 'Flexible, pay-as-you-go engagement for evolving requirements and ongoing iterative work.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    },
]

const faqs = [
    {
        question: 'How long does a typical project take?',
        answer: 'Timelines vary by scope, but most web projects launch within 4-8 weeks, and larger platforms may take longer. We’ll give you a clear estimate after understanding your requirements.',
    },
    {
        question: 'Do you offer support after launch?',
        answer: 'Yes. Every project includes a warranty period, and we offer ongoing maintenance and support plans to keep your product running smoothly long after launch.',
    },
    {
        question: 'Can you work with our existing tech stack?',
        answer: 'Absolutely. While we specialize in React, Vue, Laravel, Spring, and cloud platforms like AWS and Firebase, we can adapt to your existing codebase and tools.',
    },
    {
        question: 'How do you handle project communication?',
        answer: 'You’ll have a single point of contact and regular progress updates, so you always know where your project stands.',
    },
    {
        question: 'What if my requirements change mid-project?',
        answer: 'We work iteratively, so scope adjustments are expected and handled transparently — we’ll discuss impact on timeline and cost before any change.',
    },
]

function Hero() {
    return (
        <section className="relative overflow-hidden">
          <HeroBackdrop image={heroBackground} />
          <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-36">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                What We Do
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">Digital Solutions<br /><span className="text-blue-500">Built for Growth</span></h1>
              <p className="mt-5 max-w-xl text-lg text-slate-300">
                We provide end-to-end software development solutions that help businesses
                launch, scale, and succeed.
              </p>
            </div>
          </div>
        </section>
    )
}

function ServicesGrid() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <div className="grid gap-6 md:grid-cols-3">
                {services.map((service) => (
                    <div key={service.title} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                {service.icon}
                            </svg>
                        </div>
                        <h3 className="mt-4 font-semibold">{service.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{service.description}</p>
                        <Link
                            to="/contact"
                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300"
                        >
                            Learn more
                            <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    )
}

function EngagementModels() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
      <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        How We Work With You
      </span>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Engagement Models</h2>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
                {engagementModels.map((model) => (
                    <div key={model.title} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                {model.icon}
                            </svg>
                        </div>
                        <h3 className="mt-4 font-semibold">{model.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{model.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

function Faq() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="text-2xl font-bold sm:text-3xl">Frequently Asked Questions</h2>

            <div className="mt-8 space-y-4">
                {faqs.map((faq) => (
                    <details
                        key={faq.question}
                        className="group rounded-xl border border-slate-800 bg-slate-900/40 p-6 open:bg-slate-900/60"
                    >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                            {faq.question}
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                className="shrink-0 text-blue-400 transition-transform duration-200 group-open:rotate-180"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                            </svg>
                        </summary>
                        <p className="mt-3 text-sm text-slate-400">{faq.answer}</p>
                    </details>
                ))}
            </div>
        </section>
    )
}

export function Services() {
    return (
        <>
            <Seo
                title="Services — JayarathnaTech Solutions"
                description="End-to-end software development services — web, e-commerce, mobile, UI/UX, SaaS, and ongoing support — built to help your business launch, scale, and succeed."
            />

            <Hero />
            <ServicesGrid />
            <EngagementModels />
            <Faq />
            <CtaBanner />
        </>
    )
}
