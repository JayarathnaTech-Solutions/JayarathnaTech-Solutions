const statusStyles: Record<string, string> = {
    draft: 'bg-slate-200 text-slate-700',
    sent: 'bg-blue-500/10 text-blue-600',
    accepted: 'bg-emerald-500/10 text-emerald-600',
    rejected: 'bg-red-500/10 text-red-600',
    pending: 'bg-amber-500/10 text-amber-600',
    approved: 'bg-emerald-500/10 text-emerald-600',
    admin: 'bg-blue-500/10 text-blue-600',
    editor: 'bg-slate-200 text-slate-700',
    developer: 'bg-violet-500/10 text-violet-600',
    hr: 'bg-teal-500/10 text-teal-600',
    qa: 'bg-orange-500/10 text-orange-600',
    intern: 'bg-pink-500/10 text-pink-600',
    uiux: 'bg-fuchsia-500/10 text-fuchsia-600',
    'pending advance': 'bg-amber-500/10 text-amber-600',
    'in progress': 'bg-blue-500/10 text-blue-600',
    delivered: 'bg-emerald-500/10 text-emerald-600',
    proof_submitted: 'bg-amber-500/10 text-amber-600',
    verified: 'bg-emerald-500/10 text-emerald-600',
    'not started': 'bg-slate-200 text-slate-700',
    completed: 'bg-emerald-500/10 text-emerald-600',
}

export function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                statusStyles[status] ?? 'bg-slate-200 text-slate-700'
            }`}
        >
            {status}
        </span>
    )
}
