import { describe, expect, it } from 'vitest'
import {
  SEO_PAGES,
  SEO_PAGE_BY_PATH,
  getLanguageAlternates,
  getPracticeHref,
  getStructuredData,
} from './seoContent'

describe('SEO route manifest', () => {
  it('keeps paths, titles, and descriptions unique', () => {
    expect(new Set(SEO_PAGES.map((page) => page.path)).size).toBe(
      SEO_PAGES.length,
    )
    expect(new Set(SEO_PAGES.map((page) => page.title)).size).toBe(
      SEO_PAGES.length,
    )
    expect(new Set(SEO_PAGES.map((page) => page.description)).size).toBe(
      SEO_PAGES.length,
    )
  })

  it('only links to registered, same-language related pages', () => {
    SEO_PAGES.forEach((page) => {
      page.relatedPaths.forEach((relatedPath) => {
        const relatedPage = SEO_PAGE_BY_PATH.get(relatedPath)
        expect(relatedPage, `${page.path} -> ${relatedPath}`).toBeDefined()
        expect(relatedPage?.language).toBe(page.language)
      })
    })
  })

  it('keeps language alternates reciprocal', () => {
    SEO_PAGES.forEach((page) => {
      if (!page.alternatePath) {
        return
      }

      const alternate = SEO_PAGE_BY_PATH.get(page.alternatePath)
      expect(alternate).toBeDefined()
      expect(alternate?.alternatePath).toBe(page.path)
      expect(getLanguageAlternates(page)).toHaveLength(2)
    })
  })

  it('builds a deep link for each route with a practice mode', () => {
    SEO_PAGES.filter((page) => page.practiceMode).forEach((page) => {
      expect(getPracticeHref(page)).toContain(`mode=${page.practiceMode}`)
      expect(getPracticeHref(page)).toContain('source=')
    })
  })

  it('emits WebPage and BreadcrumbList structured data for content pages', () => {
    const data = getStructuredData(SEO_PAGE_BY_PATH.get('/ear-training'))
    const serialized = JSON.stringify(data)

    expect(serialized).toContain('LearningResource')
    expect(serialized).toContain('BreadcrumbList')
    expect(serialized).toContain('https://andy.knasoftware.com/ear-training')
  })
})
