import pool from '../config/database';
import { hashPassword, verifyPassword } from '../utils/auth';
import { generateStudentCredentials, StudentCredentials } from '../utils/passwordGenerator';
import { parseStudentNames, generateCredentialsFile } from '../utils/excelProcessor';

// Temporary storage for credentials (in production, use Redis or similar)
const credentialsCache = new Map<string, StudentCredentials[]>();

export class AdminService {
  /**
   * Authenticate admin user
   */
  async authenticate(username: string, password: string): Promise<{ id: string } | null> {
    const result = await pool.query(
      'SELECT id, password_hash FROM admins WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const admin = result.rows[0];
    const isValid = await verifyPassword(password, admin.password_hash);
    
    if (!isValid) {
      return null;
    }
    
    return { id: admin.id };
  }
  
  /**
   * Create a new subject
   */
  async createSubject(name: string): Promise<{ id: string; name: string }> {
    const result = await pool.query(
      'INSERT INTO subjects (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    
    return result.rows[0];
  }
  
  /**
   * Get all subjects
   */
  async getAllSubjects(): Promise<Array<{ id: string; name: string; teacherAssigned: boolean }>> {
    const result = await pool.query(`
      SELECT 
        s.id, 
        s.name,
        CASE WHEN t.id IS NOT NULL THEN true ELSE false END as teacher_assigned
      FROM subjects s
      LEFT JOIN teachers t ON t.subject_id = s.id
      ORDER BY s.name
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      teacherAssigned: row.teacher_assigned,
    }));
  }
  
  /**
   * Get teacher assignment for a subject
   */
  async getSubjectAssignment(subjectId: string): Promise<{ teacherUsername: string } | null> {
    const result = await pool.query(
      'SELECT username FROM teachers WHERE subject_id = $1',
      [subjectId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return { teacherUsername: result.rows[0].username };
  }
  
  /**
   * Bulk import students from Excel file
   */
  async bulkImportStudents(fileBuffer: Buffer): Promise<{ 
    imported: number; 
    batchId: string;
    credentials: StudentCredentials[];
  }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Parse student names from Excel
      const names = parseStudentNames(fileBuffer);
      
      // Get existing usernames from database to avoid duplicates
      const existingResult = await client.query('SELECT username FROM students');
      const existingUsernames = existingResult.rows.map(row => row.username);
      
      // Generate credentials with existing usernames check
      const credentials = generateStudentCredentials(names, existingUsernames);
      
      // Insert students into database
      const batchId = `batch_${Date.now()}`;
      
      for (const cred of credentials) {
        const passwordHash = await hashPassword(cred.password);
        await client.query(
          'INSERT INTO students (name, username, password_hash, admission_number) VALUES ($1, $2, $3, $4)',
          [cred.name, cred.username, passwordHash, batchId]
        );
      }
      
      await client.query('COMMIT');
      
      // Store credentials in cache for 10 minutes
      credentialsCache.set(batchId, credentials);
      setTimeout(() => credentialsCache.delete(batchId), 10 * 60 * 1000);
      
      return {
        imported: credentials.length,
        batchId,
        credentials,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get credentials file for a batch
   */
  async getCredentialsFile(batchId: string): Promise<Buffer> {
    // Try to get from cache first
    const cachedCredentials = credentialsCache.get(batchId);
    
    if (cachedCredentials) {
      return generateCredentialsFile(cachedCredentials);
    }
    
    // If not in cache, get student info from database (without passwords)
    const result = await pool.query(
      'SELECT name, username FROM students WHERE admission_number = $1 ORDER BY name',
      [batchId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Batch not found');
    }
    
    // Note: We can't retrieve original passwords (they're hashed)
    // In production, credentials should be downloaded immediately after import
    const credentials = result.rows.map(row => ({
      name: row.name,
      username: row.username,
      password: '[Already hashed - download immediately after import]',
    }));
    
    return generateCredentialsFile(credentials);
  }
  
  /**
   * Get all student results
   */
  async getAllResults(): Promise<Array<{
    studentId: string;
    studentName: string;
    subjectName: string;
    score: number;
    totalQuestions: number;
    completedAt: Date;
  }>> {
    const result = await pool.query(`
      SELECT 
        r.student_id,
        s.name as student_name,
        sub.name as subject_name,
        r.score,
        r.total_questions,
        r.completed_at
      FROM results r
      JOIN students s ON s.id = r.student_id
      JOIN exams e ON e.id = r.exam_id
      JOIN subjects sub ON sub.id = e.subject_id
      ORDER BY r.completed_at DESC
    `);
    
    return result.rows.map(row => ({
      studentId: row.student_id,
      studentName: row.student_name,
      subjectName: row.subject_name,
      score: row.score,
      totalQuestions: row.total_questions,
      completedAt: row.completed_at,
    }));
  }
  
  /**
   * Get all exam passwords
   */
  async getAllExamPasswords(): Promise<Array<{
    examId: string;
    subjectName: string;
    teacherUsername: string;
    password: string;
    isPublic: boolean;
    isFinished: boolean;
  }>> {
    const result = await pool.query(`
      SELECT 
        e.id as exam_id,
        sub.name as subject_name,
        t.username as teacher_username,
        e.password,
        e.is_public,
        e.is_finished
      FROM exams e
      JOIN subjects sub ON sub.id = e.subject_id
      JOIN teachers t ON t.id = e.teacher_id
      ORDER BY e.created_at DESC
    `);
    
    return result.rows.map(row => ({
      examId: row.exam_id,
      subjectName: row.subject_name,
      teacherUsername: row.teacher_username,
      password: row.password,
      isPublic: row.is_public,
      isFinished: row.is_finished,
    }));
  }
  
  /**
   * Get all students
   */
  async getAllStudents(): Promise<Array<{
    id: string;
    name: string;
    username: string;
    admissionNumber: string | null;
    createdAt: Date;
  }>> {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        username,
        admission_number,
        created_at
      FROM students
      ORDER BY created_at DESC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      username: row.username,
      admissionNumber: row.admission_number,
      createdAt: row.created_at,
    }));
  }
}

export default new AdminService();
