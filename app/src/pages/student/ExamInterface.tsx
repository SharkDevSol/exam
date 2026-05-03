import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Loading, Modal } from '../../components';
import ExamHeader from './components/ExamHeader';
import Timer from './components/Timer';
import QuestionDisplay from './components/QuestionDisplay';
import QuestionNavigation from './components/QuestionNavigation';
import QuestionOverviewPanel from './components/QuestionOverviewPanel';
import api, { getErrorMessage } from '../../services/api';
import styles from './ExamInterface.module.css';

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface ExamSession {
  id: string;
  examId: string;
  studentId: string;
  startTime: string;
  durationMinutes: number;
  questions: Question[];
  subjectName: string;
  subjectIcon?: string;
}

interface StudentInfo {
  name: string;
  admissionNumber: string;
  schoolName: string;
}

export default function ExamInterface() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, 'A' | 'B' | 'C' | 'D'>>(new Map());
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [unansweredQuestions, setUnansweredQuestions] = useState<number[]>([]);

  // Load exam session and questions
  useEffect(() => {
    if (!examId) {
      setError('Invalid exam ID');
      setLoading(false);
      return;
    }

    loadExamSession();
  }, [examId]);

  const loadExamSession = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch exam session with questions
      const questionsResponse = await api.get(`/student/exams/${examId}/questions`);
      const questions: Question[] = questionsResponse.data.map((q: any) => ({
        id: q.questionId,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
      }));

      // Fetch exam details to get subject name and duration
      const examsResponse = await api.get('/student/exams');
      const currentExam = examsResponse.data.find((e: any) => e.examId === examId);
      
      if (!currentExam) {
        throw new Error('Exam not found');
      }

      // Get session details (we need to fetch this from a different endpoint or use stored data)
      // For now, we'll use the data from the start exam response stored in localStorage
      const sessionData = localStorage.getItem(`exam_session_${examId}`);
      let startTime = new Date();
      let durationMinutes = currentExam.durationMinutes;
      
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          startTime = new Date(parsed.startTime);
          durationMinutes = parsed.durationMinutes;
        } catch (e) {
          console.error('Failed to parse session data:', e);
        }
      }

      const session: ExamSession = {
        id: '', // We don't have this from the API
        examId: examId!,
        studentId: localStorage.getItem('studentUserId') || '',
        startTime: startTime.toISOString(),
        durationMinutes,
        questions,
        subjectName: currentExam.subjectName,
        subjectIcon: currentExam.subjectIcon,
      };

      setExamSession(session);

      // Set student info from localStorage or use defaults
      const storedStudentInfo = localStorage.getItem('studentInfo');
      if (storedStudentInfo) {
        try {
          setStudentInfo(JSON.parse(storedStudentInfo));
        } catch (e) {
          // Use default values
          setStudentInfo({
            name: 'Student',
            admissionNumber: 'N/A',
            schoolName: 'School',
          });
        }
      } else {
        setStudentInfo({
          name: 'Student',
          admissionNumber: 'N/A',
          schoolName: 'School',
        });
      }

      // Load saved answers from localStorage
      const savedAnswers = localStorage.getItem(`exam_answers_${examId}`);
      if (savedAnswers) {
        try {
          const parsedAnswers = JSON.parse(savedAnswers);
          setAnswers(new Map(Object.entries(parsedAnswers)));
        } catch (e) {
          console.error('Failed to parse saved answers:', e);
        }
      }

      // Load flagged questions from localStorage
      const savedFlags = localStorage.getItem(`exam_flags_${examId}`);
      if (savedFlags) {
        try {
          const parsedFlags = JSON.parse(savedFlags);
          setFlaggedQuestions(new Set(parsedFlags));
        } catch (e) {
          console.error('Failed to parse saved flags:', e);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Auto-save answer
  const handleAnswerSelect = useCallback(
    async (answer: 'A' | 'B' | 'C' | 'D') => {
      if (!examSession) return;

      const currentQuestion = examSession.questions[currentQuestionIndex];
      const newAnswers = new Map(answers);
      newAnswers.set(currentQuestion.id, answer);
      setAnswers(newAnswers);

      // Save to localStorage immediately
      const answersObj = Object.fromEntries(newAnswers);
      localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(answersObj));

      // Auto-save to server
      try {
        // Get session ID from localStorage
        const sessionData = localStorage.getItem(`exam_session_${examId}`);
        if (sessionData) {
          const { sessionId } = JSON.parse(sessionData);
          await api.post('/student/answers/save', {
            sessionId,
            questionId: currentQuestion.id,
            answer,
          });
        }
      } catch (err) {
        console.error('Failed to auto-save answer:', err);
        // Answer is still saved in localStorage, will sync later
      }
    },
    [examSession, currentQuestionIndex, answers, examId]
  );

  // Toggle flag
  const handleToggleFlag = useCallback(() => {
    const newFlags = new Set(flaggedQuestions);
    if (newFlags.has(currentQuestionIndex)) {
      newFlags.delete(currentQuestionIndex);
    } else {
      newFlags.add(currentQuestionIndex);
    }
    setFlaggedQuestions(newFlags);

    // Save to localStorage
    localStorage.setItem(`exam_flags_${examId}`, JSON.stringify([...newFlags]));

    // Sync to server
    if (!examSession) return;
    const currentQuestion = examSession.questions[currentQuestionIndex];
    
    // Get session ID from localStorage
    const sessionData = localStorage.getItem(`exam_session_${examId}`);
    if (sessionData) {
      try {
        const { sessionId } = JSON.parse(sessionData);
        if (newFlags.has(currentQuestionIndex)) {
          api.post(`/student/questions/${currentQuestion.id}/flag`, { sessionId }).catch(console.error);
        } else {
          api.delete(`/student/questions/${currentQuestion.id}/flag`, { data: { sessionId } }).catch(console.error);
        }
      } catch (e) {
        console.error('Failed to parse session data:', e);
      }
    }
  }, [currentQuestionIndex, flaggedQuestions, examId, examSession]);

  // Navigation handlers
  const handleNext = () => {
    if (examSession && currentQuestionIndex < examSession.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNavigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Timer expiry handler
  const handleTimeExpired = useCallback(async () => {
    if (!examSession) return;
    
    // Auto-submit exam
    try {
      await api.post(`/student/exams/${examId}/submit`, {
        answers: Array.from(answers.entries()).map(([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        })),
      });

      // Clear localStorage
      localStorage.removeItem(`exam_answers_${examId}`);
      localStorage.removeItem(`exam_flags_${examId}`);
      localStorage.removeItem(`exam_timer_${examId}`);

      // Navigate to results
      navigate('/student/results');
    } catch (err) {
      console.error('Failed to auto-submit exam:', err);
      setError('Failed to submit exam. Please try again.');
    }
  }, [examSession, examId, answers, navigate]);

  // Submit exam
  const handleSubmitClick = () => {
    if (!examSession) return;

    // Check for unanswered questions
    const unanswered: number[] = [];
    examSession.questions.forEach((question, index) => {
      if (!answers.has(question.id)) {
        unanswered.push(index + 1);
      }
    });

    setUnansweredQuestions(unanswered);
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!examSession) return;

    try {
      setSubmitting(true);

      await api.post(`/student/exams/${examId}/submit`, {
        answers: Array.from(answers.entries()).map(([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        })),
      });

      // Clear localStorage
      localStorage.removeItem(`exam_answers_${examId}`);
      localStorage.removeItem(`exam_flags_${examId}`);
      localStorage.removeItem(`exam_timer_${examId}`);

      // Navigate to results
      navigate('/student/results');
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loading />
      </div>
    );
  }

  if (error || !examSession || !studentInfo) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>{error || 'Failed to load exam'}</div>
        <Button onClick={() => navigate('/student')}>Back to Exams</Button>
      </div>
    );
  }

  const currentQuestion = examSession.questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion.id) || null;
  const answeredQuestions = new Set(
    examSession.questions
      .map((q, idx) => (answers.has(q.id) ? idx : -1))
      .filter((idx) => idx !== -1)
  );

  return (
    <div className={styles.container}>
      <ExamHeader
        studentName={studentInfo.name}
        subjectName={examSession.subjectName}
        subjectIcon={examSession.subjectIcon}
        schoolName={studentInfo.schoolName}
        admissionNumber={studentInfo.admissionNumber}
      />

      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <div className={styles.timerSection}>
            <Timer
              examId={examId!}
              durationMinutes={examSession.durationMinutes}
              startTime={new Date(examSession.startTime)}
              onTimeExpired={handleTimeExpired}
            />
          </div>

          <div className={styles.overviewSection}>
            <QuestionOverviewPanel
              totalQuestions={examSession.questions.length}
              currentIndex={currentQuestionIndex}
              answeredQuestions={answeredQuestions}
              flaggedQuestions={flaggedQuestions}
              onNavigate={handleNavigateToQuestion}
            />
          </div>

          <div className={styles.submitSection}>
            <Button onClick={handleSubmitClick} fullWidth>
              Finish Exam
            </Button>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <QuestionDisplay
            question={currentQuestion}
            currentAnswer={currentAnswer}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={examSession.questions.length}
            onAnswerSelect={handleAnswerSelect}
          />

          <QuestionNavigation
            currentIndex={currentQuestionIndex}
            totalQuestions={examSession.questions.length}
            isFlagged={flaggedQuestions.has(currentQuestionIndex)}
            onNext={handleNext}
            onBack={handleBack}
            onToggleFlag={handleToggleFlag}
          />
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => !submitting && setShowSubmitModal(false)}
        title="Submit Exam?"
      >
        <div className={styles.modalContent}>
          {unansweredQuestions.length > 0 ? (
            <>
              <p className={styles.warningText}>
                You have {unansweredQuestions.length} unanswered question(s):
              </p>
              <div className={styles.unansweredList}>
                {unansweredQuestions.map((num) => (
                  <span key={num} className={styles.unansweredNumber}>
                    {num}
                  </span>
                ))}
              </div>
              <p className={styles.confirmText}>
                Are you sure you want to submit? Unanswered questions will be marked as incorrect.
              </p>
            </>
          ) : (
            <p className={styles.confirmText}>
              All questions have been answered. Are you sure you want to submit your exam?
              You will not be able to make changes after submission.
            </p>
          )}
          <div className={styles.modalActions}>
            <Button
              variant="secondary"
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit} loading={submitting}>
              Submit Exam
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
