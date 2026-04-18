import {
  type DifficultyLevel,
  DIFFICULTY_LEVELS,
  type GameMode,
  GAME_MODES,
  type SessionStats,
} from './gameTypes'

export type Language = 'en' | 'vi'
export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented'

export interface DifficultyCopy {
  label: string
  shortLabel: string
  helperText: string
}

export interface ModeCopy {
  label: string
  description: string
  prompt: string
  choiceMetaLabel: string
  difficulty: Record<DifficultyLevel, DifficultyCopy>
}

interface AppCopy {
  bootLoadingTitle: string
  bootErrorTitle: string
  bootLoadingBody: string
  bootLoadingStatus: string
  bootRetryStatus: string
  bootRetryButton: string
  bootLoadError: string
  heroTitle: string
  heroBody: string
  heroModesStat: string
  heroLevelsStat: string
  heroPianoStat: string
  modeGridAriaLabel: string
  modeTag: string
  switchMode: string
  sessionStatsLabel: string
  currentQuestion: string
  loadingAudio: string
  playQuestion: string
  replayQuestion: string
  audioTip: string
  correct: string
  incorrect: string
  nextQuestion: string
  correctAnswerPrefix: string
  languageLabel: string
  languageEnglish: string
  languageVietnamese: string
}

const MODE_COPY: Record<Language, Record<GameMode, ModeCopy>> = {
  en: {
    single: {
      label: 'Single Note',
      description: 'Hear one piano note and pick the correct note name.',
      prompt: 'Listen to one note and choose the correct note name',
      choiceMetaLabel: 'Note name',
      difficulty: {
        easy: {
          label: 'Easy',
          shortLabel: '6 core notes',
          helperText: 'Use 6 core notes to get familiar with each pitch class color.',
        },
        medium: {
          label: 'Medium',
          shortLabel: '12 semitones',
          helperText: 'Open all 12 semitones while still answering by pitch class only.',
        },
        hard: {
          label: 'Hard',
          shortLabel: 'Confusing notes',
          helperText: 'Bias toward close distractors to force cleaner pitch-class separation.',
        },
      },
    },
    double: {
      label: 'Double Note',
      description: 'Hear two notes together and identify the correct note pair.',
      prompt: 'Listen to two notes together and choose the correct pair',
      choiceMetaLabel: 'Note pair',
      difficulty: {
        easy: {
          label: 'Easy',
          shortLabel: 'Wide pairs',
          helperText: 'Start with wider note pairs so each layer is easier to hear.',
        },
        medium: {
          label: 'Medium',
          shortLabel: 'Any pair',
          helperText: 'Open every note pair while keeping answer labels sorted in ascending order.',
        },
        hard: {
          label: 'Hard',
          shortLabel: 'Tight pairs',
          helperText: 'Focus on close pairs to sharpen stacked-harmony perception.',
        },
      },
    },
    melody: {
      label: 'Melody',
      description: 'Hear a short 3-5 note motif and choose the correct sequence.',
      prompt: 'Listen to a short motif and choose the correct note sequence',
      choiceMetaLabel: 'Motif',
      difficulty: {
        easy: {
          label: 'Easy',
          shortLabel: '3 notes',
          helperText: 'Use short 3-note motifs to lock onto pitch order quickly.',
        },
        medium: {
          label: 'Medium',
          shortLabel: '4 notes',
          helperText: 'Use 4-note sequences with even timing to focus on pitch memory.',
        },
        hard: {
          label: 'Hard',
          shortLabel: '5 notes',
          helperText: 'Use 5-note motifs with same-length distractors that blur in the middle.',
        },
      },
    },
    interval: {
      label: 'Interval',
      description: 'Hear an interval and choose the interval name by ear.',
      prompt: 'Listen to the interval and choose the correct interval name',
      choiceMetaLabel: 'Interval',
      difficulty: {
        easy: {
          label: 'Easy',
          shortLabel: 'Core intervals',
          helperText: 'Start with unison through fifth within one octave.',
        },
        medium: {
          label: 'Medium',
          shortLabel: 'Full octave',
          helperText: 'Add sixths, sevenths, and octaves while staying melodic.',
        },
        hard: {
          label: 'Hard',
          shortLabel: 'Melodic + harmonic',
          helperText: 'Mix stacked and melodic intervals to improve separation by ear.',
        },
      },
    },
    arpeggio: {
      label: 'Arpeggio',
      description: 'Hear a broken chord pattern and identify the chord color.',
      prompt: 'Listen to the broken chord pattern and choose the chord color',
      choiceMetaLabel: 'Arpeggio',
      difficulty: {
        easy: {
          label: 'Easy',
          shortLabel: 'Major / Minor',
          helperText: 'Use rising triads to separate major and minor across different roots.',
        },
        medium: {
          label: 'Medium',
          shortLabel: 'Up or down',
          helperText: 'Keep major and minor but reverse direction to reduce shape memorization.',
        },
        hard: {
          label: 'Hard',
          shortLabel: '4 chord colors',
          helperText: 'Add diminished and augmented, with octave shifts still inside the current piano range.',
        },
      },
    },
    chord: {
      label: 'Chord',
      description: 'Hear a chord played together and choose the correct chord name.',
      prompt: 'Listen to the chord and choose the correct chord name',
      choiceMetaLabel: 'Chord',
      difficulty: {
        easy: {
          label: 'Easy',
          shortLabel: 'Major / Minor',
          helperText: 'Use root-position triads to separate major and minor by color.',
        },
        medium: {
          label: 'Medium',
          shortLabel: 'With inversions',
          helperText: 'Keep major and minor but include inversions to reduce shape dependence.',
        },
        hard: {
          label: 'Hard',
          shortLabel: '4 chord colors',
          helperText: 'Add diminished and augmented while mixing root position and inversions.',
        },
      },
    },
  },
  vi: {
    single: {
      label: 'Single Note',
      description: 'Nghe 1 nốt piano và chọn đúng tên nốt.',
      prompt: 'Nghe một nốt và chọn đúng tên nốt',
      choiceMetaLabel: 'Tên nốt',
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
      prompt: 'Nghe hai nốt vang cùng lúc và chọn đúng cặp nốt',
      choiceMetaLabel: 'Cặp nốt',
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
      prompt: 'Nghe motif ngắn và chọn đúng chuỗi nốt',
      choiceMetaLabel: 'Motif',
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
      prompt: 'Nghe quãng và chọn đúng tên quãng',
      choiceMetaLabel: 'Quãng',
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
      prompt: 'Nghe mẫu rải hợp âm và chọn đúng màu hợp âm',
      choiceMetaLabel: 'Mẫu rải',
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
      prompt: 'Nghe hợp âm đánh cùng lúc và chọn đúng tên hợp âm',
      choiceMetaLabel: 'Hợp âm',
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
  },
}

const INTERVAL_LABELS: Record<Language, Record<number, string>> = {
  en: {
    0: 'Unison',
    1: 'Minor 2nd',
    2: 'Major 2nd',
    3: 'Minor 3rd',
    4: 'Major 3rd',
    5: 'Perfect 4th',
    7: 'Perfect 5th',
    8: 'Minor 6th',
    9: 'Major 6th',
    10: 'Minor 7th',
    11: 'Major 7th',
    12: 'Octave',
  },
  vi: {
    0: 'Đồng âm',
    1: 'Quãng 2 thứ',
    2: 'Quãng 2 trưởng',
    3: 'Quãng 3 thứ',
    4: 'Quãng 3 trưởng',
    5: 'Quãng 4 đúng',
    7: 'Quãng 5 đúng',
    8: 'Quãng 6 thứ',
    9: 'Quãng 6 trưởng',
    10: 'Quãng 7 thứ',
    11: 'Quãng 7 trưởng',
    12: 'Quãng 8 đúng',
  },
}

const APP_COPY: Record<Language, AppCopy> = {
  en: {
    bootLoadingTitle: 'Loading piano',
    bootErrorTitle: 'Piano failed to load',
    bootLoadingBody: 'The app is preloading all piano assets before opening the training screen.',
    bootLoadingStatus: 'Please wait. The page will open after loading finishes.',
    bootRetryStatus: 'You can try preloading the piano assets again.',
    bootRetryButton: 'Try again',
    bootLoadError: 'Unable to load the piano. Please try again.',
    heroTitle: 'Train your ear with a real piano',
    heroBody:
      'Practice with 6 listening modes: single note, double note, melody, interval, arpeggio, and chord. Each round has 4 answers, grades instantly, and adjusts difficulty automatically.',
    heroModesStat: `${GAME_MODES.length} modes`,
    heroLevelsStat: `${DIFFICULTY_LEVELS.length} levels`,
    heroPianoStat: 'Salamander piano',
    modeGridAriaLabel: 'Choose game mode',
    modeTag: 'Mode',
    switchMode: 'Switch mode',
    sessionStatsLabel: 'Session stats',
    currentQuestion: 'Current question',
    loadingAudio: 'Loading piano...',
    playQuestion: 'Enable piano and play',
    replayQuestion: 'Replay',
    audioTip: 'Tip: the first playback unlocks Web Audio after a user gesture.',
    correct: 'Correct',
    incorrect: 'Not quite',
    nextQuestion: 'Next question',
    correctAnswerPrefix: 'Correct answer:',
    languageLabel: 'Language',
    languageEnglish: 'English',
    languageVietnamese: 'Vietnamese',
  },
  vi: {
    bootLoadingTitle: 'Đang nạp piano',
    bootErrorTitle: 'Nạp piano thất bại',
    bootLoadingBody: 'Ứng dụng đang preload toàn bộ asset piano trước khi mở màn chơi.',
    bootLoadingStatus: 'Vui lòng chờ, trang sẽ mở sau khi nạp xong.',
    bootRetryStatus: 'Bạn có thể thử preload lại asset piano.',
    bootRetryButton: 'Thử nạp lại',
    bootLoadError: 'Không thể nạp piano. Hãy thử lại.',
    heroTitle: 'Kiểm tra tai nghe nốt bằng piano thật',
    heroBody:
      'Luyện cảm âm với 6 mode nghe: nốt đơn, cặp nốt, giai điệu, quãng, arpeggio và chord. Mỗi câu có 4 đáp án, chấm ngay sau khi bấm và tự tăng độ khó theo phong độ.',
    heroModesStat: `${GAME_MODES.length} chế độ`,
    heroLevelsStat: `${DIFFICULTY_LEVELS.length} cấp độ`,
    heroPianoStat: 'Piano Salamander',
    modeGridAriaLabel: 'Chọn chế độ chơi',
    modeTag: 'Mode',
    switchMode: 'Đổi mode',
    sessionStatsLabel: 'Thống kê phiên chơi',
    currentQuestion: 'Câu hiện tại',
    loadingAudio: 'Đang nạp piano...',
    playQuestion: 'Bật piano và phát',
    replayQuestion: 'Phát lại',
    audioTip: 'Mẹo: lần phát đầu sẽ kích hoạt Web Audio theo thao tác người dùng.',
    correct: 'Chính xác',
    incorrect: 'Chưa đúng',
    nextQuestion: 'Câu tiếp theo',
    correctAnswerPrefix: 'Đáp án đúng là',
    languageLabel: 'Ngôn ngữ',
    languageEnglish: 'Tiếng Anh',
    languageVietnamese: 'Tiếng Việt',
  },
}

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'vi'
}

