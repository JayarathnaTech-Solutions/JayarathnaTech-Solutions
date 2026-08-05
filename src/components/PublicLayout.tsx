import { useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { motion } from 'motion/react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { JsonLd } from './JsonLd'
import { ChatWidget } from './ChatWidget'
import { StickyMobileCta } from './StickyMobileCta'
import { buildOrganizationSchema } from '../lib/siteInfo'

export function PublicLayout() {
  const location = useLocation()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden dark:block" aria-hidden="true">
        <div className="absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-indigo-600/15 blur-[120px]" />
      </div>
      <JsonLd id="organization" data={buildOrganizationSchema()} />
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
      <ChatWidget />
      <StickyMobileCta />
    </div>
  )
}
