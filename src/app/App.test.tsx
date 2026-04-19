import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PerfectPitchApp } from './App'
import { LANGUAGE_STORAGE_KEY } from './languagePreference'
import {
  DEFAULT_SESSION_STATS,
  SCORE_STORAGE_KEY,
} from './sessionStats'
import type { AudioEngine } from '../features/audio/audioEngine'
import type { QuestionFactory } from '../features/question-bank/questionFactory'
import type {
  DifficultyLevel,
  GameMode,
  Question,
} from '../shared/gameTypes'

function createMockAudioEngine(): AudioEngine {
  return {
    preload: vi.fn().mockResolvedValue(undefined),
    init: vi.fn().mockResolvedValue(undefined),
    playQuestion: vi.fn().mockResolvedValue(undefined),
    replay: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    dispose: vi.fn(),
  }
}

function createStubQuestion(
  id: string,
  mode: GameMode,
  difficulty: DifficultyLevel,
  label: string,
): Question {
  return {
    id,
    mode,
    difficulty,
    prompt: `Question ${id}`,
    helperText: `${mode}-${difficulty}-helper`,
    correctChoiceId: 'c',
    choices: [
      { id: 'a', label: 'A', meta: 'meta A', isCorrect: false },
      { id: 'b', label: 'B', meta: 'meta B', isCorrect: false },
      { id: 'c', label, meta: `meta ${label}`, isCorrect: true },
      { id: 'd', label: 'D', meta: 'meta D', isCorrect: false },
    ],
    playback: [{ notes: ['C4'], offsetMs: 0, durationMs: 1000, velocity: 0.7 }],
  }
}

function createTrackingQuestionFactory() {
  const callCount = new Map<string, number>()
  const createQuestion = vi.fn((mode: GameMode, difficulty: DifficultyLevel) => {
    const key = `${mode}-${difficulty}`
    const count = (callCount.get(key) ?? 0) + 1
    callCount.set(key, count)

    return createStubQuestion(
      `${mode}-${difficulty}-${count}`,
      mode,
      difficulty,
      `${difficulty}-${count}`,
    )
  })

  return {
    createQuestion,
    factory: {
      createQuestion,
    } satisfies QuestionFactory,
  }
}

function createDedupQuestionFactory() {
  const questions = [
    createStubQuestion('single-easy-1', 'single', 'easy', 'easy-1'),
    createStubQuestion('single-easy-1-duplicate', 'single', 'easy', 'easy-1'),
    createStubQuestion('single-easy-2', 'single', 'easy', 'easy-2'),
  ]
  const createQuestion = vi.fn(
    () =>
      questions.shift() ??
      createStubQuestion('fallback', 'single', 'easy', 'fallback'),
  )

  return {
    createQuestion,
    factory: {
      createQuestion,
    } satisfies QuestionFactory,
  }
}

