import type { DinoStageId } from '../../shared/gameTypes'

export interface DinoAnimationFrame {
  src: string
  normalizeScale: number
  offsetX: number
  offsetY: number
}

export interface DinoAnimationStep {
  frameIndex: number
  holdMs: number
}

export interface DinoAnimation {
  frames: readonly DinoAnimationFrame[]
  timeline: readonly DinoAnimationStep[]
}

function createDinoFrames(
  stageId: DinoStageId,
  alignment: readonly (readonly [number, number, number])[],
): readonly DinoAnimationFrame[] {
  return alignment.map(([normalizeScale, offsetX, offsetY], index) => ({
    src: `/dino/frames-v1/${stageId}-${index + 1}.png`,
    normalizeScale,
    offsetX,
    offsetY,
  }))
}

function createTimeline(
  steps: readonly (readonly [frameIndex: number, holdMs: number])[],
): readonly DinoAnimationStep[] {
  return steps.map(([frameIndex, holdMs]) => ({ frameIndex, holdMs }))
}

export const DINO_ANIMATIONS: Record<DinoStageId, DinoAnimation> = {
  egg: {
    frames: createDinoFrames('egg', [
      [0.9809, -4.023, 1.495],
      [0.9847, 11.539, 0.239],
      [0.9961, -6.226, 4.195],
      [1.0405, 7.011, 3.739],
    ]),
    // Crack and settle in both directions so the shell never jumps shut.
    timeline: createTimeline([
      [0, 520],
      [1, 220],
      [2, 220],
      [3, 760],
      [2, 220],
      [1, 220],
    ]),
  },
  baby: {
    frames: createDinoFrames('baby', [
      [1.0057, -2.848, 0.198],
      [1.0029, 0.098, 0.294],
      [1.0204, -3.488, 2.894],
      [0.99, 0.097, 3.816],
    ]),
    // Return to the resting face between laugh, wave, and excited poses.
    timeline: createTimeline([
      [0, 620],
      [1, 720],
      [0, 260],
      [2, 850],
      [0, 260],
      [3, 620],
    ]),
  },
  young: {
    frames: createDinoFrames('young', [
      [1, -5.859, 0],
      [0.9896, 10.534, -0.004],
      [1.0053, -7.166, 3.144],
      [1.0106, 11.251, 2.57],
    ]),
    timeline: createTimeline([
      [0, 260],
      [1, 520],
      [2, 260],
      [3, 320],
      [2, 260],
      [1, 360],
    ]),
  },
  adult: {
    frames: createDinoFrames('adult', [
      [0.9836, 0.576, 0.653],
      [0.9953, 10.011, -0.006],
      [1.0396, 0.305, 3.701],
      [1.0048, 8.144, 4.912],
    ]),
    timeline: createTimeline([
      [0, 480],
      [1, 650],
      [2, 320],
      [3, 420],
      [2, 320],
      [1, 360],
    ]),
  },
  super: {
    frames: createDinoFrames('super', [
      [0.9888, -7.725, 0.105],
      [1.0069, 10.324, -0.89],
      [0.9977, -1.267, 4.581],
      [1.0185, -3.979, 3.566],
    ]),
    // Resting beats keep the blink, power pose, and cape flourish readable.
    timeline: createTimeline([
      [0, 460],
      [1, 620],
      [0, 240],
      [2, 720],
      [0, 240],
      [3, 520],
    ]),
  },
}
