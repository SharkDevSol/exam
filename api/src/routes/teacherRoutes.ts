import { Router } from 'express';
import multer from 'multer';
import teacherController from '../controllers/teacherController';
import { requireTeacher } from '../middleware/auth';
import { loginLimiter, validate, validationRules } from '../middleware/security';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

// Authentication routes (no auth required)
router.post('/register',
  validate([validationRules.username, validationRules.password]),
  teacherController.register.bind(teacherController)
);

router.post('/login',
  loginLimiter,
  validate([validationRules.username, validationRules.password]),
  teacherController.login.bind(teacherController)
);

router.post('/logout',
  teacherController.logout.bind(teacherController)
);

router.get('/subjects/available',
  teacherController.getAvailableSubjects.bind(teacherController)
);

// Protected routes (require teacher authentication)
router.post('/exams',
  requireTeacher,
  validate([validationRules.duration]),
  teacherController.createExam.bind(teacherController)
);

router.get('/exams/template',
  requireTeacher,
  teacherController.downloadTemplate.bind(teacherController)
);

router.post('/exams/import',
  requireTeacher,
  upload.single('file'),
  teacherController.importQuestions.bind(teacherController)
);

router.put('/exams/:id/publish',
  requireTeacher,
  teacherController.publishExam.bind(teacherController)
);

router.put('/exams/:id/finish',
  requireTeacher,
  teacherController.finishExam.bind(teacherController)
);

router.get('/results',
  requireTeacher,
  teacherController.getResults.bind(teacherController)
);

router.get('/results/:studentId/:examId',
  requireTeacher,
  teacherController.getStudentExamDetails.bind(teacherController)
);

export default router;
