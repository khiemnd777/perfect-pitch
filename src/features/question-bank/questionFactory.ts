import {
  NOTE_NAMES,
  PITCHES,
  createPitchPoolByNoteName,
  formatArpeggioLabel,
  formatChoiceMeta,
  formatIntervalLabel,
  formatMelodyLabel,
  formatPairLabel,
  getRandomPitchForNoteName,
  pitchToNoteName,
  sortNoteNames,
  type NoteName,
  type PitchName,
} from '../../shared/music'
import {
  GAME_MODE_CONFIGS,
  type Choice,
  type DifficultyLevel,
  type GameMode,
  type PlaybackEvent,
  type Question,
} from '../../shared/gameTypes'
import {
  createSeededRandom,
  pickOne,
  sampleWithoutReplacement,
  shuffle,
} from '../../shared/random'

export interface QuestionFactory {
  createQuestion(mode: GameMode, difficulty: DifficultyLevel, seed?: string): Question
}

interface IntervalSpec {
  label: string
  semitones: number
}

interface ArpeggioSpec {
  label: string
  intervals: [number, number, number]
}

const pitchPoolByNoteName = createPitchPoolByNoteName(PITCHES)
const BASIC_SINGLE_NOTES: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A']
const HARD_SINGLE_CLUSTERS: NoteName[][] = [
  ['C', 'C#', 'D'],
  ['D#', 'E', 'F'],
  ['F', 'F#', 'G'],
  ['G#', 'A', 'A#'],
]

const INTERVAL_SPECS: Record<DifficultyLevel, IntervalSpec[]> = {
  easy: [
    { label: 'Đồng âm', semitones: 0 },
    { label: 'Quãng 2 thứ', semitones: 1 },
    { label: 'Quãng 2 trưởng', semitones: 2 },
    { label: 'Quãng 3 thứ', semitones: 3 },
    { label: 'Quãng 3 trưởng', semitones: 4 },
    { label: 'Quãng 4 đúng', semitones: 5 },
    { label: 'Quãng 5 đúng', semitones: 7 },
  ],
  medium: [
    { label: 'Đồng âm', semitones: 0 },
    { label: 'Quãng 2 thứ', semitones: 1 },
    { label: 'Quãng 2 trưởng', semitones: 2 },
    { label: 'Quãng 3 thứ', semitones: 3 },
    { label: 'Quãng 3 trưởng', semitones: 4 },
    { label: 'Quãng 4 đúng', semitones: 5 },
    { label: 'Quãng 5 đúng', semitones: 7 },
    { label: 'Quãng 6 thứ', semitones: 8 },
    { label: 'Quãng 6 trưởng', semitones: 9 },
    { label: 'Quãng 7 thứ', semitones: 10 },
    { label: 'Quãng 7 trưởng', semitones: 11 },
    { label: 'Quãng 8 đúng', semitones: 12 },
  ],
  hard: [
    { label: 'Đồng âm', semitones: 0 },
    { label: 'Quãng 2 thứ', semitones: 1 },
    { label: 'Quãng 2 trưởng', semitones: 2 },
    { label: 'Quãng 3 thứ', semitones: 3 },
    { label: 'Quãng 3 trưởng', semitones: 4 },
    { label: 'Quãng 4 đúng', semitones: 5 },
    { label: 'Quãng 5 đúng', semitones: 7 },
    { label: 'Quãng 6 thứ', semitones: 8 },
    { label: 'Quãng 6 trưởng', semitones: 9 },
    { label: 'Quãng 7 thứ', semitones: 10 },
    { label: 'Quãng 7 trưởng', semitones: 11 },
    { label: 'Quãng 8 đúng', semitones: 12 },
  ],
}

const ARPEGGIO_SPECS: Record<DifficultyLevel, ArpeggioSpec[]> = {
  easy: [
    { label: 'trưởng', intervals: [0, 4, 7] },
    { label: 'thứ', intervals: [0, 3, 7] },
  ],
  medium: [
    { label: 'trưởng', intervals: [0, 4, 7] },
    { label: 'thứ', intervals: [0, 3, 7] },
  ],
  hard: [
    { label: 'trưởng', intervals: [0, 4, 7] },
    { label: 'thứ', intervals: [0, 3, 7] },
    { label: 'giảm', intervals: [0, 3, 6] },
    { label: 'tăng', intervals: [0, 4, 8] },
  ],
}

function createId(prefix: string, random: () => number) {
  return `${prefix}-${Math.round(random() * 1_000_000_000).toString(36)}`
}

