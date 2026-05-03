import styles from './QuestionOverviewPanel.module.css';

interface QuestionOverviewPanelProps {
  totalQuestions: number;
  currentIndex: number;
  answeredQuestions: Set<number>;
  flaggedQuestions: Set<number>;
  onNavigate: (index: number) => void;
}

export default function QuestionOverviewPanel({
  totalQuestions,
  currentIndex,
  answeredQuestions,
  flaggedQuestions,
  onNavigate,
}: QuestionOverviewPanelProps) {
  const getQuestionStatus = (index: number): string => {
    const classes = [styles.questionCard];
    
    if (index === currentIndex) {
      classes.push(styles.current);
    }
    if (answeredQuestions.has(index)) {
      classes.push(styles.answered);
    }
    if (flaggedQuestions.has(index)) {
      classes.push(styles.flagged);
    }
    
    return classes.join(' ');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Question Overview</h3>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.legendCurrent}`}></div>
            <span>Current</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.legendAnswered}`}></div>
            <span>Answered</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.legendFlagged}`}></div>
            <span>Flagged</span>
          </div>
        </div>
      </div>

      <div className={styles.questionsGrid}>
        {Array.from({ length: totalQuestions }, (_, index) => (
          <button
            key={index}
            className={getQuestionStatus(index)}
            onClick={() => onNavigate(index)}
            title={`Question ${index + 1}`}
          >
            <span className={styles.questionNumber}>{index + 1}</span>
            {flaggedQuestions.has(index) && (
              <span className={styles.flagIndicator}>🚩</span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Answered:</span>
          <span className={styles.summaryValue}>
            {answeredQuestions.size} / {totalQuestions}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Flagged:</span>
          <span className={styles.summaryValue}>{flaggedQuestions.size}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Remaining:</span>
          <span className={styles.summaryValue}>
            {totalQuestions - answeredQuestions.size}
          </span>
        </div>
      </div>
    </div>
  );
}
