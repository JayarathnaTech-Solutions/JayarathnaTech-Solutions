import { useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { motion } from 'motion/react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function PublicLayout() {
  const location = useLocation()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <Navbar />
      <motion.main
        key={location.pathname}
        className="flex-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  )
}
