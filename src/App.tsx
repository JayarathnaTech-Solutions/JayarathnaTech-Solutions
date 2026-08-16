import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { Analytics } from './components/Analytics'
import { ADMIN_URL } from './lib/siteInfo'
import { PublicLayout } from './components/PublicLayout'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Services } from './pages/Services'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { Blog } from './pages/Blog'
import { BlogPost } from './pages/BlogPost'
import { Contact } from './pages/Contact'
import { TestimonialSubmission } from './pages/TestimonialSubmission'
import { NotFound } from './pages/NotFound'
import { AdminLayout } from './admin/AdminLayout'
import { RequireAuth } from './admin/RequireAuth'
import { Login } from './admin/pages/Login'
import { Dashboard } from './admin/pages/Dashboard'
import { AdminProjects } from './admin/pages/Projects'
import { AdminCompanies } from './admin/pages/Companies'
import { AdminTestimonials } from './admin/pages/Testimonials'
import { AdminQuotes } from './admin/pages/Quotes'
import { AdminAgreements } from './admin/pages/Agreements'
import { AdminInbox } from './admin/pages/Inbox'
import { AdminStaff } from './admin/pages/Staff'
import { AdminCustomers } from './admin/pages/Customers'
import { AdminEngagements } from './admin/pages/Engagements'
import { AdminEngagementDetail } from './admin/pages/EngagementDetail'
import { AdminSettings } from './admin/pages/Settings'
import { PortalLayout } from './portal/PortalLayout'
import { RequireCustomerAuth } from './portal/RequireCustomerAuth'
import { PortalLogin } from './portal/pages/Login'
import { PortalDashboard } from './portal/pages/Dashboard'
import { PortalEngagementDetail } from './portal/pages/EngagementDetail'

const ADMIN_HOSTNAME = new URL(ADMIN_URL).hostname
const isAdminHost = typeof window !== 'undefined' && window.location.hostname === ADMIN_HOSTNAME

// Old /admin/* links on the public domain now live on the admin subdomain —
// bounce them there instead of 404ing, preserving the path and query string.
// This is a cross-origin hop so it has to go through window.location, not
// react-router's <Navigate>.
function RedirectToAdminHost() {
  const location = useLocation()
  useEffect(() => {
    window.location.replace(`${ADMIN_URL}${location.pathname}${location.search}`)
  }, [location])
  return null
}

const adminRoutes = (
  <>
    <Route path="admin/login" element={<Login />} />
    <Route
      path="admin"
      element={
        <RequireAuth>
          <AdminLayout />
        </RequireAuth>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="projects" element={<AdminProjects />} />
      <Route path="companies" element={<AdminCompanies />} />
      <Route path="testimonials" element={<AdminTestimonials />} />
      <Route path="quotes" element={<AdminQuotes />} />
      <Route path="agreements" element={<AdminAgreements />} />
      <Route path="inbox" element={<AdminInbox />} />
      <Route path="staff" element={<AdminStaff />} />
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="engagements" element={<AdminEngagements />} />
      <Route path="engagements/:engagementId" element={<AdminEngagementDetail />} />
      <Route path="settings" element={<AdminSettings />} />
    </Route>
  </>
)

function App() {
  return (
    <>
      <Routes>
        {isAdminHost ? (
          <>
            {adminRoutes}
            <Route index element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        ) : (
          <>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="services" element={<Services />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="blog" element={<Blog />} />
              <Route path="blog/:slug" element={<BlogPost />} />
              <Route path="contact" element={<Contact />} />
              <Route path="testimonial/:token" element={<TestimonialSubmission />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="admin/*" element={<RedirectToAdminHost />} />

            <Route path="portal/login" element={<PortalLogin />} />
            <Route
              path="portal"
              element={
                <RequireCustomerAuth>
                  <PortalLayout />
                </RequireCustomerAuth>
              }
            >
              <Route index element={<PortalDashboard />} />
              <Route path="engagements/:engagementId" element={<PortalEngagementDetail />} />
            </Route>
          </>
        )}
      </Routes>
      <Analytics />
    </>
  )
}

export default App
