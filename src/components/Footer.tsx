import { Link } from 'react-router'
import { Logo } from './Logo'
import { siteContact, siteSocial, navLinks } from '../lib/siteInfo'

const serviceLinks = [
    'Custom Web Development',
    'E-Commerce Solutions',
    'Mobile App Development',
    'UI/UX Design',
    'SaaS Development',
    'Maintenance & Support',
]

const contactRows = [
    {
        value: siteContact.email,
        href: `mailto:${siteContact.email}`,
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            />
        ),
    },
    {
        value: siteContact.phone,
        href: `tel:${siteContact.phone.replace(/\s+/g, '')}`,
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 0 1 2-2h2.28a1 1 0 0 1 .98.804l1.11 5.11a1 1 0 0 1-.502 1.11l-1.62.81a11 11 0 0 0 5.516 5.516l.81-1.62a1 1 0 0 1 1.11-.502l5.11 1.11a1 1 0 0 1 .804.98V19a2 2 0 0 1-2 2h-1C9.163 21 3 14.837 3 7Z"
            />
        ),
    },
    {
        value: siteContact.location,
        href: undefined,
        icon: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
            </>
        ),
    },
]

function GitHubIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-1.04-.01-1.89-2.78.61-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.5-1.11-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.55 2.34 1.1 2.91.84.09-.66.35-1.1.63-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.5C19.14 20.61 22 16.77 22 12.25 22 6.58 17.52 2 12 2Z" />
        </svg>
    )
}

export function Footer() {
    return (
        <footer className="border-t border-slate-800/60 bg-slate-950">
            <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
                <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
                    <div className="col-span-2 flex flex-col items-center border-b border-slate-800/60 pb-10 text-center sm:items-start sm:border-b-0 sm:pb-0 sm:text-left lg:col-span-4">
                        <Logo />
                        <p className="mt-4 max-w-xs text-sm text-slate-400">
                            We build digital solutions that drive real business growth — web
                            applications, e-commerce platforms, and scalable software systems.
                        </p>
                        <div className="mt-6 flex items-center gap-3">
                            <a
                                href={siteSocial.github}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="GitHub"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
                            >
                                <GitHubIcon />
                            </a>
                        </div>
                    </div>

                    <div className="col-span-1 lg:col-span-2">
                        <h3 className="text-sm font-semibold text-white">Quick Links</h3>
                        <ul className="mt-4 space-y-3 text-sm">
                            {navLinks.map((link) => (
                                <li key={link.to}>
                                    <Link to={link.to} className="text-slate-400 transition-colors hover:text-white">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-1 lg:col-span-3">
                        <h3 className="text-sm font-semibold text-white">Services</h3>
                        <ul className="mt-4 space-y-3 text-sm">
                            {serviceLinks.map((service) => (
                                <li key={service}>
                                    <Link to="/services" className="text-slate-400 transition-colors hover:text-white">
                                        {service}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-2 border-t border-slate-800/60 pt-10 sm:col-span-2 sm:border-t-0 sm:pt-0 lg:col-span-3">
                        <h3 className="text-sm font-semibold text-white">Contact</h3>
                        <ul className="mt-4 space-y-3 text-sm text-slate-400">
                            {contactRows.map((row) => (
                                <li key={row.value} className="flex items-start gap-2.5">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                        className="mt-0.5 shrink-0 text-blue-400"
                                    >
                                        {row.icon}
                                    </svg>
                                    {row.href ? (
                                        <a href={row.href} className="transition-colors hover:text-white">
                                            {row.value}
                                        </a>
                                    ) : (
                                        <span>{row.value}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-800/60">
                <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-slate-500 sm:text-left">
                    <p>&copy; {new Date().getFullYear()} JayarathnaTech Solutions. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
