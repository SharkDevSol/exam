import crypto from 'crypto';

/**
 * Fisher-Yates shuffle algorithm for randomizing question order
 * Uses a deterministic seed based on student ID and exam ID for consistency
 */
export function randomizeQuestions(questionIds: string[], seed: string): string[] {
  const array = [...questionIds];
  const rng = createSeededRandom(seed);
  
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array;
}

/**
 * Create a seeded random number generator
 * Returns a function that generates pseudo-random numbers between 0 and 1
 */
function createSeededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

/**
 * Generate a deterministic seed from student ID and exam ID
 */
export function generateSeed(studentId: string, examId: string): string {
  return crypto
    .createHash('sha256')
    .update(`${studentId}:${examId}`)
    .digest('hex');
}

/**
 * Get randomized order for a student's exam
 * Returns array of indices [0-99] in randomized order
 */
export function getRandomizedOrder(questionIds: string[], studentId: string, examId: string): number[] {
  const seed = generateSeed(studentId, examId);
  const randomized = randomizeQuestions(questionIds, seed);
  
  // Return the indices of the randomized questions
  return randomized.map(id => questionIds.indexOf(id));
}
