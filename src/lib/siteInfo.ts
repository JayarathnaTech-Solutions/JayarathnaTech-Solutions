export const SITE_NAME = 'JayarathnaTech Solutions'
// Must match Vercel's primary domain exactly — the apex domain 308-redirects
// here, so pointing this at the apex instead would make every sitemap/canonical
// URL a redirect target and Search Console would flag pages as unindexable.
export const SITE_URL = 'https://www.jayarathnatechsolutions.com'

export const siteContact = {
    email: 'hello@jayarathnatechsolutions.com',
    phone: '+94 78 628 7211',
    location: 'Negombo, Sri Lanka',
}

// Registered business details used on formal documents (quotes, invoices,
// agreements) — matches the company letterhead.
export const siteLetterhead = {
    registeredName: 'JayarathnaTech Solutions (Pvt) Ltd',
    regNo: 'PV00223764',
    address: 'No. 90/28/4, Gurugewaththa, Seeduwa Road, Kotugoda, Sri Lanka',
    phone: '+94 75 282 8091',
    phoneAlt: siteContact.phone,
    website: 'www.jayarathnatechsolutions.com',
    email: 'info@jayarathnatechsolutions.com',
}

export const siteSocial = {
    github: 'https://github.com/JayarathnaTech-Solutions',
    facebook: 'https://web.facebook.com/JayarathnaTechSolutions/',
    linkedin: 'https://www.linkedin.com/company/jayarathnatech-solutions',
}

export const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/about', label: 'About' },
    { to: '/services', label: 'Services' },
    { to: '/projects', label: 'Projects' },
    { to: '/contact', label: 'Contact' },
]

// Base Organization structured data (schema.org), shared by the sitewide
// JSON-LD in PublicLayout and extended with aggregateRating/review on Home.
export function buildOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
        email: siteContact.email,
        telephone: siteContact.phone,
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Negombo',
            addressCountry: 'LK',
        },
        areaServed: ['Sri Lanka', 'Worldwide'],
        sameAs: [siteSocial.github, siteSocial.facebook, siteSocial.linkedin],
        description:
            'JayarathnaTech Solutions is a software company based in Negombo, Sri Lanka, building web applications, e-commerce platforms, and custom software for clients in Sri Lanka and internationally.',
    }
}
