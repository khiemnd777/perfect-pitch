import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import './App.css'
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
  DINO_STAGES,
  getDinoEvolution,
  loadDinoProgress,
  saveDinoProgress,
} from '../features/game/dinoProgress'
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
import {
  formatSessionStats,
  getAppCopy,
  getDifficultyCopy,
  getDifficultyLabel,
  getDinoReactions,
  getDinoStageCopy,
  getModeCopy,
  formatChoiceMeta,
  translateIntervalLabel,
  translateScaleLabel,
  type Language,
  type DinoReactionCopy,
} from '../shared/localization'
import {
  GAME_MODES,
  type DinoStageId,
  type GameMode,
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

const QUESTION_DEDUP_MAX_ATTEMPTS = 24
const PLAYBACK_START_DELAY_MS = 80
const PLAYBACK_LOCK_BUFFER_MS = 40
const DINO_HUNGER_CHECK_INTERVAL_MS = 60 * 1000
const DINO_REACTION_DURATION_MS = 2_400

interface DinoAnimationFrame {
  src: string
  normalizeScale: number
  offsetX: number
  offsetY: number
}

function createDinoFrames(
  stageId: DinoStageId,
  alignment: readonly (readonly [number, number, number])[],
): readonly DinoAnimationFrame[] {
  return alignment.map(([normalizeScale, offsetX, offsetY], index) => ({
    src: `/dino/frames-v1/${stageId}-${index + 1}.png`,
    normalizeScale,
    offsetX,
    offsetY,
  }))
}

const DINO_ANIMATION_FRAMES: Record<DinoStageId, readonly DinoAnimationFrame[]> = {
  egg: createDinoFrames('egg', [
    [0.9809, -4.023, 1.495],
    [0.9847, 11.539, 0.239],
    [0.9961, -6.226, 4.195],
    [1.0405, 7.011, 3.739],
  ]),
  baby: createDinoFrames('baby', [
    [1.0057, -2.848, 0.198],
    [1.0029, 0.098, 0.294],
    [1.0204, -3.488, 2.894],
    [0.9589, 0, 4.768],
  ]),
  young: createDinoFrames('young', [
    [1, -5.859, 0],
    [0.9896, 10.534, -0.004],
    [1.0053, -7.166, 3.144],
    [1.0106, 11.251, 2.57],
  ]),
  adult: createDinoFrames('adult', [
    [0.9836, 0.576, 0.653],
    [0.9953, 10.011, -0.006],
    [1.0396, 0.305, 3.701],
    [1.0048, 8.144, 4.912],
  ]),
  super: createDinoFrames('super', [
    [0.9888, -7.725, 0.105],
    [1.0069, 10.324, -0.89],
    [0.9977, -1.267, 4.581],
    [1.0185, -3.979, 3.566],
  ]),
}

const DINO_FRAME_INTERVAL_MS: Record<DinoStageId, number> = {
  egg: 620,
  baby: 520,
  young: 440,
  adult: 650,
  super: 460,
}

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

interface SeoPageContent {
  path: string
  title: string
  description: string
  eyebrow: string
  heading: string
  intro: string
  sections: Array<{
    heading: string
    body: string
  }>
  faqs: Array<{
    question: string
    answer: string
  }>
}

const SEO_PAGES: SeoPageContent[] = [
  {
    path: '/ear-training',
    title: 'Ear Training Online | Perfect Pitch',
    description:
      'Practice ear training online with real piano sounds, instant feedback, and focused modes for notes, intervals, melodies, arpeggios, and chords.',
    eyebrow: 'Ear training online',
    heading: 'Ear training online with real piano sounds',
    intro:
      'Perfect Pitch helps musicians practice listening skills with short, repeatable piano exercises. Each round plays a musical prompt, offers four choices, and grades the answer immediately.',
    sections: [
      {
        heading: 'What you can practice',
        body:
          'Start with single notes, then move into double notes, short melodies, intervals, arpeggios, and chords. The exercises stay compact so you can train for a few minutes without setting up a full lesson.',
      },
      {
        heading: 'Why piano samples matter',
        body:
          'The app uses sample-based piano playback instead of a basic oscillator. That gives each note a more natural attack and decay, which is closer to how musicians hear pitch in real practice.',
      },
    ],
    faqs: [
      {
        question: 'Is this ear training app free?',
        answer:
          'Yes. The web app runs in the browser and lets you practice the available listening modes without creating an account.',
      },
      {
        question: 'Should beginners start with single notes or intervals?',
        answer:
          'Beginners usually do best with single notes first, then intervals once individual pitch colors feel more familiar.',
      },
    ],
  },
  {
    path: '/perfect-pitch-training',
    title: 'Perfect Pitch Training | Practice Notes by Ear',
    description:
      'Train perfect pitch by identifying single notes and related listening patterns with real piano playback and instant feedback.',
    eyebrow: 'Perfect pitch training',
    heading: 'Perfect pitch training for note recognition',
    intro:
      'Perfect pitch training is about building reliable note recognition. This app keeps the exercise simple: hear a piano note, choose an answer, and see the result right away.',
    sections: [
      {
        heading: 'Start with pitch class',
        body:
          'Single-note rounds identify pitch class rather than octave. That keeps attention on the note name itself, which is the foundation for stronger absolute pitch recognition.',
      },
      {
        heading: 'Use short sessions',
        body:
          'Short daily sessions are easier to sustain than long unfocused practice. The app adjusts difficulty across five levels, from easy through master, as your answers improve.',
      },
    ],
    faqs: [
      {
        question: 'Can adults train perfect pitch?',
        answer:
          'Adults can still improve pitch recognition and relative listening skills. Results vary, but structured note-identification practice can make pitch memory more consistent.',
      },
      {
        question: 'Does the app test octave?',
        answer:
          'Single-note answers focus on pitch class only, not octave, so C4 and C5 are treated as the same note name.',
      },
    ],
  },
  {
    path: '/interval-ear-training',
    title: 'Interval Ear Training | Learn Intervals by Ear',
    description:
      'Practice interval ear training with piano playback, instant grading, and focused exercises from core intervals to octave-wide listening.',
    eyebrow: 'Interval ear training',
    heading: 'Interval ear training for cleaner musical listening',
    intro:
      'Intervals are the distance between two notes. Training them by ear helps with singing, transcription, improvisation, and recognizing melodies faster.',
    sections: [
      {
        heading: 'Melodic and harmonic intervals',
        body:
          'The interval mode can train both separated notes and stacked sounds depending on difficulty, helping you recognize distance whether notes are played one after another or together.',
      },
      {
        heading: 'Build from simple distances',
        body:
          'Easy practice starts with core intervals. Higher levels add wider and more confusing options so you learn to separate similar distances by sound.',
      },
    ],
    faqs: [
      {
        question: 'Why train intervals?',
        answer:
          'Intervals are a practical bridge between raw pitch recognition and real music. They help you hear movement, tension, and resolution.',
      },
      {
        question: 'Is interval training different from perfect pitch?',
        answer:
          'Yes. Interval training is relative: it focuses on the distance between notes. Perfect pitch training focuses on naming a note without a reference.',
      },
    ],
  },
  {
    path: '/chord-ear-training',
    title: 'Chord Ear Training | Identify Chords by Ear',
    description:
      'Practice chord ear training by identifying piano chords, triad colors, inversions, and harmonic qualities with immediate feedback.',
    eyebrow: 'Chord ear training',
    heading: 'Chord ear training for triads and harmonic color',
    intro:
      'Chord ear training helps you hear harmony as a color instead of guessing individual notes. Perfect Pitch includes a chord mode for identifying triads played together.',
    sections: [
      {
        heading: 'Hear chords as one sound',
        body:
          'Chord mode plays notes together so you can focus on harmonic quality. Easy levels separate major and minor; harder levels add diminished and augmented colors.',
      },
      {
        heading: 'Connect chords and arpeggios',
        body:
          'Arpeggio mode breaks chord tones apart, while chord mode stacks them. Practicing both helps connect melodic memory with harmonic recognition.',
      },
    ],
    faqs: [
      {
        question: 'What chord types are included?',
        answer:
          'The app includes major, minor, diminished, and augmented triad colors across the harder chord and arpeggio exercises.',
      },
      {
        question: 'Should I practice chords before intervals?',
        answer:
          'Intervals usually come first for beginners. Chords become easier once you can hear the relationships between individual notes.',
      },
    ],
  },
  {
    path: '/piano-ear-training',
    title: 'Piano Ear Training | Train with Sample-Based Piano',
    description:
      'Use piano ear training exercises with realistic sample-based playback for notes, intervals, melodies, arpeggios, and chords.',
    eyebrow: 'Piano ear training',
    heading: 'Piano ear training with sampled piano playback',
    intro:
      'Many ear training tools use synthetic tones. Perfect Pitch uses local piano samples so practice feels closer to a real instrument.',
    sections: [
      {
        heading: 'Realistic note attacks',
        body:
          'Piano notes have a clear attack, body, and decay. Training with that shape makes the listening experience more musical than a plain sine wave.',
      },
      {
        heading: 'Browser-based practice',
        body:
          'The app runs in the browser and loads audio only when you start playback. That keeps the page fast while preserving sample-based sound during practice.',
      },
    ],
    faqs: [
      {
        question: 'Do I need a piano?',
        answer:
          'No. The exercises use built-in piano samples, so you can practice directly in the browser.',
      },
      {
        question: 'Does piano sound help ear training?',
        answer:
          'It can help if your musical context is piano, composition, or general music study because the sound is closer to what you will hear in real use.',
      },
    ],
  },
  {
    path: '/what-is-perfect-pitch',
    title: 'What Is Perfect Pitch? | Absolute Pitch Explained',
    description:
      'Learn what perfect pitch means, how it differs from relative pitch, and how note-recognition practice can support ear training.',
    eyebrow: 'Absolute pitch explained',
    heading: 'What is perfect pitch?',
    intro:
      'Perfect pitch, also called absolute pitch, is the ability to identify or produce a note without being given a reference note first.',
    sections: [
      {
        heading: 'Perfect pitch vs relative pitch',
        body:
          'Perfect pitch names a note directly. Relative pitch compares notes and recognizes distance, chord color, or movement. Musicians often benefit from training both.',
      },
      {
        heading: 'How this app helps',
        body:
          'Single-note mode supports note recognition, while interval, melody, arpeggio, and chord modes build broader musical hearing around that foundation.',
      },
    ],
    faqs: [
      {
        question: 'Is perfect pitch required to be a good musician?',
        answer:
          'No. Many strong musicians rely on relative pitch. Perfect pitch can be useful, but it is not required for musicianship.',
      },
      {
        question: 'What should I practice first?',
        answer:
          'Start with single-note recognition and simple intervals. Add chords and melodies as your listening becomes more stable.',
      },
    ],
  },
]

const SEO_PAGE_BY_PATH = new Map(SEO_PAGES.map((page) => [page.path, page]))
const SITE_URL = 'https://andy.dailyturning.com'

function getCurrentPath() {
  if (typeof window === 'undefined') {
    return '/'
  }

  return window.location.pathname
}

function setMetaContent(selector: string, content: string) {
  document.querySelector(selector)?.setAttribute('content', content)
}

function setCanonicalUrl(url: string) {
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', url)
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

interface DinoReactionState extends DinoReactionCopy {
  id: number
}

function DinoSprite({
  stageId,
  label,
  tapLabel,
  hungry,
  reaction,
  onTap,
}: {
  stageId: DinoStageId
  label: string
  tapLabel: string
  hungry: boolean
  reaction: DinoReactionState | null
  onTap: () => void
}) {
  const frames = DINO_ANIMATION_FRAMES[stageId]
  const [activeFrame, setActiveFrame] = useState(0)

  useEffect(() => {
    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    let intervalId: number | null = null

    const stopAnimation = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId)
        intervalId = null
      }
    }

    const startAnimation = () => {
      if (reduceMotion || document.hidden || intervalId !== null) {
        return
      }

      intervalId = window.setInterval(() => {
        setActiveFrame((current) => (current + 1) % frames.length)
      }, DINO_FRAME_INTERVAL_MS[stageId])
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation()
        return
      }
      startAnimation()
    }

    startAnimation()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopAnimation()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [frames, stageId])

  return (
    <button
      aria-label={tapLabel}
      className={`dino-sprite-button ${
        reaction ? 'dino-sprite-button--reacting' : ''
      }`}
      data-testid="dino-stage-button"
      onClick={onTap}
      type="button"
    >
      {reaction && (
        <span
          key={reaction.id}
          aria-live="polite"
          className="dino-reaction"
          role="status"
        >
          <span aria-hidden="true" className="dino-reaction__emoji">
            {reaction.emoji}
          </span>
          <span>{reaction.message}</span>
        </span>
      )}
      <span
        aria-label={label}
        className={`dino-sprite dino-sprite--${stageId} ${
          hungry ? 'dino-sprite--hungry' : ''
        }`}
        data-testid="dino-stage"
        role="img"
      >
        {frames.map((frame, index) => (
          <img
            key={frame.src}
            alt=""
            aria-hidden="true"
            className={`dino-sprite__frame ${
              index === activeFrame ? 'dino-sprite__frame--active' : ''
            }`}
            data-active={index === activeFrame}
            draggable="false"
            src={frame.src}
            style={
              {
                '--dino-frame-normalize-scale': frame.normalizeScale,
                '--dino-frame-offset-x': `${frame.offsetX}%`,
                '--dino-frame-offset-y': `${frame.offsetY}%`,
              } as CSSProperties
            }
          />
        ))}
      </span>
    </button>
  )
}

