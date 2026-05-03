import { Router } from 'express';
import studentController from '../controllers/studentController';
import { requireStudent } from '../middleware/auth';
import { loginLimiter, examPasswordLimiter, validate, validationRules } from '../middleware/security';

const router = Router();

// Authentication route (no auth required)
router.post('/login',
  loginLimiter,
  validate([validationRules.username, validationRules.password]),
  studentController.login.bind(studentController)
);

// Protected routes (require student JWT authentication)
router.get('/exams',
  requireStudent,
  studentController.getAvailableExams.bind(studentController)
);

router.post('/exams/:id/start',
  requireStudent,
  examPasswordLimiter,
  validate([validationRules.examPassword]),
  studentController.startExam.bind(studentController)
);

router.get('/exams/:id/questions',
  requireStudent,
  studentController.getExamQuestions.bind(studentController)
);

router.post('/answers/save',
  requireStudent,
  studentController.saveAnswer.bind(studentController)
);

router.post('/questions/:id/flag',
  requireStudent,
  studentController.flagQuestion.bind(studentController)
);

router.delete('/questions/:id/flag',
  requireStudent,
  studentController.unflagQuestion.bind(studentController)
);

router.get('/exams/:id/timer',
  requireStudent,
  studentController.getRemainingTime.bind(studentController)
);

router.post('/exams/:id/submit',
  requireStudent,
  studentController.submitExam.bind(studentController)
);

router.get('/results',
  requireStudent,
  studentController.getResults.bind(studentController)
);

router.get('/results/:examId',
  requireStudent,
  studentController.getExamDetails.bind(studentController)
);

export default router;
