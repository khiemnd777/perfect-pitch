import type { PitchName } from './music'

export type GameMode =
  | 'single'
  | 'double'
  | 'melody'
  | 'interval'
  | 'arpeggio'
  | 'chord'
  | 'scale'
  | 'seventh'
export type DifficultyLevel =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert'
  | 'master'
export type DinoStageId = 'egg' | 'baby' | 'young' | 'adult' | 'super'

export type QuestionId = string

export interface ModeProgress {
  currentDifficulty: DifficultyLevel
  highestUnlockedDifficulty: DifficultyLevel
  correctAnswersTowardsLevelUp: number
  incorrectStreak: number
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'easy',
  'medium',
  'hard',
  'expert',
  'master',
]

export const GAME_MODES: GameMode[] = [
  'single',
  'double',
  'melody',
  'interval',
  'arpeggio',
  'chord',
  'scale',
  'seventh',
]

export interface Choice {
  id: string
  label: string
  meta: string
  isCorrect: boolean
}

export interface PlaybackEvent {
  notes: PitchName[]
  offsetMs: number
  durationMs: number
  velocity: number
}

export interface Question {
  id: QuestionId
  mode: GameMode
  difficulty: DifficultyLevel
  prompt: string
  helperText: string
  choices: Choice[]
  correctChoiceId: string
  playback: PlaybackEvent[]
}

export interface QuestionEvaluation {
  questionId: QuestionId
  selectedChoiceId: string
  correctChoiceId: string
  status: 'correct' | 'incorrect'
}

export interface RoundResult {
  questionId: QuestionId
  evaluation: QuestionEvaluation
}

export interface SessionStats {
  answered: number
  correct: number
  streak: number
  bestStreak: number
}
