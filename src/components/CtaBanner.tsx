import { Reveal } from './motion'
import { MotionLink } from './MotionLink'

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <Reveal className="flex flex-col items-start gap-6 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Let&apos;s Build Something Amazing Together
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              Have a project in mind? Let&apos;s discuss how we can help you bring your ideas to
              life.
            </p>
          </div>
        </div>
        <MotionLink
          to="/contact"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-5 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          Get in Touch
        </MotionLink>
      </Reveal>
    </section>
  )
}
