import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { testimonialInviteFromDoc } from '../lib/firestore'
import { Seo } from '../components/Seo'
import { inputClass } from '../lib/ui'
import type { TestimonialInvite } from '../types'

function useInvite(token: string | undefined) {
    const [invite, setInvite] = useState<TestimonialInvite | null | undefined>(undefined)

    useEffect(() => {
        if (!token) return
        let cancelled = false

        getDoc(doc(db, 'testimonialInvites', token))
            .then((snapshot) => {
                if (cancelled) return
                if (!snapshot.exists() || snapshot.data().used) {
                    setInvite(null)
                    return
                }
                setInvite(testimonialInviteFromDoc(snapshot))
            })
            .catch(() => {
                if (!cancelled) setInvite(null)
            })

        return () => {
            cancelled = true
        }
    }, [token])

    return invite
}

function Loading() {
    return (
        <section className="mx-auto max-w-xl px-6 py-16 md:py-24">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8">
                <div className="h-6 w-40 animate-pulse rounded bg-slate-800/60" />
                <div className="mt-4 h-9 w-64 animate-pulse rounded bg-slate-800/60" />
                <div className="mt-8 h-24 animate-pulse rounded bg-slate-800/60" />
            </div>
        </section>
    )
}

function InvalidLink() {
    return (
        <section className="mx-auto max-w-xl px-6 py-16 md:py-24">
            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" d="m9 9 6 6m0-6-6 6" />
                    </svg>
                </div>
                <h1 className="mt-4 text-xl font-semibold">This link is no longer valid.</h1>
                <p className="mt-2 text-sm text-slate-400">
                    It looks like the testimonial link has expired or has already been used.
                </p>
                <Link
                    to="/contact"
                    className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    Request a New Link
                </Link>
                <p className="mt-4 text-xs text-slate-500">
                    If you believe this is a mistake, please contact the administrator.
                </p>
            </div>
        </section>
    )
}

function StarRating({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
    return (
        <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    aria-pressed={star <= value}
                    className="p-0.5"
                >
                    <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill={star <= value ? '#fbbf24' : 'none'}
                        stroke={star <= value ? '#fbbf24' : '#475569'}
                        strokeWidth="1.5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m12 3 2.7 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.5 19.5l1.2-6-4.5-4.2 6.1-.7L12 3Z"
                        />
                    </svg>
                </button>
            ))}
        </div>
    )
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

function SuccessState() {
    return (
        <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Thank You!</h3>
            <p className="mt-2 text-sm text-slate-400">
                A big thank you — your feedback means a lot and helps us improve.
            </p>
        </div>
    )
}

function SubmissionForm({ invite }: { invite: TestimonialInvite }) {
    const [status, setStatus] = useState<Status>('idle')
    const [rating, setRating] = useState(0)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatus('submitting')

        const form = event.currentTarget
        const formData = new FormData(form)
        const clientName = String(formData.get('clientName') ?? '').trim()
        const message = String(formData.get('message') ?? '').trim()

        try {
            await addDoc(collection(db, 'testimonials'), {
                clientName,
                message,
                ...(rating > 0 ? { rating } : {}),
                status: 'pending',
                createdAt: serverTimestamp(),
            })
            await updateDoc(doc(db, 'testimonialInvites', invite.id), { used: true })
            setStatus('success')
        } catch {
            setStatus('error')
        }
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Share Your Experience
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">We&rsquo;d Love Your Feedback</h1>
            <p className="mt-3 text-sm text-slate-400">
                Your feedback helps us improve and deliver even better solutions.
            </p>

            {status === 'success' ? (
                <SuccessState />
            ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                        <label htmlFor="clientName" className="mb-1.5 block text-sm font-medium text-slate-300">
                            Your Name
                        </label>
                        <input
                            id="clientName"
                            name="clientName"
                            type="text"
                            placeholder="Enter your name"
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-300">
                            Your Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            rows={5}
                            placeholder="Share your experience working with us..."
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <span className="mb-1.5 block text-sm font-medium text-slate-300">Rating</span>
                        <StarRating value={rating} onChange={setRating} />
                    </div>

                    {status === 'error' && (
                        <p className="text-sm text-red-400">Something went wrong — please try again.</p>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                    >
                        {status === 'submitting' ? 'Submitting…' : 'Submit Testimonial'}
                    </button>
                </form>
            )}
        </div>
    )
}

export function TestimonialSubmission() {
    const { token } = useParams()
    const invite = useInvite(token)

    return (
        <>
            <Seo
                title="Share Your Feedback — JayarathnaTech Solutions"
                description="Share your experience working with JayarathnaTech Solutions."
            />

            {invite === undefined ? (
                <Loading />
            ) : invite === null ? (
                <InvalidLink />
            ) : (
                <section className="mx-auto max-w-xl px-6 py-16 md:py-24">
                    <SubmissionForm invite={invite} />
                </section>
            )}
        </>
    )
}
