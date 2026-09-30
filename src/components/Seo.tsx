import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE = 'https://paletto.acetix.xyz'
const DEFAULT_IMAGE = `${SITE}/images/palette-still-life.png`

type SeoProps = {
  title: string
  description: string
  path?: string
  image?: string
  type?: string
  noindex?: boolean
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(id: string, data: object) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export function Seo({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
}: SeoProps) {
  const { pathname } = useLocation()
  const canonicalPath = path ?? pathname
  const url = `${SITE}${canonicalPath === '/' ? '/' : canonicalPath}`

  useEffect(() => {
    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
    setMeta('name', 'googlebot', noindex ? 'noindex, nofollow' : 'index, follow')
    setLink('canonical', url)

    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', 'Palette by Acetix')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:image:alt', 'Palette colour tool by Acetix')
    setMeta('property', 'og:locale', 'en_US')

    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)

    setJsonLd('seo-webpage', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Palette by Acetix',
        url: SITE,
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: image,
      },
      inLanguage: 'en',
    })
  }, [title, description, url, image, type, noindex])

  return null
}

export function SitewideJsonLd() {
  useEffect(() => {
    setJsonLd('seo-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Palette',
      alternateName: ['Palette by Acetix', 'Calordetel'],
      url: SITE,
      description:
        'Free browser-based colour palette generator. Extract colours from images, fine-tune in OKLCH, check WCAG contrast, export CSS tokens, and customize gradients.',
      publisher: {
        '@type': 'Organization',
        name: 'acetix',
        url: 'https://acetix.xyz',
        logo: `${SITE}/favicon.svg`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE}/templates?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    })

    setJsonLd('seo-app', {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Palette',
      url: SITE,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      creator: { '@type': 'Organization', name: 'acetix', url: 'https://acetix.xyz' },
      featureList: [
        'Image colour extraction',
        'OKLCH fine-tuning',
        'WCAG contrast checker',
        'CSS SCSS Tailwind export',
        'Infinite colour templates',
        'Gradient CSS studio (Calordetel)',
        'Shareable palette links',
        'Private on-device processing',
      ],
    })
  }, [])

  return null
}
