import { describe, expect, it } from 'vitest'
import {
  DINO_CARE_STORAGE_KEY,
  DINO_HUNGRY_AFTER_MS,
  DINO_ROAR_COOLDOWN_MS,
  createDefaultDinoCare,
  feedDino,
  isDinoHungry,
  loadDinoCare,
  markDinoRoared,
  saveDinoCare,
  shouldDinoRoar,
} from './dinoCare'

describe('dinoCare', () => {
  const now = 2_000_000

  it('becomes hungry after thirty minutes without a correct answer', () => {
    const care = createDefaultDinoCare(now - DINO_HUNGRY_AFTER_MS)

    expect(isDinoHungry(care, now)).toBe(true)
    expect(shouldDinoRoar(care, now)).toBe(true)
  })

  it('feeds the dinosaur and starts a fresh care window', () => {
    const hungryCare = createDefaultDinoCare(now - DINO_HUNGRY_AFTER_MS)

    expect(isDinoHungry(feedDino(hungryCare, now), now)).toBe(false)
  })

  it('applies a cooldown after roaring', () => {
    const hungryCare = createDefaultDinoCare(now - DINO_HUNGRY_AFTER_MS)
    const roaredCare = markDinoRoared(hungryCare, now)

    expect(shouldDinoRoar(roaredCare, now + DINO_ROAR_COOLDOWN_MS - 1)).toBe(
      false,
    )
    expect(shouldDinoRoar(roaredCare, now + DINO_ROAR_COOLDOWN_MS)).toBe(true)
  })

  it('persists and restores care timestamps', () => {
    window.localStorage.clear()
    const care = { lastFedAt: 1234, lastRoaredAt: 1500 }

    saveDinoCare(care, window.localStorage)

    expect(loadDinoCare(window.localStorage, now)).toEqual(care)
  })

  it('falls back safely for malformed storage', () => {
    window.localStorage.setItem(DINO_CARE_STORAGE_KEY, '{broken-json')

    expect(loadDinoCare(window.localStorage, now)).toEqual(
      createDefaultDinoCare(now),
    )
  })
})
