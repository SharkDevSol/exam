/**
 * Calculate remaining time in minutes
 * @param startTime - When the exam started
 * @param durationMinutes - Total exam duration
 * @param currentTime - Current time (defaults to now)
 * @returns Remaining time in minutes (0 if expired)
 */
export function calculateRemainingTime(
  startTime: Date,
  durationMinutes: number,
  currentTime: Date = new Date()
): number {
  const startMs = startTime.getTime();
  const currentMs = currentTime.getTime();
  const durationMs = durationMinutes * 60 * 1000;
  
  const elapsedMs = currentMs - startMs;
  const remainingMs = durationMs - elapsedMs;
  
  if (remainingMs <= 0) {
    return 0;
  }
  
  return Math.ceil(remainingMs / (60 * 1000));
}

/**
 * Calculate end time for an exam
 */
export function calculateEndTime(startTime: Date, durationMinutes: number): Date {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);
  return endTime;
}

/**
 * Check if exam time has expired
 */
export function isTimeExpired(startTime: Date, durationMinutes: number, currentTime: Date = new Date()): boolean {
  return calculateRemainingTime(startTime, durationMinutes, currentTime) === 0;
}

/**
 * Get remaining time in seconds (for more precise countdown)
 */
export function calculateRemainingSeconds(
  startTime: Date,
  durationMinutes: number,
  currentTime: Date = new Date()
): number {
  const startMs = startTime.getTime();
  const currentMs = currentTime.getTime();
  const durationMs = durationMinutes * 60 * 1000;
  
  const elapsedMs = currentMs - startMs;
  const remainingMs = durationMs - elapsedMs;
  
  if (remainingMs <= 0) {
    return 0;
  }
  
  return Math.ceil(remainingMs / 1000);
}

/**
 * Format remaining time as HH:MM:SS
 */
export function formatRemainingTime(remainingSeconds: number): string {
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
