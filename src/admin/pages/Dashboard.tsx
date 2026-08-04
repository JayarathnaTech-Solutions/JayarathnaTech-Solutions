import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { toIsoString } from '../../lib/firestore'
import type { ContactMessage, Testimonial } from '../../types'

interface DashboardData {
    pendingTestimonialsCount: number
    openQuotesCount: number
    unreadMessagesCount: number
    totalProjectsCount: number
    recentMessages: ContactMessage[]
    pendingTestimonials: Testimonial[]
}

const emptyData: DashboardData = {
    pendingTestimonialsCount: 0,
    openQuotesCount: 0,
    unreadMessagesCount: 0,
    totalProjectsCount: 0,
    recentMessages: [],
    pendingTestimonials: [],
}

function useDashboardData() {
    const [data, setData] = useState<DashboardData | null>(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            const [
                pendingTestimonialsCount,
                openQuotesCount,
                unreadMessagesCount,
                totalProjectsCount,
                recentMessagesSnapshot,
                pendingTestimonialsSnapshot,
            ] = await Promise.all([
                getCountFromServer(query(collection(db, 'testimonials'), where('status', '==', 'pending'))),
                getCountFromServer(query(collection(db, 'quotes'), where('status', 'in', ['draft', 'sent']))),
                getCountFromServer(query(collection(db, 'contactMessages'), where('read', '==', false))),
                getCountFromServer(collection(db, 'projects')),
                getDocs(query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'), limit(5))),
                getDocs(query(collection(db, 'testimonials'), where('status', '==', 'pending'), limit(5))),
            ])

            if (cancelled) return

            setData({
                pendingTestimonialsCount: pendingTestimonialsCount.data().count,
                openQuotesCount: openQuotesCount.data().count,
                unreadMessagesCount: unreadMessagesCount.data().count,
                totalProjectsCount: totalProjectsCount.data().count,
                recentMessages: recentMessagesSnapshot.docs.map((doc) => {
                    const d = doc.data()
                    return {
                        id: doc.id,
                        name: d.name,
                        email: d.email,
                        phone: d.phone,
                        message: d.message,
                        read: d.read,
                        createdAt: toIsoString(d.createdAt),
                    } satisfies ContactMessage
                }),
                pendingTestimonials: pendingTestimonialsSnapshot.docs.map((doc) => {
                    const d = doc.data()
                    return {
                        id: doc.id,
                        clientName: d.clientName,
                        message: d.message,
                        rating: d.rating,
                        status: d.status,
                        createdAt: toIsoString(d.createdAt),
                    } satisfies Testimonial
                }),
            })
        }

        load().catch(() => {
            if (!cancelled) setData(emptyData)
        })

        return () => {
            cancelled = true
        }
    }, [])

    return data
}

function timeAgo(iso: string): string {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

function Avatar({ name }: { name: string }) {
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
            {name.charAt(0).toUpperCase() || '?'}
        </div>
    )
}

function RecentMessages({ messages }: { messages: ContactMessage[] }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Messages</h2>
                <Link to="/admin/inbox" className="text-sm font-medium text-blue-400 hover:text-blue-300">
                    View all messages &rarr;
                </Link>
            </div>

            {messages.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">No messages yet.</p>
            ) : (
                <ul className="mt-5 space-y-4">
                    {messages.map((message) => (
                        <li key={message.id} className="flex items-start gap-3">
                            <Avatar name={message.name} />
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
                    View all testimonials &rarr;
                </Link>
            </div>

            {testimonials.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">No pending testimonials.</p>
            ) : (
                <ul className="mt-5 space-y-4">
                    {testimonials.map((testimonial) => (
                        <li key={testimonial.id} className="flex items-start gap-3">
                            <Avatar name={testimonial.clientName} />
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

function Loading() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
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
    const data = useDashboardData()

    return (
        <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>

            <div className="mt-6">
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
