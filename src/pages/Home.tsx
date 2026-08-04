import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { toIsoString, projectFromDoc } from '../lib/firestore'
import { Seo } from '../components/Seo'
import { CtaBanner } from '../components/CtaBanner'
import { EmptyState } from '../components/EmptyState'
import { HeroBackdrop } from '../components/HeroBackdrop'
import { Reveal, StaggerGroup } from '../components/motion'
import { MotionLink } from '../components/MotionLink'
import { staggerItem, staggerContainer, itemTransition } from '../lib/motion'
import heroBackground from '../assets/background-image1.jpg'
import heroBackground2 from '../assets/background-image2.jpg'
import heroBackground3 from '../assets/background-image3.jpg'
import type { Project, Testimonial } from '../types'

function useFeaturedProjects() {
    const [projects, setProjects] = useState<Project[] | null>(null)

    useEffect(() => {
        let cancelled = false

        getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(3)))
            .then((snapshot) => {
                if (cancelled) return
                setProjects(snapshot.docs.map(projectFromDoc))
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

const heroImages = [heroBackground, heroBackground2, heroBackground3]

const services = [
    {
        title: 'Custom Web Development',
        description: 'Tailored web applications and platforms engineered around your exact workflows and goals.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="m9 8-4 4 4 4M15 8l4 4-4 4" />,
    },
    {
        title: 'E-Commerce Solutions',
        description: 'Secure, scalable online stores that turn browsers into paying customers.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4h2l.4 2M7 14h10l3-8H6.4M7 14 5.4 6M7 14l-1.5 6h11M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            />
        ),
    },
    {
        title: 'Mobile App Development',
        description: "Native and cross-platform apps that put your product in your customers' pockets.",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 15h2"
            />
        ),
    },
    {
        title: 'UI/UX Design',
        description: 'Interfaces people enjoy using — researched, wireframed, and polished for conversion.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19 19 12l3 3-7 7-3-3Zm0 0-4 1 1-4L19 6l3 3-10 10Z"
            />
        ),
    },
    {
        title: 'SaaS Development',
        description: 'Multi-tenant software products built to scale from your first user to your thousandth.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 18a4 4 0 1 1 .7-7.94A5.5 5.5 0 0 1 18 12a3.5 3.5 0 0 1 0 7H7Z"
            />
        ),
    },
    {
        title: 'Maintenance & Support',
        description: 'Ongoing monitoring, updates, and support so your product keeps running smoothly.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z"
            />
        ),
    },
]

const whyChooseUsItems = [
    {
        title: 'Faster Time-to-Market',
        description: 'Streamlined development gets your product to market quickly without cutting corners.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="m3 17 6-6 4 4 8-8M15 7h6v6" />,
    },
    {
        title: 'Scalable by Design',
        description: 'Architecture built to grow with your business, from first launch to enterprise scale.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m12 3 8 4-8 4-8-4 8-4ZM4 12l8 4 8-4M4 16l8 4 8-4"
            />
        ),
    },
    {
        title: 'End-to-End Ownership',
        description: 'From first sketch to production deployment, one team owns your entire product.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Zm-3 9 2 2 4-4"
            />
        ),
    },
    {
        title: 'Transparent Pricing',
        description: 'Clear scopes and honest quotes — no hidden fees or scope creep.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2h7a1 1 0 0 1 1 1v7a1 1 0 0 1-.3.7l-9 9a1 1 0 0 1-1.4 0l-6.3-6.3a1 1 0 0 1 0-1.4l9-9A1 1 0 0 1 12 2Zm4.5 5.5h.01"
            />
        ),
    },
]

