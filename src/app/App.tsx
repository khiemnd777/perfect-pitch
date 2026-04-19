import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  createAudioEngine,
  type AudioEngine,
} from '../features/audio/audioEngine'
import { evaluateSelection } from '../features/game/evaluation'
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
  getModeCopy,
  formatChoiceMeta,
  translateIntervalLabel,
  type Language,
} from '../shared/localization'
import {
  GAME_MODES,
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

const MIN_BOOT_DURATION_MS = 700
const QUESTION_DEDUP_MAX_ATTEMPTS = 24
const PLAYBACK_START_DELAY_MS = 80
const PLAYBACK_LOCK_BUFFER_MS = 40

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
  questionFactory?: QuestionFactory
  storage?: Storage | null
}

function localizeQuestion(question: Question, language: Language): Question {
  const modeCopy = getModeCopy(language, question.mode)
  const localizedChoices = question.choices.map((choice) => {
    const label =
      question.mode === 'interval'
        ? translateIntervalLabel(choice.label, language)
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

export function PerfectPitchApp({
  audioEngine: providedAudioEngine,
  questionFactory: providedQuestionFactory,
  storage: providedStorage,
}: PerfectPitchAppProps) {
  const audioEngine = useMemo(
    () => providedAudioEngine ?? createAudioEngine(),
    [providedAudioEngine],
  )
  const storage = useMemo(() => resolveStorage(providedStorage), [providedStorage])
  const [language, setLanguage] = useState<Language>(() => loadLanguagePreference(storage))
  const questionFactory = useMemo(
    () => providedQuestionFactory ?? createQuestionFactory(language),
    [language, providedQuestionFactory],
  )
  const [assetStatus, setAssetStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [assetError, setAssetError] = useState<boolean>(false)
  const [mode, setMode] = useState<GameMode | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const displayQuestion = useMemo(
    () => (question ? localizeQuestion(question, language) : null),
    [language, question],
  )
  const [evaluation, setEvaluation] = useState<QuestionEvaluation | null>(null)
  const [stats, setStats] = useState<SessionStats>(() => loadSessionStats(storage))
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
  const seenQuestionKeysRef = useRef<Record<GameMode, Set<string>>>({
    single: new Set(),
    double: new Set(),
    melody: new Set(),
    interval: new Set(),
    arpeggio: new Set(),
    chord: new Set(),
  })
  const pageViewRef = useRef<string | null>(null)
  const feedbackPanelRef = useRef<HTMLDivElement | null>(null)
  const playbackUnlockTimeoutRef = useRef<number | null>(null)
  const copy = getAppCopy(language)

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
    saveLanguagePreference(language, storage)
  }, [language, storage])

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    if (assetStatus !== 'ready') {
      return
    }

    const pagePath = mode ? `/mode/${mode}` : '/'
    if (pageViewRef.current === `${pagePath}:${language}`) {
      return
    }

    const pageTitle = mode
      ? `Perfect Pitch - ${getModeCopy(language, mode).label}`
      : 'Perfect Pitch'

    trackPageView(pagePath, pageTitle, language)
    pageViewRef.current = `${pagePath}:${language}`
  }, [assetStatus, language, mode])

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

  useEffect(() => {
    let cancelled = false

    const preloadAssets = async () => {
      const startedAt = performance.now()
      setAssetStatus('loading')
      setAssetError(false)

      try {
        await audioEngine.preload()
        const elapsedMs = performance.now() - startedAt
        const remainingMs = Math.max(0, MIN_BOOT_DURATION_MS - elapsedMs)

        if (remainingMs > 0) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, remainingMs)
          })
        }

        if (!cancelled) {
          setAssetStatus('ready')
        }
      } catch (error) {
        if (!cancelled) {
          setAssetStatus('error')
          setAssetError(true)
        }

        console.error(error)
      }
    }

    void preloadAssets()

    return () => {
      cancelled = true
      clearPlaybackUnlockTimeout()
      audioEngine.dispose()
    }
  }, [audioEngine])

  const retryAssetPreload = async () => {
    setAssetStatus('loading')
    setAssetError(false)

    try {
      await audioEngine.preload()
      setAssetStatus('ready')
    } catch (error) {
      setAssetStatus('error')
      setAssetError(true)
      console.error(error)
    }
  }

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
    audioEngine.stop()
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

  if (assetStatus !== 'ready') {
    return (
      <main className="shell shell--boot">
        <div className="shell__content">
          <section className="boot-panel" aria-live="polite">
            <div className="boot-toolbar">
              <div className="eyebrow">Perfect Pitch</div>
              <LanguageSwitcher language={language} onChange={setLanguage} />
            </div>
            <h1>{assetStatus === 'loading' ? copy.bootLoadingTitle : copy.bootErrorTitle}</h1>
            <p className="hero-copy">
              {assetStatus === 'loading'
                ? copy.bootLoadingBody
                : assetError
                  ? copy.bootLoadError
                  : null}
            </p>
            <div className="boot-status">
              <span className="boot-spinner" aria-hidden="true" />
              <strong>
                {assetStatus === 'loading' ? copy.bootLoadingStatus : copy.bootRetryStatus}
              </strong>
            </div>
            {assetStatus === 'error' && (
              <button className="play-button" onClick={retryAssetPreload} type="button">
                {copy.bootRetryButton}
              </button>
            )}
          </section>
          <FooterSignature language={language} />
        </div>
      </main>
    )
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
            <h1>{copy.heroTitle}</h1>
            <p className="hero-copy">{copy.heroBody}</p>
            <div className="hero-stats">
              <span>{copy.heroModesStat}</span>
              <span>{copy.heroLevelsStat}</span>
              <span>{copy.heroPianoStat}</span>
            </div>
          </section>
        )}

        {!mode && (
          <section className="mode-grid" aria-label={copy.modeGridAriaLabel}>
            {GAME_MODES.map((gameMode) => {
              const progress = modeProgress[gameMode]
              const modeCopy = getModeCopy(language, gameMode)

              return (
                <button
                  key={gameMode}
                  aria-label={modeCopy.label}
                  className="mode-card"
                  onClick={() => activateMode(gameMode)}
                  type="button"
                >
                  <div className="mode-card__header">
                    <span className="mode-card__tag">{copy.modeTag}</span>
                    <span className="difficulty-pill">
                      {getDifficultyLabel(language, progress.currentDifficulty)}
                    </span>
                  </div>
                  <strong>{modeCopy.label}</strong>
                  <span>{modeCopy.description}</span>
                </button>
              )
            })}
          </section>
        )}

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
