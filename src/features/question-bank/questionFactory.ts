import {
  NOTE_NAMES,
  PITCHES,
  createPitchPoolByNoteName,
  formatMelodyLabel,
  formatPairLabel,
  getRandomPitchForNoteName,
  pitchToNoteName,
  sortNoteNames,
  type NoteName,
  type PitchName,
} from '../../shared/music'
import {
  formatArpeggioLabel,
  formatChoiceMeta,
  formatChordLabel,
  getDifficultyCopy,
  getIntervalLabel,
  getModeCopy,
  type Language,
  type TriadQuality,
} from '../../shared/localization'
import {
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
  semitones: number
}

interface ArpeggioSpec {
  quality: TriadQuality
  intervals: [number, number, number]
}

interface ChordSpec {
  quality: TriadQuality
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
    { semitones: 0 },
    { semitones: 1 },
    { semitones: 2 },
    { semitones: 3 },
    { semitones: 4 },
    { semitones: 5 },
    { semitones: 7 },
  ],
  medium: [
    { semitones: 0 },
    { semitones: 1 },
    { semitones: 2 },
    { semitones: 3 },
    { semitones: 4 },
    { semitones: 5 },
    { semitones: 7 },
    { semitones: 8 },
    { semitones: 9 },
    { semitones: 10 },
    { semitones: 11 },
    { semitones: 12 },
  ],
  hard: [
    { semitones: 0 },
    { semitones: 1 },
    { semitones: 2 },
    { semitones: 3 },
    { semitones: 4 },
    { semitones: 5 },
    { semitones: 7 },
    { semitones: 8 },
    { semitones: 9 },
    { semitones: 10 },
    { semitones: 11 },
    { semitones: 12 },
  ],
}

const ARPEGGIO_SPECS: Record<DifficultyLevel, ArpeggioSpec[]> = {
  easy: [
    { quality: 'major', intervals: [0, 4, 7] },
    { quality: 'minor', intervals: [0, 3, 7] },
  ],
  medium: [
    { quality: 'major', intervals: [0, 4, 7] },
    { quality: 'minor', intervals: [0, 3, 7] },
  ],
  hard: [
    { quality: 'major', intervals: [0, 4, 7] },
    { quality: 'minor', intervals: [0, 3, 7] },
    { quality: 'diminished', intervals: [0, 3, 6] },
    { quality: 'augmented', intervals: [0, 4, 8] },
  ],
}

