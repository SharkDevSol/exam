import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Loading, Modal, Input } from '../../components';
import api, { getErrorMessage } from '../../services/api';
import styles from './ExamDiscovery.module.css';

interface Exam {
  id: string;
  subjectName: string;
  subjectIcon?: string;
  durationMinutes: number;
  isPublic: boolean;
  isCompleted: boolean;
}

export default function ExamDiscovery() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examPassword, setExamPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/student/exams');
      const examsData = response.data.map((exam: any) => ({
        id: exam.examId,
        subjectName: exam.subjectName,
        subjectIcon: exam.subjectIcon,
        durationMinutes: exam.durationMinutes,
        isPublic: true,
        isCompleted: exam.isCompleted,
      }));
      setExams(examsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExamClick = (exam: Exam) => {
    if (exam.isCompleted) {
      // Navigate to results for completed exams
      navigate(`/student/results/${exam.id}`);
    } else {
      // Show password modal for available exams
      setSelectedExam(exam);
      setExamPassword('');
      setPasswordError('');
    }
  };

  const handleStartExam = async () => {
    if (!selectedExam || !examPassword.trim()) {
      setPasswordError('Please enter the exam password');
      return;
    }

    try {
      setSubmitting(true);
      setPasswordError('');
      
      const response = await api.post(`/student/exams/${selectedExam.id}/start`, {
        password: examPassword,
      });

      // Store session data in localStorage for the exam interface
      localStorage.setItem(`exam_session_${selectedExam.id}`, JSON.stringify({
        sessionId: response.data.sessionId,
        startTime: response.data.startTime,
        durationMinutes: response.data.durationMinutes,
      }));

      // Navigate to exam interface
      navigate(`/student/exam/${selectedExam.id}`);
    } catch (err: any) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedExam(null);
    setExamPassword('');
    setPasswordError('');
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
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
        <Button onClick={fetchExams}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Available Exams</h1>
        <Button variant="secondary" onClick={() => navigate('/student/results')}>
          View Results
        </Button>
      </div>

      {exams.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No exams available at the moment.</p>
          <p>Check back later or contact your teacher.</p>
        </div>
      ) : (
        <div className={styles.examGrid}>
          {exams.map((exam) => (
            <div
              key={exam.id}
              className={`${styles.examCard} ${exam.isCompleted ? styles.completed : ''}`}
              onClick={() => handleExamClick(exam)}
            >
              <div className={styles.examHeader}>
                {exam.subjectIcon && (
                  <span className={styles.icon}>{exam.subjectIcon}</span>
                )}
                <h3>{exam.subjectName}</h3>
              </div>
              <div className={styles.examDetails}>
                <div className={styles.detail}>
                  <span className={styles.label}>Duration:</span>
                  <span className={styles.value}>{formatDuration(exam.durationMinutes)}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.label}>Questions:</span>
                  <span className={styles.value}>100</span>
                </div>
              </div>
              <div className={styles.examFooter}>
                {exam.isCompleted ? (
                  <span className={styles.completedBadge}>Already Taken</span>
                ) : (
                  <span className={styles.availableBadge}>Available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exam Password Modal */}
      <Modal
        isOpen={selectedExam !== null}
        onClose={handleCloseModal}
        title={`Start ${selectedExam?.subjectName} Exam`}
      >
        <div className={styles.modalContent}>
          <p className={styles.modalDescription}>
            Enter the exam password provided by your teacher to begin.
          </p>
          <p className={styles.modalWarning}>
            <strong>Note:</strong> Once you start, the timer will begin immediately.
            You will have {selectedExam && formatDuration(selectedExam.durationMinutes)} to complete the exam.
          </p>
          <Input
            label="Exam Password"
            type="password"
            value={examPassword}
            onChange={(e) => setExamPassword(e.target.value)}
            error={passwordError}
            fullWidth
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleStartExam();
              }
            }}
          />
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleStartExam} loading={submitting}>
              Start Exam
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
