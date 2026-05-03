import { Router } from 'express';
import multer from 'multer';
import adminController from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';
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
router.post('/login', 
  loginLimiter,
  validate([validationRules.username, validationRules.password]),
  adminController.login.bind(adminController)
);

router.post('/logout', 
  adminController.logout.bind(adminController)
);

// Protected routes (require admin authentication)
router.post('/subjects',
  requireAdmin,
  validate([validationRules.subjectName]),
  adminController.createSubject.bind(adminController)
);

router.get('/subjects',
  requireAdmin,
  adminController.getAllSubjects.bind(adminController)
);

router.get('/subjects/:id/assignments',
  requireAdmin,
  adminController.getSubjectAssignment.bind(adminController)
);

router.post('/students/bulk-import',
  requireAdmin,
  upload.single('file'),
  adminController.bulkImportStudents.bind(adminController)
);

router.get('/students/credentials/:batchId',
  requireAdmin,
  adminController.downloadCredentials.bind(adminController)
);

router.get('/results',
  requireAdmin,
  adminController.getAllResults.bind(adminController)
);

router.get('/exams/passwords',
  requireAdmin,
  adminController.getAllExamPasswords.bind(adminController)
);

router.get('/students',
  requireAdmin,
  adminController.getAllStudents.bind(adminController)
);

export default router;
