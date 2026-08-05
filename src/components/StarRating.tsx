export function StarRating({ rating = 5 }: { rating?: number }) {
    return (
        <div className="flex gap-0.5 text-amber-400">
            {Array.from({ length: 5 }, (_, i) => (
                <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill={i < rating ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1"
                >
                    <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.9l-5.2 2.72.99-5.8-4.21-4.1 5.82-.85z" />
                </svg>
            ))}
        </div>
    )
}