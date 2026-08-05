import { Reveal } from './motion'
import { useCompanies } from '../lib/useCompanies'
import type { Company } from '../types'

const cardClass =
    'flex h-16 w-36 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600'

function CompanyLogo({ company }: { company: Company }) {
    const logo = <img src={company.logoUrl} alt={company.name} className="max-h-8 w-full object-contain" />

    if (company.websiteUrl) {
        return (
            <a href={company.websiteUrl} target="_blank" rel="noreferrer" className={cardClass}>
                {logo}
            </a>
        )
    }

    return <div className={cardClass}>{logo}</div>
}

export function CompanyLogos() {
    const companies = useCompanies()

    if (companies !== null && companies.length === 0) return null

    return (
        <section className="mx-auto max-w-7xl px-6 py-12">
            <Reveal>
                <p className="text-center text-sm font-medium text-slate-500">
                    Trusted by {companies?.length}+ businesses to deliver digital excellence
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    {companies === null
                        ? [0, 1, 2, 3, 4].map((i) => (
                              <div key={i} className="h-16 w-36 shrink-0 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
                          ))
                        : companies.map((company) => <CompanyLogo key={company.id} company={company} />)}
                </div>
            </Reveal>
        </section>
    )
}