function Hero() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [])

    return (
        <section className="relative flex min-h-[92vh] items-center overflow-hidden">
            {heroImages.map((image, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentImageIndex ? 'opacity-100 z-0' : 'opacity-0 -z-10'
                    }`}
                >
                    <HeroBackdrop image={image} fadeClassName="h-56" />
                </div>
            ))}

            <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-6 py-24 md:grid-cols-[3fr_2fr] md:items-center">
                <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                    <motion.span
                        variants={staggerItem}
                        transition={itemTransition}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      Building the Future, Together
                    </motion.span>

                    <motion.h1
                        variants={staggerItem}
                        transition={itemTransition}
                        className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl"
                    >
                        We Build Digital Solutions That Drive{' '}
                        <span className="text-blue-500">Real Business Growth</span>
                    </motion.h1>

                    <motion.p
                        variants={staggerItem}
                        transition={itemTransition}
                        className="mt-5 max-w-xl text-lg text-slate-300"
                    >
                        From powerful web applications to scalable software systems, we turn ideas into
                        high-performance digital products.
                    </motion.p>

                    <motion.div variants={staggerItem} transition={itemTransition} className="mt-8 flex flex-wrap gap-4">
                        <MotionLink
                            to="/projects"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                        >
                            View Projects
                        </MotionLink>
                        <MotionLink
                            to="/contact"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-slate-500"
                        >
                            Get a Quote
                        </MotionLink>
                    </motion.div>

                    <motion.div variants={staggerItem} transition={itemTransition} className="mt-10 flex items-center gap-3">
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
                    </motion.div>
                </motion.div>
            </div>

            <motion.div
                className="absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 text-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                transition={{ opacity: { duration: 0.6, delay: 1 }, y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
            >
                <span className="text-xs font-medium tracking-wide uppercase">Scroll</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
            </motion.div>
        </section>
    )
}

function Services() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
                <div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            What We Do
          </span>
                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Our Services</h2>
                </div>
                <Link to="/services" className="text-sm font-medium text-blue-400 hover:text-blue-300">
                    View all services &rarr;
                </Link>
            </Reveal>

            <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3">
                {services.map((service) => (
                    <MotionLink
                        key={service.title}
                        to="/services"
                        variants={staggerItem}
                        transition={itemTransition}
                        whileHover={{ y: -4 }}
                        className="group rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition-colors hover:border-slate-700"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                {service.icon}
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{service.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{service.description}</p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 group-hover:text-blue-300">
                            Learn more
                        </span>
                    </MotionLink>
                ))}
            </StaggerGroup>
        </section>
    )
}

function WhyChooseUs() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <Reveal>
      <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        Why Choose Us
      </span>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Built for Your Business Goals</h2>
            </Reveal>

            <StaggerGroup className="mt-8 grid gap-6 sm:grid-cols-2">
                {whyChooseUsItems.map((item) => (
                    <motion.div
                        key={item.title}
                        variants={staggerItem}
                        transition={itemTransition}
                        className="rounded-xl border border-slate-800 bg-slate-900/40 p-6"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                {item.icon}
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                    </motion.div>
                ))}
            </StaggerGroup>
        </section>
    )
}

function FeaturedProjects({ projects }: { projects: Project[] | null }) {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
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
            </Reveal>

            {projects === null ? (
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-72 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <EmptyState
                    icon={
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M5 6h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1ZM3 11h18"
                        />
                    }
                    title="Projects coming soon"
                    message="We're just getting started — new work will appear here as we ship it."
                />
            ) : (
                <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3">
                    {projects.map((project) => (
                        <MotionLink
                            key={project.id}
                            to={`/projects/${project.id}`}
                            variants={staggerItem}
                            transition={itemTransition}
                            whileHover={{ y: -4 }}
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
                                <h3 className="text-lg font-semibold">{project.title}</h3>
                                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{project.description}</p>
                            </div>
                        </MotionLink>
                    ))}
                </StaggerGroup>
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
            <Reveal>
      <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        Testimonials
      </span>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">What Our Clients Say</h2>
            </Reveal>

            {testimonials === null ? (
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-48 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
                    ))}
                </div>
            ) : testimonials.length === 0 ? (
                <EmptyState
                    icon={
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
                        />
                    }
                    title="Testimonials coming soon"
                    message="We're collecting feedback from our early clients — check back soon."
                />
            ) : (
                <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3">
                    {testimonials.map((testimonial) => (
                        <motion.div
                            key={testimonial.id}
                            variants={staggerItem}
                            transition={itemTransition}
                            className="rounded-xl border border-slate-800 bg-slate-900/40 p-6"
                        >
                            <p className="text-2xl leading-none text-blue-500">&ldquo;</p>
                            <p className="text-sm text-slate-300">{testimonial.message}</p>
                            <div className="mt-4">
                                <StarRating rating={testimonial.rating} />
                            </div>
                            <p className="mt-4 font-semibold">{testimonial.clientName}</p>
                        </motion.div>
                    ))}
                </StaggerGroup>
            )}
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
            <Services />
            <FeaturedProjects projects={projects} />
            <WhyChooseUs />
            <FeaturedTestimonials testimonials={testimonials} />
            <CtaBanner />
        </>
    )
}