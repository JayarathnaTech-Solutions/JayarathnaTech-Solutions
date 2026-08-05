const sizeClasses = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-10 w-10 text-sm',
}

export function Avatar({ label, size = 'sm' }: { label: string; size?: keyof typeof sizeClasses }) {
    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-slate-800 font-semibold text-slate-300 ${sizeClasses[size]}`}
        >
            {label.charAt(0).toUpperCase() || '?'}
        </div>
    )
}
