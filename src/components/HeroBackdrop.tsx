/**
 * Photo background for the page heroes, with a dark scrim layered on top so the
 * headline/body copy stays legible regardless of how bright the photo is.
 */
export function HeroBackdrop({ image }: { image: string }) {
  return (
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${image})` }}
          />

          {/* Flat tint: knocks the photo back so it reads as texture, not subject. */}
          <div className="absolute inset-0 bg-slate-950/80" />

          {/* Left-weighted gradient: stops halfway so the right side is completely clear */}
          <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/40 to-transparent w-3/5" />

          {/* Bottom fade so the hero blends into the page background. */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-slate-950 to-transparent" />
      </div>
  )
}
