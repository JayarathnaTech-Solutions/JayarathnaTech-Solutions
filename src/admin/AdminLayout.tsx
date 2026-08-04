import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from './AuthContext'
import { Logo } from '../components/Logo'

const navItems = [
    {
        to: '/admin',
        label: 'Dashboard',
        end: true,
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />,
    },
    {
        to: '/admin/projects',
        label: 'Projects',
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
            />
        ),
    },
    {
        to: '/admin/testimonials',
        label: 'Testimonials',
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
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            />
        ),
    },
    {
        to: '/admin/staff',
        label: 'Staff',
        adminOnly: true,
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10.5 10v-2a4 4 0 0 0-3-3.87M15.5 3.13A4 4 0 0 1 15.5 11"
            />
        ),
    },
]

function NavItem({ to, end, label, icon }: { to: string; end?: boolean; label: string; icon: ReactNode }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
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

function Sidebar({ isAdmin }: { isAdmin: boolean }) {
    return (
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900/40 px-4 py-6 md:flex md:flex-col">
            <div className="px-2">
                <Logo />
            </div>
            <nav className="mt-8 flex flex-col gap-1">
                {navItems
                    .filter((item) => !item.adminOnly || isAdmin)
                    .map((item) => (
                        <NavItem key={item.to} to={item.to} end={item.end} label={item.label} icon={item.icon} />
                    ))}
            </nav>
        </aside>
    )
}

function Topbar({ name }: { name: string }) {
    const initial = name.charAt(0).toUpperCase() || '?'

    return (
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-6 py-4">
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>

            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-400">
                    {initial}
                </div>
                <span className="hidden text-sm font-medium sm:inline">{name}</span>
                <button
                    type="button"
                    onClick={() => signOut(auth)}
                    className="text-sm font-medium text-slate-400 hover:text-white"
                >
                    Sign out
                </button>
            </div>
        </header>
    )
}

export function AdminLayout() {
    const { staff } = useAuth()

    return (
        <div className="flex min-h-screen bg-slate-950 text-white">
            <Sidebar isAdmin={staff.role === 'admin'} />
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar name={staff.name} />
                <main className="flex-1 px-6 py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
