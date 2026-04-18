import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PerfectPitchApp } from './App'
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

    return createStubQuestion(`${mode}-${difficulty}-${count}`, mode, difficulty, `${difficulty}-${count}`)
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
  const createQuestion = vi.fn(() => questions.shift() ?? createStubQuestion('fallback', 'single', 'easy', 'fallback'))

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

  it('preloads piano samples before showing the home screen', async () => {
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp audioEngine={audioEngine} questionFactory={questionFactory.factory} />,
    )

    expect(screen.getByText('Đang nạp piano')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Single Note' })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(audioEngine.preload).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button', { name: 'Single Note' })).toBeInTheDocument()
    })
  })

  it('shows all 5 modes on the home screen', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Bật piano và phát' }))

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
    await user.click(screen.getByRole('button', { name: 'Bật piano và phát' }))
    await user.click(screen.getByTestId('choice-a'))

    expect(screen.getByText('Chưa đúng')).toBeInTheDocument()
    expect(screen.getByText(/Đáp án đúng là/)).toHaveTextContent('easy-1')

    await user.click(screen.getByRole('button', { name: 'Câu tiếp theo' }))

    expect(screen.queryByText('Chưa đúng')).not.toBeInTheDocument()
    expect(screen.getByText('Question single-easy-2')).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: 'Bật piano và phát' }))
    await user.click(screen.getByTestId('choice-a'))
    await user.click(screen.getByRole('button', { name: 'Câu tiếp theo' }))

    expect(screen.getByText('Question single-easy-2')).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: 'Bật piano và phát' }))
    await user.click(screen.getByTestId('choice-c'))
    await user.click(screen.getByRole('button', { name: 'Câu tiếp theo' }))

    await user.click(screen.getByRole('button', { name: 'Bật piano và phát' }))
    await user.click(screen.getByTestId('choice-c'))

    expect(screen.getByText('Đã tăng lên mức Vừa.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Câu tiếp theo' }))

    expect(screen.getByText('Question single-medium-1')).toBeInTheDocument()
    expect(screen.getByText('Vừa')).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: 'Bật piano và phát' }))
    await user.click(screen.getByRole('button', { name: 'Phát lại' }))

    expect(audioEngine.playQuestion).toHaveBeenCalledTimes(2)
    expect(audioEngine.replay).not.toHaveBeenCalled()
  })

  it('restores saved difficulty from local storage on reload', async () => {
    window.localStorage.setItem(
      'perfect-pitch-mode-progress',
      JSON.stringify({
        single: {
          currentDifficulty: 'medium',
          highestUnlockedDifficulty: 'hard',
          correctStreak: 1,
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

    expect(screen.getByText('Question single-medium-1')).toBeInTheDocument()
    expect(questionFactory.createQuestion).toHaveBeenCalledWith('single', 'medium')
  })
})
