import { useMemo, useState } from 'react'
import { collection, doc, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { contactMessageFromDoc } from '../../lib/firestore'
import { useFirestoreCollection } from '../../lib/useFirestoreCollection'
import { formatDateTime, timeAgo } from '../../lib/format'
import { inputClass } from '../../lib/ui'
import { Skeleton } from '../../components/Skeleton'
import { Avatar } from '../../components/Avatar'
import type { ContactMessage } from '../../types'

function SourceBadge({ source }: { source: ContactMessage['source'] }) {
    if (source !== 'chat') return null
    return (
        <span className="inline-flex shrink-0 items-center rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
            Chat
        </span>
    )
}

function useMessages() {
    const { data: messages, reload } = useFirestoreCollection(
        () => query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc')),
        contactMessageFromDoc,
    )

    return { messages, reload }
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
            className={`flex w-full items-start gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3 text-left transition-colors ${
                active ? 'bg-blue-500/10' : 'hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
        >
            <Avatar label={message.name} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <p className={`truncate text-sm ${message.read ? 'font-medium text-slate-600 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-white'}`}>
                            {message.name}
                        </p>
                        <SourceBadge source={message.source} />
                    </div>
                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{timeAgo(message.createdAt)}</span>
                </div>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{message.message}</p>
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
                className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:hidden"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>
            <div>
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{message.name}</h2>
                    <SourceBadge source={message.source} />
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message.email}</p>
                {message.phone && <p className="text-sm text-slate-500 dark:text-slate-400">{message.phone}</p>}
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(message.createdAt)}</p>
            </div>

            <p className="mt-6 flex-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{message.message}</p>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button
                    type="button"
                    onClick={onToggleRead}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600"
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

            <div className="mt-6 flex h-[calc(100vh-13rem)] min-h-[28rem] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full max-w-sm flex-col border-r border-slate-200 dark:border-slate-800`}>
                    <div className="border-b border-slate-200 dark:border-slate-800 p-3">
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
                            <p className="p-4 text-sm text-slate-500 dark:text-slate-400">No messages yet.</p>
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
                        <div className="flex mx-auto h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                            Select a message to view it
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
