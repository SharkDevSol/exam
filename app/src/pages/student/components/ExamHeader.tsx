import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal } from '../../../components';
import styles from './ExamHeader.module.css';

interface ExamHeaderProps {
  studentName: string;
  subjectName: string;
  subjectIcon?: string;
  schoolName: string;
  admissionNumber: string;
}

export default function ExamHeader({
  studentName,
  subjectName,
  subjectIcon,
  schoolName,
  admissionNumber,
}: ExamHeaderProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const navigate = useNavigate();

  const handleExitClick = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = () => {
    navigate('/student');
  };

  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.leftSection}>
          <Button variant="secondary" onClick={handleExitClick}>
            ← Back
          </Button>
        </div>

        <div className={styles.centerSection}>
          <div className={styles.subjectInfo}>
            {subjectIcon && <span className={styles.icon}>{subjectIcon}</span>}
            <h1 className={styles.subjectName}>{subjectName}</h1>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.studentInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Student:</span>
              <span className={styles.value}>{studentName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>School:</span>
              <span className={styles.value}>{schoolName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Admission No:</span>
              <span className={styles.value}>{admissionNumber}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitConfirm}
        onClose={handleCancelExit}
        title="Exit Exam?"
      >
        <div className={styles.modalContent}>
          <p className={styles.warningText}>
            Are you sure you want to exit the exam? Your progress has been saved,
            but you should only exit if absolutely necessary.
          </p>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={handleCancelExit}>
              Cancel
            </Button>
            <Button onClick={handleConfirmExit}>
              Exit Exam
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
