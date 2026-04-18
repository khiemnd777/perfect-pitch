import { describe, expect, it } from 'vitest'
import { createQuestionFactory } from './questionFactory'
import { PITCHES } from '../../shared/music'
import {
  DIFFICULTY_LEVELS,
  GAME_MODES,
} from '../../shared/gameTypes'

describe('questionFactory', () => {
  const englishFactory = createQuestionFactory('en')
  const vietnameseFactory = createQuestionFactory('vi')

  it.each(
    GAME_MODES.flatMap((mode) =>
      DIFFICULTY_LEVELS.map((difficulty) => [mode, difficulty] as const),
    ),
  )(
    'creates 4 unique choices with one correct answer for %s / %s in English',
    (mode, difficulty) => {
      const question = englishFactory.createQuestion(
        mode,
        difficulty,
        `${mode}-${difficulty}-seed`,
      )
      const uniqueChoices = new Set(question.choices.map((choice) => choice.id))
      const correctChoices = question.choices.filter((choice) => choice.isCorrect)

      expect(question.choices).toHaveLength(4)
      expect(uniqueChoices.size).toBe(4)
      expect(correctChoices).toHaveLength(1)
      expect(correctChoices[0]?.id).toBe(question.correctChoiceId)
      expect(question.mode).toBe(mode)
      expect(question.difficulty).toBe(difficulty)
      expect(question.playback.length).toBeGreaterThan(0)
    },
  )

  it.each(DIFFICULTY_LEVELS)(
    'creates melody distractors with the same note count for %s',
    (difficulty) => {
      const question = englishFactory.createQuestion('melody', difficulty, `melody-${difficulty}`)
      const lengths = question.choices.map((choice) => choice.label.split(' - ').length)

      expect(new Set(lengths).size).toBe(1)
      expect(question.playback.length).toBe(lengths[0])
      expect(
        question.playback.every(
          (event, index, array) =>
            index === 0 || event.offsetMs > array[index - 1]!.offsetMs,
        ),
      ).toBe(true)
    },
  )

  it.each(DIFFICULTY_LEVELS)('keeps double-note labels sorted for %s', (difficulty) => {
    const question = englishFactory.createQuestion('double', difficulty, `double-${difficulty}`)
    const correctLabel = question.choices.find((choice) => choice.isCorrect)?.label ?? ''

    expect(correctLabel).toMatch(/^[A-G]#?( \+ [A-G]#?)+$/)
    expect(correctLabel.split(' + ')).toEqual(
      [...correctLabel.split(' + ')].sort((left, right) => {
        const noteOrder = PITCHES.slice(0, 12).map((pitch) => pitch.replace('4', ''))
        return noteOrder.indexOf(left) - noteOrder.indexOf(right)
      }),
    )
  })

  it('keeps single-note answers at pitch-class level', () => {
    const question = englishFactory.createQuestion('single', 'medium', 'single-medium')

    expect(question.choices.every((choice) => !/[45]/.test(choice.label))).toBe(true)
  })

  it.each(DIFFICULTY_LEVELS)('keeps interval playback inside C4-B5 for %s', (difficulty) => {
    const question = englishFactory.createQuestion('interval', difficulty, `interval-${difficulty}`)

    expect(question.playback.flatMap((event) => event.notes).every((note) => PITCHES.includes(note))).toBe(true)
  })

  it.each(DIFFICULTY_LEVELS)('keeps arpeggio playback inside C4-B5 for %s', (difficulty) => {
    const question = englishFactory.createQuestion('arpeggio', difficulty, `arpeggio-${difficulty}`)

    expect(question.playback.flatMap((event) => event.notes).every((note) => PITCHES.includes(note))).toBe(true)
  })

  it.each(DIFFICULTY_LEVELS)('keeps chord playback inside C4-B5 for %s', (difficulty) => {
    const question = englishFactory.createQuestion('chord', difficulty, `chord-${difficulty}`)

    expect(question.playback).toHaveLength(1)
    expect(question.playback[0]?.notes).toHaveLength(3)
    expect(question.playback.flatMap((event) => event.notes).every((note) => PITCHES.includes(note))).toBe(true)
  })

  it('renders compact chord-style labels for triads in both languages', () => {
    const englishChord = englishFactory.createQuestion('chord', 'easy', 'chord-minor-label')
    const vietnameseChord = vietnameseFactory.createQuestion('chord', 'easy', 'chord-minor-label')
    const englishArpeggio = englishFactory.createQuestion('arpeggio', 'hard', 'arpeggio-dim-label')
    const vietnameseArpeggio = vietnameseFactory.createQuestion('arpeggio', 'hard', 'arpeggio-dim-label')

    expect(
      englishChord.choices.some(
        (choice) => /^[A-G]#?m$/.test(choice.label) || /^[A-G]#?$/.test(choice.label),
      ),
    ).toBe(true)
    expect(
      vietnameseChord.choices.some(
        (choice) => /^[A-G]#?m$/.test(choice.label) || /^[A-G]#?$/.test(choice.label),
      ),
    ).toBe(true)
    expect(
      englishArpeggio.choices.some((choice) =>
        /^(?:[A-G]#?m|[A-G]#?dim|[A-G]#?aug|[A-G]#?)$/.test(choice.label),
      ),
    ).toBe(true)
    expect(
      vietnameseArpeggio.choices.some((choice) =>
        /^(?:[A-G]#?m|[A-G]#?dim|[A-G]#?aug|[A-G]#?)$/.test(choice.label),
      ),
    ).toBe(true)
  })

  it('localizes prompts and helper text for English and Vietnamese', () => {
    const englishSingle = englishFactory.createQuestion('single', 'easy', 'single-copy')
    const vietnameseSingle = vietnameseFactory.createQuestion('single', 'easy', 'single-copy')
    const englishInterval = englishFactory.createQuestion('interval', 'medium', 'interval-copy')
    const vietnameseInterval = vietnameseFactory.createQuestion('interval', 'medium', 'interval-copy')

    expect(englishSingle.prompt).toBe('Listen to one note and choose the correct note name')
    expect(vietnameseSingle.prompt).toBe('Nghe một nốt và chọn đúng tên nốt')
    expect(englishSingle.helperText).toContain('6 core notes')
    expect(vietnameseSingle.helperText).toContain('6 nốt cơ bản')
    expect(englishInterval.choices.some((choice) => /Minor|Major|Perfect|Octave/.test(choice.label))).toBe(true)
    expect(vietnameseInterval.choices.some((choice) => choice.label.startsWith('Quãng'))).toBe(true)
    expect(englishInterval.choices.every((choice) => choice.meta.startsWith('Interval: '))).toBe(true)
    expect(vietnameseInterval.choices.every((choice) => choice.meta.startsWith('Quãng: '))).toBe(true)
  })
})
