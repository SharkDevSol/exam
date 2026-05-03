import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Loading } from '../../components';
import api, { getErrorMessage } from '../../services/api';
import styles from './StudentResults.module.css';

interface Result {
  examId: string;
  subjectName: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

interface ExamDetail {
  score: number;
  totalQuestions: number;
  completedAt: string;
  answers: Array<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: 'A' | 'B' | 'C' | 'D';
    selected_answer: 'A' | 'B' | 'C' | 'D' | null;
  }>;
}

export default function StudentResults() {
  const { examId } = useParams<{ examId?: string }>();
  const [results, setResults] = useState<Result[]>([]);
  const [examDetail, setExamDetail] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (examId) {
      fetchExamDetails(examId);
    } else {
      fetchResults();
    }
  }, [examId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/student/results');
      setResults(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchExamDetails = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/student/results/${id}`);
      setExamDetail(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/student/results/${id}`);
  };

  const handleBackToList = () => {
    navigate('/student/results');
  };

  const handleBackToExams = () => {
    navigate('/student');
  };

  const calculateTotalScore = (): { total: number; possible: number } => {
    const total = results.reduce((sum, result) => sum + result.score, 0);
    const possible = results.reduce((sum, result) => sum + result.totalQuestions, 0);
    return { total, possible };
  };

  const groupResultsBySubject = (): Record<string, Result[]> => {
    return results.reduce((acc, result) => {
      if (!acc[result.subjectName]) {
        acc[result.subjectName] = [];
      }
      acc[result.subjectName].push(result);
      return acc;
    }, {} as Record<string, Result[]>);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAnswerClass = (selectedAnswer: string | null, correctAnswer: string): string => {
    if (selectedAnswer === null) {
      return styles.unanswered;
    }
    return selectedAnswer === correctAnswer ? styles.correct : styles.incorrect;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <Button onClick={examId ? () => fetchExamDetails(examId) : fetchResults}>
          Retry
        </Button>
      </div>
    );
  }

  // Detailed results view
  if (examId && examDetail) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Button variant="secondary" onClick={handleBackToList}>
            ← Back to Results
          </Button>
          <h1>Exam Details</h1>
        </div>

        <div className={styles.scoreCard}>
          <div className={styles.scoreLabel}>Your Score</div>
          <div className={styles.scoreValue}>
            {examDetail.score} out of {examDetail.totalQuestions}
          </div>
          <div className={styles.scorePercentage}>
            {Math.round((examDetail.score / examDetail.totalQuestions) * 100)}%
          </div>
          <div className={styles.completedDate}>
            Completed on {formatDate(examDetail.completedAt)}
          </div>
        </div>

        <div className={styles.questionsSection}>
          <h2>Question Review</h2>
          {examDetail.answers.map((answer, index) => (
            <div
              key={index}
              className={`${styles.questionCard} ${getAnswerClass(
                answer.selected_answer,
                answer.correct_answer
              )}`}
            >
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>Question {index + 1}</span>
                {answer.selected_answer === null && (
                  <span className={styles.badge}>Unanswered</span>
                )}
                {answer.selected_answer === answer.correct_answer && (
                  <span className={`${styles.badge} ${styles.correctBadge}`}>Correct</span>
                )}
                {answer.selected_answer !== null &&
                  answer.selected_answer !== answer.correct_answer && (
                    <span className={`${styles.badge} ${styles.incorrectBadge}`}>
                      Incorrect
                    </span>
                  )}
              </div>

              <div className={styles.questionText}>{answer.question_text}</div>

              <div className={styles.options}>
                <div
                  className={`${styles.option} ${
                    answer.selected_answer === 'A'
                      ? answer.selected_answer === answer.correct_answer
                        ? styles.selectedCorrect
                        : styles.selectedIncorrect
                      : ''
                  } ${answer.correct_answer === 'A' ? styles.correctOption : ''}`}
                >
                  <span className={styles.optionLabel}>A.</span>
                  <span className={styles.optionText}>{answer.option_a}</span>
                </div>
                <div
                  className={`${styles.option} ${
                    answer.selected_answer === 'B'
                      ? answer.selected_answer === answer.correct_answer
                        ? styles.selectedCorrect
                        : styles.selectedIncorrect
                      : ''
                  } ${answer.correct_answer === 'B' ? styles.correctOption : ''}`}
                >
                  <span className={styles.optionLabel}>B.</span>
                  <span className={styles.optionText}>{answer.option_b}</span>
                </div>
                <div
                  className={`${styles.option} ${
                    answer.selected_answer === 'C'
                      ? answer.selected_answer === answer.correct_answer
                        ? styles.selectedCorrect
                        : styles.selectedIncorrect
                      : ''
                  } ${answer.correct_answer === 'C' ? styles.correctOption : ''}`}
                >
                  <span className={styles.optionLabel}>C.</span>
                  <span className={styles.optionText}>{answer.option_c}</span>
                </div>
                <div
                  className={`${styles.option} ${
                    answer.selected_answer === 'D'
                      ? answer.selected_answer === answer.correct_answer
                        ? styles.selectedCorrect
                        : styles.selectedIncorrect
                      : ''
                  } ${answer.correct_answer === 'D' ? styles.correctOption : ''}`}
                >
                  <span className={styles.optionLabel}>D.</span>
                  <span className={styles.optionText}>{answer.option_d}</span>
                </div>
              </div>

              {answer.selected_answer !== null &&
                answer.selected_answer !== answer.correct_answer && (
                  <div className={styles.answerSummary}>
                    <div className={styles.yourAnswer}>
                      Your answer: <strong>{answer.selected_answer}</strong>
                    </div>
                    <div className={styles.correctAnswerLabel}>
                      Correct answer: <strong>{answer.correct_answer}</strong>
                    </div>
                  </div>
                )}

              {answer.selected_answer === null && (
                <div className={styles.answerSummary}>
                  <div className={styles.correctAnswerLabel}>
                    Correct answer: <strong>{answer.correct_answer}</strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Results list view
  const groupedResults = groupResultsBySubject();
  const totalScore = calculateTotalScore();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Results</h1>
        <Button variant="secondary" onClick={handleBackToExams}>
          Back to Exams
        </Button>
      </div>

      {results.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven't completed any exams yet.</p>
          <Button onClick={handleBackToExams}>View Available Exams</Button>
        </div>
      ) : (
        <>
          <div className={styles.totalScoreCard}>
            <div className={styles.totalScoreLabel}>Total Score Across All Subjects</div>
            <div className={styles.totalScoreValue}>
              {totalScore.total} out of {totalScore.possible}
            </div>
            <div className={styles.totalScorePercentage}>
              {Math.round((totalScore.total / totalScore.possible) * 100)}%
            </div>
          </div>

          <div className={styles.subjectsSection}>
            {Object.entries(groupedResults).map(([subjectName, subjectResults]) => (
              <div key={subjectName} className={styles.subjectGroup}>
                <h2 className={styles.subjectName}>{subjectName}</h2>
                <div className={styles.resultsGrid}>
                  {subjectResults.map((result) => (
                    <div key={result.examId} className={styles.resultCard}>
                      <div className={styles.resultScore}>
                        <span className={styles.score}>{result.score}</span>
                        <span className={styles.separator}>/</span>
                        <span className={styles.total}>{result.totalQuestions}</span>
                      </div>
                      <div className={styles.resultPercentage}>
                        {Math.round((result.score / result.totalQuestions) * 100)}%
                      </div>
                      <div className={styles.resultDate}>
                        {formatDate(result.completedAt)}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => handleViewDetails(result.examId)}
                        fullWidth
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
