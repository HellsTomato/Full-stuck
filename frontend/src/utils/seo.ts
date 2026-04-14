import { useEffect } from 'react'

type SeoOptions = {
  title: string
  description: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
}

function upsertMeta(name: string, content: string, byProperty = false) {
  const selector = byProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`
  let element = document.head.querySelector(selector) as HTMLMetaElement | null

  if (!element) {
    element = document.createElement('meta')
    if (byProperty) {
      element.setAttribute('property', name)
    } else {
      element.setAttribute('name', name)
    }
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`
  let element = document.head.querySelector(selector) as HTMLLinkElement | null

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

export function usePageSeo(options: SeoOptions) {
  const { title, description, keywords, image, url, type } = options

  useEffect(() => {
    const pageUrl = url || window.location.href
    const pageImage = image || '/og-image.svg'

    document.title = title

    upsertMeta('description', description)
    if (keywords) {
      upsertMeta('keywords', keywords)
    }

    upsertMeta('og:title', title, true)
    upsertMeta('og:description', description, true)
    upsertMeta('og:type', type || 'website', true)
    upsertMeta('og:url', pageUrl, true)
    upsertMeta('og:image', pageImage, true)

    upsertMeta('twitter:card', 'summary_large_image')
    upsertMeta('twitter:title', title)
    upsertMeta('twitter:description', description)
    upsertMeta('twitter:image', pageImage)

    upsertLink('canonical', pageUrl)
  }, [title, description, keywords, image, url, type])
}
