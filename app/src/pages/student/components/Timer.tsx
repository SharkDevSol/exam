import { useState, useEffect, useRef } from 'react';
import styles from './Timer.module.css';

interface TimerProps {
  examId: string;
  durationMinutes: number;
  startTime: Date;
  onTimeExpired: () => void;
}

export default function Timer({
  examId,
  durationMinutes,
  startTime,
  onTimeExpired,
}: TimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const timerRef = useRef<number | null>(null);
  const hasExpiredRef = useRef(false);

  // Calculate remaining time
  const calculateRemainingTime = (): number => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const endTime = start + durationMinutes * 60 * 1000;
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    return remaining;
  };

  // Initialize timer from localStorage or calculate fresh
  useEffect(() => {
    const storageKey = `exam_timer_${examId}`;
    const storedData = localStorage.getItem(storageKey);

    if (storedData) {
      try {
        const { startTime: storedStart, durationMinutes: storedDuration } = JSON.parse(storedData);
        // Verify stored data matches current exam
        if (storedStart === startTime.toISOString() && storedDuration === durationMinutes) {
          const remaining = calculateRemainingTime();
          setRemainingSeconds(remaining);
        } else {
          // Data mismatch, use fresh calculation
          const remaining = calculateRemainingTime();
          setRemainingSeconds(remaining);
          localStorage.setItem(storageKey, JSON.stringify({
            startTime: startTime.toISOString(),
            durationMinutes,
          }));
        }
      } catch (error) {
        // Invalid stored data, calculate fresh
        const remaining = calculateRemainingTime();
        setRemainingSeconds(remaining);
      }
    } else {
      // No stored data, calculate fresh and store
      const remaining = calculateRemainingTime();
      setRemainingSeconds(remaining);
      localStorage.setItem(storageKey, JSON.stringify({
        startTime: startTime.toISOString(),
        durationMinutes,
      }));
    }
  }, [examId, startTime, durationMinutes]);

  // Update timer every second
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const remaining = calculateRemainingTime();
      setRemainingSeconds(remaining);

      // Set warning states
      if (remaining <= 300 && remaining > 60) {
        setIsWarning(true);
        setIsCritical(false);
      } else if (remaining <= 60) {
        setIsWarning(false);
        setIsCritical(true);
      } else {
        setIsWarning(false);
        setIsCritical(false);
      }

      // Handle expiration
      if (remaining === 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        onTimeExpired();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examId, startTime, durationMinutes, onTimeExpired]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerClass = `${styles.timer} ${isWarning ? styles.warning : ''} ${
    isCritical ? styles.critical : ''
  }`;

  return (
    <div className={timerClass}>
      <div className={styles.label}>Time Remaining</div>
      <div className={styles.time}>{formatTime(remainingSeconds)}</div>
      {isCritical && (
        <div className={styles.criticalMessage}>Less than 1 minute!</div>
      )}
      {isWarning && !isCritical && (
        <div className={styles.warningMessage}>Less than 5 minutes</div>
      )}
    </div>
  );
}
