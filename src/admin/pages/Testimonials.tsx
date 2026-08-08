import { useEffect, useState } from 'react'
import { addDoc, collection, doc, getCountFromServer, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { testimonialFromDoc } from '../../lib/firestore'
import { timeAgo } from '../../lib/format'
import { Skeleton } from '../../components/Skeleton'
import { Avatar } from '../../components/Avatar'
import type { Testimonial, TestimonialStatus } from '../../types'

function usePendingCount(version: number) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        getCountFromServer(query(collection(db, 'testimonials'), where('status', '==', 'pending')))
            .then((snapshot) => setCount(snapshot.data().count))
            .catch(() => setCount(0))
    }, [version])

    return count
}

function useTestimonials(status: TestimonialStatus) {
    const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null)

    const reload = () => {
        getDocs(query(collection(db, 'testimonials'), where('status', '==', status)))
            .then((snapshot) => {
                setTestimonials(snapshot.docs.map(testimonialFromDoc).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
            })
            .catch(() => setTestimonials([]))
    }

    useEffect(reload, [status])

    return { testimonials, reload }
}

function Stars({ rating }: { rating?: number }) {
    if (!rating) return null
    return (
        <div className="flex gap-0.5 text-amber-600">
            {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} width="13" height="13" viewBox="0 0 20 20" fill={i < rating ? 'currentColor' : 'none'} stroke="currentColor">
                    <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.9l-5.2 2.72.99-5.8-4.21-4.1 5.82-.85z" />
                </svg>
            ))}
        </div>
    )
}

function PendingCard({ testimonial, onDecided }: { testimonial: Testimonial; onDecided: () => void }) {
    const [busy, setBusy] = useState(false)

    async function decide(status: TestimonialStatus) {
        setBusy(true)
        await updateDoc(doc(db, 'testimonials', testimonial.id), { status })
        onDecided()
    }

    return (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5">
            <Avatar label={testimonial.clientName} size="md" />
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{testimonial.clientName}</p>
                    <span className="shrink-0 text-xs text-slate-500">{timeAgo(testimonial.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{testimonial.message}</p>
                <div className="mt-2">
                    <Stars rating={testimonial.rating} />
                </div>
            </div>
            <div className="flex shrink-0 gap-2">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => decide('approved')}
                    aria-label="Approve"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                    </svg>
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => decide('rejected')}
                    aria-label="Reject"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 disabled:opacity-50"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

function TestimonialActionCard({
    testimonial,
    actionLabel,
    onAction,
}: {
    testimonial: Testimonial
    actionLabel: string
    onAction: () => void
}) {
    const [busy, setBusy] = useState(false)

    function handleAction() {
        setBusy(true)
        onAction()
    }

    return (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5">
            <Avatar label={testimonial.clientName} size="md" />
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{testimonial.clientName}</p>
                    <span className="shrink-0 text-xs text-slate-500">{timeAgo(testimonial.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{testimonial.message}</p>
                <div className="mt-2">
                    <Stars rating={testimonial.rating} />
                </div>
            </div>
            <button
                type="button"
                disabled={busy}
                onClick={handleAction}
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 disabled:opacity-50"
            >
                {actionLabel}
            </button>
        </div>
    )
}

function GenerateInviteButton() {
    const [link, setLink] = useState<string | null>(null)
    const [generating, setGenerating] = useState(false)
    const [copied, setCopied] = useState(false)

    async function generate() {
        setGenerating(true)
        setCopied(false)
        try {
            const inviteRef = await addDoc(collection(db, 'testimonialInvites'), {
                used: false,
                createdAt: serverTimestamp(),
            })
            setLink(`${window.location.origin}/testimonial/${inviteRef.id}`)
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                type="button"
                onClick={generate}
                disabled={generating}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
                {generating ? 'Generating…' : 'Generate Invite Link'}
            </button>

            {link && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs">
                    <span className="max-w-xs truncate text-slate-600">{link}</span>
                    <button
                        type="button"
                        onClick={() => {
                            void navigator.clipboard.writeText(link)
                            setCopied(true)
                        }}
                        className="font-medium text-blue-600 hover:text-blue-500"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            )}
        </div>
    )
}

function Tabs({
    active,
    onChange,
    pendingCount,
}: {
    active: TestimonialStatus
    onChange: (status: TestimonialStatus) => void
    pendingCount: number
}) {
    return (
        <div className="flex gap-2">
            <button
                type="button"
                onClick={() => onChange('pending')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    active === 'pending' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
            >
                Pending {pendingCount > 0 && `(${pendingCount})`}
            </button>
            <button
                type="button"
                onClick={() => onChange('approved')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    active === 'approved' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
            >
                Approved
            </button>
            <button
                type="button"
                onClick={() => onChange('rejected')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    active === 'rejected' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
            >
                Rejected
            </button>
        </div>
    )
}

export function AdminTestimonials() {
    const [activeTab, setActiveTab] = useState<TestimonialStatus>('pending')
    const [version, setVersion] = useState(0)
    const { testimonials, reload } = useTestimonials(activeTab)
    const pendingCount = usePendingCount(version)

    function refreshAll() {
        reload()
        setVersion((v) => v + 1)
    }

    async function setStatus(testimonial: Testimonial, status: TestimonialStatus) {
        await updateDoc(doc(db, 'testimonials', testimonial.id), { status })
        refreshAll()
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Testimonials</h1>
                <GenerateInviteButton />
            </div>

            <div className="mt-6">
                <Tabs active={activeTab} onChange={setActiveTab} pendingCount={pendingCount} />
            </div>

            <div className="mt-6 space-y-4">
                {testimonials === null ? (
                    [0, 1, 2].map((i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5">
                            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                            <div className="min-w-0 flex-1 space-y-2.5">
                                <Skeleton className="h-3.5 w-1/3" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-2/3" />
                            </div>
                        </div>
                    ))
                ) : testimonials.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        {activeTab === 'pending'
                            ? 'No pending testimonials.'
                            : activeTab === 'approved'
                              ? 'No approved testimonials yet.'
                              : 'No rejected testimonials.'}
                    </p>
                ) : activeTab === 'pending' ? (
                    testimonials.map((testimonial) => (
                        <PendingCard key={testimonial.id} testimonial={testimonial} onDecided={refreshAll} />
                    ))
                ) : activeTab === 'approved' ? (
                    testimonials.map((testimonial) => (
                        <TestimonialActionCard
                            key={testimonial.id}
                            testimonial={testimonial}
                            actionLabel="Unpublish"
                            onAction={() => setStatus(testimonial, 'rejected')}
                        />
                    ))
                ) : (
                    testimonials.map((testimonial) => (
                        <TestimonialActionCard
                            key={testimonial.id}
                            testimonial={testimonial}
                            actionLabel="Re-approve"
                            onAction={() => setStatus(testimonial, 'approved')}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
