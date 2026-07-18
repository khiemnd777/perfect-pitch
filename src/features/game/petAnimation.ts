import type { DinoStageId, PetId } from '../../shared/gameTypes'
import {
  DINO_ANIMATIONS,
  type DinoAnimation,
  type DinoAnimationFrame,
} from './dinoAnimation'

const PET_STAGE_IDS: readonly DinoStageId[] = [
  'egg',
  'baby',
  'young',
  'adult',
  'super',
]

function createPetFrames(
  petId: Exclude<PetId, 'dino'>,
  stageId: DinoStageId,
): readonly DinoAnimationFrame[] {
  return Array.from({ length: 4 }, (_, index) => ({
    src: `/pets/${petId}/frames-v1/${stageId}-${index + 1}.png`,
    normalizeScale: 1,
    offsetX: 0,
    offsetY: 0,
  }))
}

function createPetAnimations(
  petId: Exclude<PetId, 'dino'>,
): Record<DinoStageId, DinoAnimation> {
  return Object.fromEntries(
    PET_STAGE_IDS.map((stageId) => [
      stageId,
      {
        frames: createPetFrames(petId, stageId),
        timeline: DINO_ANIMATIONS[stageId].timeline,
      },
    ]),
  ) as Record<DinoStageId, DinoAnimation>
}

export const PET_ANIMATIONS: Record<
  PetId,
  Record<DinoStageId, DinoAnimation>
> = {
  dino: DINO_ANIMATIONS,
  cat: createPetAnimations('cat'),
  bunny: createPetAnimations('bunny'),
  fox: createPetAnimations('fox'),
  dog: createPetAnimations('dog'),
  hamster: createPetAnimations('hamster'),
  panda: createPetAnimations('panda'),
  penguin: createPetAnimations('penguin'),
  unicorn: createPetAnimations('unicorn'),
  dragon: createPetAnimations('dragon'),
  phoenix: createPetAnimations('phoenix'),
  griffin: createPetAnimations('griffin'),
  bella: createPetAnimations('bella'),
  'little-bella': createPetAnimations('little-bella'),
  andy: createPetAnimations('andy'),
}

export function getPetAnimation(petId: PetId, stageId: DinoStageId) {
  return PET_ANIMATIONS[petId][stageId]
}
