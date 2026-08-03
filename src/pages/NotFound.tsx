import { Link } from 'react-router'
import { Seo } from '../components/Seo'
import bg from '../assets/404-error-bg.png'

export function NotFound() {
    return (
        <>
            <Seo
                title="Page Not Found — JayarathnaTech Solutions"
                description="The page you're looking for doesn't exist or has been moved."
            />

            <section className="relative overflow-hidden">
                <div
                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-70"
                    style={{ backgroundImage: `url(${bg})` }}
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute inset-0 bg-linear-to-b from-slate-950/40 via-slate-950/70 to-slate-950"
                    aria-hidden="true"
                />

                <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-32 text-center md:py-44">
                    <p className="bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-7xl font-black text-transparent sm:text-8xl">
                        404
                    </p>
                    <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Page Not Found</h1>
                    <p className="mt-5 max-w-md text-lg text-slate-300">
                        Oops! The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
                    </p>
                    <Link
                        to="/"
                        className="mt-8 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    >
                        <span aria-hidden="true">&larr;</span>
                        Back to Home
                    </Link>
                </div>
            </section>
        </>
    )
}
