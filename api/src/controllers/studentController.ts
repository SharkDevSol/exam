import { Request, Response } from 'express';
import studentService from '../services/studentService';

export class StudentController {
  /**
   * POST /api/student/login
   */
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      const token = await studentService.authenticate(username, password);
      
      if (!token) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      res.json({ token, message: 'Login successful' });
    } catch (error) {
      console.error('Student login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/student/exams
   */
  async getAvailableExams(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const exams = await studentService.getAvailableExams(studentId);
      res.json(exams);
    } catch (error) {
      console.error('Get available exams error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * POST /api/student/exams/:id/start
   */
  async startExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const studentId = req.user!.userId;
      
      if (!password) {
        return res.status(400).json({ error: 'Exam password is required' });
      }
      
      const session = await studentService.startExam(studentId, id, password);
      res.json(session);
    } catch (error: any) {
      console.error('Start exam error:', error);
      
      if (error.message === 'Incorrect exam password') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(400).json({ error: error.message || 'Failed to start exam' });
    }
  }
  
  /**
   * GET /api/student/exams/:id/questions
   */
  async getExamQuestions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = req.user!.userId;
      
      const questions = await studentService.getExamQuestions(studentId, id);
      res.json(questions);
    } catch (error: any) {
      console.error('Get exam questions error:', error);
      res.status(400).json({ error: error.message || 'Failed to get questions' });
    }
  }
  
  /**
   * POST /api/student/answers/save
   */
  async saveAnswer(req: Request, res: Response) {
    try {
      const { sessionId, questionId, answer } = req.body;
      
      if (!sessionId || !questionId || !answer) {
        return res.status(400).json({ error: 'Session ID, question ID, and answer are required' });
      }
      
      if (!['A', 'B', 'C', 'D'].includes(answer)) {
        return res.status(400).json({ error: 'Answer must be A, B, C, or D' });
      }
      
      await studentService.saveAnswer(sessionId, questionId, answer);
      res.json({ message: 'Answer saved successfully' });
    } catch (error) {
      console.error('Save answer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * POST /api/student/questions/:id/flag
   */
  async flagQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      await studentService.flagQuestion(sessionId, id);
      res.json({ message: 'Question flagged' });
    } catch (error) {
      console.error('Flag question error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * DELETE /api/student/questions/:id/flag
   */
  async unflagQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      await studentService.unflagQuestion(sessionId, id);
      res.json({ message: 'Question unflagged' });
    } catch (error) {
      console.error('Unflag question error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/student/exams/:id/timer
   */
  async getRemainingTime(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = req.user!.userId;
      
      const remainingSeconds = await studentService.getRemainingTime(studentId, id);
      res.json({ remainingSeconds });
    } catch (error: any) {
      console.error('Get remaining time error:', error);
      res.status(400).json({ error: error.message || 'Failed to get remaining time' });
    }
  }
  
  /**
   * POST /api/student/exams/:id/submit
   */
  async submitExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = req.user!.userId;
      
      const result = await studentService.submitExam(studentId, id);
      res.json(result);
    } catch (error: any) {
      console.error('Submit exam error:', error);
      res.status(400).json({ error: error.message || 'Failed to submit exam' });
    }
  }
  
  /**
   * GET /api/student/results
   */
  async getResults(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const results = await studentService.getResults(studentId);
      res.json(results);
    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/student/results/:examId
   */
  async getExamDetails(req: Request, res: Response) {
    try {
      const { examId } = req.params;
      const studentId = req.user!.userId;
      
      const details = await studentService.getExamDetails(studentId, examId);
      res.json(details);
    } catch (error: any) {
      console.error('Get exam details error:', error);
      res.status(400).json({ error: error.message || 'Failed to get details' });
    }
  }
}

export default new StudentController();
