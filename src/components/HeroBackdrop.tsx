/**
 * Photo background for the page heroes, with a dark scrim layered on top so the
 * headline/body copy stays legible regardless of how bright the photo is.
 */
export function HeroBackdrop({ image, fadeClassName = 'h-32' }: { image: string; fadeClassName?: string }) {
  return (
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${image})` }}
          />

          {/* Flat tint: balanced darkness */}
          <div className="absolute inset-0 bg-slate-900/50" />

          {/* Left-weighted gradient: gives just the right amount of shadow for text readability */}
          <div className="absolute inset-0 bg-linear-to-r from-slate-900/90 via-slate-900/25 to-transparent w-3/5" />

          {/* Bottom fade so the hero blends into the page background. */}
          <div className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-900 to-transparent ${fadeClassName}`} />
      </div>
  )
}
