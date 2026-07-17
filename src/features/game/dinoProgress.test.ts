import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DINO_PROGRESS,
  DINO_PROGRESS_STORAGE_KEY,
  getDinoEvolution,
  loadDinoProgress,
  saveDinoProgress,
} from './dinoProgress'

describe('dinoProgress', () => {
  it('moves through all five evolution stages at their point thresholds', () => {
    expect(getDinoEvolution(0).stage.id).toBe('egg')
    expect(getDinoEvolution(49).stage.id).toBe('egg')
    expect(getDinoEvolution(50).stage.id).toBe('baby')
    expect(getDinoEvolution(199).stage.id).toBe('baby')
    expect(getDinoEvolution(200).stage.id).toBe('young')
    expect(getDinoEvolution(499).stage.id).toBe('young')
    expect(getDinoEvolution(500).stage.id).toBe('adult')
    expect(getDinoEvolution(899).stage.id).toBe('adult')
    expect(getDinoEvolution(900).stage.id).toBe('super')
  })

  it('reports progress inside the current stage', () => {
    expect(getDinoEvolution(125)).toMatchObject({
      stageIndex: 1,
      pointsToNextStage: 75,
      progressPercent: 50,
    })
  })

  it('persists and restores accumulated points', () => {
    window.localStorage.clear()
    saveDinoProgress({ points: 230 }, window.localStorage)

    expect(loadDinoProgress(window.localStorage)).toEqual({ points: 230 })
  })

  it('falls back safely for malformed stored progress', () => {
    window.localStorage.setItem(DINO_PROGRESS_STORAGE_KEY, '{broken-json')

    expect(loadDinoProgress(window.localStorage)).toEqual(DEFAULT_DINO_PROGRESS)
  })
})
