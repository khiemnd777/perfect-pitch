import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SESSION_STATS,
  loadSessionStats,
  resetSessionStats,
  saveSessionStats,
  SCORE_STORAGE_KEY,
} from './sessionStats'

describe('sessionStats', () => {
  it('returns default stats when storage is empty', () => {
    window.localStorage.clear()

    expect(loadSessionStats(window.localStorage)).toEqual(DEFAULT_SESSION_STATS)
  })

  it('falls back safely when stored stats are invalid', () => {
    window.localStorage.setItem(SCORE_STORAGE_KEY, '{not-json')

    expect(loadSessionStats(window.localStorage)).toEqual(DEFAULT_SESSION_STATS)
  })

  it('restores valid stored stats', () => {
    window.localStorage.setItem(
      SCORE_STORAGE_KEY,
      JSON.stringify({
        answered: 6,
        correct: 4,
        streak: 2,
        bestStreak: 5,
      }),
    )

    expect(loadSessionStats(window.localStorage)).toEqual({
      answered: 6,
      correct: 4,
      streak: 2,
      bestStreak: 5,
    })
  })

  it('resets stored stats back to default values', () => {
    saveSessionStats(
      {
        answered: 3,
        correct: 2,
        streak: 1,
        bestStreak: 2,
      },
      window.localStorage,
    )

    resetSessionStats(window.localStorage)

    expect(loadSessionStats(window.localStorage)).toEqual(DEFAULT_SESSION_STATS)
  })
})
