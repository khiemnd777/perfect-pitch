import { describe, expect, it } from 'vitest'
import { SEO_PAGES, SEO_PAGE_BY_PATH, SITE_URL } from '../src/seo/seoContent'
import { generateSitemap, renderSeoPage } from './generate-seo'

describe('SEO artifact generator', () => {
  it('renders visible headings, FAQs, related links, and practice CTA', () => {
    const page = SEO_PAGE_BY_PATH.get('/interval-ear-training')
    expect(page).toBeDefined()

    const html = renderSeoPage(page!)

    expect(html).toContain('<h1>Learn to recognize musical intervals by ear</h1>')
    expect(html).toContain('<details>')
    expect(html).toContain('/?mode=interval&amp;source=%2Finterval-ear-training')
    expect(html).toContain('/melody-ear-training')
  })

  it('generates canonical URLs without ignored priority or changefreq fields', () => {
    const sitemap = generateSitemap()

    expect(sitemap.match(/<url>/g)).toHaveLength(SEO_PAGES.length + 1)
    expect(sitemap).not.toContain('<priority>')
    expect(sitemap).not.toContain('<changefreq>')
    SEO_PAGES.forEach((page) => {
      expect(sitemap).toContain(`<loc>${SITE_URL}${page.path}</loc>`)
    })
  })

  it('includes reciprocal EN and VI hreflang entries in the sitemap', () => {
    const sitemap = generateSitemap()

    expect(sitemap).toContain(
      'hreflang="en" href="https://andy.knasoftware.com/ear-training"',
    )
    expect(sitemap).toContain(
      'hreflang="vi" href="https://andy.knasoftware.com/vi/luyen-cam-am"',
    )
  })
})
