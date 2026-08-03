import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { Seo } from '../components/Seo'
import heroBackground from '../assets/background-image.png'
import heroGraphic from '../assets/hero-section-image.png'
import type { Project, Testimonial } from '../types'

function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

function useFeaturedProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null)

  useEffect(() => {
    let cancelled = false

    getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(3)))
      .then((snapshot) => {
        if (cancelled) return
        setProjects(
          snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              title: data.title,
              description: data.description,
              coverImageUrl: data.coverImageUrl,
              createdAt: toIsoString(data.createdAt),
            } satisfies Project
          }),
        )
      })
      .catch(() => {
        if (!cancelled) setProjects([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  return projects
}

function useFeaturedTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null)

  useEffect(() => {
    let cancelled = false

    getDocs(query(collection(db, 'testimonials'), where('status', '==', 'approved'), limit(3)))
      .then((snapshot) => {
        if (cancelled) return
        setTestimonials(
          snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              clientName: data.clientName,
              message: data.message,
              rating: data.rating,
              status: data.status,
              createdAt: toIsoString(data.createdAt),
            } satisfies Testimonial
          }),
        )
      })
      .catch(() => {
        if (!cancelled) setTestimonials([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  return testimonials
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat md:block"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1fr_1.3fr] md:items-center md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Building the Future, Together
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            We Build Digital Solutions That Drive{' '}
            <span className="text-blue-500">Real Business Growth</span>
          </h1>

          <p className="mt-5 max-w-xl text-slate-400">
            From powerful web applications to scalable software systems, we turn ideas into
            high-performance digital products.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              View Projects
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-slate-500"
            >
              Get a Quote
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-3">
              {['N', 'T', 'K'].map((initial) => (
                <div
                  key={initial}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  {initial}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400">
              Trusted by 50+ businesses
              <br />
              to deliver digital excellence
            </p>
          </div>
        </div>

        <div className="hidden md:block">
          <img src={heroGraphic} alt="" className="w-full" />
        </div>
      </div>
    </section>
  )
}

function FeaturedProjects({ projects }: { projects: Project[] | null }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Our Work
          </span>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Featured Projects</h2>
        </div>
        <Link to="/projects" className="text-sm font-medium text-blue-400 hover:text-blue-300">
          View all projects &rarr;
        </Link>
      </div>

      {projects === null ? (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <p className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-10 text-center text-slate-400">
          No projects published yet — check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 transition-colors hover:border-slate-700"
            >
              <div className="aspect-video overflow-hidden bg-slate-800">
                {project.coverImageUrl && (
                  <img
                    src={project.coverImageUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold">{project.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{project.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function StarRating({ rating = 5 }: { rating?: number }) {
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

function FeaturedTestimonials({ testimonials }: { testimonials: Testimonial[] | null }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        Testimonials
      </span>
      <h2 className="mt-2 text-2xl font-bold sm:text-3xl">What Our Clients Say</h2>

      {testimonials === null ? (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <p className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-10 text-center text-slate-400">
          No testimonials published yet — check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
              <p className="text-2xl leading-none text-blue-500">&ldquo;</p>
              <p className="text-sm text-slate-300">{testimonial.message}</p>
              <div className="mt-4">
                <StarRating rating={testimonial.rating} />
              </div>
              <p className="mt-4 font-semibold">{testimonial.clientName}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Cta() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="flex flex-col items-start gap-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Let&apos;s Build Something Amazing Together
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              Have a project in mind? Let&apos;s discuss how we can help you bring your ideas to
              life.
            </p>
          </div>
        </div>
        <Link
          to="/contact"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-5 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          Get in Touch
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </section>
  )
}

export function Home() {
  const projects = useFeaturedProjects()
  const testimonials = useFeaturedTestimonials()

  return (
    <>
      <Seo
        title="JayarathnaTech Solutions — Web & Software Development Agency"
        description="We build digital solutions that drive real business growth — web applications, e-commerce platforms, and scalable software systems."
      />

      <Hero />
      <FeaturedProjects projects={projects} />
      <FeaturedTestimonials testimonials={testimonials} />
      <Cta />
    </>
  )
}
