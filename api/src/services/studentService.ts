import pool from '../config/database';
import { verifyPassword } from '../utils/auth';
import { generateJWT } from '../utils/auth';
import { randomizeQuestions, generateSeed } from '../utils/randomization';
import { calculateScore, Answer } from '../utils/scoring';
import { calculateRemainingSeconds, isTimeExpired } from '../utils/timer';

export class StudentService {
  /**
   * Authenticate student and return JWT
   */
  async authenticate(username: string, password: string): Promise<string | null> {
    const result = await pool.query(
      'SELECT id, password_hash FROM students WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const student = result.rows[0];
    const isValid = await verifyPassword(password, student.password_hash);
    
    if (!isValid) {
      return null;
    }
    
    // Generate JWT token
    return generateJWT(student.id, 'student');
  }
  
  /**
   * Get all public exams available to student
   */
  async getAvailableExams(studentId: string): Promise<Array<{
    examId: string;
    subjectName: string;
    durationMinutes: number;
    isCompleted: boolean;
  }>> {
    const result = await pool.query(`
      SELECT 
        e.id as exam_id,
        sub.name as subject_name,
        e.duration_minutes,
        CASE WHEN es.id IS NOT NULL THEN true ELSE false END as is_completed
      FROM exams e
      JOIN subjects sub ON sub.id = e.subject_id
      LEFT JOIN exam_sessions es ON es.exam_id = e.id AND es.student_id = $1 AND es.is_submitted = true
      WHERE e.is_public = true AND e.is_finished = true
      ORDER BY e.created_at DESC
    `, [studentId]);
    
    return result.rows.map(row => ({
      examId: row.exam_id,
      subjectName: row.subject_name,
      durationMinutes: row.duration_minutes,
      isCompleted: row.is_completed,
    }));
  }
  
  /**
   * Start an exam (validate password and create session)
   */
  async startExam(studentId: string, examId: string, password: string): Promise<{
    sessionId: string;
    durationMinutes: number;
    startTime: Date;
  }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verify exam exists and password is correct
      const examResult = await client.query(
        'SELECT id, password, duration_minutes, is_public, is_finished FROM exams WHERE id = $1',
        [examId]
      );
      
      if (examResult.rows.length === 0) {
        throw new Error('Exam not found');
      }
      
      const exam = examResult.rows[0];
      
      if (!exam.is_public || !exam.is_finished) {
        throw new Error('Exam is not available');
      }
      
      if (exam.password !== password) {
        throw new Error('Incorrect exam password');
      }
      
      // Check if student already completed this exam
      const existingSession = await client.query(
        'SELECT id FROM exam_sessions WHERE student_id = $1 AND exam_id = $2',
        [studentId, examId]
      );
      
      if (existingSession.rows.length > 0) {
        throw new Error('You have already taken this exam');
      }
      
      // Get all questions for this exam
      const questionsResult = await client.query(
        'SELECT id FROM questions WHERE exam_id = $1 ORDER BY original_order',
        [examId]
      );
      
      const questionIds = questionsResult.rows.map(row => row.id);
      
      // Generate randomized order
      const seed = generateSeed(studentId, examId);
      const randomizedIds = randomizeQuestions(questionIds, seed);
      const randomizedOrder = randomizedIds.map(id => questionIds.indexOf(id));
      
      // Create exam session
      const startTime = new Date();
      const sessionResult = await client.query(
        `INSERT INTO exam_sessions (student_id, exam_id, randomized_order, start_time, duration_minutes)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [studentId, examId, JSON.stringify(randomizedOrder), startTime, exam.duration_minutes]
      );
      
      await client.query('COMMIT');
      
      return {
        sessionId: sessionResult.rows[0].id,
        durationMinutes: exam.duration_minutes,
        startTime,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get randomized questions for student's exam session
   */
  async getExamQuestions(studentId: string, examId: string): Promise<Array<{
    questionId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    displayOrder: number;
  }>> {
    // Get session
    const sessionResult = await pool.query(
      'SELECT id, randomized_order FROM exam_sessions WHERE student_id = $1 AND exam_id = $2',
      [studentId, examId]
    );
    
    if (sessionResult.rows.length === 0) {
      throw new Error('Exam session not found');
    }
    
    const randomizedOrder = sessionResult.rows[0].randomized_order as number[];
    
    // Get all questions
    const questionsResult = await pool.query(
      'SELECT id, question_text, option_a, option_b, option_c, option_d, original_order FROM questions WHERE exam_id = $1 ORDER BY original_order',
      [examId]
    );
    
    const questions = questionsResult.rows;
    
    // Reorder according to randomized order
    const randomizedQuestions = randomizedOrder.map((index, displayOrder) => {
      const q = questions[index];
      return {
        questionId: q.id,
        questionText: q.question_text,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        displayOrder: displayOrder + 1,
      };
    });
    
    return randomizedQuestions;
  }
  
  /**
   * Save/update student answer
   */
  async saveAnswer(sessionId: string, questionId: string, answer: 'A' | 'B' | 'C' | 'D'): Promise<void> {
    await pool.query(
      `INSERT INTO answers (exam_session_id, question_id, selected_answer)
       VALUES ($1, $2, $3)
       ON CONFLICT (exam_session_id, question_id)
       DO UPDATE SET selected_answer = $3, updated_at = CURRENT_TIMESTAMP`,
      [sessionId, questionId, answer]
    );
  }
  
  /**
   * Flag a question
   */
  async flagQuestion(sessionId: string, questionId: string): Promise<void> {
    await pool.query(
      `INSERT INTO flagged_questions (exam_session_id, question_id)
       VALUES ($1, $2)
       ON CONFLICT (exam_session_id, question_id) DO NOTHING`,
      [sessionId, questionId]
    );
  }
  
  /**
   * Unflag a question
   */
  async unflagQuestion(sessionId: string, questionId: string): Promise<void> {
    await pool.query(
      'DELETE FROM flagged_questions WHERE exam_session_id = $1 AND question_id = $2',
      [sessionId, questionId]
    );
  }
  
  /**
   * Get remaining time for exam
   */
  async getRemainingTime(studentId: string, examId: string): Promise<number> {
    const result = await pool.query(
      'SELECT start_time, duration_minutes FROM exam_sessions WHERE student_id = $1 AND exam_id = $2',
      [studentId, examId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Exam session not found');
    }
    
    const { start_time, duration_minutes } = result.rows[0];
    return calculateRemainingSeconds(new Date(start_time), duration_minutes);
  }
  
  /**
   * Submit exam
   */
  async submitExam(studentId: string, examId: string): Promise<{ score: number; unansweredQuestions: string[] }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get session
      const sessionResult = await client.query(
        'SELECT id, start_time, duration_minutes, is_submitted FROM exam_sessions WHERE student_id = $1 AND exam_id = $2',
        [studentId, examId]
      );
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Exam session not found');
      }
      
      const session = sessionResult.rows[0];
      
      if (session.is_submitted) {
        throw new Error('Exam already submitted');
      }
      
      // Check if time expired
      const timeExpired = isTimeExpired(new Date(session.start_time), session.duration_minutes);
      
      // Get all questions with correct answers
      const questionsResult = await client.query(
        'SELECT id, correct_answer FROM questions WHERE exam_id = $1',
        [examId]
      );
      
      // Get student answers
      const answersResult = await client.query(
        'SELECT question_id, selected_answer FROM answers WHERE exam_session_id = $1',
        [session.id]
      );
      
      const studentAnswersMap = new Map(
        answersResult.rows.map(row => [row.question_id, row.selected_answer])
      );
      
      // Build answers array for scoring
      const answers: Answer[] = questionsResult.rows.map(q => ({
        questionId: q.id,
        selectedAnswer: studentAnswersMap.get(q.id) || null,
        correctAnswer: q.correct_answer,
      }));
      
      // Calculate score
      const score = calculateScore(answers);
      
      // Get unanswered questions
      const unansweredQuestions = answers
        .filter(a => a.selectedAnswer === null)
        .map(a => a.questionId);
      
      // Mark session as submitted
      await client.query(
        'UPDATE exam_sessions SET is_submitted = true, end_time = CURRENT_TIMESTAMP WHERE id = $1',
        [session.id]
      );
      
      // Create result
      await client.query(
        'INSERT INTO results (exam_session_id, student_id, exam_id, score, total_questions) VALUES ($1, $2, $3, $4, 100)',
        [session.id, studentId, examId, score]
      );
      
      await client.query('COMMIT');
      
      return { score, unansweredQuestions };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get student results
   */
  async getResults(studentId: string): Promise<Array<{
    examId: string;
    subjectName: string;
    score: number;
    totalQuestions: number;
    completedAt: Date;
  }>> {
    const result = await pool.query(`
      SELECT 
        r.exam_id,
        sub.name as subject_name,
        r.score,
        r.total_questions,
        r.completed_at
      FROM results r
      JOIN exams e ON e.id = r.exam_id
      JOIN subjects sub ON sub.id = e.subject_id
      WHERE r.student_id = $1
      ORDER BY r.completed_at DESC
    `, [studentId]);
    
    return result.rows.map(row => ({
      examId: row.exam_id,
      subjectName: row.subject_name,
      score: row.score,
      totalQuestions: row.total_questions,
      completedAt: row.completed_at,
    }));
  }
  
  /**
   * Get detailed exam results
   */
  async getExamDetails(studentId: string, examId: string): Promise<any> {
    // Get result
    const resultQuery = await pool.query(`
      SELECT r.score, r.total_questions, r.completed_at, es.id as session_id
      FROM results r
      JOIN exam_sessions es ON es.id = r.exam_session_id
      WHERE r.student_id = $1 AND r.exam_id = $2
    `, [studentId, examId]);
    
    if (resultQuery.rows.length === 0) {
      throw new Error('Result not found');
    }
    
    const sessionId = resultQuery.rows[0].session_id;
    
    // Get all answers with questions
    const answersQuery = await pool.query(`
      SELECT 
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        a.selected_answer
      FROM questions q
      LEFT JOIN answers a ON a.question_id = q.id AND a.exam_session_id = $1
      WHERE q.exam_id = $2
      ORDER BY q.original_order
    `, [sessionId, examId]);
    
    return {
      score: resultQuery.rows[0].score,
      totalQuestions: resultQuery.rows[0].total_questions,
      completedAt: resultQuery.rows[0].completed_at,
      answers: answersQuery.rows,
    };
  }
}

export default new StudentService();
