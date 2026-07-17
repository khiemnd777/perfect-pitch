import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PerfectPitchApp } from './App'
import { LANGUAGE_STORAGE_KEY } from './languagePreference'
import {
  DINO_CARE_STORAGE_KEY,
  DINO_HUNGRY_AFTER_MS,
} from '../features/game/dinoCare'
import { DINO_PROGRESS_STORAGE_KEY } from '../features/game/dinoProgress'
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
    window.history.pushState({}, '', '/')
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  })

  it('defaults to English when no saved language preference exists', async () => {
    const audioEngine = createMockAudioEngine()

    render(<PerfectPitchApp audioEngine={audioEngine} />)

    expect(screen.getByText('Listen, play & grow your dino!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Single Note' })).toBeInTheDocument()
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })

  it('restores saved language from local storage on load', async () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'vi')
    const audioEngine = createMockAudioEngine()

    render(<PerfectPitchApp audioEngine={audioEngine} storage={window.localStorage} />)

    expect(
      await screen.findByText('Nghe thật hay, nuôi khủng long lớn!'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Single Note' })).toBeInTheDocument()
  })

  it('toggles language immediately and persists the selection', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()

    render(<PerfectPitchApp audioEngine={audioEngine} storage={window.localStorage} />)

    await screen.findByRole('button', { name: 'Single Note' })

    await user.click(screen.getAllByRole('button', { name: 'VI' })[0])

    expect(
      screen.getByText('Nghe thật hay, nuôi khủng long lớn!'),
    ).toBeInTheDocument()
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('vi')

    await user.click(screen.getAllByRole('button', { name: 'EN' })[0])

    expect(
      await screen.findByText('Listen, play & grow your dino!'),
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

  it('translates scale answer labels when switching language in game', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const { container } = render(
      <PerfectPitchApp audioEngine={audioEngine} storage={window.localStorage} />,
    )

    await user.click(await screen.findByRole('button', { name: 'Scale' }))

    const englishChoices = Array.from(
      container.querySelectorAll<HTMLButtonElement>('.choice-card'),
    ).map((choice) => choice.textContent ?? '')
    expect(englishChoices.some((choice) => /major|natural minor/.test(choice))).toBe(
      true,
    )

    await user.click(screen.getByRole('button', { name: 'VI' }))

    const vietnameseChoices = Array.from(
      container.querySelectorAll<HTMLButtonElement>('.choice-card'),
    ).map((choice) => choice.textContent ?? '')
    expect(vietnameseChoices.every((choice) => !/major|natural minor/.test(choice))).toBe(
      true,
    )
    expect(
      vietnameseChoices.some((choice) => /trưởng|thứ tự nhiên/.test(choice)),
    ).toBe(true)
  })

  it('defers piano loading until the first playback gesture', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp audioEngine={audioEngine} questionFactory={questionFactory.factory} />,
    )

    expect(screen.getByRole('button', { name: 'Single Note' })).toBeInTheDocument()
    expect(audioEngine.preload).not.toHaveBeenCalled()
    expect(audioEngine.init).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Single Note' }))
    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))

    expect(audioEngine.init).toHaveBeenCalledTimes(1)
  })

  it('shows all 8 modes and 5 levels on the home screen', async () => {
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp audioEngine={audioEngine} questionFactory={questionFactory.factory} />,
    )

    await screen.findByRole('button', { name: 'Single Note' })

    expect(screen.getByRole('button', { name: 'Double Note' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Melody' })).toBeInTheDocument()
    const intervalButton = screen.getByRole('button', { name: 'Interval' })
    const rainbowBands = intervalButton.querySelectorAll('.mode-card__rainbow-band')
    expect(intervalButton).toBeInTheDocument()
    expect(rainbowBands).toHaveLength(7)
    expect(new Set(Array.from(rainbowBands, (band) => band.getAttribute('stroke'))).size).toBe(7)
    expect(screen.getByRole('button', { name: 'Arpeggio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chord' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Scale' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7th Chord' })).toBeInTheDocument()
    expect(screen.getByText(/8 modes/)).toBeInTheDocument()
    expect(screen.getByText(/5 levels/)).toBeInTheDocument()
  })

  it('returns to the top when opening a game mode', async () => {
    const user = userEvent.setup()
    const audioEngine = createMockAudioEngine()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp
        audioEngine={audioEngine}
        questionFactory={questionFactory.factory}
      />,
    )

    document.documentElement.scrollTop = 900
    document.body.scrollTop = 900
    await user.click(screen.getByRole('button', { name: 'Single Note' }))

    expect(document.documentElement.scrollTop).toBe(0)
    expect(document.body.scrollTop).toBe(0)
  })

  it('renders crawlable SEO topic content on the home screen', async () => {
    const audioEngine = createMockAudioEngine()

    render(<PerfectPitchApp audioEngine={audioEngine} />)

    expect(
      screen.getByRole('heading', {
        name: 'Practice ear training with focused piano exercises',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Perfect pitch training' }),
    ).toHaveAttribute('href', '/perfect-pitch-training')
  })

  it('renders an SEO landing page for direct route visits', async () => {
    window.history.pushState({}, '', '/interval-ear-training')
    const audioEngine = createMockAudioEngine()

    render(<PerfectPitchApp audioEngine={audioEngine} />)

    expect(
      screen.getByRole('heading', {
        name: 'Interval ear training for cleaner musical listening',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Melodic and harmonic intervals')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start practice' })).toHaveAttribute(
      'href',
      '/#practice',
    )
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

  it.each([
    ['hard', 'Expert', 'expert'],
    ['expert', 'Master', 'master'],
  ] as const)(
    'advances from %s into the new %s level',
    async (currentDifficulty, nextLabel, nextDifficulty) => {
      window.localStorage.setItem(
        'perfect-pitch-mode-progress',
        JSON.stringify({
          single: {
            currentDifficulty,
            highestUnlockedDifficulty: currentDifficulty,
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

      await user.click(await screen.findByRole('button', { name: 'Single Note' }))
      await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
      await user.click(screen.getByTestId('choice-c'))

      expect(screen.getByText(`Moved up to ${nextLabel}.`)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Next question' }))

      expect(screen.getByText(`${nextDifficulty}-1`)).toBeInTheDocument()
    },
  )

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

  it('awards persistent music notes to the dinosaur for a correct answer', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Single Note' }))
    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-c'))

    expect(screen.getByText(/\+10 music notes for your dino!/)).toBeInTheDocument()
    expect(screen.getByLabelText('10 music notes')).toBeInTheDocument()
    expect(
      JSON.parse(window.localStorage.getItem(DINO_PROGRESS_STORAGE_KEY) ?? 'null'),
    ).toEqual({ points: 10 })
  })

  it('evolves the egg into a baby after reaching 50 music notes', async () => {
    window.localStorage.setItem(
      DINO_PROGRESS_STORAGE_KEY,
      JSON.stringify({ points: 40 }),
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

    await user.click(screen.getByRole('button', { name: 'Single Note' }))
    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-c'))

    expect(screen.getByRole('img', { name: 'Baby Dino' })).toHaveClass(
      'dino-sprite--baby',
    )
    expect(screen.getByText('Stage 2/5')).toBeInTheDocument()
  })

  it.each([
    [0, 'Dino Egg', 'dino-sprite--egg'],
    [50, 'Baby Dino', 'dino-sprite--baby'],
    [200, 'Young Dino', 'dino-sprite--young'],
    [500, 'Cute Adult Dino', 'dino-sprite--adult'],
    [900, 'Super Dino', 'dino-sprite--super'],
  ])('uses the stage-specific animation at %i points', (points, name, className) => {
    window.localStorage.setItem(
      DINO_PROGRESS_STORAGE_KEY,
      JSON.stringify({ points }),
    )

    render(<PerfectPitchApp audioEngine={createMockAudioEngine()} />)

    const sprite = screen.getByRole('img', { name })
    const stageId = className.replace('dino-sprite--', '')
    const frames = sprite.querySelectorAll('.dino-sprite__frame')

    expect(sprite).toHaveClass(className)
    expect(frames).toHaveLength(4)
    expect(frames[0]).toHaveAttribute(
      'src',
      `/dino/frames-v1/${stageId}-1.png`,
    )
    expect(frames[0]).toHaveAttribute('data-active', 'true')
  })

  it('plays the dinosaur key poses on a paced expression timeline', () => {
    vi.useFakeTimers()

    try {
      render(<PerfectPitchApp audioEngine={createMockAudioEngine()} />)

      const sprite = screen.getByRole('img', { name: 'Dino Egg' })
      const frames = sprite.querySelectorAll('.dino-sprite__frame')

      expect(frames[0]).toHaveAttribute('data-active', 'true')

      act(() => vi.advanceTimersByTime(520))
      expect(frames[1]).toHaveAttribute('data-active', 'true')

      act(() => vi.advanceTimersByTime(220))
      expect(frames[2]).toHaveAttribute('data-active', 'true')

      act(() => vi.advanceTimersByTime(220))
      expect(frames[3]).toHaveAttribute('data-active', 'true')

      act(() => vi.advanceTimersByTime(760))
      expect(frames[2]).toHaveAttribute('data-active', 'true')
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows a stage-specific expression when the dinosaur is tapped', async () => {
    const user = userEvent.setup()
    const dinoRoarPlayer = vi.fn().mockResolvedValue(undefined)

    render(
      <PerfectPitchApp
        audioEngine={createMockAudioEngine()}
        dinoRoarPlayer={dinoRoarPlayer}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Tap the dinosaur for a reaction' }),
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Knock knock... I can hear you!',
    )
    expect(dinoRoarPlayer).not.toHaveBeenCalled()
  })

  it('roars once after returning to a hungry dinosaur', async () => {
    const now = 2_000_000
    window.localStorage.setItem(
      DINO_CARE_STORAGE_KEY,
      JSON.stringify({
        lastFedAt: now - DINO_HUNGRY_AFTER_MS,
        lastRoaredAt: null,
      }),
    )
    const user = userEvent.setup()
    const dinoRoarPlayer = vi.fn().mockResolvedValue(undefined)

    render(
      <PerfectPitchApp
        audioEngine={createMockAudioEngine()}
        dinoRoarPlayer={dinoRoarPlayer}
        now={() => now}
        storage={window.localStorage}
      />,
    )

    expect(screen.getByText(/Hungry!/)).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Tap the dinosaur for a reaction' }),
    )

    await waitFor(() => expect(dinoRoarPlayer).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Rawr... my tummy needs music!',
    )
    expect(
      JSON.parse(window.localStorage.getItem(DINO_CARE_STORAGE_KEY) ?? 'null'),
    ).toEqual({ lastFedAt: now - DINO_HUNGRY_AFTER_MS, lastRoaredAt: now })
  })

  it('shows a visible message when the dinosaur voice cannot start', async () => {
    const now = 2_500_000
    window.localStorage.setItem(
      DINO_CARE_STORAGE_KEY,
      JSON.stringify({
        lastFedAt: now - DINO_HUNGRY_AFTER_MS,
        lastRoaredAt: null,
      }),
    )
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <PerfectPitchApp
        audioEngine={createMockAudioEngine()}
        dinoRoarPlayer={vi.fn().mockRejectedValue(new Error('audio blocked'))}
        now={() => now}
        storage={window.localStorage}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Tap the dinosaur for a reaction' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Dino voice is sleeping. Tap again to retry.',
    )
    consoleError.mockRestore()
  })

  it('feeds a hungry dinosaur with points from a correct answer', async () => {
    const now = 3_000_000
    window.localStorage.setItem(
      DINO_CARE_STORAGE_KEY,
      JSON.stringify({
        lastFedAt: now - DINO_HUNGRY_AFTER_MS,
        lastRoaredAt: null,
      }),
    )
    const user = userEvent.setup()
    const questionFactory = createTrackingQuestionFactory()

    render(
      <PerfectPitchApp
        audioEngine={createMockAudioEngine()}
        dinoRoarPlayer={vi.fn().mockResolvedValue(undefined)}
        now={() => now}
        questionFactory={questionFactory.factory}
        storage={window.localStorage}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Single Note' }))
    await user.click(screen.getByRole('button', { name: 'Enable piano and play' }))
    await user.click(screen.getByTestId('choice-c'))

    expect(screen.queryByText(/Hungry!/)).not.toBeInTheDocument()
    expect(
      JSON.parse(window.localStorage.getItem(DINO_CARE_STORAGE_KEY) ?? 'null'),
    ).toEqual({ lastFedAt: now, lastRoaredAt: null })
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
