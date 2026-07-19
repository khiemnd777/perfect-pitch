import { describe, expect, it } from 'vitest'
import type { DinoStageId, PetId } from '../../shared/gameTypes'
import { PET_ANIMATIONS } from './petAnimation'

const PET_IDS: readonly PetId[] = [
  'dino',
  'cat',
  'bunny',
  'fox',
  'dog',
  'hamster',
  'panda',
  'penguin',
  'unicorn',
  'dragon',
  'phoenix',
  'griffin',
  'bella',
  'little-bella',
  'andy',
  'dory',
  'alvin',
]
const STAGE_IDS: readonly DinoStageId[] = [
  'egg',
  'baby',
  'young',
  'adult',
  'super',
]

describe('PET_ANIMATIONS', () => {
  it.each(PET_IDS)('provides four valid key poses for %s', (petId) => {
    for (const stageId of STAGE_IDS) {
      const animation = PET_ANIMATIONS[petId][stageId]

      expect(animation.frames).toHaveLength(4)
      expect(animation.timeline.length).toBeGreaterThan(4)
      for (const step of animation.timeline) {
        expect(animation.frames[step.frameIndex]).toBeDefined()
        expect(step.holdMs).toBeGreaterThan(0)
      }
    }
  })

  it.each([
    'cat',
    'bunny',
    'fox',
    'dog',
    'hamster',
    'panda',
    'penguin',
    'unicorn',
    'dragon',
    'phoenix',
    'griffin',
    'bella',
    'little-bella',
    'andy',
    'dory',
    'alvin',
  ] as const)(
    'uses the generated sprite folder for %s',
    (petId) => {
      expect(PET_ANIMATIONS[petId].super.frames[3].src).toBe(
        `/pets/${petId}/frames-v1/super-4.png`,
      )
    },
  )
})
