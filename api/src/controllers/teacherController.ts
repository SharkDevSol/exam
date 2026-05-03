import { Request, Response } from 'express';
import teacherService from '../services/teacherService';

export class TeacherController {
  /**
   * POST /api/teacher/register
   */
  async register(req: Request, res: Response) {
    try {
      const { username, password, subjectId } = req.body;
      
      if (!username || !password || !subjectId) {
        return res.status(400).json({ error: 'Username, password, and subject are required' });
      }
      
      const teacher = await teacherService.register(username, password, subjectId);
      
      // Create session
      req.session.userId = teacher.id;
      req.session.role = 'teacher';
      
      res.status(201).json({ 
        message: 'Registration successful',
        userId: teacher.id,
        subjectId: teacher.subjectId,
      });
    } catch (error: any) {
      if (error.message === 'Subject already assigned to another teacher') {
        return res.status(409).json({ error: error.message });
      }
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Username already exists' });
      }
      console.error('Teacher registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * POST /api/teacher/login
   */
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      const teacher = await teacherService.authenticate(username, password);
      
      if (!teacher) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Create session
      req.session.userId = teacher.id;
      req.session.role = 'teacher';
      
      res.json({ 
        message: 'Login successful',
        userId: teacher.id,
        subjectId: teacher.subjectId,
      });
    } catch (error) {
      console.error('Teacher login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * POST /api/teacher/logout
   */
  async logout(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  }
  
  /**
   * GET /api/teacher/subjects/available
   */
  async getAvailableSubjects(req: Request, res: Response) {
    try {
      const subjects = await teacherService.getAvailableSubjects();
      res.json(subjects);
    } catch (error) {
      console.error('Get available subjects error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * POST /api/teacher/exams
   */
  async createExam(req: Request, res: Response) {
    try {
      const { questions, durationMinutes } = req.body;
      const teacherId = req.user!.userId;
      
      if (!questions || !Array.isArray(questions) || questions.length !== 100) {
        return res.status(400).json({ error: 'Exactly 100 questions are required' });
      }
      
      if (!durationMinutes || durationMinutes < 1 || durationMinutes > 300) {
        return res.status(400).json({ error: 'Duration must be between 1 and 300 minutes' });
      }
      
      // Get teacher's subject
      const teacherResult = await teacherService.authenticate(req.user!.userId, '');
      if (!teacherResult) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const exam = await teacherService.createExam(
        teacherId,
        teacherResult.subjectId,
        questions,
        durationMinutes
      );
      
      res.status(201).json({
        examId: exam.id,
        password: exam.password,
        message: 'Exam created successfully',
      });
    } catch (error: any) {
      console.error('Create exam error:', error);
      res.status(400).json({ error: error.message || 'Failed to create exam' });
    }
  }
  
  /**
   * GET /api/teacher/exams/template
   */
  async downloadTemplate(req: Request, res: Response) {
    try {
      const buffer = teacherService.getExamTemplate();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=exam_template.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Download template error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * POST /api/teacher/exams/import
   */
  async importQuestions(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Excel file is required' });
      }
      
      const questions = teacherService.parseExcelQuestions(req.file.buffer);
      res.json({ questions, count: questions.length });
    } catch (error: any) {
      console.error('Import questions error:', error);
      res.status(400).json({ error: error.message || 'Failed to parse Excel file' });
    }
  }
  
  /**
   * PUT /api/teacher/exams/:id/publish
   */
  async publishExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = req.user!.userId;
      
      await teacherService.publishExam(id, teacherId);
      res.json({ message: 'Exam published successfully' });
    } catch (error: any) {
      console.error('Publish exam error:', error);
      res.status(400).json({ error: error.message || 'Failed to publish exam' });
    }
  }
  
  /**
   * PUT /api/teacher/exams/:id/finish
   */
  async finishExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = req.user!.userId;
      
      await teacherService.finishExam(id, teacherId);
      res.json({ message: 'Exam marked as finished' });
    } catch (error: any) {
      console.error('Finish exam error:', error);
      res.status(400).json({ error: error.message || 'Failed to finish exam' });
    }
  }
  
  /**
   * GET /api/teacher/results
   */
  async getResults(req: Request, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const results = await teacherService.getSubjectResults(teacherId);
      res.json(results);
    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/teacher/results/:studentId/:examId
   */
  async getStudentExamDetails(req: Request, res: Response) {
    try {
      const { studentId, examId } = req.params;
      const teacherId = req.user!.userId;
      
      const details = await teacherService.getStudentExamDetails(studentId, examId, teacherId);
      res.json(details);
    } catch (error: any) {
      console.error('Get student exam details error:', error);
      res.status(400).json({ error: error.message || 'Failed to get details' });
    }
  }
}

export default new TeacherController();
