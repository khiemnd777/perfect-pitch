import { afterEach, describe, expect, it, vi } from 'vitest'

const appendChildSpy = vi.spyOn(document.head, 'appendChild')

afterEach(() => {
  appendChildSpy.mockClear()
  document.getElementById('google-analytics-script')?.remove()
  delete window.dataLayer
  delete window.gtag
  vi.resetModules()
  vi.unstubAllEnvs()
})

describe('analytics', () => {
  it('does nothing when no GA measurement id is configured', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')
    const analytics = await import('./analytics')

    expect(analytics.initAnalytics()).toBe(false)
    analytics.trackPageView('/', 'Perfect Pitch', 'en')
    analytics.trackEvent('select_mode', { mode: 'single' })

    expect(window.gtag).toBeUndefined()
    expect(appendChildSpy).not.toHaveBeenCalled()
  })

  it('injects the GA script and queues config and events', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
    const analytics = await import('./analytics')

    expect(analytics.initAnalytics()).toBe(true)
    analytics.trackPageView('/mode/single', 'Perfect Pitch - Single Note', 'vi')
    analytics.trackEvent('select_mode', { mode: 'single', difficulty: 'easy' })

    expect(document.getElementById('google-analytics-script')).toBeInTheDocument()
    expect(appendChildSpy).toHaveBeenCalledOnce()
    expect(window.dataLayer).toEqual([
      ['js', expect.any(Date), undefined],
      ['config', 'G-TEST123', { send_page_view: false }],
      [
        'event',
        'page_view',
        {
          page_path: '/mode/single',
          page_title: 'Perfect Pitch - Single Note',
          language: 'vi',
        },
      ],
      ['event', 'select_mode', { mode: 'single', difficulty: 'easy' }],
    ])
  })
})
