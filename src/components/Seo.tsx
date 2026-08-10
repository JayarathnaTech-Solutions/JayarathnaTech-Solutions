import { useEffect } from 'react'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '../lib/siteInfo'

interface SeoProps {
  title: string
  description: string
  /** Absolute URL to a social preview image (ideally 1200×630). Defaults to the site's OG image. */
  image?: string
  /** Set true for dead-end pages (404s, missing records) so they aren't indexed. */
  noindex?: boolean
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

export function Seo({ title, description, image, noindex }: SeoProps) {
  useEffect(() => {
    // Read directly from the URL rather than react-router's useLocation so
    // this component has no router dependency — the browser's location is
    // already updated by the time a route's page component (and its <Seo>)
    // mounts or re-renders, whether that's from client-side navigation or a
    // full page load.
    const url = `${SITE_URL}${window.location.pathname}`
    const resolvedImage = image ?? DEFAULT_OG_IMAGE

    document.title = title
    setMetaTag('name', 'description', description)
    // Set explicitly (not just when noindex) so navigating from a noindexed
    // route (e.g. a 404) to a normal one resets it back to indexable.
    setMetaTag('name', 'robots', noindex ? 'noindex,follow' : 'index,follow')
    setCanonical(url)

    setMetaTag('property', 'og:title', title)
    setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:type', 'website')
    setMetaTag('property', 'og:url', url)
    setMetaTag('property', 'og:site_name', SITE_NAME)
    setMetaTag('property', 'og:image', resolvedImage)
    setMetaTag('property', 'og:locale', 'en_US')

    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', title)
    setMetaTag('name', 'twitter:description', description)
    setMetaTag('name', 'twitter:image', resolvedImage)
  }, [title, description, image, noindex])

  return null
}
