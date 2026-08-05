import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { initAnalytics, trackPageview } from '../lib/analytics'

// Reports pageviews to GA4 on every client-side route change — GA's default
// pageview-on-load doesn't fire for SPA navigation, so this replaces it.
export function Analytics() {
  const location = useLocation()

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    trackPageview(location.pathname + location.search)
  }, [location.pathname, location.search])

  return null
}
