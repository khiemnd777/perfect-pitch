import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SEO_PAGES,
  SEO_PAGE_BY_PATH,
  SITE_NAME,
  SITE_URL,
  SOCIAL_IMAGE_PATH,
  getAbsoluteUrl,
  getLanguageAlternates,
  getPracticeHref,
  getStructuredData,
  type SeoPageContent,
} from '../src/seo/seoContent'

export const SEO_LAST_MODIFIED = '2026-07-28'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceMeta(
  html: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  const pattern = new RegExp(
    `<meta\\s+${attribute}="${escapeRegExp(key)}"\\s+content="[^"]*"\\s*/?>`,
    's',
  )
  const replacement = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`

  if (pattern.test(html)) {
    return html.replace(pattern, replacement)
  }

  return html.replace('</head>', `    ${replacement}\n  </head>`)
}

function replaceCanonical(html: string, href: string | null) {
  const pattern = /\s*<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/
  const withoutCanonical = html.replace(pattern, '')
  if (!href) {
    return withoutCanonical
  }

  return withoutCanonical.replace(
    '</head>',
    `    <link rel="canonical" href="${escapeHtml(href)}" />\n  </head>`,
  )
}

function replaceStructuredData(html: string, data: unknown | null) {
  if (data === null) {
    return html.replace(
      /\s*<script id="seo-structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/,
      '',
    )
  }

  return html.replace(
    /<script id="seo-structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script id="seo-structured-data" type="application/ld+json">${JSON.stringify(data)}</script>`,
  )
}

function replaceLanguageAlternates(html: string, page: SeoPageContent) {
  const alternates = getLanguageAlternates(page)
    .map(
      (alternate) =>
        `    <link rel="alternate" hreflang="${alternate.language}" href="${escapeHtml(getAbsoluteUrl(alternate.path))}" />`,
    )
    .join('\n')
  const defaultPath = page.language === 'en' ? page.path : (page.alternatePath ?? page.path)
  const defaultLink = `    <link rel="alternate" hreflang="x-default" href="${escapeHtml(getAbsoluteUrl(defaultPath))}" />`

  return html.replace('</head>', `${alternates}\n${defaultLink}\n  </head>`)
}

function renderLinks(paths: string[], language: 'en' | 'vi') {
  const label = language === 'vi' ? 'Chủ đề luyện cảm âm' : 'Ear training topics'
  const links = paths
    .map((path) => SEO_PAGE_BY_PATH.get(path))
    .filter((page): page is SeoPageContent => Boolean(page))
    .map(
      (page) =>
        `<a href="${escapeHtml(page.path)}">${escapeHtml(page.eyebrow)}</a>`,
    )
    .join('')
  return `<nav class="seo-links" aria-label="${escapeHtml(label)}">${links}</nav>`
}

export function renderSeoPage(page: SeoPageContent) {
  const isVietnamese = page.language === 'vi'
  const hubPath = isVietnamese ? '/vi/luyen-cam-am' : '/ear-training'
  const alternate = page.alternatePath
    ? SEO_PAGE_BY_PATH.get(page.alternatePath)
    : null
  const alternateLink = alternate
    ? `<a class="ghost-button" href="${escapeHtml(alternate.path)}" lang="${alternate.language}">${alternate.language === 'vi' ? 'VI' : 'EN'}</a>`
    : ''
  const breadcrumbCurrent =
    page.path === hubPath
      ? ''
      : `<span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(page.eyebrow)}</span>`
  const sections = page.sections
    .map((section) => {
      const paragraphs = section.paragraphs
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join('')
      const points = section.points
        ? `<ul>${section.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>`
        : ''
      return `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphs}${points}</section>`
    })
    .join('')
  const faqs = page.faqs
    .map(
      (faq) =>
        `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`,
    )
    .join('')

  return `<main class="shell shell--ready"><div class="shell__content"><article class="seo-page"><header class="seo-page__hero"><div class="hero-panel__top"><a class="eyebrow eyebrow--link" href="/">${SITE_NAME}</a><div class="seo-page__actions">${alternateLink}<a class="ghost-button" href="${escapeHtml(getPracticeHref(page))}">${escapeHtml(page.practiceLabel)}</a></div></div><nav aria-label="${isVietnamese ? 'Đường dẫn trang' : 'Breadcrumb'}" class="seo-breadcrumbs"><a href="/">${SITE_NAME}</a><span aria-hidden="true">/</span><a href="${hubPath}">${isVietnamese ? 'Luyện cảm âm' : 'Ear training'}</a>${breadcrumbCurrent}</nav><p class="question-kicker">${escapeHtml(page.eyebrow)}</p><h1>${escapeHtml(page.heading)}</h1><p class="hero-copy">${escapeHtml(page.intro)}</p></header><section class="seo-page__body" aria-label="${escapeHtml(page.eyebrow)} guide">${sections}</section><section class="seo-page__faq" aria-labelledby="seo-faq-heading"><h2 id="seo-faq-heading">${isVietnamese ? 'Câu hỏi thường gặp' : 'Frequently asked questions'}</h2>${faqs}</section><section class="seo-panel" aria-labelledby="seo-more-heading"><div class="seo-panel__header"><p class="question-kicker">${isVietnamese ? 'Chủ đề luyện tai liên quan' : 'More ear training topics'}</p><h2 id="seo-more-heading">${isVietnamese ? 'Tiếp tục khám phá' : 'Keep exploring'}</h2></div>${renderLinks(page.relatedPaths, page.language)}</section></article><footer class="app-footer"><div>${isVietnamese ? 'Dành cho con. Từ bố' : 'For Son. By Father'}</div><a class="app-footer__link" href="https://github.com/khiemnd777/perfect-pitch" rel="noreferrer">GitHub</a></footer></div></main>`
}

