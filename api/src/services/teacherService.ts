import pool from '../config/database';
import { hashPassword, verifyPassword } from '../utils/auth';
import { generateExamPassword } from '../utils/passwordGenerator';
import { ExcelQuestion, parseExamQuestions, generateExamTemplate } from '../utils/excelProcessor';

export class TeacherService {
  /**
   * Register a new teacher
   */
  async register(username: string, password: string, subjectId: string): Promise<{ id: string; subjectId: string }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if subject is already assigned
      const existingTeacher = await client.query(
        'SELECT id FROM teachers WHERE subject_id = $1',
        [subjectId]
      );
      
      if (existingTeacher.rows.length > 0) {
        throw new Error('Subject already assigned to another teacher');
      }
      
      // Hash password and create teacher
      const passwordHash = await hashPassword(password);
      const result = await client.query(
        'INSERT INTO teachers (username, password_hash, subject_id) VALUES ($1, $2, $3) RETURNING id, subject_id',
        [username, passwordHash, subjectId]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Authenticate teacher
   */
  async authenticate(username: string, password: string): Promise<{ id: string; subjectId: string } | null> {
    const result = await pool.query(
      'SELECT id, password_hash, subject_id FROM teachers WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const teacher = result.rows[0];
    const isValid = await verifyPassword(password, teacher.password_hash);
    
    if (!isValid) {
      return null;
    }
    
    return { id: teacher.id, subjectId: teacher.subject_id };
  }
  
  /**
   * Get available (unassigned) subjects
   */
  async getAvailableSubjects(): Promise<Array<{ id: string; name: string }>> {
    const result = await pool.query(`
      SELECT s.id, s.name
      FROM subjects s
      LEFT JOIN teachers t ON t.subject_id = s.id
      WHERE t.id IS NULL
      ORDER BY s.name
    `);
    
    return result.rows;
  }
  
  /**
   * Create an exam with questions
   */
  async createExam(
    teacherId: string,
    subjectId: string,
    questions: ExcelQuestion[],
    durationMinutes: number
  ): Promise<{ id: string; password: string }> {
    if (questions.length !== 100) {
      throw new Error('Exam must contain exactly 100 questions');
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate exam password
      const password = generateExamPassword();
      
      // Create exam
      const examResult = await client.query(
        'INSERT INTO exams (subject_id, teacher_id, password, duration_minutes) VALUES ($1, $2, $3, $4) RETURNING id',
        [subjectId, teacherId, password, durationMinutes]
      );
      
      const examId = examResult.rows[0].id;
      
      // Insert all questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await client.query(
          `INSERT INTO questions (exam_id, original_order, question_text, option_a, option_b, option_c, option_d, correct_answer)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [examId, i + 1, q.question, q.A, q.B, q.C, q.D, q.Answer]
        );
      }
      
      await client.query('COMMIT');
      return { id: examId, password };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Publish an exam (make it public)
   */
  async publishExam(examId: string, teacherId: string): Promise<void> {
    const result = await pool.query(
      'UPDATE exams SET is_public = true WHERE id = $1 AND teacher_id = $2',
      [examId, teacherId]
    );
    
    if (result.rowCount === 0) {
      throw new Error('Exam not found or unauthorized');
    }
  }
  
  /**
   * Mark exam as finished
   */
  async finishExam(examId: string, teacherId: string): Promise<void> {
    const result = await pool.query(
      'UPDATE exams SET is_finished = true WHERE id = $1 AND teacher_id = $2',
      [examId, teacherId]
    );
    
    if (result.rowCount === 0) {
      throw new Error('Exam not found or unauthorized');
    }
  }
  
  /**
   * Get results for teacher's subject
   */
  async getSubjectResults(teacherId: string): Promise<Array<{
    studentId: string;
    studentName: string;
    examId: string;
    score: number;
    totalQuestions: number;
    completedAt: Date;
  }>> {
    const result = await pool.query(`
      SELECT 
        r.student_id,
        s.name as student_name,
        r.exam_id,
        r.score,
        r.total_questions,
        r.completed_at
      FROM results r
      JOIN students s ON s.id = r.student_id
      JOIN exams e ON e.id = r.exam_id
      WHERE e.teacher_id = $1
      ORDER BY r.completed_at DESC
    `, [teacherId]);
    
    return result.rows.map(row => ({
      studentId: row.student_id,
      studentName: row.student_name,
      examId: row.exam_id,
      score: row.score,
      totalQuestions: row.total_questions,
      completedAt: row.completed_at,
    }));
  }
  
  /**
   * Get detailed student exam results
   */
  async getStudentExamDetails(studentId: string, examId: string, teacherId: string): Promise<any> {
    // Verify teacher owns this exam
    const examCheck = await pool.query(
      'SELECT id FROM exams WHERE id = $1 AND teacher_id = $2',
      [examId, teacherId]
    );
    
    if (examCheck.rows.length === 0) {
      throw new Error('Exam not found or unauthorized');
    }
    
    // Get result
    const result = await pool.query(`
      SELECT r.score, r.total_questions, r.completed_at, es.id as session_id
      FROM results r
      JOIN exam_sessions es ON es.id = r.exam_session_id
      WHERE r.student_id = $1 AND r.exam_id = $2
    `, [studentId, examId]);
    
    if (result.rows.length === 0) {
      throw new Error('Result not found');
    }
    
    const sessionId = result.rows[0].session_id;
    
    // Get all answers with questions
    const answers = await pool.query(`
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
      score: result.rows[0].score,
      totalQuestions: result.rows[0].total_questions,
      completedAt: result.rows[0].completed_at,
      answers: answers.rows,
    };
  }
  
  /**
   * Generate Excel template
   */
  getExamTemplate(): Buffer {
    return generateExamTemplate();
  }
  
  /**
   * Parse Excel file with questions
   */
  parseExcelQuestions(buffer: Buffer): ExcelQuestion[] {
    return parseExamQuestions(buffer);
  }
}

export default new TeacherService();
