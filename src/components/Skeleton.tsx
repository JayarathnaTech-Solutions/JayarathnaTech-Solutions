export function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800/60 ${className}`} />
}