export function getAppCopy(language: Language) {
  return APP_COPY[language]
}

export function getModeCopy(language: Language, mode: GameMode) {
  return MODE_COPY[language][mode]
}

export function getDifficultyLabel(language: Language, difficulty: DifficultyLevel) {
  return MODE_COPY[language].single.difficulty[difficulty].label
}

export function getDifficultyCopy(
  language: Language,
  mode: GameMode,
  difficulty: DifficultyLevel,
) {
  return MODE_COPY[language][mode].difficulty[difficulty]
}

export function getIntervalLabel(language: Language, semitones: number) {
  return INTERVAL_LABELS[language][semitones] ?? `${semitones}`
}

export function translateIntervalLabel(label: string, language: Language) {
  const semitones = Object.entries(INTERVAL_LABELS.en).find(([, value]) => value === label)?.[0]
    ?? Object.entries(INTERVAL_LABELS.vi).find(([, value]) => value === label)?.[0]

  return semitones ? getIntervalLabel(language, Number(semitones)) : label
}

export function formatChoiceMeta(language: Language, mode: GameMode, label: string) {
  return `${MODE_COPY[language][mode].choiceMetaLabel}: ${label}`
}

function formatTriadQualitySuffix(quality: TriadQuality) {
  switch (quality) {
    case 'major':
      return ''
    case 'minor':
      return 'm'
    case 'diminished':
      return 'dim'
    case 'augmented':
      return 'aug'
  }
}

