import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { Loading, Table, Button, Modal } from '../../components';
import styles from './TeacherResults.module.css';

interface Result {
  student_id: string;
  student_name: string;
  student_username: string;
  exam_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

interface DetailedAnswer {
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  student_answer: string | null;
  is_correct: boolean;
}

interface DetailedResult {
  student_name: string;
  score: number;
  total_questions: number;
  completed_at: string;
  answers: DetailedAnswer[];
}

export default function TeacherResults() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedResult, setSelectedResult] = useState<DetailedResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teacher/results');
      setResults(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (studentId: string, examId: string) => {
    try {
      setLoadingDetail(true);
      const response = await api.get(`/teacher/results/${studentId}/${examId}`);
      setSelectedResult(response.data);
      setShowDetailModal(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingDetail(false);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'name') {
      const comparison = a.student_name.localeCompare(b.student_name);
      return sortOrder === 'asc' ? comparison : -comparison;
    } else {
      const comparison = a.score - b.score;
      return sortOrder === 'asc' ? comparison : -comparison;
    }
  });

  const toggleSort = (field: 'name' | 'score') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return <Loading />;
  }

  const columns = [
    {
      key: 'student_name',
      header: `Student Name ${sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}`,
      render: (result: Result) => (
        <button onClick={() => toggleSort('name')} className={styles.sortButton}>
          {result.student_name}
        </button>
      ),
    },
    { key: 'student_username', header: 'Username' },
    {
      key: 'score',
      header: `Score ${sortBy === 'score' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}`,
      render: (result: Result) => (
        <button onClick={() => toggleSort('score')} className={styles.sortButton}>
          {result.score} / {result.total_questions}
        </button>
      ),
    },
    {
      key: 'completed_at',
      header: 'Completed At',
      render: (result: Result) => new Date(result.completed_at).toLocaleString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (result: Result) => (
        <Button
          size="small"
          variant="secondary"
          onClick={() => viewDetails(result.student_id, result.exam_id)}
          disabled={loadingDetail}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Student Results</h2>
        <p className={styles.description}>
          View exam results for your subject. Click "View Details" to see individual answers.
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {results.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No results available yet.</p>
          <p className={styles.emptyHint}>
            Results will appear here once students complete exams for your subject.
          </p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <Table
            columns={columns}
            data={sortedResults}
            keyExtractor={(result) => `${result.student_id}-${result.exam_id}`}
          />
        </div>
      )}

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detailed Results"
      >
        {selectedResult && (
          <div className={styles.detailModal}>
            <div className={styles.detailHeader}>
              <p><strong>Student:</strong> {selectedResult.student_name}</p>
              <p><strong>Score:</strong> {selectedResult.score} / {selectedResult.total_questions}</p>
              <p><strong>Completed:</strong> {new Date(selectedResult.completed_at).toLocaleString()}</p>
            </div>

            <div className={styles.answersContainer}>
              {selectedResult.answers.map((answer) => (
                <div
                  key={answer.question_number}
                  className={`${styles.answerCard} ${
                    answer.is_correct ? styles.correct : styles.incorrect
                  }`}
                >
                  <div className={styles.answerHeader}>
                    <span className={styles.questionNumber}>Q{answer.question_number}</span>
                    <span className={styles.answerStatus}>
                      {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  <p className={styles.questionText}>{answer.question_text}</p>
                  <div className={styles.options}>
                    <p>A: {answer.option_a}</p>
                    <p>B: {answer.option_b}</p>
                    <p>C: {answer.option_c}</p>
                    <p>D: {answer.option_d}</p>
                  </div>
                  <div className={styles.answerInfo}>
                    <p>
                      <strong>Student Answer:</strong>{' '}
                      {answer.student_answer || 'Not answered'}
                    </p>
                    {!answer.is_correct && (
                      <p>
                        <strong>Correct Answer:</strong> {answer.correct_answer}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