export function renderHomePage() {
  const englishPaths = SEO_PAGES.filter((page) => page.language === 'en').map(
    (page) => page.path,
  )
  return `<main class="shell shell--ready"><div class="shell__content"><section class="hero-panel"><div class="hero-panel__copy"><p class="eyebrow">${SITE_NAME}</p><h1>Listen, play &amp; grow your pets!</h1><p class="hero-copy">Free online ear training with real piano sounds, eight practice modes, five levels, and instant feedback after every answer.</p><a class="primary-button" href="#practice">Start free ear training</a></div></section><section id="practice" class="seo-panel"><div class="seo-panel__header"><p class="question-kicker">Ear training guides</p><h2>Practice notes, intervals, melodies, chords, and scales</h2><p>Choose a focused guide or enable JavaScript to start the interactive ear trainer.</p></div>${renderLinks(englishPaths, 'en')}</section></div></main>`
}

export function renderNotFoundPage() {
  return `<main class="shell shell--ready"><div class="shell__content"><section class="seo-page__hero seo-page__not-found"><p class="question-kicker">404</p><h1>Page not found</h1><p class="hero-copy">This page does not exist. Return to the ear trainer or choose a learning guide.</p><a class="primary-button" href="/">Return to Perfect Pitch</a></section>${renderLinks(['/ear-training', '/perfect-pitch-training', '/interval-ear-training'], 'en')}</div></main>`
}

function applyDocumentMetadata(
  sourceHtml: string,
  options: {
    title: string
    description: string
    language: 'en' | 'vi'
    locale: 'en_US' | 'vi_VN'
    canonical: string | null
    robots: string
    body: string
    structuredData: unknown | null
    page?: SeoPageContent
  },
) {
  let html = sourceHtml
    .replace(/<html lang="[^"]+">/, `<html lang="${options.language}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(options.title)}</title>`)
    .replace(/<noscript>[\s\S]*?<\/noscript>/, '')
    .replace('<div id="root"></div>', `<div id="root">${options.body}</div>`)

  html = replaceMeta(html, 'name', 'description', options.description)
  html = replaceMeta(html, 'name', 'robots', options.robots)
  html = replaceMeta(html, 'property', 'og:url', options.canonical ?? `${SITE_URL}/`)
  html = replaceMeta(html, 'property', 'og:title', options.title)
  html = replaceMeta(html, 'property', 'og:description', options.description)
  html = replaceMeta(html, 'property', 'og:locale', options.locale)
  html = replaceMeta(
    html,
    'property',
    'og:locale:alternate',
    options.language === 'vi' ? 'en_US' : 'vi_VN',
  )
  html = replaceMeta(html, 'property', 'og:image', getAbsoluteUrl(SOCIAL_IMAGE_PATH))
  html = replaceMeta(html, 'name', 'twitter:title', options.title)
  html = replaceMeta(html, 'name', 'twitter:description', options.description)
  html = replaceMeta(html, 'name', 'twitter:image', getAbsoluteUrl(SOCIAL_IMAGE_PATH))
  html = replaceCanonical(html, options.canonical)
  html = replaceStructuredData(html, options.structuredData)

  if (options.page) {
    html = replaceLanguageAlternates(html, options.page)
  }

  return html
}

export function generateSitemap() {
  const urls = [
    `  <url><loc>${SITE_URL}/</loc><lastmod>${SEO_LAST_MODIFIED}</lastmod></url>`,
    ...SEO_PAGES.map((page) => {
      const alternates = getLanguageAlternates(page)
        .map(
          (alternate) =>
            `<xhtml:link rel="alternate" hreflang="${alternate.language}" href="${escapeHtml(getAbsoluteUrl(alternate.path))}" />`,
        )
        .join('')
      return `  <url><loc>${escapeHtml(getAbsoluteUrl(page.path))}</loc><lastmod>${SEO_LAST_MODIFIED}</lastmod>${alternates}</url>`
    }),
  ].join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`
}

export async function generateSeoArtifacts(distDirectory = join(process.cwd(), 'dist')) {
  const indexPath = join(distDirectory, 'index.html')
  const sourceHtml = await readFile(indexPath, 'utf8')
  const homeHtml = applyDocumentMetadata(sourceHtml, {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    language: 'en',
    locale: 'en_US',
    canonical: `${SITE_URL}/`,
    robots: 'index, follow',
    body: renderHomePage(),
    structuredData: getStructuredData(null),
  })
  await writeFile(indexPath, homeHtml)

  for (const page of SEO_PAGES) {
    const outputPath = join(distDirectory, `${page.path.slice(1)}.html`)
    await mkdir(dirname(outputPath), { recursive: true })
    const pageHtml = applyDocumentMetadata(sourceHtml, {
      title: page.title,
      description: page.description,
      language: page.language,
      locale: page.locale,
      canonical: getAbsoluteUrl(page.path),
      robots: 'index, follow',
      body: renderSeoPage(page),
      structuredData: getStructuredData(page),
      page,
    })
    await writeFile(outputPath, pageHtml)
  }

  const notFoundHtml = applyDocumentMetadata(sourceHtml, {
    title: 'Page Not Found | Perfect Pitch',
    description: 'The requested page could not be found.',
    language: 'en',
    locale: 'en_US',
    canonical: null,
    robots: 'noindex, follow',
    body: renderNotFoundPage(),
    structuredData: null,
  })
  await writeFile(join(distDirectory, '404.html'), notFoundHtml)
  await writeFile(join(distDirectory, 'sitemap.xml'), generateSitemap())
}

if (import.meta.main) {
  await generateSeoArtifacts()
}
