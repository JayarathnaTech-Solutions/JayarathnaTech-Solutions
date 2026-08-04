import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { engagementFromDoc } from '../../lib/firestore'
import { currentPhase, currentSprint, engagementStatusLabels } from '../../lib/engagement'
import { useCustomerAuth } from '../CustomerAuthContext'
import { StatusBadge } from '../../components/StatusBadge'
import { Skeleton } from '../../components/Skeleton'
import type { Engagement } from '../../types'

function useMyEngagements(customerId: string) {
    const [engagements, setEngagements] = useState<Engagement[] | null>(null)

    useEffect(() => {
        getDocs(query(collection(db, 'engagements'), where('customerId', '==', customerId), orderBy('createdAt', 'desc')))
            .then((snapshot) => setEngagements(snapshot.docs.map(engagementFromDoc)))
            .catch(() => setEngagements([]))
    }, [customerId])

    return engagements
}

export function PortalDashboard() {
    const { customer } = useCustomerAuth()
    const engagements = useMyEngagements(customer.id)

    return (
        <div>
            <h1 className="text-2xl font-bold">Your Projects</h1>
            <p className="mt-1 text-sm text-slate-400">Welcome back, {customer.name}.</p>

            <div className="mt-6 space-y-3">
                {engagements === null ? (
                    <>
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                    </>
                ) : engagements.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-10 text-center text-sm text-slate-500">
                        No projects yet — we'll set one up for you shortly.
                    </div>
                ) : (
                    engagements.map((engagement) => {
                        const sprint = currentSprint(engagement.sprints)
                        const phase = sprint ? currentPhase(sprint.phases) : null
                        return (
                            <Link
                                key={engagement.id}
                                to={`/portal/engagements/${engagement.id}`}
                                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition-colors hover:border-slate-700"
                            >
                                <div>
                                    <h2 className="font-medium text-white">{engagement.title}</h2>
                                    {engagement.status === 'in_progress' && sprint && (
                                        <p className="mt-1 text-sm text-slate-400">
                                            {sprint.name}
                                            {phase && ` — ${phase.name}`}
                                        </p>
                                    )}
                                </div>
                                <StatusBadge status={engagementStatusLabels[engagement.status]} />
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    )
}
