import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { contactMessageFromDoc, testimonialFromDoc } from '../../lib/firestore'
import { timeAgo } from '../../lib/format'
import { useAuth } from '../AuthContext'
import { Avatar } from '../../components/Avatar'
import type { ContactMessage, Testimonial } from '../../types'

interface DashboardData {
    pendingTestimonialsCount: number
    openQuotesCount: number
    unreadMessagesCount: number
    totalProjectsCount: number
    pendingAdvanceCount: number | null
    paymentsNeedingReviewCount: number | null
    recentMessages: ContactMessage[]
    pendingTestimonials: Testimonial[]
}

const emptyData: DashboardData = {
    pendingTestimonialsCount: 0,
    openQuotesCount: 0,
    unreadMessagesCount: 0,
    totalProjectsCount: 0,
    pendingAdvanceCount: null,
    paymentsNeedingReviewCount: null,
    recentMessages: [],
    pendingTestimonials: [],
}

// Engagements-awaiting-advance and payments-needing-review are admin-only
// under the Firestore rules (developers can't list engagements by status,
// and have no invoice access at all — payment info stays admin-only by
// design). Every staff role sees this Dashboard, so these two queries only
// run for admins; other roles would just get a permission error that failed
// the whole Promise.all and blanked the entire dashboard.
function useDashboardData(isAdmin: boolean) {
    const [data, setData] = useState<DashboardData | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function load() {
            const [
                pendingTestimonialsCount,
                openQuotesCount,
                unreadMessagesCount,
                totalProjectsCount,
                pendingAdvanceCount,
                paymentsNeedingReviewCount,
                recentMessagesSnapshot,
                pendingTestimonialsSnapshot,
            ] = await Promise.all([
                getCountFromServer(query(collection(db, 'testimonials'), where('status', '==', 'pending'))),
                getCountFromServer(query(collection(db, 'quotes'), where('status', 'in', ['draft', 'sent']))),
                getCountFromServer(query(collection(db, 'contactMessages'), where('read', '==', false))),
                getCountFromServer(collection(db, 'projects')),
                isAdmin ? getCountFromServer(query(collection(db, 'engagements'), where('status', '==', 'pending_advance'))) : null,
                isAdmin ? getCountFromServer(query(collection(db, 'invoices'), where('status', '==', 'proof_submitted'))) : null,
                getDocs(query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'), limit(5))),
                getDocs(query(collection(db, 'testimonials'), where('status', '==', 'pending'), limit(5))),
            ])

            if (cancelled) return

            setData({
                pendingTestimonialsCount: pendingTestimonialsCount.data().count,
                openQuotesCount: openQuotesCount.data().count,
                unreadMessagesCount: unreadMessagesCount.data().count,
                totalProjectsCount: totalProjectsCount.data().count,
                pendingAdvanceCount: pendingAdvanceCount?.data().count ?? null,
                paymentsNeedingReviewCount: paymentsNeedingReviewCount?.data().count ?? null,
                recentMessages: recentMessagesSnapshot.docs.map(contactMessageFromDoc),
                pendingTestimonials: pendingTestimonialsSnapshot.docs.map(testimonialFromDoc),
            })
        }

        load().catch(() => {
            if (!cancelled) {
                setError(true)
                setData(emptyData)
            }
        })

        return () => {
            cancelled = true
        }
    }, [isAdmin])

    return { data, error }
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{label}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        {icon}
                    </svg>
                </div>
            </div>
            <p className="mt-3 text-3xl font-bold">{value}</p>
        </div>
    )
}

function StatCards({ data }: { data: DashboardData }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
                label="Pending Testimonials"
                value={data.pendingTestimonialsCount}
                icon={
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m12 3 2.7 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.5 19.5l1.2-6-4.5-4.2 6.1-.7L12 3Z"
                    />
                }
            />
            <StatCard
                label="Open Quotes"
                value={data.openQuotesCount}
                icon={
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6M9 17h6"
                    />
                }
            />
            <StatCard
                label="Unread Messages"
                value={data.unreadMessagesCount}
                icon={
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                    />
                }
            />
            <StatCard
                label="Total Projects"
                value={data.totalProjectsCount}
                icon={
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
                    />
                }
            />
            {data.pendingAdvanceCount !== null && (
                <StatCard
                    label="Engagements Awaiting Advance"
                    value={data.pendingAdvanceCount}
                    icon={
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                    }
                />
            )}
            {data.paymentsNeedingReviewCount !== null && (
                <StatCard
                    label="Payments Needing Review"
                    value={data.paymentsNeedingReviewCount}
                    icon={
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12h6m-6 4h6M9 8h1m4-5H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Z"
                        />
                    }
                />
            )}
        </div>
    )
}

function MiniStars({ rating }: { rating?: number }) {
    if (!rating) return null
    return (
        <div className="flex gap-0.5 text-amber-400">
            {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 20 20" fill={i < rating ? 'currentColor' : 'none'} stroke="currentColor">
                    <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.9l-5.2 2.72.99-5.8-4.21-4.1 5.82-.85z" />
                </svg>
            ))}
        </div>
    )
}

function RecentMessages({ messages }: { messages: ContactMessage[] }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Messages</h2>
                <Link to="/admin/inbox" className="text-sm font-medium text-blue-400 hover:text-blue-300">
                    View all messages
                </Link>
            </div>

            {messages.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">No messages yet.</p>
            ) : (
                <ul className="mt-5 space-y-4">
                    {messages.map((message) => (
                        <li key={message.id} className="flex items-start gap-3">
                            <Avatar label={message.name} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-medium">{message.name}</p>
                                    <span className="shrink-0 text-xs text-slate-500">{timeAgo(message.createdAt)}</span>
                                </div>
                                <p className="truncate text-sm text-slate-400">{message.message}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

function PendingTestimonials({ testimonials }: { testimonials: Testimonial[] }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Pending Testimonials</h2>
                <Link to="/admin/testimonials" className="text-sm font-medium text-blue-400 hover:text-blue-300">
                    View all testimonials
                </Link>
            </div>

            {testimonials.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">No pending testimonials.</p>
            ) : (
                <ul className="mt-5 space-y-4">
                    {testimonials.map((testimonial) => (
                        <li key={testimonial.id} className="flex items-start gap-3">
                            <Avatar label={testimonial.clientName} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-medium">{testimonial.clientName}</p>
                                    <span className="shrink-0 text-xs text-slate-500">{timeAgo(testimonial.createdAt)}</span>
                                </div>
                                <p className="truncate text-sm text-slate-400">{testimonial.message}</p>
                                <div className="mt-1">
                                    <MiniStars rating={testimonial.rating} />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

function ErrorBanner({ onDismiss }: { onDismiss: () => void }) {
    return (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>Couldn&rsquo;t load dashboard data — try refreshing.</span>
            <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-red-300 hover:text-red-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
            </button>
        </div>
    )
}

function Loading() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-64 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
                <div className="h-64 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
            </div>
        </div>
    )
}

export function Dashboard() {
    const { staff } = useAuth()
    const { data, error } = useDashboardData(staff.role === 'admin')
    const [dismissed, setDismissed] = useState(false)

    return (
        <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>

            <div className="mt-6">
                {error && !dismissed && <ErrorBanner onDismiss={() => setDismissed(true)} />}
                {data === null ? (
                    <Loading />
                ) : (
                    <div className="space-y-6">
                        <StatCards data={data} />
                        <div className="grid gap-6 lg:grid-cols-2">
                            <RecentMessages messages={data.recentMessages} />
                            <PendingTestimonials testimonials={data.pendingTestimonials} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
