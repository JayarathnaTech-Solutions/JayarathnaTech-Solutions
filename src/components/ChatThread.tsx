import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { chatMessageFromDoc } from '../lib/firestore'
import { uploadImage, RECEIPTS_UPLOAD_PRESET } from '../lib/cloudinary'
import { inputClass } from '../lib/ui'
import { Skeleton } from './Skeleton'
import type { ChatMessage, ChatSenderRole } from '../types'

function formatTime(iso: string) {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const roleLabels: Record<ChatSenderRole, string> = {
    admin: 'Admin',
    developer: 'Developer',
    customer: 'Customer',
}

export function ChatThread({
    engagementId,
    senderId,
    senderEmail,
    senderName,
    senderRole,
}: {
    engagementId: string
    senderId: string
    senderEmail: string
    senderName: string
    senderRole: ChatSenderRole
}) {
    const [messages, setMessages] = useState<ChatMessage[] | null>(null)
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const q = query(collection(db, 'engagements', engagementId, 'messages'), orderBy('createdAt', 'asc'))
        return onSnapshot(
            q,
            (snapshot) => setMessages(snapshot.docs.map(chatMessageFromDoc)),
            () => setMessages([]),
        )
    }, [engagementId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' })
    }, [messages])

    async function handleSend(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmed = text.trim()
        if (!trimmed || sending) return

        setSending(true)
        setError(false)
        try {
            await addDoc(collection(db, 'engagements', engagementId, 'messages'), {
                senderId, senderEmail, senderName, senderRole, text: trimmed, createdAt: serverTimestamp(),
            })
            setText('')
        } catch {
            setError(true)
        } finally {
            setSending(false)
        }
    }

    async function handleAttach(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        setUploading(true)
        setError(false)
        try {
            const url = await uploadImage(file, undefined, RECEIPTS_UPLOAD_PRESET)
            await addDoc(collection(db, 'engagements', engagementId, 'messages'), {
                senderId, senderEmail, senderName, senderRole,
                attachmentUrl: url,
                attachmentType: file.type.startsWith('image/') ? 'image' : 'file',
                createdAt: serverTimestamp(),
            })
        } catch {
            setError(true)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-sm font-semibold text-slate-300">Team Chat</h2>

            <div className="mt-4 max-h-96 space-y-4 overflow-y-auto">
                {messages === null ? (
                    <Skeleton className="h-24 w-full" />
                ) : messages.length === 0 ? (
                    <p className="text-sm text-slate-500">No messages yet — say hello.</p>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className={message.senderId === senderId ? 'text-right' : 'text-left'}>
                            <div
                                className={`inline-block max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm ${
                                    message.senderId === senderId ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'
                                }`}
                            >
                                <p className="text-xs font-medium opacity-70">
                                    {message.senderName || message.senderEmail} · {roleLabels[message.senderRole]}
                                </p>
                                {message.text && <p className="mt-1 whitespace-pre-wrap">{message.text}</p>}
                                {message.attachmentUrl && message.attachmentType === 'image' && (
                                    <img src={message.attachmentUrl} alt="Attachment" className="mt-2 max-h-48 rounded-md" />
                                )}
                                {message.attachmentUrl && message.attachmentType === 'file' && (
                                    <a
                                        href={message.attachmentUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 block underline"
                                    >
                                        View attachment
                                    </a>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-slate-600">{formatTime(message.createdAt)}</p>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {error && <p className="mt-2 text-sm text-red-400">Something went wrong — please try again.</p>}

            <form onSubmit={handleSend} className="mt-4 flex items-center gap-2">
                <label className="shrink-0 cursor-pointer text-slate-400 hover:text-white">
                    <input type="file" accept="image/*,application/pdf" onChange={handleAttach} disabled={uploading} className="hidden" />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                </label>
                <input
                    type="text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={uploading ? 'Uploading attachment…' : 'Type a message…'}
                    disabled={uploading}
                    className={inputClass}
                />
                <button
                    type="submit"
                    disabled={sending || uploading || !text.trim()}
                    className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                >
                    Send
                </button>
            </form>
        </div>
    )
}
