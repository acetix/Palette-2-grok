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

function setLink(rel: string, href: string, attrs?: Record<string, string>) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v))
  }
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

const PATH_LABELS: Record<string, string> = {
  '/': 'Home',
  '/templates': 'Templates',
  '/calordetel': 'Calordetel',
  '/privacy': 'Privacy',
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
  const cleanPath = canonicalPath.split('?')[0] || '/'
  const url = `${SITE}${cleanPath === '/' ? '/' : cleanPath}`

  useEffect(() => {
    document.title = title
    setMeta('name', 'description', description)
    setMeta(
      'name',
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    )
    setMeta('name', 'googlebot', noindex ? 'noindex, nofollow' : 'index, follow')
    setLink('canonical', url)

    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', 'Palette by Acetix')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:image:secure_url', image)
    setMeta('property', 'og:image:width', '1200')
    setMeta('property', 'og:image:height', '630')
    setMeta('property', 'og:image:alt', 'Palette colour tool by Acetix')
    setMeta('property', 'og:locale', 'en_US')

    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)

    setJsonLd('seo-webpage', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      name: title,
      description,
      url,
      isPartOf: { '@id': `${SITE}/#website` },
      primaryImageOfPage: { '@type': 'ImageObject', url: image },
      inLanguage: 'en-US',
      dateModified: new Date().toISOString().slice(0, 10),
    })

    const crumbs = [{ name: 'Home', item: `${SITE}/` }]
    if (cleanPath !== '/') {
      crumbs.push({
        name: PATH_LABELS[cleanPath] || title,
        item: url,
      })
    }
    setJsonLd('seo-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: c.item,
      })),
    })
  }, [title, description, url, image, type, noindex, cleanPath])

  return null
}

export function SitewideJsonLd() {
  useEffect(() => {
    setJsonLd('seo-organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://acetix.xyz/#organization',
      name: 'acetix',
      url: 'https://acetix.xyz',
      logo: `${SITE}/favicon.svg`,
      sameAs: ['https://acetix.xyz', 'https://acetix.xyz/about', 'https://acetix.xyz/contact'],
    })

    setJsonLd('seo-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      name: 'Palette',
      alternateName: ['Palette by Acetix', 'Calordetel'],
      url: SITE,
      description:
        'Free browser-based colour palette generator. Extract colours from images, fine-tune in OKLCH, check WCAG contrast, export CSS tokens, and customize gradients.',
      publisher: { '@id': 'https://acetix.xyz/#organization' },
      inLanguage: 'en-US',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE}/templates?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    })

    setJsonLd('seo-app', {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': `${SITE}/#app`,
      name: 'Palette',
      url: SITE,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      creator: { '@id': 'https://acetix.xyz/#organization' },
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
      screenshot: DEFAULT_IMAGE,
    })
  }, [])

  return null
}
