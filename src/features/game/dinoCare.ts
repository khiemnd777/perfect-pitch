export const DINO_CARE_STORAGE_KEY = 'perfect-pitch-dino-care'
export const DINO_HUNGRY_AFTER_MS = 30 * 60 * 1000
export const DINO_ROAR_COOLDOWN_MS = 5 * 60 * 1000

export interface DinoCareState {
  lastFedAt: number
  lastRoaredAt: number | null
}

export function createDefaultDinoCare(now = Date.now()): DinoCareState {
  return {
    lastFedAt: now,
    lastRoaredAt: null,
  }
}

function sanitizeTimestamp(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback
}

function sanitizeCare(value: unknown, now: number): DinoCareState {
  if (!value || typeof value !== 'object') {
    return createDefaultDinoCare(now)
  }

  const candidate = value as Partial<DinoCareState>
  const lastFedAt = sanitizeTimestamp(candidate.lastFedAt, now)
  const lastRoaredAt =
    candidate.lastRoaredAt === null
      ? null
      : sanitizeTimestamp(candidate.lastRoaredAt, 0) || null

  return { lastFedAt, lastRoaredAt }
}

export function isDinoHungry(care: DinoCareState, now = Date.now()) {
  return now - care.lastFedAt >= DINO_HUNGRY_AFTER_MS
}

export function shouldDinoRoar(care: DinoCareState, now = Date.now()) {
  if (!isDinoHungry(care, now)) {
    return false
  }

  return (
    care.lastRoaredAt === null || now - care.lastRoaredAt >= DINO_ROAR_COOLDOWN_MS
  )
}

export function feedDino(care: DinoCareState, now = Date.now()): DinoCareState {
  return {
    ...care,
    lastFedAt: now,
    lastRoaredAt: null,
  }
}

export function markDinoRoared(
  care: DinoCareState,
  now = Date.now(),
): DinoCareState {
  return {
    ...care,
    lastRoaredAt: now,
  }
}

export function loadDinoCare(
  storage?: Storage | null,
  now = Date.now(),
): DinoCareState {
  if (!storage) {
    return createDefaultDinoCare(now)
  }

  try {
    const raw = storage.getItem(DINO_CARE_STORAGE_KEY)
    return raw ? sanitizeCare(JSON.parse(raw), now) : createDefaultDinoCare(now)
  } catch {
    return createDefaultDinoCare(now)
  }
}

export function saveDinoCare(care: DinoCareState, storage?: Storage | null) {
  if (!storage) {
    return
  }

  try {
    storage.setItem(DINO_CARE_STORAGE_KEY, JSON.stringify(care))
  } catch {
    // Keep care state in memory if browser storage is unavailable.
  }
}
