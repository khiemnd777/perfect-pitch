import type { GameMode } from './gameTypes'

export const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

export type NoteName = (typeof NOTE_NAMES)[number]

export const OCTAVES = [4, 5] as const

export type PitchName =
  | 'C4'
  | 'C#4'
  | 'D4'
  | 'D#4'
  | 'E4'
  | 'F4'
  | 'F#4'
  | 'G4'
  | 'G#4'
  | 'A4'
  | 'A#4'
  | 'B4'
  | 'C5'
  | 'C#5'
  | 'D5'
  | 'D#5'
  | 'E5'
  | 'F5'
  | 'F#5'
  | 'G5'
  | 'G#5'
  | 'A5'
  | 'A#5'
  | 'B5'

export const PITCHES = OCTAVES.flatMap((octave) =>
  NOTE_NAMES.map((noteName) => `${noteName}${octave}` as PitchName),
)

export function pitchToNoteName(pitch: PitchName): NoteName {
  return pitch.replace(/[45]/g, '') as NoteName
}

export function sortNoteNames(noteNames: NoteName[]) {
  return [...noteNames].sort(
    (left, right) => NOTE_NAMES.indexOf(left) - NOTE_NAMES.indexOf(right),
  )
}

export function formatPairLabel(noteNames: NoteName[]) {
  return sortNoteNames(noteNames).join(' + ')
}

export function formatMelodyLabel(noteNames: NoteName[]) {
  return noteNames.join(' - ')
}

export function formatIntervalLabel(label: string) {
  return label
}

export function formatArpeggioLabel(root: NoteName, quality: string) {
  return `${root} ${quality}`
}

export function formatChoiceMeta(mode: GameMode, label: string) {
  switch (mode) {
    case 'single':
      return `Tên nốt: ${label}`
    case 'double':
      return `Cặp nốt: ${label}`
    case 'melody':
      return `Motif: ${label}`
    case 'interval':
      return `Quãng: ${label}`
    case 'arpeggio':
      return `Mẫu rải: ${label}`
  }
}

export function createPitchPoolByNoteName(pitches: PitchName[]) {
  return Object.fromEntries(
    NOTE_NAMES.map((noteName) => [
      noteName,
      pitches.filter((pitch) => pitchToNoteName(pitch) === noteName),
    ]),
  ) as Record<NoteName, PitchName[]>
}

export function getRandomPitchForNoteName(
  pool: Record<NoteName, PitchName[]>,
  noteName: NoteName,
  random: () => number,
) {
  const options = pool[noteName]
  return options[Math.floor(random() * options.length)]
}
