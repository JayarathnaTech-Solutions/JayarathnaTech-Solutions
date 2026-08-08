import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function EmptyState({
    icon,
    title,
    message,
    action,
}: {
    icon: ReactNode
    title: string
    message: string
    action?: { label: string; to: string }
}) {
    return (
        <div className="mt-8 flex flex-col items-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    {icon}
                </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-600">{message}</p>
            {action && (
                <Link
                    to={action.to}
                    className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    {action.label}
                </Link>
            )}
        </div>
    )
}
