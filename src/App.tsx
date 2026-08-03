import { Route, Routes } from 'react-router'
import { PublicLayout } from './components/PublicLayout'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Services } from './pages/Services'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { Contact } from './pages/Contact'
import { TestimonialSubmission } from './pages/TestimonialSubmission'
import { NotFound } from './pages/NotFound'
import { AdminLayout } from './admin/AdminLayout'
import { RequireAuth } from './admin/RequireAuth'
import { Login } from './admin/pages/Login'
import { Dashboard } from './admin/pages/Dashboard'
import { AdminProjects } from './admin/pages/Projects'
import { AdminTestimonials } from './admin/pages/Testimonials'
import { AdminQuotes } from './admin/pages/Quotes'
import { AdminInbox } from './admin/pages/Inbox'
import { AdminStaff } from './admin/pages/Staff'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<ProjectDetail />} />
        <Route path="contact" element={<Contact />} />
        <Route path="testimonial/:token" element={<TestimonialSubmission />} />
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
        <Route path="testimonials" element={<AdminTestimonials />} />
        <Route path="quotes" element={<AdminQuotes />} />
        <Route path="inbox" element={<AdminInbox />} />
        <Route path="staff" element={<AdminStaff />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
