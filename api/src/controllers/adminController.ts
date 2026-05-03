import { Request, Response } from 'express';
import adminService from '../services/adminService';

export class AdminController {
  /**
   * POST /api/admin/login
   */
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      const admin = await adminService.authenticate(username, password);
      
      if (!admin) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Create session
      req.session.userId = admin.id;
      req.session.role = 'admin';
      
      res.json({ message: 'Login successful', userId: admin.id });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * POST /api/admin/logout
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
   * POST /api/admin/subjects
   */
  async createSubject(req: Request, res: Response) {
    try {
      const { name } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Subject name is required' });
      }
      
      const subject = await adminService.createSubject(name.trim());
      res.status(201).json(subject);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Subject already exists' });
      }
      console.error('Create subject error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/admin/subjects
   */
  async getAllSubjects(req: Request, res: Response) {
    try {
      const subjects = await adminService.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      console.error('Get subjects error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/admin/subjects/:id/assignments
   */
  async getSubjectAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const assignment = await adminService.getSubjectAssignment(id);
      
      if (!assignment) {
        return res.status(404).json({ error: 'No teacher assigned to this subject' });
      }
      
      res.json(assignment);
    } catch (error) {
      console.error('Get subject assignment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * POST /api/admin/students/bulk-import
   */
  async bulkImportStudents(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Excel file is required' });
      }
      
      const result = await adminService.bulkImportStudents(req.file.buffer);
      
      // Store credentials in session temporarily for download
      req.session.lastImportCredentials = result.credentials;
      req.session.lastImportBatchId = result.batchId;
      
      res.json({
        imported: result.imported,
        batchId: result.batchId,
        message: `Successfully imported ${result.imported} students`,
      });
    } catch (error: any) {
      console.error('Bulk import error:', error);
      res.status(400).json({ error: error.message || 'Import failed' });
    }
  }
  
  /**
   * GET /api/admin/students/credentials/:batchId
   */
  async downloadCredentials(req: Request, res: Response) {
    try {
      const { batchId } = req.params;
      
      // Check if this is the last import and credentials are in session
      if (req.session.lastImportBatchId === batchId && req.session.lastImportCredentials) {
        const credentials = req.session.lastImportCredentials;
        const buffer = await adminService.getCredentialsFile(batchId);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=student_credentials_${batchId}.xlsx`);
        res.send(buffer);
        
        // Clear from session after download
        delete req.session.lastImportCredentials;
        delete req.session.lastImportBatchId;
      } else {
        return res.status(404).json({ 
          error: 'Credentials not available. Please download immediately after import.' 
        });
      }
    } catch (error) {
      console.error('Download credentials error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/admin/results
   */
  async getAllResults(req: Request, res: Response) {
    try {
      const results = await adminService.getAllResults();
      res.json(results);
    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/admin/exams/passwords
   */
  async getAllExamPasswords(req: Request, res: Response) {
    try {
      const passwords = await adminService.getAllExamPasswords();
      res.json(passwords);
    } catch (error) {
      console.error('Get exam passwords error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * GET /api/admin/students
   */
  async getAllStudents(req: Request, res: Response) {
    try {
      const students = await adminService.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new AdminController();
