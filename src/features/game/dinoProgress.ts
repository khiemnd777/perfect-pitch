import type { DinoStageId } from '../../shared/gameTypes'

export const DINO_POINTS_PER_CORRECT = 10
export const DINO_PROGRESS_STORAGE_KEY = 'perfect-pitch-dino-progress'

export interface DinoStage {
  id: DinoStageId
  minimumPoints: number
}

export interface DinoProgressState {
  points: number
}

export interface DinoEvolutionProgress {
  stage: DinoStage
  stageIndex: number
  nextStage: DinoStage | null
  pointsToNextStage: number
  progressPercent: number
}

export const DINO_STAGES: readonly DinoStage[] = [
  { id: 'egg', minimumPoints: 0 },
  { id: 'baby', minimumPoints: 50 },
  { id: 'young', minimumPoints: 200 },
  { id: 'adult', minimumPoints: 500 },
  { id: 'super', minimumPoints: 900 },
]

export const DEFAULT_DINO_PROGRESS: DinoProgressState = { points: 0 }

function sanitizePoints(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0
}

function sanitizeProgress(value: unknown): DinoProgressState {
  if (!value || typeof value !== 'object') {
    return DEFAULT_DINO_PROGRESS
  }

  return {
    points: sanitizePoints((value as Partial<DinoProgressState>).points),
  }
}

export function getDinoEvolution(points: number): DinoEvolutionProgress {
  const safePoints = sanitizePoints(points)
  let stageIndex = 0

  for (let index = DINO_STAGES.length - 1; index >= 0; index -= 1) {
    if (safePoints >= DINO_STAGES[index].minimumPoints) {
      stageIndex = index
      break
    }
  }

  const stage = DINO_STAGES[stageIndex]
  const nextStage = DINO_STAGES[stageIndex + 1] ?? null

  if (!nextStage) {
    return {
      stage,
      stageIndex,
      nextStage: null,
      pointsToNextStage: 0,
      progressPercent: 100,
    }
  }

  const stageRange = nextStage.minimumPoints - stage.minimumPoints
  const pointsInStage = safePoints - stage.minimumPoints

  return {
    stage,
    stageIndex,
    nextStage,
    pointsToNextStage: nextStage.minimumPoints - safePoints,
    progressPercent: Math.min(100, Math.round((pointsInStage / stageRange) * 100)),
  }
}

export function loadDinoProgress(storage?: Storage | null): DinoProgressState {
  if (!storage) {
    return DEFAULT_DINO_PROGRESS
  }

  try {
    const raw = storage.getItem(DINO_PROGRESS_STORAGE_KEY)
    return raw ? sanitizeProgress(JSON.parse(raw)) : DEFAULT_DINO_PROGRESS
  } catch {
    return DEFAULT_DINO_PROGRESS
  }
}

export function saveDinoProgress(
  progress: DinoProgressState,
  storage?: Storage | null,
) {
  if (!storage) {
    return
  }

  try {
    storage.setItem(DINO_PROGRESS_STORAGE_KEY, JSON.stringify(sanitizeProgress(progress)))
  } catch {
    // Keep the in-memory pet progress alive when storage is unavailable.
  }
}
