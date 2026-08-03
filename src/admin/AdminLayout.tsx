import { Link, Outlet } from 'react-router'

export function AdminLayout() {
  return (
    <>
      <nav>
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/projects">Projects</Link>
        <Link to="/admin/testimonials">Testimonials</Link>
        <Link to="/admin/quotes">Quotes</Link>
        <Link to="/admin/inbox">Inbox</Link>
        <Link to="/admin/staff">Staff</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  )
}
