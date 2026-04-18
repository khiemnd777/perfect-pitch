import {
  DIFFICULTY_LEVELS,
  GAME_MODES,
  type DifficultyLevel,
  type GameMode,
  type ModeProgress,
} from '../../shared/gameTypes'
import {
  getLevelDownNotice,
  getLevelUpNotice,
  type Language,
} from '../../shared/localization'

const STORAGE_KEY = 'perfect-pitch-mode-progress'
const STREAK_TARGET = 2

export type ModeProgressState = Record<GameMode, ModeProgress>

export interface ProgressionResult {
  nextProgress: ModeProgress
  notice: string | null
}

function createDefaultModeProgress(): ModeProgress {
  return {
    currentDifficulty: 'easy',
    highestUnlockedDifficulty: 'easy',
    correctAnswersTowardsLevelUp: 0,
    incorrectStreak: 0,
  }
}

export function createDefaultProgressState(): ModeProgressState {
  return Object.fromEntries(
    GAME_MODES.map((mode) => [mode, createDefaultModeProgress()]),
  ) as ModeProgressState
}

function sanitizeDifficultyLevel(value: unknown): DifficultyLevel {
  if (typeof value === 'string' && DIFFICULTY_LEVELS.includes(value as DifficultyLevel)) {
    return value as DifficultyLevel
  }

  return 'easy'
}

function clampUnlockedDifficulty(current: DifficultyLevel, unlocked: DifficultyLevel) {
  return DIFFICULTY_LEVELS.indexOf(unlocked) < DIFFICULTY_LEVELS.indexOf(current)
    ? current
    : unlocked
}

function sanitizeModeProgress(value: unknown): ModeProgress {
  if (!value || typeof value !== 'object') {
    return createDefaultModeProgress()
  }

  const candidate = value as Partial<ModeProgress> & { correctStreak?: unknown }
  const currentDifficulty = sanitizeDifficultyLevel(candidate.currentDifficulty)
  const highestUnlockedDifficulty = clampUnlockedDifficulty(
    currentDifficulty,
    sanitizeDifficultyLevel(candidate.highestUnlockedDifficulty),
  )

  return {
    currentDifficulty,
    highestUnlockedDifficulty,
    correctAnswersTowardsLevelUp:
      typeof candidate.correctAnswersTowardsLevelUp === 'number' &&
      candidate.correctAnswersTowardsLevelUp >= 0
        ? candidate.correctAnswersTowardsLevelUp
        : typeof candidate.correctStreak === 'number' && candidate.correctStreak >= 0
          ? candidate.correctStreak
          : 0,
    incorrectStreak:
      typeof candidate.incorrectStreak === 'number' && candidate.incorrectStreak >= 0
        ? candidate.incorrectStreak
        : 0,
  }
}

export function loadProgressState(storage?: Storage | null): ModeProgressState {
  const fallback = createDefaultProgressState()

  if (!storage) {
    return fallback
  }

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<Record<GameMode, ModeProgress>>

    return Object.fromEntries(
      GAME_MODES.map((mode) => [mode, sanitizeModeProgress(parsed[mode])]),
    ) as ModeProgressState
  } catch {
    return fallback
  }
}

export function saveProgressState(
  state: ModeProgressState,
  storage?: Storage | null,
) {
  if (!storage) {
    return
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage failures and keep the in-memory session alive.
  }
}

function getAdjacentDifficulty(
  difficulty: DifficultyLevel,
  direction: 1 | -1,
): DifficultyLevel {
  const currentIndex = DIFFICULTY_LEVELS.indexOf(difficulty)
  const nextIndex = Math.max(
    0,
    Math.min(DIFFICULTY_LEVELS.length - 1, currentIndex + direction),
  )

  return DIFFICULTY_LEVELS[nextIndex]
}

export function applyProgression(
  progress: ModeProgress,
  status: 'correct' | 'incorrect',
  language: Language = 'en',
): ProgressionResult {
  if (status === 'correct') {
    const correctAnswersTowardsLevelUp = progress.correctAnswersTowardsLevelUp + 1

    if (correctAnswersTowardsLevelUp >= STREAK_TARGET) {
      const nextDifficulty = getAdjacentDifficulty(progress.currentDifficulty, 1)
      const changed = nextDifficulty !== progress.currentDifficulty

      return {
        nextProgress: {
          currentDifficulty: nextDifficulty,
          highestUnlockedDifficulty:
            DIFFICULTY_LEVELS.indexOf(nextDifficulty) >
            DIFFICULTY_LEVELS.indexOf(progress.highestUnlockedDifficulty)
              ? nextDifficulty
              : progress.highestUnlockedDifficulty,
          correctAnswersTowardsLevelUp: 0,
          incorrectStreak: 0,
        },
        notice: changed ? getLevelUpNotice(language, nextDifficulty) : null,
      }
    }

    return {
      nextProgress: {
        ...progress,
        correctAnswersTowardsLevelUp,
        incorrectStreak: 0,
      },
      notice: null,
    }
  }

  const incorrectStreak = progress.incorrectStreak + 1
  if (incorrectStreak >= STREAK_TARGET) {
    const nextDifficulty = getAdjacentDifficulty(progress.currentDifficulty, -1)
    const changed = nextDifficulty !== progress.currentDifficulty

    return {
      nextProgress: {
        ...progress,
        currentDifficulty: nextDifficulty,
        correctAnswersTowardsLevelUp: 0,
        incorrectStreak: 0,
      },
      notice: changed ? getLevelDownNotice(language, nextDifficulty) : null,
    }
  }

  return {
    nextProgress: {
      ...progress,
      correctAnswersTowardsLevelUp: progress.correctAnswersTowardsLevelUp,
      incorrectStreak,
    },
    notice: null,
  }
}
