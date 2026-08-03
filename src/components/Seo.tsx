import { useEffect } from 'react'

interface SeoProps {
  title: string
  description: string
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

export function Seo({ title, description }: SeoProps) {
  useEffect(() => {
    document.title = title
    setMetaTag('name', 'description', description)
    setMetaTag('property', 'og:title', title)
    setMetaTag('property', 'og:description', description)
  }, [title, description])

  return null
}
