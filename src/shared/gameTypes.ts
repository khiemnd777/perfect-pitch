import type { PitchName } from './music'

export type GameMode =
  | 'single'
  | 'double'
  | 'melody'
  | 'interval'
  | 'arpeggio'
  | 'chord'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export type QuestionId = string

export interface DifficultyConfig {
  label: string
  shortLabel: string
  helperText: string
}

export interface GameModeConfig {
  label: string
  description: string
  difficulty: Record<DifficultyLevel, DifficultyConfig>
}

export interface ModeProgress {
  currentDifficulty: DifficultyLevel
  highestUnlockedDifficulty: DifficultyLevel
  correctAnswersTowardsLevelUp: number
  incorrectStreak: number
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['easy', 'medium', 'hard']

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Dễ',
  medium: 'Vừa',
  hard: 'Khó',
}

export const GAME_MODES: GameMode[] = [
  'single',
  'double',
  'melody',
  'interval',
  'arpeggio',
  'chord',
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

export const GAME_MODE_CONFIGS: Record<GameMode, GameModeConfig> = {
  single: {
    label: 'Single Note',
    description: 'Nghe 1 nốt piano và chọn đúng tên nốt.',
    difficulty: {
      easy: {
        label: 'Dễ',
        shortLabel: '6 nốt cơ bản',
        helperText: 'Chỉ dùng 6 nốt cơ bản để làm quen màu âm của từng pitch class.',
      },
      medium: {
        label: 'Vừa',
        shortLabel: '12 bán âm',
        helperText: 'Mở đủ 12 bán âm nhưng vẫn bỏ qua octave khi trả lời.',
      },
      hard: {
        label: 'Khó',
        shortLabel: 'Nốt dễ nhầm',
        helperText: 'Ưu tiên các lựa chọn dễ nhầm để ép tai phân biệt pitch class sát nhau.',
      },
    },
  },
  double: {
    label: 'Double Note',
    description: 'Nghe 2 nốt vang cùng lúc và nhận diện đúng cặp nốt.',
    difficulty: {
      easy: {
        label: 'Dễ',
        shortLabel: 'Cặp tách xa',
        helperText: 'Bắt đầu bằng các cặp nốt cách xa nhau để nghe từng lớp âm rõ hơn.',
      },
      medium: {
        label: 'Vừa',
        shortLabel: 'Cặp bất kỳ',
        helperText: 'Mở đủ mọi cặp nốt và vẫn giữ nhãn đáp án được sắp theo thứ tự tăng dần.',
      },
      hard: {
        label: 'Khó',
        shortLabel: 'Cặp sát nhau',
        helperText: 'Tập trung vào các cặp gần nhau để tăng độ nhạy với hòa âm chồng.',
      },
    },
  },
  melody: {
    label: 'Melody',
    description: 'Nghe một motif ngắn 3-5 nốt và chọn đúng chuỗi giai điệu.',
    difficulty: {
      easy: {
        label: 'Dễ',
        shortLabel: '3 nốt',
        helperText: 'Motif ngắn 3 nốt để bám thứ tự cao độ thật nhanh.',
      },
      medium: {
        label: 'Vừa',
        shortLabel: '4 nốt',
        helperText: 'Chuỗi 4 nốt giữ timing đều để tập trung vào trí nhớ cao độ.',
      },
      hard: {
        label: 'Khó',
        shortLabel: '5 nốt',
        helperText: 'Motif 5 nốt với distractor cùng độ dài, dễ lẫn ở vị trí giữa câu.',
      },
    },
  },
  interval: {
    label: 'Interval',
    description: 'Nghe quãng và chọn đúng tên quãng theo cảm giác cao độ.',
    difficulty: {
      easy: {
        label: 'Dễ',
        shortLabel: 'Quãng cơ bản',
        helperText: 'Làm quen unison đến quãng 5 trong phạm vi 1 octave.',
      },
      medium: {
        label: 'Vừa',
        shortLabel: 'Đủ 1 octave',
        helperText: 'Mở thêm quãng 6, quãng 7 và octave nhưng vẫn nghe theo dạng melodic.',
      },
      hard: {
        label: 'Khó',
        shortLabel: 'Melodic + harmonic',
        helperText: 'Trộn quãng ngân cùng lúc và quãng đi nối tiếp để tăng khả năng phân biệt.',
      },
    },
  },
  arpeggio: {
    label: 'Arpeggio',
    description: 'Nghe mẫu rải hợp âm và nhận diện đúng màu hợp âm.',
    difficulty: {
      easy: {
        label: 'Dễ',
        shortLabel: 'Major / Minor',
        helperText: 'Rải 3 nốt đi lên để phân biệt trưởng và thứ trên nhiều root khác nhau.',
      },
      medium: {
        label: 'Vừa',
        shortLabel: 'Lên hoặc xuống',
        helperText: 'Giữ major và minor nhưng đổi hướng chạy để giảm phụ thuộc vào hình quen.',
      },
      hard: {
        label: 'Khó',
        shortLabel: '4 màu hợp âm',
        helperText: 'Thêm diminished và augmented, có thể đổi octave nhưng vẫn nằm trong dải piano hiện có.',
      },
    },
  },
  chord: {
    label: 'Chord',
    description: 'Nghe hợp âm đánh cùng lúc và chọn đúng tên hợp âm.',
    difficulty: {
      easy: {
        label: 'Dễ',
        shortLabel: 'Major / Minor',
        helperText: 'Nghe triad ở root position để phân biệt trưởng và thứ theo màu hợp âm.',
      },
      medium: {
        label: 'Vừa',
        shortLabel: 'Có đảo hợp âm',
        helperText: 'Vẫn là major và minor nhưng có thể đảo thế để bớt phụ thuộc vào hình quen.',
      },
      hard: {
        label: 'Khó',
        shortLabel: '4 màu hợp âm',
        helperText: 'Thêm diminished và augmented, đồng thời trộn root position với các thế đảo.',
      },
    },
  },
}

export const GAME_MODE_LABELS: Record<GameMode, string> = Object.fromEntries(
  GAME_MODES.map((mode) => [mode, GAME_MODE_CONFIGS[mode].label]),
) as Record<GameMode, string>
