import { Seo } from '../components/Seo'
import { CtaBanner } from '../components/CtaBanner'
import { HeroBackdrop } from '../components/HeroBackdrop'
import heroBackground from '../assets/about-background-image.jpg'

const missionItems = [
    {
        title: 'Innovate',
        description: 'We embrace emerging technologies to build future-ready solutions.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2 15 9l7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
            />
        ),
    },
    {
        title: 'Deliver Value',
        description: 'We focus on delivering real value that drives growth and impact.',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 20 20 4M20 4h-6M20 4v6" />,
    },
    {
        title: 'Build Relationships',
        description:
            'We believe in long-term partnerships built on trust, transparency and results.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c0-3 2.5-5 6-5s6 2 6 5M10 20c0-3 2.5-5 6-5s6 2 6 5"
            />
        ),
    },
]

const team = [
    { name: 'Niduranga Jayarathna', role: 'CEO & Founder' },
    { name: 'Naduni Tharushika', role: 'UI/UX Designer' },
    { name: 'Harshani Fernando', role: 'QA Tester' },
]

function Hero() {
    return (
        <section className="relative overflow-hidden">
            <HeroBackdrop image={heroBackground} />

            {/* Padding eka py-24 md:py-36 walata wadi kara, image eka loku wenna */}
            <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-36">
                <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Our Story
          </span>

                    <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
                        Building the Future,
                        <br />
                        <span className="text-blue-500">Together</span>
                    </h1>

                    <p className="mt-5 max-w-xl text-lg text-slate-300">
                        We are a team of passionate developers, designers, and problem solvers helping
                        businesses turn ideas into powerful digital products.
                    </p>
                </div>
            </div>
        </section>
    )
}

function Mission() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="text-2xl font-bold sm:text-3xl">Our Mission</h2>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
                {missionItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                {item.icon}
                            </svg>
                        </div>
                        <h3 className="mt-4 font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

function Team() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="text-2xl font-bold sm:text-3xl">Meet the Team</h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                {team.map((member) => (
                    <div
                        key={member.name}
                        className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center"
                    >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-lg font-semibold text-slate-300">
                            {member.name
                                .split(' ')
                                .map((part) => part[0])
                                .join('')}
                        </div>
                        <h3 className="mt-4 font-semibold">{member.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{member.role}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

export function About() {
    return (
        <>
            <Seo
                title="About — JayarathnaTech Solutions"
                description="Meet the team behind JayarathnaTech Solutions and learn about our mission to build digital products that drive real business growth."
            />

            <Hero />
            <Mission />
            <Team />
            <CtaBanner />
        </>
    )
}