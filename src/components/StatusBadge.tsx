const statusStyles: Record<string, string> = {
    draft: 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
    sent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    accepted: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    admin: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    editor: 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
    developer: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    'pending advance': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'in progress': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    delivered: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    proof_submitted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    verified: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    'not started': 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
    completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

export function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                statusStyles[status] ?? 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300'
            }`}
        >
            {status}
        </span>
    )
}
