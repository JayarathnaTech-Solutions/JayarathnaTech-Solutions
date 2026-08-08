import { useState, type ReactNode } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from './AuthContext'
import { useEscapeKey } from '../lib/useEscapeKey'
import { Logo } from '../components/Logo'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { StaffRole } from '../types'

interface NavItemConfig {
    to: string
    label: string
    end?: boolean
    /** Restricts visibility to these roles; omit to show to every staff role. */
    visibleTo?: StaffRole[]
    icon: ReactNode
}

const navItems: NavItemConfig[] = [
    {
        to: '/admin',
        label: 'Dashboard',
        end: true,
        visibleTo: ['admin', 'editor'],
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />,
    },
    {
        to: '/admin/projects',
        label: 'Projects',
        visibleTo: ['admin', 'editor'],
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
            />
        ),
    },
    {
        to: '/admin/companies',
        label: 'Companies',
        visibleTo: ['admin', 'editor'],
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 21h18M6 21V7l6-4 6 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"
            />
        ),
    },
    {
        to: '/admin/testimonials',
        label: 'Testimonials',
        visibleTo: ['admin', 'editor'],
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m12 3 2.7 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.5 19.5l1.2-6-4.5-4.2 6.1-.7L12 3Z"
            />
        ),
    },
    {
        to: '/admin/quotes',
        label: 'Quotes',
        visibleTo: ['admin', 'editor'],
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6M9 17h6"
            />
        ),
    },
    {
        to: '/admin/inbox',
        label: 'Messages',
        visibleTo: ['admin', 'editor'],
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            />
        ),
    },
    {
        to: '/admin/customers',
        label: 'Customers',
        visibleTo: ['admin'],
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm12 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            />
        ),
    },
    {
        to: '/admin/engagements',
        label: 'Engagements',
        visibleTo: ['admin', 'developer'],
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 12h6M9 16h6"
            />
        ),
    },
    {
        to: '/admin/staff',
        label: 'Staff',
        visibleTo: ['admin', 'hr'],
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10.5 10v-2a4 4 0 0 0-3-3.87M15.5 3.13A4 4 0 0 1 15.5 11"
            />
        ),
    },
    {
        to: '/admin/settings',
        label: 'Settings',
        visibleTo: ['admin'],
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.3 3.4a1.9 1.9 0 0 1 3.4 0l.3.7a1.9 1.9 0 0 0 2.3 1l.8-.3a1.9 1.9 0 0 1 2.4 2.4l-.3.8a1.9 1.9 0 0 0 1 2.3l.7.3a1.9 1.9 0 0 1 0 3.4l-.7.3a1.9 1.9 0 0 0-1 2.3l.3.8a1.9 1.9 0 0 1-2.4 2.4l-.8-.3a1.9 1.9 0 0 0-2.3 1l-.3.7a1.9 1.9 0 0 1-3.4 0l-.3-.7a1.9 1.9 0 0 0-2.3-1l-.8.3a1.9 1.9 0 0 1-2.4-2.4l.3-.8a1.9 1.9 0 0 0-1-2.3l-.7-.3a1.9 1.9 0 0 1 0-3.4l.7-.3a1.9 1.9 0 0 0 1-2.3l-.3-.8a1.9 1.9 0 0 1 2.4-2.4l.8.3a1.9 1.9 0 0 0 2.3-1l.3-.7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
            />
        ),
    },
]

function useCurrentPageLabel() {
    const { pathname } = useLocation()
    const match = navItems
        .filter((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))
        .sort((a, b) => b.to.length - a.to.length)[0]
    return match?.label ?? 'Dashboard'
}

function NavItem({
    to,
    end,
    label,
    icon,
    onClick,
}: {
    to: string
    end?: boolean
    label: string
    icon: ReactNode
    onClick?: () => void
}) {
    return (
        <NavLink
            to={to}
            end={end}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`
            }
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                {icon}
            </svg>
            {label}
        </NavLink>
    )
}

function NavList({ role, onNavigate }: { role: StaffRole; onNavigate?: () => void }) {
    return (
        <nav className="mt-8 flex flex-col gap-1">
            {navItems
                .filter((item) => !item.visibleTo || item.visibleTo.includes(role))
                .map((item) => (
                    <NavItem key={item.to} to={item.to} end={item.end} label={item.label} icon={item.icon} onClick={onNavigate} />
                ))}
        </nav>
    )
}

function Sidebar({ role }: { role: StaffRole }) {
    return (
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-6 md:flex md:flex-col">
            <div className="px-2">
                <Logo />
            </div>
            <NavList role={role} />
        </aside>
    )
}

function MobileNavDrawer({ role, open, onClose }: { role: StaffRole; open: boolean; onClose: () => void }) {
    useEscapeKey(open, onClose)

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.aside
                        role="dialog"
                        aria-modal="true"
                        aria-label="Navigation"
                        className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 md:hidden"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="px-2">
                            <Logo />
                        </div>
                        <NavList role={role} onNavigate={onClose} />
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}

function Topbar({ name, onMenuClick, mobileNavOpen }: { name: string; onMenuClick: () => void; mobileNavOpen: boolean }) {
    const initial = name.charAt(0).toUpperCase() || '?'
    const title = useCurrentPageLabel()
    const [signOutOpen, setSignOutOpen] = useState(false)

    return (
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="text-slate-600 md:hidden"
                    aria-label="Toggle navigation"
                    aria-expanded={mobileNavOpen}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        {mobileNavOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                        )}
                    </svg>
                </button>
                <h1 className="text-lg font-semibold">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-600">
                    {initial}
                </div>
                <span className="hidden text-sm font-medium sm:inline">{name}</span>
                <button
                    type="button"
                    onClick={() => setSignOutOpen(true)}
                    className="text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                    Sign out
                </button>
            </div>

            <ConfirmDialog
                open={signOutOpen}
                title="Sign out?"
                message="You'll need to sign in again to access the admin panel."
                confirmLabel="Sign Out"
                onConfirm={() => signOut(auth)}
                onCancel={() => setSignOutOpen(false)}
            />
        </header>
    )
}

export function AdminLayout() {
    const { staff } = useAuth()
    const { pathname } = useLocation()
    const [mobileNavOpen, setMobileNavOpen] = useState(false)

    // Developers only have Engagements in the nav — bounce them out of any
    // other admin route (e.g. the `/admin` dashboard index) instead of
    // rendering a page they otherwise can't get to via the sidebar.
    if (staff.role === 'developer' && !pathname.startsWith('/admin/engagements')) {
        return <Navigate to="/admin/engagements" replace />
    }

    // HR is scoped to staff management only — nav hiding alone wouldn't stop
    // a direct URL hit to e.g. /admin/settings, so enforce it here too.
    if (staff.role === 'hr' && !pathname.startsWith('/admin/staff')) {
        return <Navigate to="/admin/staff" replace />
    }

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
            <Sidebar role={staff.role} />
            <MobileNavDrawer role={staff.role} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar name={staff.name} onMenuClick={() => setMobileNavOpen((value) => !value)} mobileNavOpen={mobileNavOpen} />
                <main className="flex-1 px-6 py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