function DinoCompanion({
  language,
  points,
  compact = false,
  celebrate = false,
  hungry = false,
  soundError = null,
  onInteract,
}: {
  language: Language
  points: number
  compact?: boolean
  celebrate?: boolean
  hungry?: boolean
  soundError?: string | null
  onInteract?: () => void
}) {
  const copy = getAppCopy(language)
  const evolution = getDinoEvolution(points)
  const stageCopy = getDinoStageCopy(language, evolution.stage.id)
  const reactions = getDinoReactions(language, evolution.stage.id, hungry)
  const [reaction, setReaction] = useState<DinoReactionState | null>(null)
  const reactionIndexRef = useRef(-1)
  const reactionIdRef = useRef(0)
  const reactionTimeoutRef = useRef<number | null>(null)
  const progressLabel = evolution.nextStage
    ? `${copy.petNextPrefix} ${evolution.pointsToNextStage} ${copy.petPointsLabel}`
    : copy.petMaxStage

  useEffect(
    () => () => {
      if (reactionTimeoutRef.current !== null) {
        window.clearTimeout(reactionTimeoutRef.current)
      }
    },
    [],
  )

  const handleDinoTap = () => {
    reactionIndexRef.current = (reactionIndexRef.current + 1) % reactions.length
    reactionIdRef.current += 1
    setReaction({
      ...reactions[reactionIndexRef.current],
      id: reactionIdRef.current,
    })

    if (reactionTimeoutRef.current !== null) {
      window.clearTimeout(reactionTimeoutRef.current)
    }
    reactionTimeoutRef.current = window.setTimeout(() => {
      setReaction(null)
      reactionTimeoutRef.current = null
    }, DINO_REACTION_DURATION_MS)

    onInteract?.()
  }

  return (
    <section
      aria-label={copy.petTitle}
      className={`dino-card ${compact ? 'dino-card--compact' : ''} ${
        celebrate ? 'dino-card--celebrate' : ''
      } ${hungry ? 'dino-card--hungry' : ''}`}
    >
      <header className="dino-card__header">
        <div>
          <p className="dino-card__kicker">{copy.petTitle}</p>
          {!compact && (
            <p className="dino-card__subtitle">
              {hungry ? copy.petHungryMessage : copy.petSubtitle}
            </p>
          )}
        </div>
        <div className="dino-card__status">
          {hungry && <span className="dino-hunger-badge">🍎 {copy.petHungryLabel}</span>}
          <span className="dino-points" aria-label={`${points} ${copy.petPointsLabel}`}>
            <span aria-hidden="true">♫</span> {points}
          </span>
        </div>
      </header>

      <div className="dino-card__body">
        <DinoSprite
          key={evolution.stage.id}
          hungry={hungry}
          label={stageCopy.name}
          onTap={handleDinoTap}
          reaction={reaction}
          stageId={evolution.stage.id}
          tapLabel={copy.petTapLabel}
        />
        <div className="dino-card__copy">
          <span className="dino-stage-chip">
            {language === 'en' ? 'Stage' : 'Cấp'} {evolution.stageIndex + 1}/
            {DINO_STAGES.length}
          </span>
          <strong className="dino-stage-name">{stageCopy.name}</strong>
          <p>{stageCopy.description}</p>
        </div>
      </div>

      <div className="dino-progress">
        <div className="dino-progress__label">
          <span>{progressLabel}</span>
          <strong>{evolution.progressPercent}%</strong>
        </div>
        <div
          aria-label={progressLabel}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={evolution.progressPercent}
          className="dino-progress__track"
          role="progressbar"
        >
          <span style={{ width: `${evolution.progressPercent}%` }} />
        </div>
      </div>

      <div className="evolution-track" aria-label={copy.petEvolutionLabel}>
        {DINO_STAGES.map((stage, index) => {
          const isCurrent = index === evolution.stageIndex
          const isComplete = index < evolution.stageIndex

          return (
            <span
              key={stage.id}
              aria-label={getDinoStageCopy(language, stage.id).name}
              className={`evolution-track__step ${
                isCurrent ? 'evolution-track__step--current' : ''
              } ${isComplete ? 'evolution-track__step--complete' : ''}`}
              title={getDinoStageCopy(language, stage.id).name}
            >
              {isComplete ? '✓' : index + 1}
            </span>
          )
        })}
      </div>

      <p className="dino-card__tap-hint">👆 {copy.petTapHint}</p>
      {soundError && (
        <p className="dino-card__sound-error" role="alert">
          {soundError}
        </p>
      )}
      {!compact && <p className="dino-card__hint">💡 {copy.petHint}</p>}
    </section>
  )
}

