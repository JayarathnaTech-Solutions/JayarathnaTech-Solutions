import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { toIsoString } from '../../lib/firestore'
import { inputClass } from '../../lib/ui'
import { Skeleton } from '../../components/Skeleton'
import type { ContactMessage } from '../../types'

function useMessages() {
    const [messages, setMessages] = useState<ContactMessage[] | null>(null)

    const reload = () => {
        getDocs(query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc')))
            .then((snapshot) => {
                setMessages(
                    snapshot.docs.map((snap) => {
                        const data = snap.data()
                        return {
                            id: snap.id,
                            name: data.name,
                            email: data.email,
                            phone: data.phone,
                            message: data.message,
                            read: data.read,
                            createdAt: toIsoString(data.createdAt),
                        } satisfies ContactMessage
                    }),
                )
            })
            .catch(() => setMessages([]))
    }

    useEffect(reload, [])

    return { messages, reload }
}

function timeAgo(iso: string): string {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function Avatar({ name }: { name: string }) {
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
            {name.charAt(0).toUpperCase() || '?'}
        </div>
    )
}

function MessageListItem({
    message,
    active,
    onSelect,
}: {
    message: ContactMessage
    active: boolean
    onSelect: () => void
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`flex w-full items-start gap-3 border-b border-slate-800 px-4 py-3 text-left transition-colors ${
                active ? 'bg-blue-500/10' : 'hover:bg-slate-900/60'
            }`}
        >
            <Avatar name={message.name} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${message.read ? 'font-medium text-slate-300' : 'font-semibold text-white'}`}>
                        {message.name}
                    </p>
                    <span className="shrink-0 text-xs text-slate-500">{timeAgo(message.createdAt)}</span>
                </div>
                <p className="truncate text-sm text-slate-500">{message.message}</p>
            </div>
            {!message.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
        </button>
    )
}

function MessageDetail({
    message,
    onToggleRead,
    onBack,
}: {
    message: ContactMessage
    onToggleRead: () => void
    onBack: () => void
}) {
    return (
        <div className="flex h-full flex-col p-6">
            <button
                type="button"
                onClick={onBack}
                className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white md:hidden"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>
            <div>
                <h2 className="text-lg font-semibold">{message.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{message.email}</p>
                {message.phone && <p className="text-sm text-slate-400">{message.phone}</p>}
                <p className="mt-1 text-xs text-slate-500">{formatDate(message.createdAt)}</p>
            </div>

            <p className="mt-6 flex-1 whitespace-pre-wrap text-sm text-slate-300">{message.message}</p>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                    type="button"
                    onClick={onToggleRead}
                    className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-600"
                >
                    {message.read ? 'Mark as Unread' : 'Mark as Read'}
                </button>
                <a
                    href={`mailto:${message.email}`}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    Reply via Email
                </a>
            </div>
        </div>
    )
}

export function AdminInbox() {
    const { messages, reload } = useMessages()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        if (!messages) return null
        const term = search.trim().toLowerCase()
        if (!term) return messages
        return messages.filter(
            (message) =>
                message.name.toLowerCase().includes(term) ||
                message.email.toLowerCase().includes(term) ||
                message.message.toLowerCase().includes(term),
        )
    }, [messages, search])

    const selected = messages?.find((message) => message.id === selectedId) ?? null

    async function handleSelect(message: ContactMessage) {
        setSelectedId(message.id)
        if (!message.read) {
            await updateDoc(doc(db, 'contactMessages', message.id), { read: true })
            reload()
        }
    }

    async function handleToggleRead() {
        if (!selected) return
        await updateDoc(doc(db, 'contactMessages', selected.id), { read: !selected.read })
        reload()
    }

    return (
        <div>
            <h1 className="text-2xl font-bold">Messages</h1>

            <div className="mt-6 flex h-[calc(100vh-13rem)] min-h-[28rem] overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full max-w-sm flex-col border-r border-slate-800`}>
                    <div className="border-b border-slate-800 p-3">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search messages..."
                            className={inputClass}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filtered === null ? (
                            <div className="space-y-1 p-3">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-start gap-3 p-1 py-2">
                                        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <Skeleton className="h-3.5 w-2/3" />
                                            <Skeleton className="h-3 w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="p-4 text-sm text-slate-500">No messages yet.</p>
                        ) : (
                            filtered.map((message) => (
                                <MessageListItem
                                    key={message.id}
                                    message={message}
                                    active={message.id === selectedId}
                                    onSelect={() => handleSelect(message)}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className={`${selected ? 'flex' : 'hidden'} w-full flex-1 md:flex`}>
                    {selected ? (
                        <MessageDetail message={selected} onToggleRead={handleToggleRead} onBack={() => setSelectedId(null)} />
                    ) : (
                        <div className="flex mx-auto h-full items-center justify-center text-sm text-slate-500">
                            Select a message to view it
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
