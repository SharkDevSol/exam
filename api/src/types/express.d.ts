import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: 'admin' | 'teacher';
    lastImportCredentials?: Array<{ name: string; username: string; password: string }>;
    lastImportBatchId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: 'admin' | 'teacher' | 'student';
      };
    }
  }
}

export {};
