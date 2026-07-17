import {
  type DifficultyLevel,
  DIFFICULTY_LEVELS,
  type DinoStageId,
  type GameMode,
  GAME_MODES,
  type SessionStats,
} from './gameTypes'

export type Language = 'en' | 'vi'
export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented'
export type SeventhQuality =
  | 'major-seventh'
  | 'dominant-seventh'
  | 'minor-seventh'
  | 'half-diminished-seventh'
  | 'diminished-seventh'
export type ScaleQuality =
  | 'major'
  | 'natural-minor'
  | 'harmonic-minor'
  | 'melodic-minor'
  | 'dorian'
  | 'mixolydian'
  | 'whole-tone'
  | 'blues'

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
  heroTitle: string
  heroBody: string
  heroModesStat: string
  heroLevelsStat: string
  heroPianoStat: string
  modeGridAriaLabel: string
  modeTag: string
  switchMode: string
  sessionStatsLabel: string
  resetScore: string
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
  footerSignature: string
  petTitle: string
  petSubtitle: string
  petPointsLabel: string
  petNextPrefix: string
  petMaxStage: string
  petHint: string
  petEvolutionLabel: string
  pointsEarned: string
  petHungryLabel: string
  petHungryMessage: string
  petTapHint: string
  petTapLabel: string
  petSoundError: string
}

interface DinoStageCopy {
  name: string
  description: string
}

