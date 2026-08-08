import {Reveal, StaggerGroup} from "./motion.tsx";
import {MotionLink} from "./MotionLink.tsx";
import {Link} from "react-router";
import {itemTransition, staggerItem} from "../lib/motion.ts";

const services = [
    {
        title: 'Custom Web Development',
        description: 'Tailored web applications and platforms engineered around your exact workflows and goals.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="m9 8-4 4 4 4M15 8l4 4-4 4" />,
    },
    {
        title: 'E-Commerce Solutions',
        description: 'Secure, scalable online stores that turn browsers into paying customers.',
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
        description: "Native and cross-platform apps that put your product in your customers' pockets.",
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
        description: 'Interfaces people enjoy using — researched, wireframed, and polished for conversion.',
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
        description: 'Multi-tenant software products built to scale from your first user to your thousandth.',
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
        description: 'Ongoing monitoring, updates, and support so your product keeps running smoothly.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z"
            />
        ),
    },
]

export function Services() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
                <div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            What We Do
          </span>
                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Our Services</h2>
                </div>
                <Link
                    to="/services"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                    View all services
                </Link>
            </Reveal>

            <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3">
                {services.map((service) => (
                    <MotionLink
                        key={service.title}
                        to="/services"
                        variants={staggerItem}
                        transition={itemTransition}
                        whileHover={{ y: -4 }}
                        className="group rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                {service.icon}
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{service.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 group-hover:text-blue-500">
                            Learn more
                        </span>
                    </MotionLink>
                ))}
            </StaggerGroup>
        </section>
    )
}