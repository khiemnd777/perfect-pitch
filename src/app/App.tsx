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
  DIFFICULTY_LABELS,
  GAME_MODE_CONFIGS,
  GAME_MODES,
  type GameMode,
  type Question,
  type QuestionEvaluation,
  type SessionStats,
} from '../shared/gameTypes'

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

export function PerfectPitchApp({
  audioEngine: providedAudioEngine,
  questionFactory: providedQuestionFactory,
  storage: providedStorage,
}: PerfectPitchAppProps) {
  const audioEngine = useMemo(
    () => providedAudioEngine ?? createAudioEngine(),
    [providedAudioEngine],
  )
  const questionFactory = useMemo(
    () => providedQuestionFactory ?? createQuestionFactory(),
    [providedQuestionFactory],
  )
  const storage = useMemo(() => resolveStorage(providedStorage), [providedStorage])
  const [assetStatus, setAssetStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [assetError, setAssetError] = useState<string | null>(null)
  const [mode, setMode] = useState<GameMode | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
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
    let cancelled = false

    const preloadAssets = async () => {
      const startedAt = performance.now()
      setAssetStatus('loading')
      setAssetError(null)

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
          setAssetError('Không thể nạp piano. Hãy thử lại.')
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
    setAssetError(null)

    try {
      await audioEngine.preload()
      setAssetStatus('ready')
    } catch (error) {
      setAssetStatus('error')
      setAssetError('Không thể nạp piano. Hãy thử lại.')
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
      setAudioError('Không thể khởi tạo âm thanh trên trình duyệt này.')
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
    const progression = applyProgression(modeProgress[question.mode], result.status)
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

  if (assetStatus !== 'ready') {
    return (
      <main className="shell shell--boot">
        <section className="boot-panel" aria-live="polite">
          <div className="eyebrow">Perfect Pitch</div>
          <h1>{assetStatus === 'loading' ? 'Đang nạp piano' : 'Nạp piano thất bại'}</h1>
          <p className="hero-copy">
            {assetStatus === 'loading'
              ? 'Ứng dụng đang preload toàn bộ asset piano trước khi mở màn chơi.'
              : assetError}
          </p>
          <div className="boot-status">
            <span className="boot-spinner" aria-hidden="true" />
            <strong>
              {assetStatus === 'loading'
                ? 'Vui lòng chờ, trang sẽ mở sau khi nạp xong.'
                : 'Bạn có thể thử preload lại asset piano.'}
            </strong>
          </div>
          {assetStatus === 'error' && (
            <button className="play-button" onClick={retryAssetPreload} type="button">
              Thử nạp lại
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
          <div className="eyebrow">Perfect Pitch</div>
          <h1>Kiểm tra tai nghe nốt bằng piano thật</h1>
          <p className="hero-copy">
            Luyện cảm âm với 6 mode nghe: nốt đơn, cặp nốt, giai điệu, quãng, arpeggio và chord.
            Mỗi câu có 4 đáp án, chấm ngay sau khi bấm và tự tăng độ khó theo phong độ.
          </p>
          <div className="hero-stats">
            <span>{GAME_MODES.length} chế độ</span>
            <span>3 cấp độ</span>
            <span>Piano Salamander</span>
          </div>
        </section>
      )}

      {!mode && (
        <section className="mode-grid" aria-label="Chọn chế độ chơi">
          {GAME_MODES.map((gameMode) => {
            const progress = modeProgress[gameMode]

            return (
              <button
                key={gameMode}
                aria-label={GAME_MODE_CONFIGS[gameMode].label}
                className="mode-card"
                onClick={() => activateMode(gameMode)}
                type="button"
              >
                <div className="mode-card__header">
                  <span className="mode-card__tag">Mode</span>
                  <span className="difficulty-pill">
                    {DIFFICULTY_LABELS[progress.currentDifficulty]}
                  </span>
                </div>
                <strong>{GAME_MODE_CONFIGS[gameMode].label}</strong>
                <span>{GAME_MODE_CONFIGS[gameMode].description}</span>
              </button>
            )
          })}
        </section>
      )}

      {mode && question && (
        <section className="game-layout">
          <header className="game-header">
            <div className="mode-header">
              <button className="ghost-button" onClick={goBackToModes} type="button">
                Đổi mode
              </button>
              <p className="mode-name">{GAME_MODE_CONFIGS[mode].label}</p>
              <div className="mode-badges">
                <span className="difficulty-pill">
                  {DIFFICULTY_LABELS[question.difficulty]}
                </span>
                <span className="difficulty-pill difficulty-pill--muted">
                  {GAME_MODE_CONFIGS[mode].difficulty[question.difficulty].shortLabel}
                </span>
              </div>
            </div>
            <div className="stats-card" aria-label="Thống kê phiên chơi">
              <span>{stats.correct}/{stats.answered} đúng</span>
              <span>{accuracy}% chính xác</span>
              <span>Streak {stats.streak}</span>
            </div>
          </header>

          <div className="question-panel">
            <div className="question-heading">
              <p className="question-kicker">Câu hiện tại</p>
              <h2>{question.prompt}</h2>
              <p>{question.helperText}</p>
            </div>

            {progressNotice && <p className="progress-banner">{progressNotice}</p>}

            <div className="control-row">
              <button className="play-button" onClick={playQuestion} type="button">
                {audioStatus === 'loading'
                  ? 'Đang nạp piano...'
                  : hasPlayedCurrent
                    ? 'Phát lại'
                    : 'Bật piano và phát'}
              </button>
            </div>

            {audioError && <p className="status-message error">{audioError}</p>}
            {!hasPlayedCurrent && !audioError && (
              <p className="status-message">
                Mẹo: lần phát đầu sẽ kích hoạt Web Audio theo thao tác người dùng.
              </p>
            )}

            <div className="choices-grid">
              {question.choices.map((choice) => {
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
                    {evaluation.status === 'correct'
                      ? 'Chính xác'
                      : 'Chưa đúng'}
                  </p>
                  <p>
                    Đáp án đúng là{' '}
                    <strong>{question.choices.find((choice) => choice.id === question.correctChoiceId)?.label}</strong>.
                  </p>
                </div>
                <button className="next-button" onClick={goToNextQuestion} type="button">
                  Câu tiếp theo
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
