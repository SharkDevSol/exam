import { useState } from 'react';
import { Input, Select, Button } from '../../components';
import styles from './QuestionEntry.module.css';

interface Question {
  question: string;
  A: string;
  B: string;
  C: string;
  D: string;
  Answer: 'A' | 'B' | 'C' | 'D';
}

interface QuestionEntryProps {
  questions: Question[];
  onQuestionChange: (index: number, question: Question) => void;
}

export default function QuestionEntry({ questions, onQuestionChange }: QuestionEntryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = questions[currentIndex];

  const handleFieldChange = (field: keyof Question, value: string) => {
    onQuestionChange(currentIndex, {
      ...currentQuestion,
      [field]: value,
    });
  };

  const goToNext = () => {
    if (currentIndex < 99) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const isQuestionComplete = (q: Question) => {
    return q.question.trim() && q.A.trim() && q.B.trim() && q.C.trim() && q.D.trim();
  };

  return (
    <div className={styles.container}>
      <div className={styles.navigation}>
        <div className={styles.navHeader}>
          <h3 className={styles.navTitle}>Question {currentIndex + 1} of 100</h3>
          <div className={styles.navButtons}>
            <Button
              size="small"
              variant="secondary"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              ← Previous
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={goToNext}
              disabled={currentIndex === 99}
            >
              Next →
            </Button>
          </div>
        </div>

        <div className={styles.questionGrid}>
          {questions.map((q, index) => (
            <button
              key={index}
              className={`${styles.questionButton} ${
                index === currentIndex ? styles.current : ''
              } ${isQuestionComplete(q) ? styles.complete : ''}`}
              onClick={() => goToQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.questionForm}>
        <Input
          label="Question Text"
          type="text"
          value={currentQuestion.question}
          onChange={(e) => handleFieldChange('question', e.target.value)}
          placeholder="Enter the question"
          required
        />

        <div className={styles.optionsGrid}>
          <Input
            label="Option A"
            type="text"
            value={currentQuestion.A}
            onChange={(e) => handleFieldChange('A', e.target.value)}
            placeholder="Enter option A"
            required
          />

          <Input
            label="Option B"
            type="text"
            value={currentQuestion.B}
            onChange={(e) => handleFieldChange('B', e.target.value)}
            placeholder="Enter option B"
            required
          />

          <Input
            label="Option C"
            type="text"
            value={currentQuestion.C}
            onChange={(e) => handleFieldChange('C', e.target.value)}
            placeholder="Enter option C"
            required
          />

          <Input
            label="Option D"
            type="text"
            value={currentQuestion.D}
            onChange={(e) => handleFieldChange('D', e.target.value)}
            placeholder="Enter option D"
            required
          />
        </div>

        <Select
          label="Correct Answer"
          value={currentQuestion.Answer}
          onChange={(e) => handleFieldChange('Answer', e.target.value as 'A' | 'B' | 'C' | 'D')}
          required
          options={[
            { value: 'A', label: 'A' },
            { value: 'B', label: 'B' },
            { value: 'C', label: 'C' },
            { value: 'D', label: 'D' },
          ]}
        />
      </div>
    </div>
  );
}