export interface DinoReactionCopy {
  emoji: string
  message: string
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
        expert: {
          label: 'Expert',
          shortLabel: 'Fast attack',
          helperText: 'Use shorter notes and only neighboring pitch classes as distractors.',
        },
        master: {
          label: 'Master',
          shortLabel: 'Octave jumps',
          helperText: 'Hear the same pitch class across octave jumps with a very short attack.',
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
        expert: {
          label: 'Expert',
          shortLabel: 'Chromatic pairs',
          helperText: 'Prioritize semitone and whole-tone pairs with close answer choices.',
        },
        master: {
          label: 'Master',
          shortLabel: 'Dense voicing',
          helperText: 'Use compact chromatic pairs with shorter playback and near-match distractors.',
        },
      },
    },
    melody: {
      label: 'Melody',
      description: 'Hear a short 3-7 note motif and choose the correct sequence.',
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
        expert: {
          label: 'Expert',
          shortLabel: '6 notes + repeats',
          helperText: 'Track 6-note motifs that may repeat notes and differ at only two positions.',
        },
        master: {
          label: 'Master',
          shortLabel: '7 notes + repeats',
          helperText: 'Hold a 7-note motif in memory while distractors change just one note.',
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
        expert: {
          label: 'Expert',
          shortLabel: 'All semitones',
          helperText: 'Add the tritone and mix ascending, descending, and harmonic playback.',
        },
        master: {
          label: 'Master',
          shortLabel: 'Compound intervals',
          helperText: 'Identify ninths through twelfths across the full sampled piano range.',
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
        expert: {
          label: 'Expert',
          shortLabel: 'Long patterns',
          helperText: 'Hear up-down and zigzag patterns while answer choices share roots or qualities.',
        },
        master: {
          label: 'Master',
          shortLabel: 'Fast broken chords',
          helperText: 'Use fast extended patterns with close same-root chord-color distractors.',
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
        expert: {
          label: 'Expert',
          shortLabel: 'Close choices',
          helperText: 'Keep every triad color and favor same-root distractors across inversions.',
        },
        master: {
          label: 'Master',
          shortLabel: 'Compact voicings',
          helperText: 'Use shorter compact chords with the most confusable roots and qualities.',
        },
      },
    },
    scale: {
      label: 'Scale',
      description: 'Hear a scale pattern and identify its root and musical color.',
      prompt: 'Listen to the scale and choose the correct scale name',
      choiceMetaLabel: 'Scale',
      difficulty: {
        easy: {
          label: 'Easy',
          shortLabel: '5-note major / minor',
          helperText: 'Start with the first 5 notes of major and natural minor scales.',
        },
        medium: {
          label: 'Medium',
          shortLabel: 'Full octave',
          helperText: 'Hear complete ascending major and natural minor scales.',
        },
        hard: {
          label: 'Hard',
          shortLabel: '4 scale colors',
          helperText: 'Add harmonic and melodic minor with ascending or descending playback.',
        },
        expert: {
          label: 'Expert',
          shortLabel: 'Modes',
          helperText: 'Add Dorian and Mixolydian while close choices reuse the same root.',
        },
        master: {
          label: 'Master',
          shortLabel: '8 scale colors',
          helperText: 'Mix modes, whole-tone, and blues patterns with changing directions.',
        },
      },
    },
    seventh: {
      label: '7th Chord',
      description: 'Hear a four-note chord and identify its root and seventh quality.',
      prompt: 'Listen to the seventh chord and choose the correct chord name',
      choiceMetaLabel: 'Seventh chord',
      difficulty: {
        easy: {
          label: 'Easy',
          shortLabel: 'maj7 / m7',
          helperText: 'Separate major seventh and minor seventh chords in root position.',
        },
        medium: {
          label: 'Medium',
          shortLabel: 'Add dominant 7',
          helperText: 'Add dominant seventh and occasional first inversions.',
        },
        hard: {
          label: 'Hard',
          shortLabel: 'Half-diminished',
          helperText: 'Add half-diminished seventh and more inversions.',
        },
        expert: {
          label: 'Expert',
          shortLabel: '5 seventh colors',
          helperText: 'Add fully diminished seventh with same-root answer distractors.',
        },
        master: {
          label: 'Master',
          shortLabel: 'Dense inversions',
          helperText: 'Mix every seventh quality across compact inversions and close choices.',
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
        expert: {
          label: 'Chuyên gia',
          shortLabel: 'Âm ngắn',
          helperText: 'Nốt phát ngắn hơn và đáp án nhiễu chỉ nằm sát pitch class đúng.',
        },
        master: {
          label: 'Bậc thầy',
          shortLabel: 'Nhảy octave',
          helperText: 'Nghe cùng pitch class qua các octave với attack rất ngắn.',
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
        expert: {
          label: 'Chuyên gia',
          shortLabel: 'Cặp chromatic',
          helperText: 'Ưu tiên cặp cách nửa cung hoặc một cung với các lựa chọn rất gần nhau.',
        },
        master: {
          label: 'Bậc thầy',
          shortLabel: 'Voicing dày',
          helperText: 'Nghe cặp chromatic gọn hơn, ngắn hơn và có distractor gần trùng.',
        },
      },
    },
    melody: {
      label: 'Melody',
      description: 'Nghe một motif ngắn 3-7 nốt và chọn đúng chuỗi giai điệu.',
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
        expert: {
          label: 'Chuyên gia',
          shortLabel: '6 nốt + lặp',
          helperText: 'Theo dõi motif 6 nốt có thể lặp và chỉ khác đáp án ở hai vị trí.',
        },
        master: {
          label: 'Bậc thầy',
          shortLabel: '7 nốt + lặp',
          helperText: 'Ghi nhớ motif 7 nốt trong khi distractor chỉ đổi đúng một nốt.',
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
        expert: {
          label: 'Chuyên gia',
          shortLabel: 'Đủ bán âm',
          helperText: 'Thêm tritone và trộn cách phát đi lên, đi xuống hoặc vang cùng lúc.',
        },
        master: {
          label: 'Bậc thầy',
          shortLabel: 'Quãng kép',
          helperText: 'Nhận diện quãng 9 đến quãng 12 trên toàn dải piano mẫu.',
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
        expert: {
          label: 'Chuyên gia',
          shortLabel: 'Pattern dài',
          helperText: 'Nghe pattern lên-xuống và zigzag với đáp án dùng chung root hoặc màu hợp âm.',
        },
        master: {
          label: 'Bậc thầy',
          shortLabel: 'Rải hợp âm nhanh',
          helperText: 'Pattern dài và nhanh hơn, với distractor cùng root rất dễ nhầm.',
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
        expert: {
          label: 'Chuyên gia',
          shortLabel: 'Đáp án sát nhau',
          helperText: 'Giữ đủ màu triad và ưu tiên distractor cùng root qua nhiều thế đảo.',
        },
        master: {
          label: 'Bậc thầy',
          shortLabel: 'Voicing gọn',
          helperText: 'Nghe chord ngắn, gọn với root và màu hợp âm dễ nhầm nhất.',
        },
      },
    },
    scale: {
      label: 'Scale',
      description: 'Nghe mẫu thang âm và nhận diện root cùng màu thang âm.',
      prompt: 'Nghe thang âm và chọn đúng tên thang âm',
      choiceMetaLabel: 'Thang âm',
      difficulty: {
        easy: {
          label: 'Dễ',
          shortLabel: '5 nốt trưởng / thứ',
          helperText: 'Bắt đầu bằng 5 nốt đầu của thang major và natural minor.',
        },
        medium: {
          label: 'Vừa',
          shortLabel: 'Đủ 1 octave',
          helperText: 'Nghe trọn thang major và natural minor đi lên.',
        },
        hard: {
          label: 'Khó',
          shortLabel: '4 màu thang âm',
          helperText: 'Thêm harmonic minor, melodic minor và đổi hướng phát.',
        },
        expert: {
          label: 'Chuyên gia',
          shortLabel: 'Các mode',
          helperText: 'Thêm Dorian, Mixolydian và đáp án nhiễu dùng chung root.',
        },
        master: {
          label: 'Bậc thầy',
          shortLabel: '8 màu thang âm',
          helperText: 'Trộn mode, whole-tone và blues với hướng chạy thay đổi.',
        },
      },
    },
    seventh: {
      label: '7th Chord',
      description: 'Nghe hợp âm 4 nốt và nhận diện root cùng màu hợp âm bảy.',
      prompt: 'Nghe hợp âm bảy và chọn đúng tên hợp âm',
      choiceMetaLabel: 'Hợp âm bảy',
      difficulty: {
        easy: {
          label: 'Dễ',
          shortLabel: 'maj7 / m7',
          helperText: 'Phân biệt major seventh và minor seventh ở root position.',
        },
        medium: {
          label: 'Vừa',
          shortLabel: 'Thêm dominant 7',
          helperText: 'Thêm dominant seventh và đôi lúc có đảo một.',
        },
        hard: {
          label: 'Khó',
          shortLabel: 'Half-diminished',
          helperText: 'Thêm half-diminished seventh và nhiều thế đảo hơn.',
        },
        expert: {
          label: 'Chuyên gia',
          shortLabel: '5 màu hợp âm bảy',
          helperText: 'Thêm fully diminished seventh với distractor cùng root.',
        },
        master: {
          label: 'Bậc thầy',
          shortLabel: 'Thế đảo dày',
          helperText: 'Trộn mọi màu hợp âm bảy qua thế đảo gọn và đáp án rất sát nhau.',
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
    6: 'Tritone',
    7: 'Perfect 5th',
    8: 'Minor 6th',
    9: 'Major 6th',
    10: 'Minor 7th',
    11: 'Major 7th',
    12: 'Octave',
    13: 'Minor 9th',
    14: 'Major 9th',
    15: 'Minor 10th',
    16: 'Major 10th',
    17: 'Perfect 11th',
    18: 'Augmented 11th',
    19: 'Perfect 12th',
  },
  vi: {
    0: 'Đồng âm',
    1: 'Quãng 2 thứ',
    2: 'Quãng 2 trưởng',
    3: 'Quãng 3 thứ',
    4: 'Quãng 3 trưởng',
    5: 'Quãng 4 đúng',
    6: 'Tritone',
    7: 'Quãng 5 đúng',
    8: 'Quãng 6 thứ',
    9: 'Quãng 6 trưởng',
    10: 'Quãng 7 thứ',
    11: 'Quãng 7 trưởng',
    12: 'Quãng 8 đúng',
    13: 'Quãng 9 thứ',
    14: 'Quãng 9 trưởng',
    15: 'Quãng 10 thứ',
    16: 'Quãng 10 trưởng',
    17: 'Quãng 11 đúng',
    18: 'Quãng 11 tăng',
    19: 'Quãng 12 đúng',
  },
}

const APP_COPY: Record<Language, AppCopy> = {
  en: {
    heroTitle: 'Listen, play & grow your dino!',
    heroBody:
      'Hear real piano sounds, choose the answer, and collect music notes. Every correct answer helps your tiny dino hatch, grow, and become a super hero!',
    heroModesStat: `${GAME_MODES.length} modes`,
    heroLevelsStat: `${DIFFICULTY_LEVELS.length} levels`,
    heroPianoStat: 'Salamander piano',
    modeGridAriaLabel: 'Choose game mode',
    modeTag: 'Mode',
    switchMode: 'Switch mode',
    sessionStatsLabel: 'Session stats',
    resetScore: 'Reset score',
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
    footerSignature: 'For Son. By Father',
    petTitle: 'Your music buddy',
    petSubtitle: 'Every correct answer helps your dino grow.',
    petPointsLabel: 'music notes',
    petNextPrefix: 'Next evolution in',
    petMaxStage: 'Maximum evolution unlocked!',
    petHint: 'Get 10 music notes for every correct answer.',
    petEvolutionLabel: 'Dinosaur evolution journey',
    pointsEarned: '+10 music notes for your dino!',
    petHungryLabel: 'Hungry!',
    petHungryMessage: 'Rawr... I miss music! Get one answer right to feed me.',
    petTapHint: 'Tap your dino to see how it feels.',
    petTapLabel: 'Tap the dinosaur for a reaction',
    petSoundError: 'Dino voice is sleeping. Tap again to retry.',
  },
  vi: {
    heroTitle: 'Nghe thật hay, nuôi khủng long lớn!',
    heroBody:
      'Nghe tiếng piano thật, chọn đáp án và sưu tập nốt nhạc. Mỗi câu đúng sẽ giúp khủng long nở trứng, lớn lên và trở thành siêu nhân!',
    heroModesStat: `${GAME_MODES.length} chế độ`,
    heroLevelsStat: `${DIFFICULTY_LEVELS.length} cấp độ`,
    heroPianoStat: 'Piano Salamander',
    modeGridAriaLabel: 'Chọn chế độ chơi',
    modeTag: 'Mode',
    switchMode: 'Đổi mode',
    sessionStatsLabel: 'Thống kê phiên chơi',
    resetScore: 'Reset điểm',
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
    footerSignature: 'For Son. By Father',
    petTitle: 'Bạn khủng long âm nhạc',
    petSubtitle: 'Mỗi câu đúng sẽ giúp khủng long lớn thêm.',
    petPointsLabel: 'nốt nhạc',
    petNextPrefix: 'Còn lại để tiến hóa',
    petMaxStage: 'Đã mở khóa tiến hóa tối đa!',
    petHint: 'Mỗi câu đúng nhận 10 nốt nhạc.',
    petEvolutionLabel: 'Hành trình tiến hóa của khủng long',
    pointsEarned: '+10 nốt nhạc cho khủng long!',
    petHungryLabel: 'Đang đói!',
    petHungryMessage: 'Rawr... mình nhớ âm nhạc! Trả lời đúng một câu để cho mình ăn nhé.',
    petTapHint: 'Tap vào khủng long để xem bạn ấy đang cảm thấy gì.',
    petTapLabel: 'Tap vào khủng long để xem biểu cảm',
    petSoundError: 'Giọng khủng long đang ngủ. Tap lại để thử nhé.',
  },
}

const DINO_STAGE_COPY: Record<Language, Record<DinoStageId, DinoStageCopy>> = {
  en: {
    egg: {
      name: 'Dino Egg',
      description: 'A tiny friend is waiting for enough music to hatch!',
    },
    baby: {
      name: 'Baby Dino',
      description: 'Hatched! Your curious baby loves every note you play.',
    },
    young: {
      name: 'Young Dino',
      description: 'Growing fast and starting a musical adventure.',
    },
    adult: {
      name: 'Cute Adult Dino',
      description: 'Confident, clever, and ready for harder listening games.',
    },
    super: {
      name: 'Super Dino',
      description: 'Cute, strong, and powered up by your amazing ears!',
    },
  },
  vi: {
    egg: {
      name: 'Trứng khủng long',
      description: 'Một người bạn nhỏ đang chờ đủ âm nhạc để nở!',
    },
    baby: {
      name: 'Khủng long baby',
      description: 'Nở rồi! Bạn baby tò mò rất thích những nốt nhạc của bạn.',
    },
    young: {
      name: 'Khủng long con',
      description: 'Đang lớn thật nhanh và bắt đầu chuyến phiêu lưu âm nhạc.',
    },
    adult: {
      name: 'Khủng long trưởng thành',
      description: 'Dễ thương, tự tin và sẵn sàng nghe những thử thách khó hơn.',
    },
    super: {
      name: 'Khủng long siêu nhân',
      description: 'Vừa dễ thương vừa mạnh mẽ nhờ đôi tai siêu cấp của bạn!',
    },
  },
}

const DINO_REACTION_COPY: Record<
  Language,
  Record<DinoStageId, DinoReactionCopy[]>
> = {
  en: {
    egg: [
      { emoji: '🥚', message: 'Knock knock... I can hear you!' },
      { emoji: '🎵', message: 'More music, please!' },
      { emoji: '✨', message: 'I am almost ready to hatch!' },
    ],
    baby: [
      { emoji: '🥰', message: 'A tiny dino hug!' },
      { emoji: '🎶', message: 'That note made me happy!' },
      { emoji: '😋', message: 'Music notes are yummy!' },
    ],
    young: [
      { emoji: '🤩', message: 'Let’s play another round!' },
      { emoji: '💃', message: 'Look at my dino dance!' },
      { emoji: '🎧', message: 'Your ears are getting stronger!' },
    ],
    adult: [
      { emoji: '😎', message: 'Ready for a harder challenge?' },
      { emoji: '💚', message: 'I am proud of you!' },
      { emoji: '🎹', message: 'Keep the piano music coming!' },
    ],
    super: [
      { emoji: '🦸', message: 'Super hearing power activated!' },
      { emoji: '⚡', message: 'We make a mighty music team!' },
      { emoji: '🌟', message: 'You are a pitch hero!' },
    ],
  },
  vi: {
    egg: [
      { emoji: '🥚', message: 'Cốc cốc... mình nghe thấy bạn rồi!' },
      { emoji: '🎵', message: 'Cho mình nghe thêm nhạc nhé!' },
      { emoji: '✨', message: 'Mình sắp nở rồi!' },
    ],
    baby: [
      { emoji: '🥰', message: 'Ôm khủng long baby một cái nào!' },
      { emoji: '🎶', message: 'Nốt nhạc đó làm mình vui quá!' },
      { emoji: '😋', message: 'Nốt nhạc ngon tuyệt!' },
    ],
    young: [
      { emoji: '🤩', message: 'Chơi thêm một câu nữa nhé!' },
      { emoji: '💃', message: 'Xem mình nhảy điệu khủng long nè!' },
      { emoji: '🎧', message: 'Đôi tai của bạn mạnh hơn rồi!' },
    ],
    adult: [
      { emoji: '😎', message: 'Sẵn sàng thử câu khó hơn chưa?' },
      { emoji: '💚', message: 'Mình tự hào về bạn lắm!' },
      { emoji: '🎹', message: 'Chơi thêm tiếng piano nhé!' },
    ],
    super: [
      { emoji: '🦸', message: 'Kích hoạt sức mạnh siêu thính giác!' },
      { emoji: '⚡', message: 'Chúng mình là đội âm nhạc siêu mạnh!' },
      { emoji: '🌟', message: 'Bạn là siêu anh hùng cảm âm!' },
    ],
  },
}

const HUNGRY_REACTION_COPY: Record<Language, DinoReactionCopy[]> = {
  en: [
    { emoji: '🥺', message: 'Rawr... my tummy needs music!' },
    { emoji: '🍽️', message: 'One correct answer will feed me!' },
    { emoji: '😴', message: 'I miss playing with you.' },
  ],
  vi: [
    { emoji: '🥺', message: 'Rawr... bụng mình cần nốt nhạc!' },
    { emoji: '🍽️', message: 'Trả lời đúng một câu để cho mình ăn nhé!' },
    { emoji: '😴', message: 'Mình nhớ được chơi cùng bạn.' },
  ],
}

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'vi'
}

export function getAppCopy(language: Language) {
  return APP_COPY[language]
}

export function getDinoStageCopy(language: Language, stage: DinoStageId) {
  return DINO_STAGE_COPY[language][stage]
}

export function getDinoReactions(
  language: Language,
  stage: DinoStageId,
  hungry: boolean,
) {
  return hungry ? HUNGRY_REACTION_COPY[language] : DINO_REACTION_COPY[language][stage]
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

export function formatSeventhChordLabel(root: string, quality: SeventhQuality) {
  switch (quality) {
    case 'major-seventh':
      return `${root}maj7`
    case 'dominant-seventh':
      return `${root}7`
    case 'minor-seventh':
      return `${root}m7`
    case 'half-diminished-seventh':
      return `${root}m7♭5`
    case 'diminished-seventh':
      return `${root}dim7`
  }
}

const SCALE_QUALITY_LABELS: Record<Language, Record<ScaleQuality, string>> = {
  en: {
    major: 'major',
    'natural-minor': 'natural minor',
    'harmonic-minor': 'harmonic minor',
    'melodic-minor': 'melodic minor',
    dorian: 'Dorian',
    mixolydian: 'Mixolydian',
    'whole-tone': 'whole-tone',
    blues: 'blues',
  },
  vi: {
    major: 'trưởng',
    'natural-minor': 'thứ tự nhiên',
    'harmonic-minor': 'thứ hòa thanh',
    'melodic-minor': 'thứ giai điệu',
    dorian: 'Dorian',
    mixolydian: 'Mixolydian',
    'whole-tone': 'toàn cung',
    blues: 'blues',
  },
}

export function formatScaleLabel(
  language: Language,
  root: string,
  quality: ScaleQuality,
) {
  return `${root} ${SCALE_QUALITY_LABELS[language][quality]}`
}

export function translateScaleLabel(label: string, language: Language) {
  const match = label.match(/^([A-G]#?) (.+)$/)
  if (!match) {
    return label
  }

  const [, root, qualityLabel] = match
  const quality = (Object.keys(SCALE_QUALITY_LABELS.en) as ScaleQuality[]).find(
    (candidate) =>
      SCALE_QUALITY_LABELS.en[candidate] === qualityLabel ||
      SCALE_QUALITY_LABELS.vi[candidate] === qualityLabel,
  )

  return quality ? formatScaleLabel(language, root, quality) : label
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
