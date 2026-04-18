import { describe, expect, it } from 'vitest'
import { evaluateSelection } from './evaluation'
import { createQuestionFactory } from '../question-bank/questionFactory'

describe('evaluateSelection', () => {
  const question = createQuestionFactory().createQuestion('single', 'easy', 'evaluation-seed')
  const wrongChoice = question.choices.find((choice) => !choice.isCorrect)!
  const correctChoice = question.choices.find((choice) => choice.isCorrect)!

  it('returns correct for the right answer', () => {
    const result = evaluateSelection(question, correctChoice.id, null)

    expect(result.status).toBe('correct')
    expect(result.correctChoiceId).toBe(question.correctChoiceId)
  })

  it('locks the first submitted result', () => {
    const firstAttempt = evaluateSelection(question, wrongChoice.id, null)
    const secondAttempt = evaluateSelection(question, correctChoice.id, firstAttempt)

    expect(firstAttempt.status).toBe('incorrect')
    expect(secondAttempt).toBe(firstAttempt)
    expect(secondAttempt.correctChoiceId).toBe(question.correctChoiceId)
  })
})
