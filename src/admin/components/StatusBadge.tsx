const statusStyles: Record<string, string> = {
    draft: 'bg-slate-700/50 text-slate-300',
    sent: 'bg-blue-500/10 text-blue-400',
    accepted: 'bg-emerald-500/10 text-emerald-400',
    rejected: 'bg-red-500/10 text-red-400',
    pending: 'bg-amber-500/10 text-amber-400',
    approved: 'bg-emerald-500/10 text-emerald-400',
    admin: 'bg-blue-500/10 text-blue-400',
    editor: 'bg-slate-700/50 text-slate-300',
}

export function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                statusStyles[status] ?? 'bg-slate-700/50 text-slate-300'
            }`}
        >
            {status}
        </span>
    )
}
