import { Route, Routes } from 'react-router'
import { Analytics } from './components/Analytics'
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

function App() {
  return (
    <>
      <Routes>
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
      </Routes>
      <Analytics />
    </>
  )
}

export default App