function SeoLinks() {
  return (
    <nav className="seo-links" aria-label="Ear training topics">
      {SEO_PAGES.map((page) => (
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
  return (
    <main className="shell shell--ready">
      <div className="shell__content">
        <article className="seo-page">
          <header className="seo-page__hero">
            <div className="hero-panel__top">
              <a className="eyebrow eyebrow--link" href="/">
                Perfect Pitch
              </a>
              <a className="ghost-button" href="/#practice">
                Start practice
              </a>
            </div>
            <p className="question-kicker">{page.eyebrow}</p>
            <h1>{page.heading}</h1>
            <p className="hero-copy">{page.intro}</p>
          </header>

          <section className="seo-page__body" aria-label={`${page.eyebrow} guide`}>
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </section>

          <section className="seo-page__faq" aria-labelledby="seo-faq-heading">
            <h2 id="seo-faq-heading">Frequently asked questions</h2>
            {page.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </section>

          <section className="seo-panel" aria-labelledby="seo-more-heading">
            <div className="seo-panel__header">
              <p className="question-kicker">More ear training topics</p>
              <h2 id="seo-more-heading">Keep exploring</h2>
            </div>
            <SeoLinks />
          </section>
        </article>
        <FooterSignature language="en" />
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
  const audioEngineRef = useRef<AudioEngine | null>(providedAudioEngine ?? null)
  const storage = useMemo(() => resolveStorage(providedStorage), [providedStorage])
  const [language, setLanguage] = useState<Language>(() => loadLanguagePreference(storage))
  const questionFactory = useMemo(
    () => providedQuestionFactory ?? createQuestionFactory(language),
    [language, providedQuestionFactory],
  )
  const [mode, setMode] = useState<GameMode | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const displayQuestion = useMemo(
    () => (question ? localizeQuestion(question, language) : null),
    [language, question],
  )
  const [evaluation, setEvaluation] = useState<QuestionEvaluation | null>(null)
  const [stats, setStats] = useState<SessionStats>(() => loadSessionStats(storage))
  const [dinoProgress, setDinoProgress] = useState(() => loadDinoProgress(storage))
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
  const [modeProgress, setModeProgress] = useState<ModeProgressState>(() =>
    loadProgressState(storage),
  )
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
  const copy = getAppCopy(language)
  const dinoHungry = isDinoHungry(dinoCare, currentTime)

  const maybePlayDinoRoar = useCallback(async () => {
    const roarAt = getNow()
    if (
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
  }, [copy.petSoundError, dinoRoarPlayer, getNow])

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
    saveDinoProgress(dinoProgress, storage)
  }, [dinoProgress, storage])

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
    if (audioStatus === 'ready' && dinoHungry) {
      void maybePlayDinoRoar()
    }
  }, [audioStatus, dinoHungry, maybePlayDinoRoar])

  useEffect(() => {
    saveLanguagePreference(language, storage)
  }, [language, storage])

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    if (!seoPage) {
      document.title = 'Perfect Pitch | Ear Training with Real Piano Sounds'
      const description =
        'Perfect Pitch is an ear training web app for notes, intervals, melodies, arpeggios, and chords with instant feedback and sample-based piano sounds.'
      setMetaContent('meta[name="description"]', description)
      setMetaContent('meta[property="og:title"]', document.title)
      setMetaContent('meta[property="og:description"]', description)
      setMetaContent('meta[property="og:url"]', `${SITE_URL}/`)
      setMetaContent('meta[name="twitter:title"]', document.title)
      setMetaContent('meta[name="twitter:description"]', description)
      setCanonicalUrl(`${SITE_URL}/`)
      return
    }

    const url = `${SITE_URL}${seoPage.path}`
    document.title = seoPage.title
    setMetaContent('meta[name="description"]', seoPage.description)
    setMetaContent('meta[property="og:title"]', seoPage.title)
    setMetaContent('meta[property="og:description"]', seoPage.description)
    setMetaContent('meta[property="og:url"]', url)
    setMetaContent('meta[name="twitter:title"]', seoPage.title)
    setMetaContent('meta[name="twitter:description"]', seoPage.description)
    setCanonicalUrl(url)
  }, [seoPage])

  useEffect(() => {
    const pagePath = mode ? `/mode/${mode}` : '/'
    if (pageViewRef.current === `${pagePath}:${language}`) {
      return
    }

    const pageTitle = mode
      ? `Perfect Pitch - ${getModeCopy(language, mode).label}`
      : 'Perfect Pitch'

    trackPageView(pagePath, pageTitle, language)
    pageViewRef.current = `${pagePath}:${language}`
  }, [language, mode])

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
      setDinoProgress((current) => ({
        points: current.points + DINO_POINTS_PER_CORRECT,
      }))
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

  const sessionStats = formatSessionStats(language, stats, accuracy)

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
              <DinoCompanion
                hungry={dinoHungry}
                language={language}
                onInteract={() => void maybePlayDinoRoar()}
                points={dinoProgress.points}
                soundError={dinoSoundError}
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
              <DinoCompanion
                celebrate={evaluation?.status === 'correct'}
                compact
                hungry={dinoHungry}
                language={language}
                onInteract={() => void maybePlayDinoRoar()}
                points={dinoProgress.points}
                soundError={dinoSoundError}
              />

              <div className="question-panel">
              <div className="question-heading">
                <p className="question-kicker">{copy.currentQuestion}</p>
                <h2>{displayQuestion.prompt}</h2>
                <p>{displayQuestion.helperText}</p>
              </div>

              {progressNotice && <p className="progress-banner">{progressNotice}</p>}

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

              <div className="choices-grid">
                {displayQuestion.choices.map((choice) => {
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
                      <span className="choice-label">{choice.label}</span>
                      <span className="choice-meta">{choice.meta}</span>
                    </button>
                  )
                })}
              </div>

              {evaluation && (
                <div
                  ref={feedbackPanelRef}
                  className={`feedback-panel ${
                    evaluation.status === 'correct' ? 'success' : 'danger'
                  }`}
                >
                  <div>
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
    </main>
  )
}

export default function App() {
  return <PerfectPitchApp />
}