function uniqueChoiceId(label: string) {
  return label.toLowerCase().replaceAll(/[^a-z0-9#]+/g, '-')
}

function withCorrectChoice(choices: Choice[], correctChoiceId: string): Choice[] {
  return choices.map((choice) => ({
    ...choice,
    isCorrect: choice.id === correctChoiceId,
  }))
}

function createChoiceSet(mode: GameMode, labels: string[], correctChoiceId: string): Choice[] {
  return withCorrectChoice(
    labels.map((label) => ({
      id: uniqueChoiceId(label),
      label,
      meta: formatChoiceMeta(mode, label),
      isCorrect: false,
    })),
    correctChoiceId,
  )
}

function createPlayback(
  notes: PitchName[],
  staggerMs: number,
  durationMs: number,
  velocity: number,
): PlaybackEvent[] {
  return notes.map((note, index) => ({
    notes: [note],
    offsetMs: index * staggerMs,
    durationMs,
    velocity,
  }))
}

function circularDistance(left: NoteName, right: NoteName) {
  const leftIndex = NOTE_NAMES.indexOf(left)
  const rightIndex = NOTE_NAMES.indexOf(right)
  const rawDistance = Math.abs(leftIndex - rightIndex)
  return Math.min(rawDistance, NOTE_NAMES.length - rawDistance)
}

function sampleUniqueByFilter(
  pool: readonly NoteName[],
  count: number,
  random: () => number,
  predicate: (note: NoteName) => boolean,
) {
  const candidates = pool.filter(predicate)
  const source = candidates.length >= count ? candidates : pool
  return sampleWithoutReplacement(source, count, random)
}

function createSingleQuestion(difficulty: DifficultyLevel, random: () => number): Question {
  const notePool = difficulty === 'easy' ? BASIC_SINGLE_NOTES : NOTE_NAMES
  const correctNote =
    difficulty === 'hard'
      ? pickOne(pickOne(HARD_SINGLE_CLUSTERS, random), random)
      : pickOne(notePool, random)
  const correctPitch = getRandomPitchForNoteName(pitchPoolByNoteName, correctNote, random)
  const distractors =
    difficulty === 'easy'
      ? sampleUniqueByFilter(notePool, 3, random, (note) =>
          note !== correctNote && circularDistance(note, correctNote) >= 2,
        )
      : difficulty === 'hard'
        ? sampleUniqueByFilter(NOTE_NAMES, 3, random, (note) =>
            note !== correctNote && circularDistance(note, correctNote) <= 2,
          )
        : sampleWithoutReplacement(
            NOTE_NAMES.filter((note) => note !== correctNote),
            3,
            random,
          )
  const labels = shuffle([correctNote, ...distractors], random)
  const correctChoiceId = uniqueChoiceId(correctNote)

  return {
    id: createId('single', random),
    mode: 'single',
    difficulty,
    prompt: 'Nghe một nốt và chọn đúng tên nốt',
    helperText: GAME_MODE_CONFIGS.single.difficulty[difficulty].helperText,
    correctChoiceId,
    choices: createChoiceSet('single', labels, correctChoiceId),
    playback: [
      {
        notes: [correctPitch],
        offsetMs: 0,
        durationMs: difficulty === 'hard' ? 1350 : 1500,
        velocity: 0.72,
      },
    ],
  }
}

function createNotePairs(minDistance: number, maxDistance: number) {
  const pairs: NoteName[][] = []

  for (let leftIndex = 0; leftIndex < NOTE_NAMES.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < NOTE_NAMES.length; rightIndex += 1) {
      const pair = [NOTE_NAMES[leftIndex], NOTE_NAMES[rightIndex]] as NoteName[]
      const distance = rightIndex - leftIndex

      if (distance >= minDistance && distance <= maxDistance) {
        pairs.push(pair)
      }
    }
  }

  return pairs
}

const DOUBLE_PAIR_POOLS: Record<DifficultyLevel, NoteName[][]> = {
  easy: createNotePairs(4, 11),
  medium: createNotePairs(1, 11),
  hard: createNotePairs(1, 3),
}

function createDoubleQuestion(difficulty: DifficultyLevel, random: () => number): Question {
  const pairPool = DOUBLE_PAIR_POOLS[difficulty]
  const pair = sortNoteNames(pickOne(pairPool, random))
  const correctChoiceLabel = formatPairLabel(pair)
  const distractors = new Set<string>()

  while (distractors.size < 3) {
    const nextPair = formatPairLabel(sortNoteNames(pickOne(pairPool, random)))
    if (nextPair !== correctChoiceLabel) {
      distractors.add(nextPair)
    }
  }

  const labels = shuffle([correctChoiceLabel, ...Array.from(distractors)], random)
  const pitches = pair.map((noteName) =>
    getRandomPitchForNoteName(pitchPoolByNoteName, noteName, random),
  )
  const correctChoiceId = uniqueChoiceId(correctChoiceLabel)

  return {
    id: createId('double', random),
    mode: 'double',
    difficulty,
    prompt: 'Nghe hai nốt vang cùng lúc và chọn đúng cặp nốt',
    helperText: GAME_MODE_CONFIGS.double.difficulty[difficulty].helperText,
    correctChoiceId,
    choices: createChoiceSet('double', labels, correctChoiceId),
    playback: [
      {
        notes: pitches,
        offsetMs: 0,
        durationMs: difficulty === 'hard' ? 1700 : 1800,
        velocity: 0.76,
      },
    ],
  }
}

function createMelodyQuestion(difficulty: DifficultyLevel, random: () => number): Question {
  const lengthByDifficulty: Record<DifficultyLevel, number> = {
    easy: 3,
    medium: 4,
    hard: 5,
  }
  const length = lengthByDifficulty[difficulty]
  const noteSequence = sampleWithoutReplacement(NOTE_NAMES, length, random)
  const correctChoiceLabel = formatMelodyLabel(noteSequence)
  const distractors = new Set<string>()

  while (distractors.size < 3) {
    const candidate = formatMelodyLabel(sampleWithoutReplacement(NOTE_NAMES, length, random))
    if (candidate !== correctChoiceLabel) {
      distractors.add(candidate)
    }
  }

  const labels = shuffle([correctChoiceLabel, ...Array.from(distractors)], random)
  const pitches = noteSequence.map((noteName) =>
    getRandomPitchForNoteName(pitchPoolByNoteName, noteName, random),
  )
  const correctChoiceId = uniqueChoiceId(correctChoiceLabel)

  return {
    id: createId('melody', random),
    mode: 'melody',
    difficulty,
    prompt: 'Nghe motif ngắn và chọn đúng chuỗi nốt',
    helperText: GAME_MODE_CONFIGS.melody.difficulty[difficulty].helperText,
    correctChoiceId,
    choices: createChoiceSet('melody', labels, correctChoiceId),
    playback: createPlayback(
      pitches,
      difficulty === 'hard' ? 760 : 820,
      difficulty === 'hard' ? 580 : 640,
      0.7,
    ),
  }
}

function createIntervalPlayback(
  difficulty: DifficultyLevel,
  interval: IntervalSpec,
  random: () => number,
): PlaybackEvent[] {
  const isHard = difficulty === 'hard'
  const style = isHard ? pickOne(['harmonic', 'ascending', 'descending'] as const, random) : 'ascending'

  if (style === 'descending') {
    const upperIndex = Math.floor(random() * (PITCHES.length - interval.semitones)) + interval.semitones
    const upper = PITCHES[upperIndex]
    const lower = PITCHES[upperIndex - interval.semitones]
    return createPlayback([upper, lower], 720, 620, 0.72)
  }

  const rootIndex = Math.floor(random() * (PITCHES.length - interval.semitones))
  const root = PITCHES[rootIndex]
  const target = PITCHES[rootIndex + interval.semitones]

  if (style === 'harmonic') {
    return [
      {
        notes: interval.semitones === 0 ? [root] : [root, target],
        offsetMs: 0,
        durationMs: 1700,
        velocity: 0.74,
      },
    ]
  }

  return createPlayback(interval.semitones === 0 ? [root] : [root, target], 760, 620, 0.72)
}

function createIntervalQuestion(difficulty: DifficultyLevel, random: () => number): Question {
  const specs = INTERVAL_SPECS[difficulty]
  const correctSpec = pickOne(specs, random)
  const correctChoiceLabel = formatIntervalLabel(correctSpec.label)
  const distractors = sampleWithoutReplacement(
    specs
      .map((spec) => formatIntervalLabel(spec.label))
      .filter((label) => label !== correctChoiceLabel),
    3,
    random,
  )
  const labels = shuffle([correctChoiceLabel, ...distractors], random)
  const correctChoiceId = uniqueChoiceId(correctChoiceLabel)

  return {
    id: createId('interval', random),
    mode: 'interval',
    difficulty,
    prompt: 'Nghe quãng và chọn đúng tên quãng',
    helperText: GAME_MODE_CONFIGS.interval.difficulty[difficulty].helperText,
    correctChoiceId,
    choices: createChoiceSet('interval', labels, correctChoiceId),
    playback: createIntervalPlayback(difficulty, correctSpec, random),
  }
}

function fitsPitchRange(rootIndex: number, intervals: [number, number, number]) {
  return rootIndex + intervals[2] < PITCHES.length
}

function rotateArpeggioUp(pitches: PitchName[]) {
  const indices = pitches.map((pitch) => PITCHES.indexOf(pitch))
  const raisedIndex = indices[0] + 12

  if (raisedIndex >= PITCHES.length) {
    return pitches
  }

  return [PITCHES[indices[1]], PITCHES[indices[2]], PITCHES[raisedIndex]]
}

function spreadArpeggio(pitches: PitchName[]) {
  const indices = pitches.map((pitch) => PITCHES.indexOf(pitch))
  const raisedMiddle = indices[1] + 12

  if (raisedMiddle >= PITCHES.length) {
    return pitches
  }

  return [pitches[0], PITCHES[raisedMiddle], pitches[2]]
}

function createArpeggioPlayback(
  difficulty: DifficultyLevel,
  root: NoteName,
  spec: ArpeggioSpec,
  random: () => number,
): PlaybackEvent[] {
  const rootCandidates = pitchPoolByNoteName[root]
    .map((pitch) => PITCHES.indexOf(pitch))
    .filter((index) => fitsPitchRange(index, spec.intervals))
  const rootIndex = pickOne(rootCandidates, random)
  const basePitches = spec.intervals.map((offset) => PITCHES[rootIndex + offset]) as [
    PitchName,
    PitchName,
    PitchName,
  ]
  let playbackPitches = basePitches

  if (difficulty === 'hard') {
    const hardShape = pickOne(['up', 'down', 'rotate', 'spread'] as const, random)
    if (hardShape === 'rotate') {
      playbackPitches = rotateArpeggioUp(basePitches) as [PitchName, PitchName, PitchName]
    } else if (hardShape === 'spread') {
      playbackPitches = spreadArpeggio(basePitches) as [PitchName, PitchName, PitchName]
    } else if (hardShape === 'down') {
      playbackPitches = [...basePitches].reverse() as [PitchName, PitchName, PitchName]
    }
  } else if (difficulty === 'medium' && random() > 0.5) {
    playbackPitches = [...basePitches].reverse() as [PitchName, PitchName, PitchName]
  }

  return createPlayback(playbackPitches, 580, 640, 0.72)
}

function createArpeggioQuestion(difficulty: DifficultyLevel, random: () => number): Question {
  const specs = ARPEGGIO_SPECS[difficulty]
  const correctRoot = pickOne(NOTE_NAMES, random)
  const correctSpec = pickOne(specs, random)
  const correctChoiceLabel = formatArpeggioLabel(correctRoot, correctSpec.label)
  const distractors = new Set<string>()

  while (distractors.size < 3) {
    const nextLabel = formatArpeggioLabel(pickOne(NOTE_NAMES, random), pickOne(specs, random).label)
    if (nextLabel !== correctChoiceLabel) {
      distractors.add(nextLabel)
    }
  }

  const labels = shuffle([correctChoiceLabel, ...Array.from(distractors)], random)
  const correctChoiceId = uniqueChoiceId(correctChoiceLabel)

  return {
    id: createId('arpeggio', random),
    mode: 'arpeggio',
    difficulty,
    prompt: 'Nghe mẫu rải hợp âm và chọn đúng màu hợp âm',
    helperText: GAME_MODE_CONFIGS.arpeggio.difficulty[difficulty].helperText,
    correctChoiceId,
    choices: createChoiceSet('arpeggio', labels, correctChoiceId),
    playback: createArpeggioPlayback(difficulty, correctRoot, correctSpec, random),
  }
}

export function createQuestionFactory(): QuestionFactory {
  return {
    createQuestion(mode, difficulty, seed) {
      const random = createSeededRandom(seed ?? `${mode}-${difficulty}-${crypto.randomUUID()}`)

      switch (mode) {
        case 'single':
          return createSingleQuestion(difficulty, random)
        case 'double':
          return createDoubleQuestion(difficulty, random)
        case 'melody':
          return createMelodyQuestion(difficulty, random)
        case 'interval':
          return createIntervalQuestion(difficulty, random)
        case 'arpeggio':
          return createArpeggioQuestion(difficulty, random)
      }
    },
  }
}

export function getPlaybackPitchRange(question: Question) {
  return question.playback.flatMap((event) => event.notes.map((note) => pitchToNoteName(note)))
}
