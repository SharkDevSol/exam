/**
 * Answer interface
 */
export interface Answer {
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

/**
 * Calculate score by comparing student answers with correct answers
 * Returns score between 0 and 100
 */
export function calculateScore(studentAnswers: Answer[]): number {
  if (studentAnswers.length === 0) {
    return 0;
  }
  
  const correctCount = studentAnswers.filter(answer => 
    answer.selectedAnswer === answer.correctAnswer
  ).length;
  
  return correctCount;
}

/**
 * Compare student answers with correct answers
 * Returns detailed comparison for each question
 */
export interface AnswerComparison {
  questionId: string;
  studentAnswer: 'A' | 'B' | 'C' | 'D' | null;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  isAnswered: boolean;
}

export function compareAnswers(studentAnswers: Answer[]): AnswerComparison[] {
  return studentAnswers.map(answer => ({
    questionId: answer.questionId,
    studentAnswer: answer.selectedAnswer,
    correctAnswer: answer.correctAnswer,
    isCorrect: answer.selectedAnswer === answer.correctAnswer,
    isAnswered: answer.selectedAnswer !== null,
  }));
}

/**
 * Get unanswered question IDs
 */
export function getUnansweredQuestions(studentAnswers: Answer[]): string[] {
  return studentAnswers
    .filter(answer => answer.selectedAnswer === null)
    .map(answer => answer.questionId);
}

/**
 * Calculate percentage score
 */
export function calculatePercentage(score: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((score / total) * 100);
}
