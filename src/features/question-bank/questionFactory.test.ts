import { describe, expect, it } from 'vitest'
import { createQuestionFactory } from './questionFactory'
import { PITCHES } from '../../shared/music'
import {
  DIFFICULTY_LEVELS,
  GAME_MODES,
} from '../../shared/gameTypes'

describe('questionFactory', () => {
  const factory = createQuestionFactory()

  it.each(
    GAME_MODES.flatMap((mode) => DIFFICULTY_LEVELS.map((difficulty) => [mode, difficulty] as const)),
  )(
    'creates 4 unique choices with one correct answer for %s / %s',
    (mode, difficulty) => {
      const question = factory.createQuestion(mode, difficulty, `${mode}-${difficulty}-seed`)
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
      const question = factory.createQuestion('melody', difficulty, `melody-${difficulty}`)
      const lengths = question.choices.map((choice) => choice.label.split(' - ').length)

      expect(new Set(lengths).size).toBe(1)
      expect(question.playback.length).toBe(lengths[0])
      expect(question.playback.every((event, index, array) => index === 0 || event.offsetMs > array[index - 1]!.offsetMs)).toBe(true)
    },
  )

  it.each(DIFFICULTY_LEVELS)('keeps double-note labels sorted for %s', (difficulty) => {
    const question = factory.createQuestion('double', difficulty, `double-${difficulty}`)
    const correctLabel = question.choices.find((choice) => choice.isCorrect)?.label ?? ''

    expect(correctLabel).toMatch(/^[A-G]#?( \+ [A-G]#?)+$/)
    expect(correctLabel.split(' + ')).toEqual([...correctLabel.split(' + ')].sort((left, right) => {
      const noteOrder = PITCHES.slice(0, 12).map((pitch) => pitch.replace('4', ''))
      return noteOrder.indexOf(left) - noteOrder.indexOf(right)
    }))
  })

  it('keeps single-note answers at pitch-class level', () => {
    const question = factory.createQuestion('single', 'medium', 'single-medium')

    expect(question.choices.every((choice) => !/[45]/.test(choice.label))).toBe(true)
  })

  it.each(DIFFICULTY_LEVELS)('keeps interval playback inside C4-B5 for %s', (difficulty) => {
    const question = factory.createQuestion('interval', difficulty, `interval-${difficulty}`)

    expect(question.playback.flatMap((event) => event.notes).every((note) => PITCHES.includes(note))).toBe(true)
  })

  it.each(DIFFICULTY_LEVELS)('keeps arpeggio playback inside C4-B5 for %s', (difficulty) => {
    const question = factory.createQuestion('arpeggio', difficulty, `arpeggio-${difficulty}`)

    expect(question.playback.flatMap((event) => event.notes).every((note) => PITCHES.includes(note))).toBe(true)
  })
})
