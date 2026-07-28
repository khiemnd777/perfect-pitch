import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import './App.css'
import './clayTheme.css'
import type { AudioEngine } from '../features/audio/audioEngine'
import { evaluateSelection } from '../features/game/evaluation'
import {
  feedDino,
  isDinoHungry,
  loadDinoCare,
  markDinoRoared,
  saveDinoCare,
  shouldDinoRoar,
  type DinoCareState,
} from '../features/game/dinoCare'
import {
  DINO_POINTS_PER_CORRECT,
  saveDinoProgress,
} from '../features/game/dinoProgress'
import {
  loadPetCollection,
  purchasePet,
  rewardSelectedPet,
  savePetCollection,
  selectPet,
} from '../features/game/petCollection'
import {
  applyProgression,
  loadProgressState,
  saveProgressState,
  type ModeProgressState,
} from '../features/game/progression'
import {
  createQuestionFactory,
  type QuestionFactory,
} from '../features/question-bank/questionFactory'
import { PetCompanion } from '../features/pet-shop/PetCompanion'
import {
  formatSessionStats,
  getAppCopy,
  getDifficultyCopy,
  getDifficultyLabel,
  getPetIdentityCopy,
  getModeCopy,
  formatChoiceMeta,
  translateIntervalLabel,
  translateScaleLabel,
  type Language,
} from '../shared/localization'
import {
  GAME_MODES,
  type GameMode,
  type PetId,
  type Question,
  type QuestionEvaluation,
  type SessionStats,
} from '../shared/gameTypes'
import {
  loadLanguagePreference,
  saveLanguagePreference,
} from './languagePreference'
import {
  DEFAULT_SESSION_STATS,
  loadSessionStats,
  resetSessionStats,
  saveSessionStats,
} from './sessionStats'
import { initAnalytics, trackEvent, trackPageView } from './analytics'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SEO_PAGES,
  SEO_PAGE_BY_PATH,
  SITE_URL,
  SOCIAL_IMAGE_PATH,
  getAbsoluteUrl,
  getLanguageAlternates,
  getPracticeHref,
  getStructuredData,
  type SeoPageContent,
} from '../seo/seoContent'

const QUESTION_DEDUP_MAX_ATTEMPTS = 24
const PLAYBACK_START_DELAY_MS = 80
const PLAYBACK_LOCK_BUFFER_MS = 40
const DINO_HUNGER_CHECK_INTERVAL_MS = 60 * 1000

const PetShop = lazy(() =>
  import('../features/pet-shop/PetShop').then((module) => ({
    default: module.PetShop,
  })),
)

const MODE_ICONS: Record<Exclude<GameMode, 'interval'>, string> = {
  single: '🎵',
  double: '🎶',
  melody: '🎼',
  arpeggio: '✨',
  chord: '🎹',
  scale: '🪜',
  seventh: '🎷',
}

const RAINBOW_BANDS = [
  { color: '#e63946', radius: 21 },
  { color: '#f77f00', radius: 18 },
  { color: '#facc15', radius: 15 },
  { color: '#2bb673', radius: 12 },
  { color: '#3a86ff', radius: 9 },
  { color: '#4f46e5', radius: 6 },
  { color: '#8b5cf6', radius: 3 },
] as const

function ModeIcon({ mode }: { mode: GameMode }) {
  if (mode !== 'interval') {
    return MODE_ICONS[mode]
  }

  return (
    <svg className="mode-card__rainbow" viewBox="0 0 48 40">
      {RAINBOW_BANDS.map(({ color, radius }) => (
        <path
          key={color}
          className="mode-card__rainbow-band"
          d={`M ${24 - radius} 36 A ${radius} ${radius} 0 0 1 ${24 + radius} 36`}
          fill="none"
          stroke={color}
          strokeWidth="3"
        />
      ))}
    </svg>
  )
}

async function playDefaultDinoRoar() {
  const { playDinoRoar } = await import('../features/audio/dinoVoice')
  await playDinoRoar()
}


function getCurrentPath() {
  if (typeof window === 'undefined') {
    return '/'
  }

  return window.location.pathname
}

function getRequestedMode() {
  if (typeof window === 'undefined') {
    return null
  }

  const requestedMode = new URLSearchParams(window.location.search).get('mode')
  return GAME_MODES.includes(requestedMode as GameMode)
    ? (requestedMode as GameMode)
    : null
}

function getRequestedSource() {
  if (typeof window === 'undefined') {
    return null
  }

  return new URLSearchParams(window.location.search).get('source')
}

