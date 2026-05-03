import { useState, useEffect } from 'react';
import styles from './QuestionDisplay.module.css';

interface QuestionDisplayProps {
  question: {
    id: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
  };
  currentAnswer: 'A' | 'B' | 'C' | 'D' | null;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSelect: (answer: 'A' | 'B' | 'C' | 'D') => void;
}

export default function QuestionDisplay({
  question,
  currentAnswer,
  questionNumber,
  totalQuestions,
  onAnswerSelect,
}: QuestionDisplayProps) {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(
    currentAnswer
  );

  // Update selected option when currentAnswer changes (e.g., navigating between questions)
  useEffect(() => {
    setSelectedOption(currentAnswer);
  }, [currentAnswer, question.id]);

  const handleOptionClick = (option: 'A' | 'B' | 'C' | 'D') => {
    setSelectedOption(option);
    onAnswerSelect(option);
  };

  const options = [
    { value: 'A' as const, text: question.optionA },
    { value: 'B' as const, text: question.optionB },
    { value: 'C' as const, text: question.optionC },
    { value: 'D' as const, text: question.optionD },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.questionHeader}>
        <span className={styles.questionNumber}>
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>

      <div className={styles.questionText}>{question.questionText}</div>

      <div className={styles.optionsContainer}>
        {options.map((option) => (
          <div
            key={option.value}
            className={`${styles.option} ${
              selectedOption === option.value ? styles.selected : ''
            }`}
            onClick={() => handleOptionClick(option.value)}
          >
            <div className={styles.optionRadio}>
              <input
                type="radio"
                name="answer"
                value={option.value}
                checked={selectedOption === option.value}
                onChange={() => handleOptionClick(option.value)}
                className={styles.radioInput}
              />
              <span className={styles.radioLabel}>{option.value}</span>
            </div>
            <div className={styles.optionText}>{option.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
