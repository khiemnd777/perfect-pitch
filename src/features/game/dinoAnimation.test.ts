import { describe, expect, it } from 'vitest'
import { DINO_ANIMATIONS } from './dinoAnimation'

describe('DINO_ANIMATIONS', () => {
  it.each(Object.entries(DINO_ANIMATIONS))(
    'keeps every %s timeline inside its four key poses',
    (_stageId, animation) => {
      expect(animation.frames).toHaveLength(4)
      expect(animation.timeline.length).toBeGreaterThan(4)
      expect(new Set(animation.timeline.map((step) => step.frameIndex))).toEqual(
        new Set([0, 1, 2, 3]),
      )

      for (const step of animation.timeline) {
        expect(animation.frames[step.frameIndex]).toBeDefined()
        expect(step.holdMs).toBeGreaterThan(0)
      }
    },
  )

  it('keeps the baby key poses within a tight visual scale range', () => {
    const scales = DINO_ANIMATIONS.baby.frames.map(
      (frame) => frame.normalizeScale,
    )

    expect(Math.max(...scales) - Math.min(...scales)).toBeLessThan(0.05)
  })
})
