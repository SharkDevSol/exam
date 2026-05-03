import { Button } from '../../../components';
import styles from './QuestionNavigation.module.css';

interface QuestionNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  isFlagged: boolean;
  onNext: () => void;
  onBack: () => void;
  onToggleFlag: () => void;
}

export default function QuestionNavigation({
  currentIndex,
  totalQuestions,
  isFlagged,
  onNext,
  onBack,
  onToggleFlag,
}: QuestionNavigationProps) {
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={isFirstQuestion}
        >
          ← Back
        </Button>
      </div>

      <div className={styles.centerSection}>
        <button
          className={`${styles.flagButton} ${isFlagged ? styles.flagged : ''}`}
          onClick={onToggleFlag}
          title={isFlagged ? 'Remove flag' : 'Flag for review'}
        >
          <span className={styles.flagIcon}>🚩</span>
          <span className={styles.flagText}>
            {isFlagged ? 'Flagged' : 'Flag for Review'}
          </span>
        </button>
      </div>

      <div className={styles.rightSection}>
        <Button
          onClick={onNext}
          disabled={isLastQuestion}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
