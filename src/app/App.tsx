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

const DEFAULT_STATS: SessionStats = {
  answered: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
}

const MIN_BOOT_DURATION_MS = 700
const QUESTION_DEDUP_MAX_ATTEMPTS = 24

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
  const [stats, setStats] = useState<SessionStats>(DEFAULT_STATS)
  const [audioStatus, setAudioStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle')
  const [audioError, setAudioError] = useState<string | null>(null)
  const [hasPlayedCurrent, setHasPlayedCurrent] = useState(false)
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
    saveLanguagePreference(language, storage)
  }, [language, storage])

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
    seenQuestionKeysRef.current[nextMode] = new Set()
    setMode(nextMode)
    setQuestion(createNextQuestion(nextMode, modeProgress))
    setEvaluation(null)
    setHasPlayedCurrent(false)
    setAudioError(null)
    setProgressNotice(null)
  }

  const playQuestion = async () => {
    if (!question) {
      return
    }

    setAudioError(null)

    try {
      setAudioStatus((current) => (current === 'ready' ? 'ready' : 'loading'))
      await audioEngine.init()
      setAudioStatus('ready')
      await audioEngine.playQuestion(question)
      setHasPlayedCurrent(true)
    } catch (error) {
      setAudioStatus('error')
      setAudioError(
        language === 'en'
          ? 'Unable to initialize audio in this browser.'
          : 'Không thể khởi tạo âm thanh trên trình duyệt này.',
      )
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
  }

  const goToNextQuestion = () => {
    if (!mode) {
      return
    }

    setQuestion(createNextQuestion(mode, modeProgress))
    setEvaluation(null)
    setHasPlayedCurrent(false)
    setAudioError(null)
  }

  const goBackToModes = () => {
    audioEngine.stop()
    setMode(null)
    setQuestion(null)
    setEvaluation(null)
    setHasPlayedCurrent(false)
    setAudioError(null)
    setProgressNotice(null)
  }

  const sessionStats = formatSessionStats(language, stats, accuracy)

  if (assetStatus !== 'ready') {
    return (
      <main className="shell shell--boot">
        <section className="boot-panel" aria-live="polite">
          <div className="boot-toolbar">
            <div className="eyebrow">Perfect Pitch</div>
            <LanguageSwitcher language={language} onChange={setLanguage} />
          </div>
          <h1>{assetStatus === 'loading' ? copy.bootLoadingTitle : copy.bootErrorTitle}</h1>
          <p className="hero-copy">
            {assetStatus === 'loading' ? copy.bootLoadingBody : assetError ? copy.bootLoadError : null}
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
      </main>
    )
  }

  return (
    <main className="shell shell--ready">
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
              {sessionStats.map((item) => (
                <span key={item}>{item}</span>
              ))}
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
              <button className="play-button" onClick={playQuestion} type="button">
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
    </main>
  )
}

export default function App() {
  return <PerfectPitchApp />
}
