type AnalyticsValue = string | number | boolean | undefined

type AnalyticsParams = Record<string, AnalyticsValue>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? ''
const GA_SCRIPT_ID = 'google-analytics-script'

function isAnalyticsEnabled() {
  return GA_MEASUREMENT_ID.length > 0
}

function canUseDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function gtag(command: string, target: string | Date, params?: AnalyticsParams) {
  if (!canUseDom() || typeof window.gtag !== 'function') {
    return
  }

  window.gtag(command, target, params)
}

export function initAnalytics() {
  if (!isAnalyticsEnabled() || !canUseDom()) {
    return false
  }

  window.dataLayer ??= []
  window.gtag ??= function pushToDataLayer(...args: unknown[]) {
    window.dataLayer?.push(args)
  }

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = GA_SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`
    document.head.appendChild(script)
  }

  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
  })

  return true
}

export function trackPageView(path: string, title: string, language: string) {
  if (!isAnalyticsEnabled()) {
    return
  }

  gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
    language,
  })
}

export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (!isAnalyticsEnabled()) {
    return
  }

  gtag('event', name, params)
}