describe('PerfectPitchApp', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('defaults to English when no saved language preference exists', async () => {
    const audioEngine = createMockAudioEngine()

    render(<PerfectPitchApp audioEngine={audioEngine} />)

    expect(screen.getByText('Loading piano')).toBeInTheDocument()

    await screen.findByRole('button', { name: 'Single Note' })

    expect(screen.getByText('Train your ear with a real piano')).toBeInTheDocument()
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })

  it('restores saved language from local storage on load', async () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'vi')
    const audioEngine = createMockAudioEngine()

    render(<PerfectPitchApp audioEngine={audioEngine} storage={window.localStorage} />)

    expect(screen.getByText('Đang nạp piano')).toBeInTheDocument()

    await screen.findByRole('button', { name: 'Single Note' })

    expect(
      await screen.findByText('Kiểm tra tai nghe nốt bằng piano thật'),
    ).toBeInTheDocument()
  })

  it('toggles language immediately and persists the selection', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()

    render(<PerfectPitchApp audioEngine={audioEngine} storage={window.localStorage} />)

    await screen.findByRole('button', { name: 'Single Note' })

    await user.click(screen.getAllByRole('button', { name: 'VI' })[0])

    expect(
      screen.getByText('Kiểm tra tai nghe nốt bằng piano thật'),
    ).toBeInTheDocument()
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('vi')

    await user.click(screen.getAllByRole('button', { name: 'EN' })[0])

    expect(
      await screen.findByText('Train your ear with a real piano'),
    ).toBeInTheDocument()
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })

  it('shows the language switcher on the home screen and in game', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp
        audioEngine={audioEngine}
        questionFactory={questionFactory.factory}
      />,
    )

    await screen.findByRole('button', { name: 'Single Note' })
    expect(screen.getAllByRole('button', { name: 'EN' })).not.toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Single Note' }))

    expect(screen.getAllByRole('button', { name: 'EN' })).not.toHaveLength(0)
  })

  it('updates the current question copy when switching language in game', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()

    render(<PerfectPitchApp audioEngine={audioEngine} storage={window.localStorage} />)

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Interval' }))

    expect(
      await screen.findByText('Listen to the interval and choose the correct interval name'),
    ).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'VI' })[0])

    expect(
      await screen.findByText('Nghe quãng và chọn đúng tên quãng'),
    ).toBeInTheDocument()
  })

  it('preloads piano samples before showing the home screen', async () => {
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp audioEngine={audioEngine} questionFactory={questionFactory.factory} />,
    )

    expect(screen.getByText('Loading piano')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Single Note' })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(audioEngine.preload).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button', { name: 'Single Note' })).toBeInTheDocument()
    })
  })

  it('shows all 6 modes on the home screen', async () => {
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp audioEngine={audioEngine} questionFactory={questionFactory.factory} />,
    )

    await screen.findByRole('button', { name: 'Single Note' })

    expect(screen.getByRole('button', { name: 'Double Note' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Melody' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Interval' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Arpeggio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chord' })).toBeInTheDocument()
  })

  it('disables answer choices until the current question has been played', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp audioEngine={audioEngine} questionFactory={questionFactory.factory} />,
    )

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))

    expect(screen.getByTestId('choice-a')).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))

    expect(screen.getByTestId('choice-a')).not.toBeDisabled()
  })

  it('shows immediate feedback and resets on next question', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp audioEngine={audioEngine} questionFactory={questionFactory.factory} />,
    )

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))
    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-a'))

    expect(screen.getByText('Not quite')).toBeInTheDocument()
    expect(screen.getByText(/Correct answer:/)).toHaveTextContent('easy-1')

    await user.click(screen.getByRole('button', { name: 'Next question' }))

    expect(screen.queryByText('Not quite')).not.toBeInTheDocument()
    expect(screen.getByText('easy-2')).toBeInTheDocument()
  })

  it('deduplicates repeated questions within the same play screen', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createDedupQuestionFactory()

    render(
      <PerfectPitchApp audioEngine={audioEngine} questionFactory={questionFactory.factory} />,
    )

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))
    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-a'))
    await user.click(screen.getByRole('button', { name: 'Next question' }))

    expect(screen.getByText('easy-2')).toBeInTheDocument()
    expect(questionFactory.createQuestion).toHaveBeenCalledTimes(3)
  })

  it('raises difficulty after two correct answers and uses the new level on the next question', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp audioEngine={audioEngine} questionFactory={questionFactory.factory} />,
    )

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))

    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-c'))
    await user.click(screen.getByRole('button', { name: 'Next question' }))

    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-c'))

    expect(screen.getByText('Moved up to Medium.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next question' }))

    expect(screen.getByText('medium-1')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('raises difficulty based on cumulative correct answers, not total answered questions', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp audioEngine={audioEngine} questionFactory={questionFactory.factory} />,
    )

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))

    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-c'))
    await user.click(screen.getByRole('button', { name: 'Next question' }))

    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-a'))
    await user.click(screen.getByRole('button', { name: 'Next question' }))

    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-c'))

    expect(screen.getByText('Moved up to Medium.')).toBeInTheDocument()
  })

  it('plays the current question again after the first playback', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp audioEngine={audioEngine} questionFactory={questionFactory.factory} />,
    )

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))
    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: 'Replay' })).toBeEnabled()
      },
      { timeout: 2_000 },
    )
    await user.click(screen.getByRole('button', { name: 'Replay' }))

    expect(audioEngine.playQuestion).toHaveBeenCalledTimes(2)
    expect(audioEngine.replay).not.toHaveBeenCalled()
  })

  it('disables play button while the current question audio is still playing', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp
        audioEngine={audioEngine}
        questionFactory={questionFactory.factory}
      />,
    )

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))

    const playButton = screen.getByRole('button', { name: 'Enable piano and play' })
    await user.click(playButton)

    expect(playButton).toBeDisabled()

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: 'Replay' })).toBeEnabled()
      },
      { timeout: 2_000 },
    )
  })

  it('restores saved difficulty from local storage on reload', async () => {
    window.localStorage.setItem(
      'perfect-pitch-mode-progress',
      JSON.stringify({
        single: {
          currentDifficulty: 'medium',
          highestUnlockedDifficulty: 'hard',
          correctAnswersTowardsLevelUp: 1,
          incorrectStreak: 0,
        },
      }),
    )

    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp
        audioEngine={audioEngine}
        questionFactory={questionFactory.factory}
        storage={window.localStorage}
      />,
    )

    await screen.findByRole('button', { name: 'Single Note' })

    await user.click(screen.getByRole('button', { name: 'Single Note' }))

    expect(screen.getByText('medium-1')).toBeInTheDocument()
    expect(questionFactory.createQuestion).toHaveBeenCalledWith('single', 'medium')
  })

  it('restores saved session stats from local storage on load', async () => {
    window.localStorage.setItem(
      SCORE_STORAGE_KEY,
      JSON.stringify({
        answered: 4,
        correct: 3,
        streak: 2,
        bestStreak: 2,
      }),
    )

    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()

    render(<PerfectPitchApp audioEngine={audioEngine} storage={window.localStorage} />)

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))

    expect(screen.getByText('3/4 correct')).toBeInTheDocument()
    expect(screen.getByText('75% accuracy')).toBeInTheDocument()
    expect(screen.getByText('Streak 2')).toBeInTheDocument()
  })

  it('persists updated session stats after answering a question', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp
        audioEngine={audioEngine}
        questionFactory={questionFactory.factory}
        storage={window.localStorage}
      />,
    )

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))
    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-c'))

    expect(JSON.parse(window.localStorage.getItem(SCORE_STORAGE_KEY) ?? 'null')).toEqual({
      answered: 1,
      correct: 1,
      streak: 1,
      bestStreak: 1,
    })
  })

  it('resets session stats in UI and storage', async () => {
    window.localStorage.setItem(
      SCORE_STORAGE_KEY,
      JSON.stringify({
        answered: 5,
        correct: 4,
        streak: 3,
        bestStreak: 4,
      }),
    )

    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()

    render(<PerfectPitchApp audioEngine={audioEngine} storage={window.localStorage} />)

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))
    await user.click(screen.getByRole('button', { name: 'Reset score' }))

    expect(screen.getByText('0/0 correct')).toBeInTheDocument()
    expect(screen.getByText('0% accuracy')).toBeInTheDocument()
    expect(screen.getByText('Streak 0')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(SCORE_STORAGE_KEY) ?? 'null')).toEqual(
      DEFAULT_SESSION_STATS,
    )
  })

  it('keeps session stats after remounting the app', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    const firstRender = render(
      <PerfectPitchApp
        audioEngine={audioEngine}
        questionFactory={questionFactory.factory}
        storage={window.localStorage}
      />,
    )

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))
    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-c'))

    firstRender.unmount()

    render(<PerfectPitchApp audioEngine={audioEngine} storage={window.localStorage} />)

    await screen.findByRole('button', { name: 'Single Note' })
    await user.click(screen.getByRole('button', { name: 'Single Note' }))

    expect(screen.getByText('1/1 correct')).toBeInTheDocument()
    expect(screen.getByText('100% accuracy')).toBeInTheDocument()
    expect(screen.getByText('Streak 1')).toBeInTheDocument()
  })
})
