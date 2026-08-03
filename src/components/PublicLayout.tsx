import { Outlet } from 'react-router'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
