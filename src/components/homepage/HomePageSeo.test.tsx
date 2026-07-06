import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import HomePage from './HomePage'

vi.mock('./HomePageView', () => ({
  default: () => <main>Homepage shell</main>,
}))

const SEO_TITLE = 'NEXORA TOUCH | Smart QR Tips, Reviews & Loyalty for Salons'
const EXPECTED_FAQ_QUESTIONS = [
  'What is Nexora Touch?',
  'How is Nexora Touch different from regular tipping or QR apps?',
  'Why should a business use Nexora Touch instead of only personal wallet tips?',
  'Do customers need to download an app?',
  'How is Smart QR better than a regular QR code?',
  'How does direct tipping work?',
  'What do owners and staff use the app for?',
  'How does Nexora Touch help increase Google/Yelp reviews?',
  'Does Nexora Touch only handle tips?',
  'How does a business start using Nexora Touch after signing up?',
]

function loadIndexDocument() {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
  return new JSDOM(html).window.document
}

function getMeta(document: Document, selector: string) {
  return document.querySelector(selector)?.getAttribute('content') ?? ''
}

function getStructuredData(document: Document) {
  const script = document.querySelector('script[type="application/ld+json"]')
  expect(script?.textContent).toBeTruthy()
  return JSON.parse(script?.textContent ?? '{}') as {
    '@context'?: string
    '@graph'?: Array<Record<string, unknown>>
  }
}

function findGraphNode(graph: Array<Record<string, unknown>>, type: string) {
  return graph.find((node) => {
    const nodeType = node['@type']
    return Array.isArray(nodeType) ? nodeType.includes(type) : nodeType === type
  })
}

describe('homepage SEO metadata', () => {
  it('uses search-focused title, description, and social metadata', () => {
    const document = loadIndexDocument()
    const description = getMeta(document, 'meta[name="description"]')

    expect(document.title).toBe(SEO_TITLE)
    expect(description).toMatch(/Smart QR/i)
    expect(description).toMatch(/salons and spas/i)
    expect(description).toMatch(/direct tips/i)
    expect(description).toMatch(/Google\/Yelp reviews/i)
    expect(getMeta(document, 'meta[name="application-name"]')).toBe('NEXORA TOUCH')
    expect(getMeta(document, 'meta[property="og:title"]')).toBe(SEO_TITLE)
    expect(getMeta(document, 'meta[name="twitter:title"]')).toBe(SEO_TITLE)
  })

  it('exposes JSON-LD for the app, website, organization, and visible FAQ', () => {
    const document = loadIndexDocument()
    const structuredData = getStructuredData(document)
    const graph = structuredData['@graph'] ?? []
    const app = findGraphNode(graph, 'SoftwareApplication')
    const website = findGraphNode(graph, 'WebSite')
    const organization = findGraphNode(graph, 'Organization')
    const faq = findGraphNode(graph, 'FAQPage') as
      | {
          mainEntity?: Array<{
            '@type': string
            name: string
            acceptedAnswer: {
              '@type': string
              text: string
            }
          }>
        }
      | undefined

    expect(structuredData['@context']).toBe('https://schema.org')
    expect(organization?.name).toBe('NEXORA TOUCH')
    expect(website?.url).toBe('https://nexoratouch.com/')
    expect(app?.applicationCategory).toBe('BusinessApplication')
    expect(app?.featureList).toEqual(
      expect.arrayContaining([
        'Smart QR customer flow',
        'Direct staff tipping',
        'Google and Yelp review routing',
        'Customer loyalty rewards',
        'Owner and staff dashboards',
      ]),
    )
    expect(faq?.mainEntity).toHaveLength(10)
    expect(faq?.mainEntity?.map((item) => item.name)).toEqual(EXPECTED_FAQ_QUESTIONS)
    expect(JSON.stringify(faq)).not.toMatch(/NFC/i)
  })

  it('publishes crawl directives and a root sitemap for the canonical homepage', () => {
    const robotsPath = resolve(process.cwd(), 'public/robots.txt')
    const sitemapPath = resolve(process.cwd(), 'public/sitemap.xml')

    expect(existsSync(robotsPath)).toBe(true)
    expect(existsSync(sitemapPath)).toBe(true)

    const robots = readFileSync(robotsPath, 'utf8')
    const sitemap = readFileSync(sitemapPath, 'utf8')

    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Sitemap: https://nexoratouch.com/sitemap.xml')
    expect(sitemap).toContain('<loc>https://nexoratouch.com/</loc>')
  })

  it('keeps the runtime homepage title aligned with the SEO title', () => {
    document.title = 'Previous title'

    const { unmount } = render(<HomePage />)

    expect(document.title).toBe(SEO_TITLE)

    unmount()

    expect(document.title).toBe('Previous title')
  })
})
