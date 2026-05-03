import { useState, FormEvent } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { Button, Input, Modal } from '../../components';
import QuestionEntry from './QuestionEntry';
import ExcelImport from './ExcelImport';
import styles from './ExamCreation.module.css';

interface Question {
  question: string;
  A: string;
  B: string;
  C: string;
  D: string;
  Answer: 'A' | 'B' | 'C' | 'D';
}

export default function ExamCreation() {
  const [questions, setQuestions] = useState<Question[]>(
    Array(100).fill(null).map(() => ({
      question: '',
      A: '',
      B: '',
      C: '',
      D: '',
      Answer: 'A' as const,
    }))
  );
  const [hours, setHours] = useState('2');
  const [minutes, setMinutes] = useState('0');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [examPassword, setExamPassword] = useState('');
  const [examId, setExamId] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [entryMode, setEntryMode] = useState<'manual' | 'excel'>('manual');

  const answeredCount = questions.filter(
    (q) => q.question.trim() && q.A.trim() && q.B.trim() && q.C.trim() && q.D.trim()
  ).length;

  const handleQuestionChange = (index: number, question: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = question;
    setQuestions(newQuestions);
  };

  const handleExcelImport = (importedQuestions: Question[]) => {
    if (importedQuestions.length === 100) {
      setQuestions(importedQuestions);
      setSuccess('Successfully imported 100 questions from Excel');
      setEntryMode('manual'); // Switch to manual mode to review
    }
  };

  const validateExam = (): boolean => {
    if (answeredCount !== 100) {
      setError(`Exam must contain exactly 100 questions. Current count: ${answeredCount}`);
      return false;
    }

    const durationMinutes = parseInt(hours) * 60 + parseInt(minutes);
    if (durationMinutes <= 0) {
      setError('Exam duration must be greater than 0');
      return false;
    }

    return true;
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateExam()) {
      return;
    }

    setLoading(true);

    try {
      const durationMinutes = parseInt(hours) * 60 + parseInt(minutes);
      const response = await api.post('/teacher/exams', {
        questions,
        durationMinutes,
      });

      setExamId(response.data.id);
      setExamPassword(response.data.password);
      setShowPasswordModal(true);
      setSuccess('Exam created successfully!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!examId) return;

    try {
      await api.put(`/teacher/exams/${examId}/publish`);
      setSuccess('Exam published successfully! Students can now access it.');
      setShowPasswordModal(false);
      
      // Reset form
      setQuestions(
        Array(100).fill(null).map(() => ({
          question: '',
          A: '',
          B: '',
          C: '',
          D: '',
          Answer: 'A' as const,
        }))
      );
      setHours('2');
      setMinutes('0');
      setExamId('');
      setExamPassword('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Create New Exam</h2>
        <p className={styles.description}>
          Create an exam with exactly 100 questions. You can enter questions manually or import from Excel.
        </p>
      </div>

      <div className={styles.modeSelector}>
        <button
          className={`${styles.modeButton} ${entryMode === 'manual' ? styles.active : ''}`}
          onClick={() => setEntryMode('manual')}
        >
          Manual Entry
        </button>
        <button
          className={`${styles.modeButton} ${entryMode === 'excel' ? styles.active : ''}`}
          onClick={() => setEntryMode('excel')}
        >
          Excel Import
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.questionCounter}>
        <span className={styles.counterLabel}>Questions Completed:</span>
        <span className={`${styles.counterValue} ${answeredCount === 100 ? styles.complete : ''}`}>
          {answeredCount} / 100
        </span>
      </div>

      {entryMode === 'excel' ? (
        <ExcelImport onImport={handleExcelImport} />
      ) : (
        <QuestionEntry
          questions={questions}
          onQuestionChange={handleQuestionChange}
        />
      )}

      <form onSubmit={handleFinish} className={styles.durationForm}>
        <h3 className={styles.subheading}>Exam Duration</h3>
        <div className={styles.durationInputs}>
          <Input
            label="Hours"
            type="number"
            min="0"
            max="5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            label="Minutes"
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || answeredCount !== 100}
          fullWidth
        >
          {loading ? 'Creating Exam...' : 'Finish & Generate Password'}
        </Button>
      </form>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Exam Created Successfully"
      >
        <div className={styles.passwordModal}>
          <p className={styles.passwordLabel}>Exam Password:</p>
          <div className={styles.passwordDisplay}>{examPassword}</div>
          <p className={styles.passwordHint}>
            Share this password with your students. They will need it to access the exam.
          </p>
          <div className={styles.modalActions}>
            <Button onClick={handlePublish} fullWidth>
              Make Public
            </Button>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)} fullWidth>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