export function formatArpeggioLabel(root: string, quality: TriadQuality) {
  return `${root}${formatTriadQualitySuffix(quality)}`
}

export function formatChordLabel(root: string, quality: TriadQuality) {
  return `${root}${formatTriadQualitySuffix(quality)}`
}

export function getLevelUpNotice(language: Language, difficulty: DifficultyLevel) {
  return language === 'en'
    ? `Moved up to ${getDifficultyLabel(language, difficulty)}.`
    : `Đã tăng lên mức ${getDifficultyLabel(language, difficulty)}.`
}

export function getLevelDownNotice(language: Language, difficulty: DifficultyLevel) {
  return language === 'en'
    ? `Moved down to ${getDifficultyLabel(language, difficulty)} to stabilize.`
    : `Hạ về mức ${getDifficultyLabel(language, difficulty)} để ổn định lại.`
}

export function formatSessionStats(language: Language, stats: SessionStats, accuracy: number) {
  if (language === 'en') {
    return [
      `${stats.correct}/${stats.answered} correct`,
      `${accuracy}% accuracy`,
      `Streak ${stats.streak}`,
    ]
  }

  return [
    `${stats.correct}/${stats.answered} đúng`,
    `${accuracy}% chính xác`,
    `Streak ${stats.streak}`,
  ]
}