function setMetaContent(selector: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(selector)
  if (!meta) {
    const selectorMatch = selector.match(/^meta\[(name|property)="([^"]+)"\]$/)
    if (!selectorMatch) {
      return
    }

    meta = document.createElement('meta')
    meta.setAttribute(selectorMatch[1], selectorMatch[2])
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

function setCanonicalUrl(url: string) {
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = url
}

function setDocumentLanguageAlternates(page: SeoPageContent | null) {
  document
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((link) => link.remove())

  if (!page) {
    return
  }

  getLanguageAlternates(page).forEach((alternate) => {
    const link = document.createElement('link')
    link.rel = 'alternate'
    link.hreflang = alternate.language
    link.href = getAbsoluteUrl(alternate.path)
    document.head.appendChild(link)
  })

  const defaultLink = document.createElement('link')
  defaultLink.rel = 'alternate'
  defaultLink.hreflang = 'x-default'
  defaultLink.href = getAbsoluteUrl(
    page.language === 'en' ? page.path : (page.alternatePath ?? page.path),
  )
  document.head.appendChild(defaultLink)
}

function setStructuredData(page: SeoPageContent | null) {
  let script = document.querySelector<HTMLScriptElement>('#seo-structured-data')
  if (!script) {
    script = document.createElement('script')
    script.id = 'seo-structured-data'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }

  script.textContent = JSON.stringify(getStructuredData(page))
}

function removeStructuredData() {
  document.querySelector('#seo-structured-data')?.remove()
}

function getPlaybackDurationMs(question: Question) {
  if (question.playback.length === 0) {
    return 0
  }

  const playbackTailMs = question.playback.reduce(
    (maxDuration, event) => Math.max(maxDuration, event.offsetMs + event.durationMs),
    0,
  )

  return playbackTailMs + PLAYBACK_START_DELAY_MS + PLAYBACK_LOCK_BUFFER_MS
}

function resolveStorage(providedStorage?: Storage | null) {
  if (providedStorage !== undefined) {
    return providedStorage
  }

  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export interface PerfectPitchAppProps {
  audioEngine?: AudioEngine
  dinoRoarPlayer?: () => Promise<void>
  now?: () => number
  questionFactory?: QuestionFactory
  storage?: Storage | null
}

function localizeQuestion(question: Question, language: Language): Question {
  const modeCopy = getModeCopy(language, question.mode)
  const localizedChoices = question.choices.map((choice) => {
    const label =
      question.mode === 'interval'
        ? translateIntervalLabel(choice.label, language)
        : question.mode === 'scale'
          ? translateScaleLabel(choice.label, language)
        : choice.label

    return {
      ...choice,
      label,
      meta: formatChoiceMeta(language, question.mode, label),
    }
  })

  return {
    ...question,
    prompt: modeCopy.prompt,
    helperText: getDifficultyCopy(language, question.mode, question.difficulty).helperText,
    choices: localizedChoices,
  }
}

function LanguageSwitcher({
  language,
  onChange,
}: {
  language: Language
  onChange: (nextLanguage: Language) => void
}) {
  const copy = getAppCopy(language)

  return (
    <div className="language-switcher" aria-label={copy.languageLabel}>
      <span className="language-switcher__label">{copy.languageLabel}</span>
      <div className="language-switcher__options">
        <button
          aria-pressed={language === 'en'}
          className={`language-switcher__button ${
            language === 'en' ? 'language-switcher__button--active' : ''
          }`}
          onClick={() => onChange('en')}
          type="button"
        >
          EN
        </button>
        <button
          aria-pressed={language === 'vi'}
          className={`language-switcher__button ${
            language === 'vi' ? 'language-switcher__button--active' : ''
          }`}
          onClick={() => onChange('vi')}
          type="button"
        >
          VI
        </button>
      </div>
    </div>
  )
}

function FooterSignature({ language }: { language: Language }) {
  const copy = getAppCopy(language)

  return (
    <footer className="app-footer">
      <div>{copy.footerSignature}</div>
      <a
        className="app-footer__link"
        href="https://github.com/khiemnd777/perfect-pitch"
        rel="noreferrer"
        target="_blank"
      >
        <svg
          aria-hidden="true"
          className="app-footer__icon"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 2C6.477 2 2 6.589 2 12.248c0 4.527 2.865 8.366 6.839 9.721.5.096.682-.223.682-.496 0-.245-.009-.894-.014-1.754-2.782.62-3.369-1.389-3.369-1.389-.455-1.183-1.11-1.498-1.11-1.498-.908-.637.069-.624.069-.624 1.004.073 1.532 1.055 1.532 1.055.892 1.564 2.341 1.112 2.91.85.091-.664.349-1.112.635-1.368-2.221-.259-4.556-1.14-4.556-5.074 0-1.121.39-2.037 1.029-2.755-.103-.259-.446-1.301.098-2.712 0 0 .84-.276 2.75 1.052A9.303 9.303 0 0 1 12 6.839a9.27 9.27 0 0 1 2.504.349c1.909-1.328 2.748-1.052 2.748-1.052.546 1.411.203 2.453.1 2.712.64.718 1.027 1.634 1.027 2.755 0 3.944-2.338 4.812-4.566 5.066.359.319.679.949.679 1.913 0 1.381-.012 2.495-.012 2.834 0 .275.18.596.688.495C19.138 20.61 22 16.773 22 12.248 22 6.589 17.523 2 12 2Z"
            fill="currentColor"
          />
        </svg>
        GitHub
      </a>
    </footer>
  )
}

function SeoLinks({ paths }: { paths?: string[] }) {
  const pages = paths
    ? paths
        .map((path) => SEO_PAGE_BY_PATH.get(path))
        .filter((page): page is SeoPageContent => Boolean(page))
    : SEO_PAGES.filter((page) => page.language === 'en')

  return (
    <nav className="seo-links" aria-label="Ear training topics">
      {pages.map((page) => (
        <a key={page.path} href={page.path}>
          {page.eyebrow}
        </a>
      ))}
    </nav>
  )
}

function SeoHomeContent() {
  return (
    <section className="seo-panel" aria-labelledby="seo-home-heading">
      <div className="seo-panel__header">
        <p className="question-kicker">Ear training guide</p>
        <h2 id="seo-home-heading">Practice ear training with focused piano exercises</h2>
        <p>
          Perfect Pitch is an online ear training app for musicians who want short,
          practical listening drills. You can practice single notes, double notes,
          melodies, intervals, arpeggios, triads, scales, and seventh chords with real
          piano sounds and instant feedback after each answer.
        </p>
      </div>
      <div className="seo-panel__grid">
        <article>
          <h3>For note recognition</h3>
          <p>
            Single-note practice helps you identify pitch classes by ear. The app keeps
            the answer focused on the note name, not octave, so each round trains a
            clear listening target.
          </p>
        </article>
        <article>
          <h3>For musical context</h3>
          <p>
            Interval, melody, arpeggio, chord, scale, and seventh-chord modes connect
            note recognition to musical patterns. That makes the training useful for
            singing, playing, transcription, and composition.
          </p>
        </article>
      </div>
      <SeoLinks />
    </section>
  )
}

function SeoContentPage({ page }: { page: SeoPageContent }) {
  const alternate = page.alternatePath
    ? SEO_PAGE_BY_PATH.get(page.alternatePath)
    : null
  const isVietnamese = page.language === 'vi'
  const practiceHref = getPracticeHref(page)

  return (
    <main className="shell shell--ready">
      <div className="shell__content">
        <article className="seo-page">
          <header className="seo-page__hero">
            <div className="hero-panel__top">
              <a className="eyebrow eyebrow--link" href="/">
                Perfect Pitch
              </a>
              <div className="seo-page__actions">
                {alternate && (
                  <a className="ghost-button" href={alternate.path} lang={alternate.language}>
                    {alternate.language === 'vi' ? 'VI' : 'EN'}
                  </a>
                )}
                <a
                  className="ghost-button"
                  href={practiceHref}
                  onClick={() =>
                    trackEvent('seo_cta_click', {
                      landing_path: page.path,
                      mode: page.practiceMode,
                      language: page.language,
                    })
                  }
                >
                  {page.practiceLabel}
                </a>
              </div>
            </div>
            <nav aria-label={isVietnamese ? 'Đường dẫn trang' : 'Breadcrumb'} className="seo-breadcrumbs">
              <a href="/">Perfect Pitch</a>
              <span aria-hidden="true">/</span>
              <a href={isVietnamese ? '/vi/luyen-cam-am' : '/ear-training'}>
                {isVietnamese ? 'Luyện cảm âm' : 'Ear training'}
              </a>
              {page.path !== (isVietnamese ? '/vi/luyen-cam-am' : '/ear-training') && (
                <>
                  <span aria-hidden="true">/</span>
                  <span aria-current="page">{page.eyebrow}</span>
                </>
              )}
            </nav>
            <p className="question-kicker">{page.eyebrow}</p>
            <h1>{page.heading}</h1>
            <p className="hero-copy">{page.intro}</p>
          </header>

          <section className="seo-page__body" aria-label={`${page.eyebrow} guide`}>
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.points && (
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </section>

          <section className="seo-page__faq" aria-labelledby="seo-faq-heading">
            <h2 id="seo-faq-heading">
              {isVietnamese ? 'Câu hỏi thường gặp' : 'Frequently asked questions'}
            </h2>
            {page.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </section>

          <section className="seo-panel" aria-labelledby="seo-more-heading">
            <div className="seo-panel__header">
              <p className="question-kicker">
                {isVietnamese ? 'Chủ đề luyện tai liên quan' : 'More ear training topics'}
              </p>
              <h2 id="seo-more-heading">
                {isVietnamese ? 'Tiếp tục khám phá' : 'Keep exploring'}
              </h2>
            </div>
            <SeoLinks paths={page.relatedPaths} />
          </section>
        </article>
        <FooterSignature language={page.language} />
      </div>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="shell shell--ready">
      <div className="shell__content">
        <section className="seo-page__hero seo-page__not-found">
          <p className="question-kicker">404</p>
          <h1>Page not found</h1>
          <p className="hero-copy">
            This page does not exist. Return to the ear trainer or choose a learning
            guide below.
          </p>
          <a className="primary-button" href="/">
            Return to Perfect Pitch
          </a>
        </section>
        <SeoLinks paths={['/ear-training', '/perfect-pitch-training', '/interval-ear-training']} />
      </div>
    </main>
  )
}

export function PerfectPitchApp({
  audioEngine: providedAudioEngine,
  dinoRoarPlayer: providedDinoRoarPlayer,
  now: providedNow,
  questionFactory: providedQuestionFactory,
  storage: providedStorage,
}: PerfectPitchAppProps) {
  const getNow = providedNow ?? Date.now
  const dinoRoarPlayer = providedDinoRoarPlayer ?? playDefaultDinoRoar
  const [currentPath] = useState(() => getCurrentPath())
  const seoPage = SEO_PAGE_BY_PATH.get(currentPath) ?? null
  const isNotFound = currentPath !== '/' && !seoPage
  const audioEngineRef = useRef<AudioEngine | null>(providedAudioEngine ?? null)
  const storage = useMemo(() => resolveStorage(providedStorage), [providedStorage])
  const [language, setLanguage] = useState<Language>(() => loadLanguagePreference(storage))
  const questionFactory = useMemo(
    () => providedQuestionFactory ?? createQuestionFactory(language),
    [language, providedQuestionFactory],
  )
  const [modeProgress, setModeProgress] = useState<ModeProgressState>(() =>
    loadProgressState(storage),
  )
  const [requestedMode] = useState(() =>
    currentPath === '/' ? getRequestedMode() : null,
  )
  const [requestedSource] = useState(() => getRequestedSource())
  const [mode, setMode] = useState<GameMode | null>(requestedMode)
  const [question, setQuestion] = useState<Question | null>(() =>
    requestedMode
      ? questionFactory.createQuestion(
          requestedMode,
          modeProgress[requestedMode].currentDifficulty,
        )
      : null,
  )
  const displayQuestion = useMemo(
    () => (question ? localizeQuestion(question, language) : null),
    [language, question],
  )
  const [evaluation, setEvaluation] = useState<QuestionEvaluation | null>(null)
  const [stats, setStats] = useState<SessionStats>(() => loadSessionStats(storage))
  const [petCollection, setPetCollection] = useState(() =>
    loadPetCollection(storage),
  )
  const [isPetShopOpen, setIsPetShopOpen] = useState(false)
  const [petShopNotice, setPetShopNotice] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(() => getNow())
  const [dinoCare, setDinoCare] = useState<DinoCareState>(() =>
    loadDinoCare(storage, currentTime),
  )
  const [dinoSoundError, setDinoSoundError] = useState<string | null>(null)
  const [audioStatus, setAudioStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle')
  const [audioError, setAudioError] = useState<string | null>(null)
  const [hasPlayedCurrent, setHasPlayedCurrent] = useState(false)
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false)
  const [progressNotice, setProgressNotice] = useState<string | null>(null)
  const seenQuestionKeysRef = useRef<Record<GameMode, Set<string>>>(
    Object.fromEntries(GAME_MODES.map((gameMode) => [gameMode, new Set<string>()])) as Record<
      GameMode,
      Set<string>
    >,
  )
  const pageViewRef = useRef<string | null>(null)
  const feedbackPanelRef = useRef<HTMLDivElement | null>(null)
  const playbackUnlockTimeoutRef = useRef<number | null>(null)
  const dinoCareRef = useRef(dinoCare)
  const isDinoRoaringRef = useRef(false)
  const seoLandingTrackedRef = useRef(false)
  const copy = getAppCopy(language)
  const activePetId = petCollection.selectedPetId
  const activePetPoints = petCollection.petPoints[activePetId]
  const petHungry = isDinoHungry(dinoCare, currentTime)

  const maybePlayDinoRoar = useCallback(async () => {
    const roarAt = getNow()
    if (
      activePetId !== 'dino' ||
      isDinoRoaringRef.current ||
      !shouldDinoRoar(dinoCareRef.current, roarAt)
    ) {
      return
    }

    isDinoRoaringRef.current = true
    try {
      await dinoRoarPlayer()
      const nextCare = markDinoRoared(dinoCareRef.current, roarAt)
      dinoCareRef.current = nextCare
      setDinoCare(nextCare)
      setCurrentTime(roarAt)
      setDinoSoundError(null)
    } catch (error) {
      setDinoSoundError(copy.petSoundError)
      console.error(error)
    } finally {
      isDinoRoaringRef.current = false
    }
  }, [activePetId, copy.petSoundError, dinoRoarPlayer, getNow])

  const getAudioEngine = async () => {
    if (audioEngineRef.current) {
      return audioEngineRef.current
    }

    const { createAudioEngine } = await import('../features/audio/audioEngine')
    audioEngineRef.current = createAudioEngine()
    return audioEngineRef.current
  }

  const accuracy = useMemo(() => {
    if (stats.answered === 0) {
      return 0
    }

    return Math.round((stats.correct / stats.answered) * 100)
  }, [stats])

  useEffect(() => {
    saveProgressState(modeProgress, storage)
  }, [modeProgress, storage])

  useEffect(() => {
    saveSessionStats(stats, storage)
  }, [stats, storage])

  useEffect(() => {
    savePetCollection(petCollection, storage)
    saveDinoProgress({ points: petCollection.petPoints.dino }, storage)
  }, [petCollection, storage])

  useEffect(() => {
    dinoCareRef.current = dinoCare
    saveDinoCare(dinoCare, storage)
  }, [dinoCare, storage])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(getNow())
    }, DINO_HUNGER_CHECK_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [getNow])

  useEffect(() => {
    const handleUserGesture = () => {
      void maybePlayDinoRoar()
    }

    window.addEventListener('pointerdown', handleUserGesture, { passive: true })
    window.addEventListener('keydown', handleUserGesture)

    return () => {
      window.removeEventListener('pointerdown', handleUserGesture)
      window.removeEventListener('keydown', handleUserGesture)
    }
  }, [maybePlayDinoRoar])

  useEffect(() => {
    if (audioStatus === 'ready' && petHungry) {
      void maybePlayDinoRoar()
    }
  }, [audioStatus, petHungry, maybePlayDinoRoar])

  useEffect(() => {
    saveLanguagePreference(language, storage)
  }, [language, storage])

  useEffect(() => {
    initAnalytics()
    if (requestedMode && !seoLandingTrackedRef.current) {
      trackEvent('seo_practice_landing', {
        landing_path: requestedSource ?? 'direct',
        mode: requestedMode,
        language,
      })
      seoLandingTrackedRef.current = true
    }
  }, [language, requestedMode, requestedSource])

  useEffect(() => {
    if (isNotFound) {
      document.documentElement.lang = 'en'
      document.title = 'Page Not Found | Perfect Pitch'
      setMetaContent('meta[name="description"]', 'The requested page could not be found.')
      setMetaContent('meta[name="robots"]', 'noindex, follow')
      document.querySelector('link[rel="canonical"]')?.remove()
      setDocumentLanguageAlternates(null)
      removeStructuredData()
      return
    }

    if (!seoPage) {
      document.documentElement.lang = 'en'
      document.title = DEFAULT_TITLE
      setMetaContent('meta[name="description"]', DEFAULT_DESCRIPTION)
      setMetaContent('meta[name="robots"]', 'index, follow')
      setMetaContent('meta[property="og:title"]', document.title)
      setMetaContent('meta[property="og:description"]', DEFAULT_DESCRIPTION)
      setMetaContent('meta[property="og:url"]', `${SITE_URL}/`)
      setMetaContent('meta[property="og:locale"]', 'en_US')
      setMetaContent('meta[property="og:locale:alternate"]', 'vi_VN')
      setMetaContent('meta[property="og:image"]', getAbsoluteUrl(SOCIAL_IMAGE_PATH))
      setMetaContent('meta[name="twitter:title"]', document.title)
      setMetaContent('meta[name="twitter:description"]', DEFAULT_DESCRIPTION)
      setMetaContent('meta[name="twitter:image"]', getAbsoluteUrl(SOCIAL_IMAGE_PATH))
      setCanonicalUrl(`${SITE_URL}/`)
      setDocumentLanguageAlternates(null)
      setStructuredData(null)
      return
    }

    const url = getAbsoluteUrl(seoPage.path)
    document.documentElement.lang = seoPage.language
    document.title = seoPage.title
    setMetaContent('meta[name="description"]', seoPage.description)
    setMetaContent('meta[name="robots"]', 'index, follow')
    setMetaContent('meta[property="og:title"]', seoPage.title)
    setMetaContent('meta[property="og:description"]', seoPage.description)
    setMetaContent('meta[property="og:url"]', url)
    setMetaContent('meta[property="og:locale"]', seoPage.locale)
    setMetaContent(
      'meta[property="og:locale:alternate"]',
      seoPage.language === 'vi' ? 'en_US' : 'vi_VN',
    )
    setMetaContent('meta[property="og:image"]', getAbsoluteUrl(SOCIAL_IMAGE_PATH))
    setMetaContent('meta[name="twitter:title"]', seoPage.title)
    setMetaContent('meta[name="twitter:description"]', seoPage.description)
    setMetaContent('meta[name="twitter:image"]', getAbsoluteUrl(SOCIAL_IMAGE_PATH))
    setCanonicalUrl(url)
    setDocumentLanguageAlternates(seoPage)
    setStructuredData(seoPage)
  }, [isNotFound, seoPage])

  useEffect(() => {
    const pagePath = isNotFound
      ? currentPath
      : (seoPage?.path ?? (mode ? `/mode/${mode}` : '/'))
    const pageLanguage = seoPage?.language ?? language
    if (pageViewRef.current === `${pagePath}:${pageLanguage}`) {
      return
    }

    const pageTitle = isNotFound
      ? 'Page Not Found | Perfect Pitch'
      : seoPage
      ? seoPage.title
      : mode
        ? `Perfect Pitch - ${getModeCopy(language, mode).label}`
        : 'Perfect Pitch'

    trackPageView(pagePath, pageTitle, pageLanguage)
    pageViewRef.current = `${pagePath}:${pageLanguage}`
  }, [currentPath, isNotFound, language, mode, seoPage])

  useEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [mode])

  useEffect(() => {
    if (!evaluation) {
      return
    }

    const feedbackPanel = feedbackPanelRef.current
    if (!feedbackPanel || typeof feedbackPanel.scrollIntoView !== 'function') {
      return
    }

    feedbackPanel.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [evaluation])

  const clearPlaybackUnlockTimeout = () => {
    if (playbackUnlockTimeoutRef.current !== null) {
      window.clearTimeout(playbackUnlockTimeoutRef.current)
      playbackUnlockTimeoutRef.current = null
    }
  }

  useEffect(
    () => () => {
      clearPlaybackUnlockTimeout()
      audioEngineRef.current?.dispose()
    },
    [],
  )

  const createQuestionKey = (nextQuestion: Question) =>
    JSON.stringify({
      mode: nextQuestion.mode,
      difficulty: nextQuestion.difficulty,
      correctChoice: nextQuestion.choices.find(
        (choice) => choice.id === nextQuestion.correctChoiceId,
      )?.label,
      choices: nextQuestion.choices.map((choice) => choice.label),
      playback: nextQuestion.playback.map((event) => ({
        notes: event.notes,
        offsetMs: event.offsetMs,
        durationMs: event.durationMs,
      })),
    })

  const createNextQuestion = (nextMode: GameMode, progressState: ModeProgressState) => {
    const seenKeys = seenQuestionKeysRef.current[nextMode]
    let latestQuestion = questionFactory.createQuestion(
      nextMode,
      progressState[nextMode].currentDifficulty,
    )
    let latestKey = createQuestionKey(latestQuestion)
    let attempts = 0

    while (seenKeys.has(latestKey) && attempts < QUESTION_DEDUP_MAX_ATTEMPTS) {
      latestQuestion = questionFactory.createQuestion(
        nextMode,
        progressState[nextMode].currentDifficulty,
      )
      latestKey = createQuestionKey(latestQuestion)
      attempts += 1
    }

    seenKeys.add(latestKey)

    return latestQuestion
  }

  const activateMode = (nextMode: GameMode) => {
    clearPlaybackUnlockTimeout()
    seenQuestionKeysRef.current[nextMode] = new Set()
    setMode(nextMode)
    setQuestion(createNextQuestion(nextMode, modeProgress))
    setEvaluation(null)
    setHasPlayedCurrent(false)
    setIsPlayingQuestion(false)
    setAudioError(null)
    setProgressNotice(null)
    trackEvent('select_mode', {
      mode: nextMode,
      difficulty: modeProgress[nextMode].currentDifficulty,
      language,
    })
  }

  const playQuestion = async () => {
    if (!question || isPlayingQuestion || audioStatus === 'loading') {
      return
    }

    const isReplay = hasPlayedCurrent
    setAudioError(null)

    try {
      setAudioStatus((current) => (current === 'ready' ? 'ready' : 'loading'))
      const audioEngine = await getAudioEngine()
      await audioEngine.init()
      setAudioStatus('ready')
      await audioEngine.playQuestion(question)
      clearPlaybackUnlockTimeout()
      setIsPlayingQuestion(true)
      playbackUnlockTimeoutRef.current = window.setTimeout(() => {
        setIsPlayingQuestion(false)
        playbackUnlockTimeoutRef.current = null
      }, getPlaybackDurationMs(question))
      setHasPlayedCurrent(true)
      trackEvent('play_question', {
        mode: question.mode,
        difficulty: question.difficulty,
        replay: isReplay,
        language,
      })
    } catch (error) {
      clearPlaybackUnlockTimeout()
      setIsPlayingQuestion(false)
      setAudioStatus('error')
      setAudioError(
        language === 'en'
          ? 'Unable to initialize audio in this browser.'
          : 'Không thể khởi tạo âm thanh trên trình duyệt này.',
      )
      trackEvent('audio_error', {
        mode: question.mode,
        difficulty: question.difficulty,
        replay: isReplay,
        language,
      })
      console.error(error)
    }
  }

  const chooseAnswer = (choiceId: string) => {
    if (!question) {
      return
    }

    const result = evaluateSelection(question, choiceId, evaluation)
    if (result === evaluation) {
      return
    }

    const selectedChoice = question.choices.find((choice) => choice.id === choiceId)
    const correctChoice = question.choices.find(
      (choice) => choice.id === question.correctChoiceId,
    )
    const nextAnsweredCount = stats.answered + 1

    setEvaluation(result)
    setStats((current) => {
      const correct = result.status === 'correct'
      const streak = correct ? current.streak + 1 : 0

      return {
        answered: current.answered + 1,
        correct: current.correct + (correct ? 1 : 0),
        streak,
        bestStreak: Math.max(current.bestStreak, streak),
      }
    })
    if (result.status === 'correct') {
      const fedAt = getNow()
      setPetCollection((current) =>
        rewardSelectedPet(current, DINO_POINTS_PER_CORRECT),
      )
      setDinoCare((current) => {
        const nextCare = feedDino(current, fedAt)
        dinoCareRef.current = nextCare
        return nextCare
      })
      setCurrentTime(fedAt)
      setDinoSoundError(null)
    }
    const progression = applyProgression(modeProgress[question.mode], result.status, language)
    setProgressNotice(progression.notice)
    setModeProgress((current) => ({
      ...current,
      [question.mode]: progression.nextProgress,
    }))
    trackEvent('answer_question', {
      mode: question.mode,
      difficulty: question.difficulty,
      result: result.status,
      selected_choice: selectedChoice?.label,
      correct_choice: correctChoice?.label,
      replayed_before_answer: hasPlayedCurrent,
      language,
    })
    if (nextAnsweredCount === 1) {
      trackEvent('first_answer', {
        mode: question.mode,
        difficulty: question.difficulty,
        result: result.status,
        language,
      })
    }
    if (nextAnsweredCount === 5 || nextAnsweredCount === 10) {
      trackEvent(`answer_${nextAnsweredCount}`, {
        mode: question.mode,
        difficulty: question.difficulty,
        correct_answers: stats.correct + (result.status === 'correct' ? 1 : 0),
        language,
      })
    }
  }

  const goToNextQuestion = () => {
    if (!mode) {
      return
    }

    clearPlaybackUnlockTimeout()
    setQuestion(createNextQuestion(mode, modeProgress))
    setEvaluation(null)
    setHasPlayedCurrent(false)
    setIsPlayingQuestion(false)
    setAudioError(null)
    trackEvent('next_question', {
      mode,
      difficulty: modeProgress[mode].currentDifficulty,
      language,
    })
  }

  const goBackToModes = () => {
    clearPlaybackUnlockTimeout()
    audioEngineRef.current?.stop()
    if (window.location.search) {
      window.history.replaceState({}, '', '/')
    }
    setMode(null)
    setQuestion(null)
    setEvaluation(null)
    setHasPlayedCurrent(false)
    setIsPlayingQuestion(false)
    setAudioError(null)
    setProgressNotice(null)
    trackEvent('return_home', { language })
  }

  const resetScore = () => {
    setStats(DEFAULT_SESSION_STATS)
    resetSessionStats(storage)
  }

  const openPetShop = () => {
    setPetShopNotice(null)
    setIsPetShopOpen(true)
    trackEvent('open_pet_shop', {
      selected_pet: activePetId,
      wallet: petCollection.wallet,
      language,
    })
  }

  const closePetShop = useCallback(() => {
    setIsPetShopOpen(false)
  }, [])

  const buyPet = (petId: PetId) => {
    const nextCollection = purchasePet(petCollection, petId)
    if (nextCollection === petCollection) {
      return
    }

    setPetCollection(nextCollection)
    setPetShopNotice(
      `${copy.petShopBought} ${getPetIdentityCopy(language, petId).name}`,
    )
    setDinoSoundError(null)
    trackEvent('buy_pet', {
      pet: petId,
      wallet_after: nextCollection.wallet,
      language,
    })
  }

  const choosePet = (petId: PetId) => {
    const nextCollection = selectPet(petCollection, petId)
    if (nextCollection === petCollection) {
      return
    }

    setPetCollection(nextCollection)
    setPetShopNotice(
      `${copy.petShopSelected} ${getPetIdentityCopy(language, petId).name}`,
    )
    setDinoSoundError(null)
    trackEvent('select_pet', { pet: petId, language })
  }

  const sessionStats = formatSessionStats(language, stats, accuracy)

  if (isNotFound) {
    return <NotFoundPage />
  }

  if (seoPage) {
    return <SeoContentPage page={seoPage} />
  }

  return (
    <main className="shell shell--ready">
      <div className="shell__content">
        {!mode && (
          <section className="hero-panel">
            <div className="hero-panel__top">
              <div className="eyebrow">Perfect Pitch</div>
              <LanguageSwitcher language={language} onChange={setLanguage} />
            </div>
            <div className="hero-panel__layout">
              <div className="hero-panel__copy">
                <h1>{copy.heroTitle}</h1>
                <p className="hero-copy">{copy.heroBody}</p>
                <div className="hero-stats">
                  <span>🎧 {copy.heroModesStat}</span>
                  <span>⭐ {copy.heroLevelsStat}</span>
                  <span>🎹 {copy.heroPianoStat}</span>
                </div>
              </div>
              <PetCompanion
                hungry={petHungry}
                language={language}
                onInteract={() => void maybePlayDinoRoar()}
                onOpenShop={openPetShop}
                petId={activePetId}
                points={activePetPoints}
                soundError={activePetId === 'dino' ? dinoSoundError : null}
                wallet={petCollection.wallet}
              />
            </div>
          </section>
        )}

        {!mode && (
          <section id="practice" className="mode-grid" aria-label={copy.modeGridAriaLabel}>
            {GAME_MODES.map((gameMode) => {
              const progress = modeProgress[gameMode]
              const modeCopy = getModeCopy(language, gameMode)

              return (
                <button
                  key={gameMode}
                  aria-label={modeCopy.label}
                  className={`mode-card mode-card--${gameMode}`}
                  onClick={() => activateMode(gameMode)}
                  type="button"
                >
                  <div className="mode-card__header">
                    <span className="mode-card__icon" aria-hidden="true">
                      <ModeIcon mode={gameMode} />
                    </span>
                    <span className="difficulty-pill">
                      {getDifficultyLabel(language, progress.currentDifficulty)}
                    </span>
                  </div>
                  <strong>
                    <span className="mode-card__tag">{copy.modeTag}</span>
                    {modeCopy.label}
                  </strong>
                  <span>{modeCopy.description}</span>
                </button>
              )
            })}
          </section>
        )}

        {!mode && <SeoHomeContent />}

        {mode && question && displayQuestion && (
          <section className="game-layout">
            <header className="game-header">
              <div className="mode-header">
                <div className="game-header__top">
                  <button className="ghost-button" onClick={goBackToModes} type="button">
                    {copy.switchMode}
                  </button>
                  <LanguageSwitcher language={language} onChange={setLanguage} />
                </div>
                <p className="mode-name">{getModeCopy(language, mode).label}</p>
                <div className="mode-badges">
                  <span className="difficulty-pill">
                    {getDifficultyLabel(language, question.difficulty)}
                  </span>
                  <span className="difficulty-pill difficulty-pill--muted">
                    {getDifficultyCopy(language, mode, question.difficulty).shortLabel}
                  </span>
                </div>
              </div>
              <div className="stats-card" aria-label={copy.sessionStatsLabel}>
                <div className="stats-card__values">
                  {sessionStats.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <button className="ghost-button" onClick={resetScore} type="button">
                  {copy.resetScore}
                </button>
              </div>
            </header>

            <div className="game-board">
              <PetCompanion
                celebrate={evaluation?.status === 'correct'}
                compact
                hungry={petHungry}
                language={language}
                onInteract={() => void maybePlayDinoRoar()}
                onOpenShop={openPetShop}
                petId={activePetId}
                points={activePetPoints}
                soundError={activePetId === 'dino' ? dinoSoundError : null}
                wallet={petCollection.wallet}
              />

              <div className="question-panel">
                <div className="question-hero">
                  <div className="question-heading">
                    <p className="question-kicker">{copy.currentQuestion}</p>
                    <h2>{displayQuestion.prompt}</h2>
                    <p>{displayQuestion.helperText}</p>
                  </div>

                  <div
                    className={`listen-card ${
                      isPlayingQuestion ? 'listen-card--playing' : ''
                    } ${hasPlayedCurrent ? 'listen-card--replay' : ''}`}
                  >
                    <div className="listen-card__visual" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="control-row">
                      <button
                        className="play-button"
                        disabled={audioStatus === 'loading' || isPlayingQuestion}
                        onClick={playQuestion}
                        type="button"
                      >
                        {audioStatus === 'loading'
                          ? copy.loadingAudio
                          : hasPlayedCurrent
                            ? copy.replayQuestion
                            : copy.playQuestion}
                      </button>
                    </div>

                    {audioError && <p className="status-message error">{audioError}</p>}
                    {!hasPlayedCurrent && !audioError && (
                      <p className="status-message">{copy.audioTip}</p>
                    )}
                  </div>
                </div>

                {progressNotice && <p className="progress-banner">{progressNotice}</p>}

                <div className="answer-panel">
                  <div className="answer-panel__header">
                    <h3>{copy.chooseAnswer}</h3>
                    <span className={hasPlayedCurrent ? 'is-ready' : ''}>
                      <span aria-hidden="true">{hasPlayedCurrent ? '●' : '○'}</span>{' '}
                      {hasPlayedCurrent ? copy.answersReady : copy.answersLocked}
                    </span>
                  </div>

                  <div className="choices-grid">
                    {displayQuestion.choices.map((choice, choiceIndex) => {
                      const isSelected = evaluation?.selectedChoiceId === choice.id
                      const isCorrect = choice.id === question.correctChoiceId
                      const isChoiceDisabled = !hasPlayedCurrent || Boolean(evaluation)

                      const stateClass = evaluation
                        ? isCorrect
                          ? 'choice-card correct'
                          : isSelected
                            ? 'choice-card wrong'
                            : 'choice-card muted'
                        : 'choice-card'

                      return (
                        <button
                          key={choice.id}
                          className={stateClass}
                          data-testid={`choice-${choice.id}`}
                          disabled={isChoiceDisabled}
                          onClick={() => chooseAnswer(choice.id)}
                          type="button"
                        >
                          <span className="choice-card__topline">
                            <span className="choice-index" aria-hidden="true">
                              {String.fromCharCode(65 + choiceIndex)}
                            </span>
                            {evaluation && (isCorrect || isSelected) && (
                              <span className="choice-state" aria-hidden="true">
                                {isCorrect ? '✓' : '×'}
                              </span>
                            )}
                          </span>
                          <span className="choice-label">{choice.label}</span>
                          <span className="choice-meta">{choice.meta}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {evaluation && (
                  <div
                    ref={feedbackPanelRef}
                    className={`feedback-panel ${
                      evaluation.status === 'correct' ? 'success' : 'danger'
                    }`}
                  >
                    <span className="feedback-panel__icon" aria-hidden="true">
                      {evaluation.status === 'correct' ? '✓' : '↗'}
                    </span>
                    <div className="feedback-panel__copy">
                      <p className="feedback-title">
                        {evaluation.status === 'correct' ? copy.correct : copy.incorrect}
                      </p>
                      {evaluation.status === 'correct' && (
                        <p className="reward-message">♫ {copy.pointsEarned}</p>
                      )}
                      <p>
                        {copy.correctAnswerPrefix}{' '}
                        <strong>
                          {
                            displayQuestion.choices.find(
                              (choice) => choice.id === question.correctChoiceId,
                            )?.label
                          }
                        </strong>
                        .
                      </p>
                    </div>
                    <button className="next-button" onClick={goToNextQuestion} type="button">
                      {copy.nextQuestion}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        <FooterSignature language={language} />
      </div>
      {isPetShopOpen &&
        createPortal(
          <Suspense
            fallback={
              <div aria-live="polite" className="pet-shop-loading" role="status">
                {language === 'vi' ? 'Đang mở cửa hàng…' : 'Opening pet shop…'}
              </div>
            }
          >
            <PetShop
              collection={petCollection}
              language={language}
              notice={petShopNotice}
              onBuy={buyPet}
              onClose={closePetShop}
              onSelect={choosePet}
            />
          </Suspense>,
          document.body,
        )}
    </main>
  )
}

export default function App() {
  return <PerfectPitchApp />
}
