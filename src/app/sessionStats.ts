import type { SessionStats } from '../shared/gameTypes'

const SCORE_STORAGE_KEY = 'perfect-pitch-session-stats'

export const DEFAULT_SESSION_STATS: SessionStats = {
  answered: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
}

function sanitizeCount(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0
}

function sanitizeSessionStats(value: unknown): SessionStats {
  if (!value || typeof value !== 'object') {
    return DEFAULT_SESSION_STATS
  }

  const candidate = value as Partial<SessionStats>
  const answered = sanitizeCount(candidate.answered)
  const correct = Math.min(sanitizeCount(candidate.correct), answered)
  const streak = sanitizeCount(candidate.streak)
  const bestStreak = Math.max(sanitizeCount(candidate.bestStreak), streak)

  return {
    answered,
    correct,
    streak,
    bestStreak,
  }
}

export function loadSessionStats(storage?: Storage | null): SessionStats {
  if (!storage) {
    return DEFAULT_SESSION_STATS
  }

  try {
    const raw = storage.getItem(SCORE_STORAGE_KEY)
    if (!raw) {
      return DEFAULT_SESSION_STATS
    }

    return sanitizeSessionStats(JSON.parse(raw))
  } catch {
    return DEFAULT_SESSION_STATS
  }
}

export function saveSessionStats(stats: SessionStats, storage?: Storage | null) {
  if (!storage) {
    return
  }

  try {
    storage.setItem(SCORE_STORAGE_KEY, JSON.stringify(sanitizeSessionStats(stats)))
  } catch {
    // Ignore storage failures and keep the in-memory session alive.
  }
}

export function resetSessionStats(storage?: Storage | null) {
  saveSessionStats(DEFAULT_SESSION_STATS, storage)
}

export { SCORE_STORAGE_KEY }
