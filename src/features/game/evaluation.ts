import type { Question, QuestionEvaluation } from '../../shared/gameTypes'

export function evaluateSelection(
  question: Question,
  selectedChoiceId: string,
  existing: QuestionEvaluation | null,
): QuestionEvaluation {
  if (existing) {
    return existing
  }

  return {
    questionId: question.id,
    selectedChoiceId,
    correctChoiceId: question.correctChoiceId,
    status: selectedChoiceId === question.correctChoiceId ? 'correct' : 'incorrect',
  }
}
