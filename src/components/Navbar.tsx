import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Logo } from './Logo'
import { navLinks as links } from '../lib/siteInfo'
import { itemTransition } from '../lib/motion'

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
      <header className="fixed inset-x-0 top-0 z-50 bg-transparent px-4 pt-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between rounded-full bg-white/90 px-6 py-2.5 shadow-lg backdrop-blur">
          <Link to="/" onClick={() => setOpen(false)}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                        `text-sm font-medium transition-colors ${
                            isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                        }`
                    }
                >
                  {link.label}
                </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
                to="/portal/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
                Account
            </Link>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="text-slate-600"
                aria-label="Toggle menu"
                aria-expanded={open}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                {open ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
              <motion.nav
                  key="mobile-nav"
                  className="mt-2 flex flex-col gap-1 overflow-hidden rounded-3xl bg-white px-6 py-4 shadow-lg md:hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={itemTransition}
              >
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                            `rounded-md px-2 py-2 text-sm font-medium ${
                                isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                            }`
                        }
                    >
                      {link.label}
                    </NavLink>
                ))}
                <div className="mt-2 flex flex-col gap-2">
                  <Link
                      to="/portal/login"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
                  >
                      Account
                  </Link>
                </div>
              </motion.nav>
          )}
        </AnimatePresence>
      </header>
  )
}
