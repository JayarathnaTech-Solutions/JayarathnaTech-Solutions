import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { Seo } from '../components/Seo'
import { siteContact } from '../lib/siteInfo'
import { staggerItem, staggerContainer, itemTransition } from '../lib/motion'
import { inputClass } from '../lib/ui'

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string

const contactDetails = [
    {
        label: 'Email',
        value: siteContact.email,
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            />
        ),
    },
    {
        label: 'Phone',
        value: siteContact.phone,
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 0 1 2-2h2.28a1 1 0 0 1 .98.804l1.11 5.11a1 1 0 0 1-.502 1.11l-1.62.81a11 11 0 0 0 5.516 5.516l.81-1.62a1 1 0 0 1 1.11-.502l5.11 1.11a1 1 0 0 1 .804.98V19a2 2 0 0 1-2 2h-1C9.163 21 3 14.837 3 7Z"
            />
        ),
    },
    {
        label: 'Location',
        value: siteContact.location,
        icon: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
            </>
        ),
    },
]

function Info() {
    return (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.span
                variants={staggerItem}
                transition={itemTransition}
                className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400"
            >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Get in Touch
            </motion.span>

            <motion.h1
                variants={staggerItem}
                transition={itemTransition}
                className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl"
            >
                Let&rsquo;s Build Something
                <br/>
                <span className="text-blue-500">Amazing Together</span>
            </motion.h1>

            <motion.p variants={staggerItem} transition={itemTransition} className="mt-5 max-w-md text-lg text-slate-300">
                Have a project in mind or want to learn more about our services? We&rsquo;d love to
                hear from you.
            </motion.p>

            <motion.div variants={staggerItem} transition={itemTransition} className="mt-8 space-y-5">
                {contactDetails.map((detail) => (
                    <div key={detail.label} className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                {detail.icon}
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">{detail.label}</p>
                            <p className="font-medium">{detail.value}</p>
                        </div>
                    </div>
                ))}
            </motion.div>
        </motion.div>
    )
}

function Field({
    label,
    name,
    type,
    placeholder,
    required,
}: {
    label: string
    name: string
    type: string
    placeholder: string
    required?: boolean
}) {
    return (
        <div>
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-300">
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                required={required}
                className={inputClass}
            />
        </div>
    )
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

function SuccessState({ onReset }: { onReset: () => void }) {
    return (
        <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Message Sent!</h3>
            <p className="mt-2 text-sm text-slate-400">
                Thanks for reaching out — we&rsquo;ll get back to you within 1-2 business days.
            </p>
            <button
                type="button"
                onClick={onReset}
                className="mt-6 text-sm font-medium text-blue-400 hover:text-blue-300"
            >
                Send another message
            </button>
        </div>
    )
}

function ContactForm() {
    const [status, setStatus] = useState<Status>('idle')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatus('submitting')

        const form = event.currentTarget
        const formData = new FormData(form)
        const name = String(formData.get('name') ?? '').trim()
        const email = String(formData.get('email') ?? '').trim()
        const phone = String(formData.get('phone') ?? '').trim()
        const message = String(formData.get('message') ?? '').trim()

        formData.append('access_key', WEB3FORMS_ACCESS_KEY)

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: formData,
            })
            const result = await response.json()

            if (result.success) {
                form.reset()
                setStatus('success')
                // Web3Forms handles email delivery (the critical path); mirroring
                // into Firestore so it shows up in the admin inbox is best-effort
                // and shouldn't affect the user-facing success state if it fails.
                void addDoc(collection(db, 'contactMessages'), {
                    name,
                    email,
                    message,
                    ...(phone ? { phone } : {}),
                    read: false,
                    createdAt: serverTimestamp(),
                }).catch(() => {})
            } else {
                setStatus('error')
            }
        } catch {
            setStatus('error')
        }
    }

    return (
        <motion.div
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-8"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            {status === 'success' ? (
                <SuccessState onReset={() => setStatus('idle')} />
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />

                    <Field label="Name" name="name" type="text" placeholder="Your full name" required />
                    <Field label="Email" name="email" type="email" placeholder="your.email@example.com" required />
                    <Field label="Phone (optional)" name="phone" type="tel" placeholder="Your phone number" />

                    <div>
                        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-300">
                            Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            rows={5}
                            placeholder="Tell us about your project..."
                            required
                            className={inputClass}
                        />
                    </div>

                    {status === 'error' && (
                        <p className="text-sm text-red-400">Something went wrong — please try again.</p>
                    )}

                    <motion.button
                        type="submit"
                        disabled={status === 'submitting'}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                    >
                        {status === 'submitting' ? 'Sending…' : 'Send Message'}
                        {status !== 'submitting' && <span aria-hidden="true">&rarr;</span>}
                    </motion.button>
                </form>
            )}
        </motion.div>
    )
}

export function Contact() {
    return (
        <>
            <Seo
                title="Contact — JayarathnaTech Solutions"
                description="Have a project in mind? Get in touch with JayarathnaTech Solutions — we'd love to hear from you."
            />

            <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
                <div className="grid gap-12 lg:grid-cols-2">
                    <Info />
                    <ContactForm />
                </div>
            </section>
        </>
    )
}
