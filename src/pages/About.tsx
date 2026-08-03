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
    { name: 'Niduranga Jayarathna', role: 'CEO & Founder', img: 'https://i.ibb.co/7NXPGyh1/IMG-9802-01.jpg' },
    { name: 'Naduni Tharushika', role: 'UI/UX Designer', img: '' },
    { name: 'Harshani Fernando', role: 'QA Tester', img: 'https://i.ibb.co/M47SptC/Whats-App-Image-2026-07-26-at-10-07-51.jpg' },
]

const processSteps = [
    {
        step: '01',
        title: 'Discover',
        description: 'We start by understanding your business goals, users, and challenges to define a clear project scope.',
    },
    {
        step: '02',
        title: 'Design',
        description: 'We craft intuitive UI/UX and technical architecture that balances usability with scalability.',
    },
    {
        step: '03',
        title: 'Develop',
        description: 'Our team builds your product using modern, reliable technologies with clean, maintainable code.',
    },
    {
        step: '04',
        title: 'Deliver & Support',
        description: 'We launch your product and stay engaged with ongoing support and improvements.',
    },
]

const whyChooseUsItems = [
    {
        title: 'Modern Tech Stack',
        description: 'We build with proven, modern frameworks and cloud infrastructure for performance and scalability.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"
            />
        ),
    },
    {
        title: 'Transparent Communication',
        description: "You'll always know where your project stands — clear updates, no surprises.",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
            />
        ),
    },
    {
        title: 'Dedicated Attention',
        description: 'As a growing studio, every project gets our full focus and hands-on care.',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21s-6.7-4.35-9.3-8.4C1 9.9 1.8 6.6 4.6 5.2 7 4 9.7 4.8 12 7.5 14.3 4.8 17 4 19.4 5.2c2.8 1.4 3.6 4.7 1.9 7.4C18.7 16.65 12 21 12 21Z"
            />
        ),
    },
    {
        title: 'Flexible & Responsive',
        description: 'We adapt quickly to feedback and changing requirements throughout the project.',
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
        ),
    },
]

const technologyGroups = [
    {
        category: 'Frontend & Mobile',
        items: [
            { name: 'React', mono: 'Re', color: 'bg-cyan-500/10 text-cyan-400' },
            { name: 'Vue', mono: 'Vu', color: 'bg-emerald-500/10 text-emerald-400' },
            { name: 'React Native', mono: 'RN', color: 'bg-sky-500/10 text-sky-400' },
        ],
    },
    {
        category: 'Backend',
        items: [
            { name: 'Laravel', mono: 'La', color: 'bg-red-500/10 text-red-400' },
            { name: 'Spring Boot', mono: 'Sp', color: 'bg-lime-500/10 text-lime-400' },
            { name: 'Express', mono: 'Ex', color: 'bg-red-500/10 text-lime-400' },
        ],
    },
    {
        category: 'Cloud & Data',
        items: [
            { name: 'AWS', mono: 'AW', color: 'bg-orange-500/10 text-orange-400' },
            { name: 'Firebase', mono: 'Fi', color: 'bg-amber-500/10 text-amber-400' },
            { name: 'MySQL', mono: 'My', color: 'bg-blue-500/10 text-blue-400' },
        ],
    },
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
                        <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

function Process() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="text-2xl font-bold sm:text-3xl">Our Process</h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                {processSteps.map((item) => (
                    <div key={item.step} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                        <span className="text-3xl font-bold text-blue-500/30">{item.step}</span>
                        <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

function WhyChooseUs() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="text-2xl font-bold sm:text-3xl">Why Choose Us</h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {whyChooseUsItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                {item.icon}
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

function TechStack() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="text-2xl font-bold sm:text-3xl">Technologies We Use</h2>

            <div className="mt-8 grid gap-8 md:grid-cols-3">
                {technologyGroups.map((group) => (
                    <div key={group.category}>
                        <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                            {group.category}
                        </h3>
                        <div className="mt-4 space-y-3">
                            {group.items.map((tech) => (
                                <div
                                    key={tech.name}
                                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-colors hover:border-slate-700"
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${tech.color}`}
                                    >
                                        {tech.mono}
                                    </div>
                                    <span className="font-medium text-slate-200">{tech.name}</span>
                                </div>
                            ))}
                        </div>
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
                        className="group rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-black/20"
                    >
                        <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-xl font-semibold text-slate-300 ring-4 ring-slate-800/80 transition-all duration-300 group-hover:ring-blue-500/30">
                            {member.img ? (
                                <img src={member.img} alt={member.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                member.name
                                    .split(' ')
                                    .map((part) => part[0])
                                    .join('')
                            )}
                        </div>
                        <h3 className="mt-5 text-lg font-semibold">{member.name}</h3>
                        <span className="mt-2 inline-block rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                            {member.role}
                        </span>
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
            <Process />
            <WhyChooseUs />
            <TechStack />
            <Team />
            <CtaBanner />
        </>
    )
}