const CHORD_SPECS: Record<DifficultyLevel, ChordSpec[]> = {
  easy: [
    { quality: 'major', intervals: [0, 4, 7] },
    { quality: 'minor', intervals: [0, 3, 7] },
  ],
  medium: [
    { quality: 'major', intervals: [0, 4, 7] },
    { quality: 'minor', intervals: [0, 3, 7] },
  ],
  hard: [
    { quality: 'major', intervals: [0, 4, 7] },
    { quality: 'minor', intervals: [0, 3, 7] },
    { quality: 'diminished', intervals: [0, 3, 6] },
    { quality: 'augmented', intervals: [0, 4, 8] },
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

function createChoiceSet(
  language: Language,
  mode: GameMode,
  labels: string[],
  correctChoiceId: string,
): Choice[] {
  return withCorrectChoice(
    labels.map((label) => ({
      id: uniqueChoiceId(label),
      label,
      meta: formatChoiceMeta(language, mode, label),
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

function createSingleQuestion(
  language: Language,
  difficulty: DifficultyLevel,
  random: () => number,
): Question {
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
    prompt: getModeCopy(language, 'single').prompt,
    helperText: getDifficultyCopy(language, 'single', difficulty).helperText,
    correctChoiceId,
    choices: createChoiceSet(language, 'single', labels, correctChoiceId),
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

function createDoubleQuestion(
  language: Language,
  difficulty: DifficultyLevel,
  random: () => number,
): Question {
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
    prompt: getModeCopy(language, 'double').prompt,
    helperText: getDifficultyCopy(language, 'double', difficulty).helperText,
    correctChoiceId,
    choices: createChoiceSet(language, 'double', labels, correctChoiceId),
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

function createMelodyQuestion(
  language: Language,
  difficulty: DifficultyLevel,
  random: () => number,
): Question {
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
    prompt: getModeCopy(language, 'melody').prompt,
    helperText: getDifficultyCopy(language, 'melody', difficulty).helperText,
    correctChoiceId,
    choices: createChoiceSet(language, 'melody', labels, correctChoiceId),
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

function createIntervalQuestion(
  language: Language,
  difficulty: DifficultyLevel,
  random: () => number,
): Question {
  const specs = INTERVAL_SPECS[difficulty]
  const correctSpec = pickOne(specs, random)
  const correctChoiceLabel = getIntervalLabel(language, correctSpec.semitones)
  const distractors = sampleWithoutReplacement(
    specs
      .map((spec) => getIntervalLabel(language, spec.semitones))
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
    prompt: getModeCopy(language, 'interval').prompt,
    helperText: getDifficultyCopy(language, 'interval', difficulty).helperText,
    correctChoiceId,
    choices: createChoiceSet(language, 'interval', labels, correctChoiceId),
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

function createArpeggioQuestion(
  language: Language,
  difficulty: DifficultyLevel,
  random: () => number,
): Question {
  const specs = ARPEGGIO_SPECS[difficulty]
  const correctRoot = pickOne(NOTE_NAMES, random)
  const correctSpec = pickOne(specs, random)
  const correctChoiceLabel = formatArpeggioLabel(correctRoot, correctSpec.quality)
  const distractors = new Set<string>()

  while (distractors.size < 3) {
    const nextLabel = formatArpeggioLabel(
      pickOne(NOTE_NAMES, random),
      pickOne(specs, random).quality,
    )
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
    prompt: getModeCopy(language, 'arpeggio').prompt,
    helperText: getDifficultyCopy(language, 'arpeggio', difficulty).helperText,
    correctChoiceId,
    choices: createChoiceSet(language, 'arpeggio', labels, correctChoiceId),
    playback: createArpeggioPlayback(difficulty, correctRoot, correctSpec, random),
  }
}

function invertChordUp(
  pitches: [PitchName, PitchName, PitchName],
  inversion: 'root' | 'first' | 'second',
) {
  if (inversion === 'root') {
    return pitches
  }

  const indices = pitches.map((pitch) => PITCHES.indexOf(pitch))

  if (inversion === 'first') {
    const raisedRoot = indices[0] + 12

    if (raisedRoot >= PITCHES.length) {
      return pitches
    }

    return [PITCHES[indices[1]], PITCHES[indices[2]], PITCHES[raisedRoot]] as [
      PitchName,
      PitchName,
      PitchName,
    ]
  }

  const raisedRoot = indices[0] + 12
  const raisedThird = indices[1] + 12

  if (raisedRoot >= PITCHES.length || raisedThird >= PITCHES.length) {
    return pitches
  }

  return [PITCHES[indices[2]], PITCHES[raisedRoot], PITCHES[raisedThird]] as [
    PitchName,
    PitchName,
    PitchName,
  ]
}

function createChordPlayback(
  difficulty: DifficultyLevel,
  root: NoteName,
  spec: ChordSpec,
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
  const inversion =
    difficulty === 'easy'
      ? 'root'
      : pickOne(['root', 'first', 'second'] as const, random)
  const playbackPitches = invertChordUp(basePitches, inversion)

  return [
    {
      notes: playbackPitches,
      offsetMs: 0,
      durationMs: difficulty === 'hard' ? 1850 : 1950,
      velocity: 0.76,
    },
  ]
}

function createChordQuestion(
  language: Language,
  difficulty: DifficultyLevel,
  random: () => number,
): Question {
  const specs = CHORD_SPECS[difficulty]
  const correctRoot = pickOne(NOTE_NAMES, random)
  const correctSpec = pickOne(specs, random)
  const correctChoiceLabel = formatChordLabel(correctRoot, correctSpec.quality)
  const distractors = new Set<string>()

  while (distractors.size < 3) {
    const nextLabel = formatChordLabel(
      pickOne(NOTE_NAMES, random),
      pickOne(specs, random).quality,
    )
    if (nextLabel !== correctChoiceLabel) {
      distractors.add(nextLabel)
    }
  }

  const labels = shuffle([correctChoiceLabel, ...Array.from(distractors)], random)
  const correctChoiceId = uniqueChoiceId(correctChoiceLabel)

  return {
    id: createId('chord', random),
    mode: 'chord',
    difficulty,
    prompt: getModeCopy(language, 'chord').prompt,
    helperText: getDifficultyCopy(language, 'chord', difficulty).helperText,
    correctChoiceId,
    choices: createChoiceSet(language, 'chord', labels, correctChoiceId),
    playback: createChordPlayback(difficulty, correctRoot, correctSpec, random),
  }
}

export function createQuestionFactory(language: Language = 'en'): QuestionFactory {
  return {
    createQuestion(mode, difficulty, seed) {
      const random = createSeededRandom(seed ?? `${mode}-${difficulty}-${crypto.randomUUID()}`)

      switch (mode) {
        case 'single':
          return createSingleQuestion(language, difficulty, random)
        case 'double':
          return createDoubleQuestion(language, difficulty, random)
        case 'melody':
          return createMelodyQuestion(language, difficulty, random)
        case 'interval':
          return createIntervalQuestion(language, difficulty, random)
        case 'arpeggio':
          return createArpeggioQuestion(language, difficulty, random)
        case 'chord':
          return createChordQuestion(language, difficulty, random)
      }
    },
  }
}

export function getPlaybackPitchRange(question: Question) {
  return question.playback.flatMap((event) => event.notes.map((note) => pitchToNoteName(note)))
}
