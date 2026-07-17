import { beforeEach, describe, expect, it } from 'vitest'
import { DIFFICULTY_LEVELS, GAME_MODES } from '../../shared/gameTypes'
import {
  applyProgression,
  createDefaultProgressState,
  loadProgressState,
} from './progression'

describe('mode progression', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('moves through all five levels after cumulative correct answers', () => {
    let progress = createDefaultProgressState().single

    DIFFICULTY_LEVELS.slice(1).forEach((expectedDifficulty) => {
      progress = applyProgression(progress, 'correct').nextProgress
      const result = applyProgression(progress, 'correct')
      progress = result.nextProgress

      expect(progress.currentDifficulty).toBe(expectedDifficulty)
      expect(progress.highestUnlockedDifficulty).toBe(expectedDifficulty)
      expect(result.notice).not.toBeNull()
    })

    const atMaximum = applyProgression(
      applyProgression(progress, 'correct').nextProgress,
      'correct',
    )

    expect(atMaximum.nextProgress.currentDifficulty).toBe('master')
    expect(atMaximum.notice).toBeNull()
  })

  it('creates independent progress for every expanded game mode', () => {
    const state = createDefaultProgressState()

    expect(Object.keys(state)).toEqual(GAME_MODES)
    expect(state.scale.currentDifficulty).toBe('easy')
    expect(state.seventh.currentDifficulty).toBe('easy')
  })

  it('keeps old saved progress and fills newly added modes with defaults', () => {
    window.localStorage.setItem(
      'perfect-pitch-mode-progress',
      JSON.stringify({
        single: {
          currentDifficulty: 'hard',
          highestUnlockedDifficulty: 'hard',
          correctAnswersTowardsLevelUp: 1,
          incorrectStreak: 0,
        },
      }),
    )

    const state = loadProgressState(window.localStorage)

    expect(state.single.currentDifficulty).toBe('hard')
    expect(state.single.correctAnswersTowardsLevelUp).toBe(1)
    expect(state.scale.currentDifficulty).toBe('easy')
    expect(state.seventh.currentDifficulty).toBe('easy')
  })
})
