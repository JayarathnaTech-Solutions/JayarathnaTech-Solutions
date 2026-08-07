import { Link } from 'react-router'
import { collection, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { engagementFromDoc } from '../../lib/firestore'
import { useFirestoreCollection } from '../../lib/useFirestoreCollection'
import { currentPhase, currentSprint, engagementStatusLabels } from '../../lib/engagement'
import { useCustomerAuth } from '../CustomerAuthContext'
import { StatusBadge } from '../../components/StatusBadge'
import { Skeleton } from '../../components/Skeleton'

function useMyEngagements(customerId: string) {
    const { data } = useFirestoreCollection(
        () => query(collection(db, 'engagements'), where('customerId', '==', customerId), orderBy('createdAt', 'desc')),
        engagementFromDoc,
        [customerId],
    )

    return data
}

export function PortalDashboard() {
    const { customer } = useCustomerAuth()
    const engagements = useMyEngagements(customer.id)

    return (
        <div>
            <h1 className="text-2xl font-bold">Your Projects</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Welcome back, {customer.name}.</p>

            <div className="mt-6 space-y-3">
                {engagements === null ? (
                    <>
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                    </>
                ) : engagements.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
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
                                className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 transition-colors hover:border-slate-400 dark:hover:border-slate-700"
                            >
                                <div>
                                    <h2 className="font-medium text-slate-900 dark:text-white">{engagement.title}</h2>
                                    {engagement.status === 'in_progress' && sprint && (
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
