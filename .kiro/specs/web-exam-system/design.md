# Design Document: Web Exam System

## Overview

The Web Exam System is a comprehensive multi-role examination platform designed to facilitate online assessments across educational institutions. The system provides three distinct portals (Admin, Teacher, Student) with role-specific functionality, ensuring secure exam administration, flexible question management, and fair assessment delivery.

### Core Objectives

- **Multi-Role Architecture**: Support three distinct user roles with isolated interfaces and permissions
- **Exam Integrity**: Ensure fair assessments through question randomization and secure access control
- **Scalability**: Handle multiple concurrent exams with individual student timers and auto-save functionality
- **Usability**: Provide intuitive interfaces for bulk operations, exam creation, and result viewing
- **Accessibility**: Enable offline-capable student access through PWA technology

### Technology Stack

- **Frontend**: React 18+ with Vite, CSS Modules for styling
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL 14+ with connection pooling
- **Authentication**: JWT tokens with role-based access control
- **Session Management**: express-session with PostgreSQL store for admin/teacher, stateless JWT for students
- **PWA**: vite-plugin-pwa with Workbox for service worker generation
- **File Processing**: xlsx library for Excel import/export
- **Deployment**: VPS server (76.13.48.245) with Nginx reverse proxy

### Key Design Principles

1. **Separation of Concerns**: Clear boundaries between admin, teacher, and student domains
2. **Security First**: Role-based access control, secure password generation, exam password protection
3. **Data Integrity**: Transactional operations for critical workflows, auto-save for student answers
4. **Performance**: Efficient database queries, connection pooling, optimized randomization algorithms
5. **User Experience**: Progressive enhancement, offline capability for students, bulk operations for admins

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        AP[Admin Portal<br/>exam.skoolific.com/admin]
        TP[Teacher Portal<br/>exam.skoolific.com/teacher]
        SP[Student Portal<br/>exam.skoolific.com/student<br/>PWA Enabled]
    end
    
    subgraph "Nginx Reverse Proxy"
        NG[Nginx<br/>76.13.48.245]
    end
    
    subgraph "Application Layer"
        API[Express.js API Server<br/>Port 3000]
        AUTH[Authentication Middleware<br/>JWT + Session]
        RBAC[Role-Based Access Control]
    end
    
    subgraph "Business Logic Layer"
        AS[Admin Service]
        TS[Teacher Service]
        SS[Student Service]
        ES[Exam Service]
        RS[Result Service]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL Database)]
        SESS[Session Store<br/>PostgreSQL]
    end
    
    subgraph "External Services"
        EXCEL[Excel Processing<br/>xlsx library]
        PWA[Service Worker<br/>Workbox]
    end
    
    AP --> NG
    TP --> NG
    SP --> NG
    NG --> API
    API --> AUTH
    AUTH --> RBAC
    RBAC --> AS
    RBAC --> TS
    RBAC --> SS
    AS --> PG
    TS --> PG
    SS --> PG
    TS --> ES
    SS --> ES
    ES --> PG
    AS --> RS
    TS --> RS
    SS --> RS
    RS --> PG
    AUTH --> SESS
    SESS --> PG
    AS --> EXCEL
    TS --> EXCEL
    SP --> PWA
```

### Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        subgraph "Admin Portal"
            A1[Subject Management]
            A2[Student Bulk Import]
            A3[Results Dashboard]
            A4[Exam Password View]
        end
        
        subgraph "Teacher Portal"
            T1[Exam Creation]
            T2[Question Entry/Import]
            T3[Exam Publishing]
            T4[Results View]
        end
        
        subgraph "Student Portal"
            S1[Exam Discovery]
            S2[Exam Interface]
            S3[Question Navigation]
            S4[Results View]
        end
    end
    
    subgraph "Backend Services"
        AUTH_SVC[Authentication Service]
        ADMIN_SVC[Admin Service]
        TEACHER_SVC[Teacher Service]
        STUDENT_SVC[Student Service]
        EXAM_SVC[Exam Service]
        RESULT_SVC[Result Service]
    end
    
    A1 --> ADMIN_SVC
    A2 --> ADMIN_SVC
    A3 --> RESULT_SVC
    A4 --> ADMIN_SVC
    T1 --> TEACHER_SVC
    T2 --> EXAM_SVC
    T3 --> EXAM_SVC
    T4 --> RESULT_SVC
    S1 --> STUDENT_SVC
    S2 --> EXAM_SVC
    S3 --> EXAM_SVC
    S4 --> RESULT_SVC
    
    ADMIN_SVC --> AUTH_SVC
    TEACHER_SVC --> AUTH_SVC
    STUDENT_SVC --> AUTH_SVC
```

### Deployment Architecture

```mermaid
graph TB
    subgraph "Internet"
        USER[Users]
    end
    
    subgraph "VPS Server - 76.13.48.245"
        subgraph "Nginx Layer"
            NGINX[Nginx Reverse Proxy<br/>Port 80/443]
        end
        
        subgraph "Application Layer"
            REACT[React App<br/>Static Files]
            EXPRESS[Express API<br/>Port 3000]
        end
        
        subgraph "Database Layer"
            POSTGRES[(PostgreSQL<br/>Port 5432)]
        end
        
        subgraph "Process Management"
            PM2[PM2 Process Manager]
        end
    end
    
    USER -->|HTTPS| NGINX
    NGINX -->|/admin, /teacher, /student| REACT
    NGINX -->|/api/*| EXPRESS
    EXPRESS --> POSTGRES
    PM2 -.manages.-> EXPRESS
```

## Components and Interfaces

### Frontend Components

#### Admin Portal Components

**SubjectManagement Component**
- Purpose: Create and manage academic subjects
- Props: None (fetches data via API)
- State: subjects list, form inputs, loading state
- Key Methods:
  - `createSubject(name)`: POST /api/admin/subjects
  - `fetchSubjects()`: GET /api/admin/subjects
  - `viewAssignments()`: GET /api/admin/subjects/:id/assignments

**StudentBulkImport Component**
- Purpose: Upload Excel files and generate student credentials
- Props: None
- State: file upload state, processing status, generated credentials
- Key Methods:
  - `uploadExcel(file)`: POST /api/admin/students/bulk-import (multipart/form-data)
  - `downloadCredentials(batchId)`: GET /api/admin/students/credentials/:batchId
  - `validateExcelFormat(file)`: Client-side validation

**ResultsDashboard Component**
- Purpose: View all student results across subjects
- Props: None
- State: results data, filters (student, subject), sorting preferences
- Key Methods:
  - `fetchAllResults()`: GET /api/admin/results
  - `filterByStudent(studentId)`: Client-side filtering
  - `filterBySubject(subjectId)`: Client-side filtering
  - `calculateTotalScore(studentId)`: Aggregation logic

**ExamPasswordView Component**
- Purpose: Display exam passwords for oversight
- Props: None
- State: exams list with passwords, filters
- Key Methods:
  - `fetchExamPasswords()`: GET /api/admin/exams/passwords
  - `searchBySubject(subjectId)`: Filter exams
  - `searchByTeacher(teacherId)`: Filter exams

#### Teacher Portal Components

**ExamCreation Component**
- Purpose: Create exams with 100 questions
- Props: subjectId (from authenticated teacher)
- State: exam metadata, questions array (100), validation errors
- Key Methods:
  - `createExam(examData)`: POST /api/teacher/exams
  - `validateQuestionCount()`: Ensure exactly 100 questions
  - `setExamDuration(hours, minutes)`: Set timer configuration

**QuestionEntry Component**
- Purpose: Manual question input with validation
- Props: questionIndex, onQuestionChange
- State: question text, options A-D, correct answer
- Key Methods:
  - `updateQuestion(index, data)`: Update question in parent state
  - `validateQuestion()`: Ensure all fields completed

**ExcelImport Component**
- Purpose: Import questions from Excel template
- Props: onQuestionsImported
- State: file upload state, parsed questions, validation errors
- Key Methods:
  - `downloadTemplate()`: GET /api/teacher/exams/template
  - `uploadExcel(file)`: POST /api/teacher/exams/import (multipart/form-data)
  - `validateExcelData(data)`: Validate 100 questions with required fields

**ExamPublishing Component**
- Purpose: Publish exams and manage access
- Props: examId
- State: exam status, generated password
- Key Methods:
  - `publishExam(examId)`: PUT /api/teacher/exams/:id/publish
  - `finishExam(examId)`: PUT /api/teacher/exams/:id/finish
  - `displayPassword(password)`: Show generated password

**TeacherResults Component**
- Purpose: View results for teacher's subject
- Props: subjectId (from authenticated teacher)
- State: results data, sorting preferences
- Key Methods:
  - `fetchSubjectResults()`: GET /api/teacher/results
  - `viewStudentDetails(studentId, examId)`: GET /api/teacher/results/:studentId/:examId
  - `sortByScore()`: Client-side sorting

#### Student Portal Components

**ExamDiscovery Component**
- Purpose: Display available public exams
- Props: studentId (from authenticated student)
- State: available exams, completed exams
- Key Methods:
  - `fetchAvailableExams()`: GET /api/student/exams
  - `checkExamStatus(examId)`: Determine if exam is completed
  - `startExam(examId, password)`: POST /api/student/exams/:id/start

**ExamInterface Component**
- Purpose: Main exam-taking interface with timer and navigation
- Props: examId, studentId
- State: current question index, timer, answers, flags, randomized question order
- Key Methods:
  - `initializeTimer(duration)`: Start countdown timer
  - `randomizeQuestions(questions)`: Fisher-Yates shuffle
  - `autoSaveAnswer(questionId, answer)`: POST /api/student/answers/save
  - `submitExam()`: POST /api/student/exams/:id/submit

**QuestionDisplay Component**
- Purpose: Display single question with answer options
- Props: question, currentAnswer, onAnswerSelect
- State: selected option
- Key Methods:
  - `selectAnswer(option)`: Update answer and trigger auto-save
  - `flagQuestion()`: Toggle flag status

**QuestionOverviewPanel Component**
- Purpose: Visual grid of all questions with status indicators
- Props: questions, answers, flags, currentIndex
- State: None (controlled component)
- Key Methods:
  - `navigateToQuestion(index)`: Change current question
  - `getQuestionStatus(index)`: Return status (answered, flagged, current)

**StudentResults Component**
- Purpose: View exam results by subject
- Props: studentId (from authenticated student)
- State: results grouped by subject, total score
- Key Methods:
  - `fetchResults()`: GET /api/student/results
  - `calculateTotalScore()`: Sum all exam scores
  - `viewExamDetails(examId)`: GET /api/student/results/:examId

**ExamHeader Component**
- Purpose: Display student and exam information
- Props: studentName, subjectName, schoolName, admissionNumber
- State: None
- Key Methods:
  - `exitExam()`: Confirm and navigate back

### Backend Services

#### Authentication Service

**Interface:**
```typescript
interface AuthService {
  // Admin authentication
  authenticateAdmin(username: string, password: string): Promise<AdminSession>;
  
  // Teacher authentication
  registerTeacher(username: string, password: string, subjectId: string): Promise<TeacherAccount>;
  authenticateTeacher(username: string, password: string): Promise<TeacherSession>;
  
  // Student authentication
  authenticateStudent(username: string, password: string): Promise<StudentToken>;
  
  // Session management
  createPersistentSession(userId: string, role: string): Promise<SessionToken>;
  validateSession(sessionToken: string): Promise<UserSession>;
  destroySession(sessionToken: string): Promise<void>;
  
  // JWT management
  generateJWT(userId: string, role: string): string;
  verifyJWT(token: string): JWTPayload;
}
```

**Key Responsibilities:**
- Password hashing using bcrypt (cost factor 12)
- JWT token generation and validation
- Session creation and management for admin/teacher
- Stateless authentication for students
- Role-based access control enforcement

#### Admin Service

**Interface:**
```typescript
interface AdminService {
  // Subject management
  createSubject(name: string): Promise<Subject>;
  listSubjects(): Promise<Subject[]>;
  getSubjectAssignments(subjectId: string): Promise<TeacherAssignment[]>;
  
  // Student bulk import
  importStudentsFromExcel(file: Buffer): Promise<BulkImportResult>;
  generateCredentials(students: StudentData[]): Promise<CredentialFile>;
  downloadCredentials(batchId: string): Promise<Buffer>;
  
  // Results viewing
  getAllResults(): Promise<ResultSummary[]>;
  filterResultsByStudent(studentId: string): Promise<ResultSummary[]>;
  filterResultsBySubject(subjectId: string): Promise<ResultSummary[]>;
  
  // Exam password viewing
  getAllExamPasswords(): Promise<ExamPasswordInfo[]>;
  searchExamsBySubject(subjectId: string): Promise<ExamPasswordInfo[]>;
  searchExamsByTeacher(teacherId: string): Promise<ExamPasswordInfo[]>;
}
```

#### Teacher Service

**Interface:**
```typescript
interface TeacherService {
  // Exam creation
  createExam(teacherId: string, examData: ExamData): Promise<Exam>;
  validateQuestionCount(questions: Question[]): boolean;
  setExamDuration(examId: string, hours: number, minutes: number): Promise<void>;
  
  // Question management
  addQuestionManually(examId: string, question: Question): Promise<void>;
  importQuestionsFromExcel(examId: string, file: Buffer): Promise<Question[]>;
  downloadExcelTemplate(): Promise<Buffer>;
  
  // Exam publishing
  generateExamPassword(examId: string): Promise<string>;
  publishExam(examId: string): Promise<void>;
  finishExam(examId: string): Promise<void>;
  
  // Results viewing
  getSubjectResults(teacherId: string): Promise<ResultSummary[]>;
  getStudentExamDetails(studentId: string, examId: string): Promise<DetailedResult>;
}
```

#### Student Service

**Interface:**
```typescript
interface StudentService {
  // Exam discovery
  getAvailableExams(studentId: string): Promise<Exam[]>;
  checkExamCompletion(studentId: string, examId: string): Promise<boolean>;
  
  // Exam access
  validateExamPassword(examId: string, password: string): Promise<boolean>;
  startExam(studentId: string, examId: string): Promise<ExamSession>;
  
  // Results viewing
  getStudentResults(studentId: string): Promise<ResultsBySubject>;
  calculateTotalScore(studentId: string): Promise<TotalScore>;
  getExamDetails(studentId: string, examId: string): Promise<DetailedResult>;
}
```

#### Exam Service

**Interface:**
```typescript
interface ExamService {
  // Question randomization
  randomizeQuestions(examId: string, studentId: string): Promise<Question[]>;
  getRandomizedOrder(examId: string, studentId: string): Promise<number[]>;
  
  // Timer management
  initializeTimer(studentId: string, examId: string, duration: number): Promise<Timer>;
  getRemainingTime(studentId: string, examId: string): Promise<number>;
  handleTimerExpiry(studentId: string, examId: string): Promise<void>;
  
  // Answer management
  autoSaveAnswer(studentId: string, questionId: string, answer: string): Promise<void>;
  updateAnswer(studentId: string, questionId: string, answer: string): Promise<void>;
  getStudentAnswers(studentId: string, examId: string): Promise<Answer[]>;
  
  // Question flagging
  flagQuestion(studentId: string, questionId: string): Promise<void>;
  unflagQuestion(studentId: string, questionId: string): Promise<void>;
  getFlaggedQuestions(studentId: string, examId: string): Promise<string[]>;
  
  // Exam submission
  validateSubmission(studentId: string, examId: string): Promise<ValidationResult>;
  submitExam(studentId: string, examId: string): Promise<void>;
}
```

#### Result Service

**Interface:**
```typescript
interface ResultService {
  // Score calculation
  calculateScore(studentId: string, examId: string): Promise<number>;
  gradeExam(studentId: string, examId: string, answers: Answer[]): Promise<Result>;
  
  // Result retrieval
  getResultsByStudent(studentId: string): Promise<Result[]>;
  getResultsBySubject(subjectId: string): Promise<Result[]>;
  getResultsByExam(examId: string): Promise<Result[]>;
  
  // Detailed results
  getDetailedResult(studentId: string, examId: string): Promise<DetailedResult>;
  compareAnswers(studentAnswers: Answer[], correctAnswers: Answer[]): Promise<AnswerComparison[]>;
}
```

### API Endpoints

#### Admin Endpoints

```
POST   /api/admin/login
POST   /api/admin/logout
GET    /api/admin/subjects
POST   /api/admin/subjects
GET    /api/admin/subjects/:id/assignments
POST   /api/admin/students/bulk-import (multipart/form-data)
GET    /api/admin/students/credentials/:batchId
GET    /api/admin/results
GET    /api/admin/results?studentId=:id
GET    /api/admin/results?subjectId=:id
GET    /api/admin/exams/passwords
GET    /api/admin/exams/passwords?subjectId=:id
GET    /api/admin/exams/passwords?teacherId=:id
```

#### Teacher Endpoints

```
POST   /api/teacher/register
POST   /api/teacher/login
POST   /api/teacher/logout
GET    /api/teacher/subjects/available
POST   /api/teacher/exams
PUT    /api/teacher/exams/:id
GET    /api/teacher/exams/template
POST   /api/teacher/exams/import (multipart/form-data)
PUT    /api/teacher/exams/:id/publish
PUT    /api/teacher/exams/:id/finish
GET    /api/teacher/results
GET    /api/teacher/results/:studentId/:examId
```

#### Student Endpoints

```
POST   /api/student/login
GET    /api/student/exams
POST   /api/student/exams/:id/start
GET    /api/student/exams/:id/questions
POST   /api/student/answers/save
PUT    /api/student/answers/:id
POST   /api/student/questions/:id/flag
DELETE /api/student/questions/:id/flag
GET    /api/student/exams/:id/timer
POST   /api/student/exams/:id/submit
GET    /api/student/results
GET    /api/student/results/:examId
```

## Data Models

### Database Schema

```mermaid
erDiagram
    ADMINS ||--o{ SESSIONS : has
    TEACHERS ||--o{ SESSIONS : has
    TEACHERS ||--|| SUBJECTS : assigned_to
    SUBJECTS ||--o{ EXAMS : contains
    EXAMS ||--o{ QUESTIONS : has
    EXAMS ||--o{ EXAM_SESSIONS : generates
    STUDENTS ||--o{ EXAM_SESSIONS : participates_in
    EXAM_SESSIONS ||--o{ ANSWERS : contains
    EXAM_SESSIONS ||--o{ FLAGGED_QUESTIONS : has
    EXAM_SESSIONS ||--|| RESULTS : produces
    QUESTIONS ||--o{ ANSWERS : answered_by
    
    ADMINS {
        uuid id PK
        string username UK
        string password_hash
        timestamp created_at
        timestamp updated_at
    }
    
    TEACHERS {
        uuid id PK
        string username UK
        string password_hash
        uuid subject_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    STUDENTS {
        uuid id PK
        string name
        string username UK
        string password_hash
        string admission_number
        timestamp created_at
        timestamp updated_at
    }
    
    SUBJECTS {
        uuid id PK
        string name UK
        timestamp created_at
        timestamp updated_at
    }
    
    EXAMS {
        uuid id PK
        uuid subject_id FK
        uuid teacher_id FK
        string password
        integer duration_minutes
        boolean is_public
        boolean is_finished
        timestamp created_at
        timestamp updated_at
    }
    
    QUESTIONS {
        uuid id PK
        uuid exam_id FK
        integer original_order
        text question_text
        text option_a
        text option_b
        text option_c
        text option_d
        char correct_answer
        timestamp created_at
    }
    
    EXAM_SESSIONS {
        uuid id PK
        uuid student_id FK
        uuid exam_id FK
        jsonb randomized_order
        timestamp start_time
        timestamp end_time
        integer duration_minutes
        boolean is_submitted
        timestamp created_at
    }
    
    ANSWERS {
        uuid id PK
        uuid exam_session_id FK
        uuid question_id FK
        char selected_answer
        timestamp answered_at
        timestamp updated_at
    }
    
    FLAGGED_QUESTIONS {
        uuid id PK
        uuid exam_session_id FK
        uuid question_id FK
        timestamp flagged_at
    }
    
    RESULTS {
        uuid id PK
        uuid exam_session_id FK
        uuid student_id FK
        uuid exam_id FK
        integer score
        integer total_questions
        timestamp completed_at
    }
    
    SESSIONS {
        string sid PK
        jsonb sess
        timestamp expire
    }
```

### Entity Definitions

#### Admin Entity

```typescript
interface Admin {
  id: string;                    // UUID
  username: string;              // Unique
  passwordHash: string;          // bcrypt hash
  createdAt: Date;
  updatedAt: Date;
}
```

#### Teacher Entity

```typescript
interface Teacher {
  id: string;                    // UUID
  username: string;              // Unique
  passwordHash: string;          // bcrypt hash
  subjectId: string;             // FK to subjects, unique constraint
  createdAt: Date;
  updatedAt: Date;
}
```

#### Student Entity

```typescript
interface Student {
  id: string;                    // UUID
  name: string;
  username: string;              // Unique, generated
  passwordHash: string;          // bcrypt hash, generated
  admissionNumber: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Subject Entity

```typescript
interface Subject {
  id: string;                    // UUID
  name: string;                  // Unique
  createdAt: Date;
  updatedAt: Date;
}
```

#### Exam Entity

```typescript
interface Exam {
  id: string;                    // UUID
  subjectId: string;             // FK to subjects
  teacherId: string;             // FK to teachers
  password: string;              // Generated, 8-character alphanumeric
  durationMinutes: number;       // Exam duration
  isPublic: boolean;             // Published status
  isFinished: boolean;           // Completion status
  createdAt: Date;
  updatedAt: Date;
}
```

#### Question Entity

```typescript
interface Question {
  id: string;                    // UUID
  examId: string;                // FK to exams
  originalOrder: number;         // 1-100
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  createdAt: Date;
}
```

#### ExamSession Entity

```typescript
interface ExamSession {
  id: string;                    // UUID
  studentId: string;             // FK to students
  examId: string;                // FK to exams
  randomizedOrder: number[];     // Array of question indices [0-99]
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number;
  isSubmitted: boolean;
  createdAt: Date;
}
```

#### Answer Entity

```typescript
interface Answer {
  id: string;                    // UUID
  examSessionId: string;         // FK to exam_sessions
  questionId: string;            // FK to questions
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  answeredAt: Date;
  updatedAt: Date;
}
```

#### FlaggedQuestion Entity

```typescript
interface FlaggedQuestion {
  id: string;                    // UUID
  examSessionId: string;         // FK to exam_sessions
  questionId: string;            // FK to questions
  flaggedAt: Date;
}
```

#### Result Entity

```typescript
interface Result {
  id: string;                    // UUID
  examSessionId: string;         // FK to exam_sessions
  studentId: string;             // FK to students
  examId: string;                // FK to exams
  score: number;                 // 0-100
  totalQuestions: number;        // Always 100
  completedAt: Date;
}
```

### Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_teachers_subject ON teachers(subject_id);
CREATE INDEX idx_exams_subject ON exams(subject_id);
CREATE INDEX idx_exams_teacher ON exams(teacher_id);
CREATE INDEX idx_exams_public ON exams(is_public) WHERE is_public = true;
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_exam_sessions_student ON exam_sessions(student_id);
CREATE INDEX idx_exam_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX idx_answers_session ON answers(exam_session_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_flagged_session ON flagged_questions(exam_session_id);
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_exam ON results(exam_id);

-- Unique constraints
CREATE UNIQUE INDEX idx_teachers_subject_unique ON teachers(subject_id);
CREATE UNIQUE INDEX idx_exam_session_unique ON exam_sessions(student_id, exam_id);
```

## Correctness Properties

### Property-Based Testing Applicability Assessment

After analyzing the Web Exam System requirements, this feature is **primarily NOT suitable for comprehensive property-based testing** because:

1. **CRUD Operations Dominant**: Most functionality involves database reads/writes (creating subjects, storing students, saving answers)
2. **UI-Heavy**: Significant portions are UI rendering, form submissions, and user interactions
3. **External Service Integration**: Excel file processing, session management, PWA installation
4. **Configuration and Setup**: Authentication, authorization, session persistence

However, there are **specific algorithmic components** where property-based testing provides value:

- **Question Randomization**: Pure function with testable invariants
- **Password Generation**: Deterministic properties for validity and uniqueness
- **Score Calculation**: Mathematical computation with verifiable properties
- **Timer Calculations**: Time-based logic with predictable behavior

### Core Algorithm Properties

The following properties focus on the pure algorithmic components that benefit from property-based testing:

#### Property 1: Question Randomization Preserves All Questions

*For any* exam with 100 questions, when questions are randomized for a student, the randomized order SHALL contain all 100 question IDs exactly once with no duplicates or omissions.

**Validates: Requirements 16.1, 16.3**

**Rationale**: This is a permutation property - randomization should shuffle order but preserve the complete set of questions.

#### Property 2: Question Randomization Produces Different Orders

*For any* exam, when questions are randomized for different students, the probability that two students receive identical question orders SHALL be negligible (less than 1/100!).

**Validates: Requirements 16.2**

**Rationale**: Ensures the randomization algorithm provides sufficient entropy for exam integrity.

#### Property 3: Password Generation Produces Valid Format

*For any* generated exam password, the password SHALL be exactly 8 characters long and contain only alphanumeric characters [A-Za-z0-9].

**Validates: Requirements 10.2**

**Rationale**: Password format validation ensures consistent access control.

#### Property 4: Score Calculation Accuracy

*For any* set of student answers and correct answers, the calculated score SHALL equal the count of matching answers, and SHALL be between 0 and 100 inclusive.

**Validates: Requirements 11.2, 24.2, 25.1**

**Rationale**: Score calculation is a pure function with verifiable mathematical properties.

#### Property 5: Timer Calculation Consistency

*For any* exam start time and duration, the remaining time at any point SHALL equal (start_time + duration - current_time), and SHALL never be negative after submission.

**Validates: Requirements 15.1, 15.3, 15.4**

**Rationale**: Time calculations must be consistent and monotonically decreasing.

#### Property 6: Excel Import Round-Trip Preservation

*For any* valid set of 100 questions exported to Excel template format, importing that Excel file SHALL produce an equivalent set of questions with identical content.

**Validates: Requirements 9.2, 9.4, 9.5**

**Rationale**: Round-trip property ensures data integrity in import/export operations.



## Error Handling

### Error Categories

#### 1. Authentication Errors

**Invalid Credentials**
- **Scenario**: User provides incorrect username/password
- **Response**: HTTP 401 Unauthorized
- **Message**: "Invalid username or password"
- **Action**: Clear password field, allow retry with rate limiting (max 5 attempts per 15 minutes)

**Session Expired**
- **Scenario**: Admin/Teacher session token expires
- **Response**: HTTP 401 Unauthorized
- **Message**: "Your session has expired. Please log in again."
- **Action**: Redirect to login page, preserve intended destination

**Unauthorized Access**
- **Scenario**: User attempts to access resource outside their role
- **Response**: HTTP 403 Forbidden
- **Message**: "You do not have permission to access this resource"
- **Action**: Log security event, redirect to appropriate portal home

#### 2. Validation Errors

**Exam Question Count Mismatch**
- **Scenario**: Teacher attempts to create exam with ≠100 questions
- **Response**: HTTP 400 Bad Request
- **Message**: "Exam must contain exactly 100 questions. Current count: {count}"
- **Action**: Highlight question counter, prevent submission

**Excel Format Invalid**
- **Scenario**: Uploaded Excel file missing required columns or has wrong structure
- **Response**: HTTP 400 Bad Request
- **Message**: "Invalid Excel format. Missing columns: {column_names}. Please download the template."
- **Action**: Display error with download template button

**Excel Data Invalid**
- **Scenario**: Excel rows have empty required fields
- **Response**: HTTP 400 Bad Request
- **Message**: "Invalid data in rows: {row_numbers}. All fields (question, A, B, C, D, Answer) are required."
- **Action**: Display specific row numbers with errors

**Incorrect Exam Password**
- **Scenario**: Student enters wrong exam password
- **Response**: HTTP 403 Forbidden
- **Message**: "Incorrect exam password. Please check with your teacher."
- **Action**: Clear password field, allow retry (max 3 attempts before 5-minute lockout)

**Incomplete Exam Submission**
- **Scenario**: Student attempts to submit with unanswered questions
- **Response**: HTTP 400 Bad Request (client-side validation)
- **Message**: "You have {count} unanswered questions: {question_numbers}. Do you want to submit anyway?"
- **Action**: Display confirmation dialog with question list

#### 3. Business Logic Errors

**Subject Already Assigned**
- **Scenario**: Teacher attempts to register for subject already assigned to another teacher
- **Response**: HTTP 409 Conflict
- **Message**: "This subject has already been assigned to another teacher"
- **Action**: Refresh available subjects list

**Exam Already Completed**
- **Scenario**: Student attempts to access exam they've already taken
- **Response**: HTTP 409 Conflict
- **Message**: "You have already completed this exam. View your results instead."
- **Action**: Redirect to results page for that exam

**Exam Not Public**
- **Scenario**: Student attempts to access unpublished exam
- **Response**: HTTP 403 Forbidden
- **Message**: "This exam is not yet available. Please check back later."
- **Action**: Return to exam list

**Timer Expired**
- **Scenario**: Student's exam time runs out
- **Response**: Auto-submit triggered
- **Message**: "Time's up! Your exam has been automatically submitted."
- **Action**: Submit current answers, redirect to confirmation page

#### 4. Database Errors

**Connection Failure**
- **Scenario**: Database connection pool exhausted or database unreachable
- **Response**: HTTP 503 Service Unavailable
- **Message**: "Service temporarily unavailable. Please try again in a moment."
- **Action**: Log error, retry with exponential backoff (3 attempts), display user-friendly message

**Constraint Violation**
- **Scenario**: Unique constraint violated (duplicate username, subject assignment)
- **Response**: HTTP 409 Conflict
- **Message**: "This {field} is already in use. Please choose another."
- **Action**: Highlight conflicting field

**Transaction Failure**
- **Scenario**: Multi-step operation fails mid-transaction
- **Response**: HTTP 500 Internal Server Error
- **Message**: "An error occurred while processing your request. Please try again."
- **Action**: Rollback transaction, log error details, preserve user input where possible

#### 5. File Processing Errors

**File Too Large**
- **Scenario**: Uploaded Excel file exceeds size limit (10MB)
- **Response**: HTTP 413 Payload Too Large
- **Message**: "File size exceeds maximum limit of 10MB"
- **Action**: Display error, clear file input

**File Type Invalid**
- **Scenario**: User uploads non-Excel file
- **Response**: HTTP 415 Unsupported Media Type
- **Message**: "Invalid file type. Please upload an Excel file (.xlsx or .xls)"
- **Action**: Display error, clear file input

**File Parsing Error**
- **Scenario**: Excel file is corrupted or unreadable
- **Response**: HTTP 422 Unprocessable Entity
- **Message**: "Unable to read Excel file. The file may be corrupted. Please try again."
- **Action**: Log error details, suggest re-downloading template

#### 6. Network Errors

**Request Timeout**
- **Scenario**: API request exceeds timeout (30 seconds)
- **Response**: HTTP 408 Request Timeout
- **Message**: "Request timed out. Please check your connection and try again."
- **Action**: Retry button, preserve form data

**Connection Lost During Exam**
- **Scenario**: Student loses internet connection while taking exam
- **Response**: Client-side detection
- **Message**: "Connection lost. Your answers are saved locally and will sync when connection is restored."
- **Action**: Display offline indicator, continue allowing answer selection, queue auto-save requests

### Error Handling Strategies

#### Client-Side Validation

**Form Validation**
- Validate required fields before submission
- Provide real-time feedback on input errors
- Disable submit buttons until validation passes
- Display inline error messages near relevant fields

**Optimistic UI Updates**
- Update UI immediately for better UX
- Revert changes if server request fails
- Display loading states during async operations

#### Server-Side Validation

**Input Sanitization**
- Sanitize all user inputs to prevent SQL injection
- Validate data types and formats
- Enforce business rules before database operations

**Transaction Management**
- Use database transactions for multi-step operations
- Implement rollback on any step failure
- Log transaction failures for debugging

#### Auto-Save Error Handling

**Answer Auto-Save Failures**
- Queue failed save requests for retry
- Retry with exponential backoff (1s, 2s, 4s, 8s)
- Store answers in localStorage as backup
- Display warning if multiple save attempts fail
- Sync localStorage answers on connection restore

#### Graceful Degradation

**PWA Offline Mode**
- Cache static assets for offline access
- Display clear offline indicators
- Queue API requests for when connection returns
- Provide meaningful offline error messages

**Timer Resilience**
- Store timer state in localStorage
- Recalculate remaining time on page reload
- Handle clock skew between client and server
- Auto-submit if timer expires during offline period

### Logging and Monitoring

**Error Logging**
- Log all server errors with stack traces
- Include request context (user ID, endpoint, parameters)
- Use structured logging (JSON format)
- Separate log levels: ERROR, WARN, INFO, DEBUG

**Security Event Logging**
- Log failed authentication attempts
- Log unauthorized access attempts
- Log exam password failures
- Monitor for suspicious patterns (brute force, rapid requests)

**Performance Monitoring**
- Track API response times
- Monitor database query performance
- Alert on slow queries (>1 second)
- Track error rates by endpoint

**User Activity Logging**
- Log exam start/end times
- Log answer submissions (for audit trail)
- Log exam publication events
- Log bulk import operations



## Testing Strategy

### Overview

The Web Exam System requires a **multi-layered testing approach** combining unit tests, integration tests, end-to-end tests, and limited property-based tests for core algorithms. Given the system's nature as a CRUD application with significant UI and database interactions, the testing strategy emphasizes integration and functional testing over pure property-based testing.

### Testing Pyramid

```
                    /\
                   /  \
                  / E2E \
                 /--------\
                /          \
               / Integration \
              /--------------\
             /                \
            /   Unit + Property \
           /--------------------\
```

- **Unit + Property Tests (60%)**: Core business logic, algorithms, utilities
- **Integration Tests (30%)**: API endpoints, database operations, service interactions
- **End-to-End Tests (10%)**: Critical user workflows across all three portals

### Property-Based Testing

**Library**: fast-check (JavaScript/TypeScript)

**Configuration**: Minimum 100 iterations per property test

**Applicable Properties** (from Correctness Properties section):

#### Property 1: Question Randomization Preserves All Questions
```typescript
// Feature: web-exam-system, Property 1: Question Randomization Preserves All Questions
test('randomization preserves all questions', () => {
  fc.assert(
    fc.property(
      fc.array(fc.uuid(), { minLength: 100, maxLength: 100 }),
      (questionIds) => {
        const randomized = randomizeQuestions(questionIds);
        return (
          randomized.length === 100 &&
          new Set(randomized).size === 100 &&
          questionIds.every(id => randomized.includes(id))
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 2: Question Randomization Produces Different Orders
```typescript
// Feature: web-exam-system, Property 2: Question Randomization Produces Different Orders
test('randomization produces different orders', () => {
  fc.assert(
    fc.property(
      fc.array(fc.uuid(), { minLength: 100, maxLength: 100 }),
      (questionIds) => {
        const orders = Array.from({ length: 10 }, () => 
          randomizeQuestions(questionIds)
        );
        const uniqueOrders = new Set(orders.map(o => JSON.stringify(o)));
        return uniqueOrders.size >= 9; // At least 9 out of 10 should be different
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 3: Password Generation Produces Valid Format
```typescript
// Feature: web-exam-system, Property 3: Password Generation Produces Valid Format
test('password generation produces valid format', () => {
  fc.assert(
    fc.property(
      fc.constant(null), // No input needed
      () => {
        const password = generateExamPassword();
        return (
          password.length === 8 &&
          /^[A-Za-z0-9]{8}$/.test(password)
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 4: Score Calculation Accuracy
```typescript
// Feature: web-exam-system, Property 4: Score Calculation Accuracy
test('score calculation accuracy', () => {
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom('A', 'B', 'C', 'D'), { minLength: 100, maxLength: 100 }),
      fc.array(fc.constantFrom('A', 'B', 'C', 'D'), { minLength: 100, maxLength: 100 }),
      (studentAnswers, correctAnswers) => {
        const score = calculateScore(studentAnswers, correctAnswers);
        const expectedScore = studentAnswers.filter((ans, idx) => 
          ans === correctAnswers[idx]
        ).length;
        return score === expectedScore && score >= 0 && score <= 100;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 5: Timer Calculation Consistency
```typescript
// Feature: web-exam-system, Property 5: Timer Calculation Consistency
test('timer calculation consistency', () => {
  fc.assert(
    fc.property(
      fc.date(),
      fc.integer({ min: 1, max: 300 }), // 1-300 minutes
      fc.date(),
      (startTime, durationMinutes, currentTime) => {
        fc.pre(currentTime >= startTime); // Current time must be after start
        const remaining = calculateRemainingTime(startTime, durationMinutes, currentTime);
        const expected = Math.max(0, 
          (startTime.getTime() + durationMinutes * 60000 - currentTime.getTime()) / 60000
        );
        return Math.abs(remaining - expected) < 0.01; // Allow small floating point difference
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 6: Excel Import Round-Trip Preservation
```typescript
// Feature: web-exam-system, Property 6: Excel Import Round-Trip Preservation
test('excel import round-trip preservation', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          question: fc.string({ minLength: 10, maxLength: 500 }),
          A: fc.string({ minLength: 1, maxLength: 200 }),
          B: fc.string({ minLength: 1, maxLength: 200 }),
          C: fc.string({ minLength: 1, maxLength: 200 }),
          D: fc.string({ minLength: 1, maxLength: 200 }),
          Answer: fc.constantFrom('A', 'B', 'C', 'D')
        }),
        { minLength: 100, maxLength: 100 }
      ),
      (questions) => {
        const excelBuffer = exportQuestionsToExcel(questions);
        const imported = importQuestionsFromExcel(excelBuffer);
        return (
          imported.length === 100 &&
          imported.every((q, idx) => 
            q.question === questions[idx].question &&
            q.A === questions[idx].A &&
            q.B === questions[idx].B &&
            q.C === questions[idx].C &&
            q.D === questions[idx].D &&
            q.Answer === questions[idx].Answer
          )
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Framework**: Jest with TypeScript support

**Coverage Target**: 80% code coverage for business logic

**Focus Areas**:

#### Authentication Service
- Password hashing and verification
- JWT token generation and validation
- Session creation and validation
- Role-based access control logic

```typescript
describe('AuthService', () => {
  test('should hash passwords securely', async () => {
    const password = 'testPassword123';
    const hash = await authService.hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await authService.verifyPassword(password, hash)).toBe(true);
  });

  test('should generate valid JWT tokens', () => {
    const token = authService.generateJWT('user-id', 'student');
    const payload = authService.verifyJWT(token);
    expect(payload.userId).toBe('user-id');
    expect(payload.role).toBe('student');
  });

  test('should reject expired tokens', () => {
    const expiredToken = authService.generateJWT('user-id', 'student', -3600);
    expect(() => authService.verifyJWT(expiredToken)).toThrow('Token expired');
  });
});
```

#### Exam Service
- Question randomization algorithm
- Timer initialization and calculation
- Answer validation
- Submission validation

```typescript
describe('ExamService', () => {
  test('should initialize timer with correct duration', async () => {
    const timer = await examService.initializeTimer('student-id', 'exam-id', 120);
    expect(timer.durationMinutes).toBe(120);
    expect(timer.startTime).toBeInstanceOf(Date);
  });

  test('should validate submission with all answers', async () => {
    const result = await examService.validateSubmission('student-id', 'exam-id');
    expect(result.isValid).toBe(true);
    expect(result.unansweredQuestions).toHaveLength(0);
  });

  test('should identify unanswered questions', async () => {
    // Setup: student has answered only 95 questions
    const result = await examService.validateSubmission('student-id', 'exam-id');
    expect(result.isValid).toBe(false);
    expect(result.unansweredQuestions).toHaveLength(5);
  });
});
```

#### Result Service
- Score calculation
- Result aggregation
- Answer comparison

```typescript
describe('ResultService', () => {
  test('should calculate correct score', async () => {
    const score = await resultService.calculateScore('student-id', 'exam-id');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('should compare answers correctly', async () => {
    const comparison = await resultService.compareAnswers(studentAnswers, correctAnswers);
    expect(comparison).toHaveLength(100);
    comparison.forEach(c => {
      expect(c).toHaveProperty('isCorrect');
      expect(c).toHaveProperty('studentAnswer');
      expect(c).toHaveProperty('correctAnswer');
    });
  });
});
```

#### Admin Service
- Student credential generation
- Excel parsing and validation
- Subject management

```typescript
describe('AdminService', () => {
  test('should generate unique usernames', async () => {
    const students = [{ name: 'John Doe' }, { name: 'Jane Smith' }];
    const result = await adminService.generateCredentials(students);
    const usernames = result.map(s => s.username);
    expect(new Set(usernames).size).toBe(usernames.length);
  });

  test('should generate secure passwords', async () => {
    const students = [{ name: 'John Doe' }];
    const result = await adminService.generateCredentials(students);
    expect(result[0].password).toMatch(/^[A-Za-z0-9]{8,}$/);
  });

  test('should validate Excel format', () => {
    const invalidExcel = Buffer.from('invalid data');
    expect(() => adminService.validateExcelFormat(invalidExcel)).toThrow();
  });
});
```

### Integration Testing

**Framework**: Jest with Supertest for API testing

**Database**: Test database with migrations and seed data

**Focus Areas**:

#### API Endpoint Testing

**Admin Endpoints**
```typescript
describe('Admin API', () => {
  test('POST /api/admin/subjects - should create subject', async () => {
    const response = await request(app)
      .post('/api/admin/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Mathematics' })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Mathematics');
  });

  test('POST /api/admin/students/bulk-import - should import students', async () => {
    const response = await request(app)
      .post('/api/admin/students/bulk-import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', 'test/fixtures/students.xlsx')
      .expect(200);
    
    expect(response.body.imported).toBe(50);
    expect(response.body.batchId).toBeDefined();
  });

  test('GET /api/admin/results - should return all results', async () => {
    const response = await request(app)
      .get('/api/admin/results')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});
```

**Teacher Endpoints**
```typescript
describe('Teacher API', () => {
  test('POST /api/teacher/register - should register teacher', async () => {
    const response = await request(app)
      .post('/api/teacher/register')
      .send({
        username: 'teacher1',
        password: 'password123',
        subjectId: subjectId
      })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.subjectId).toBe(subjectId);
  });

  test('POST /api/teacher/exams - should create exam', async () => {
    const response = await request(app)
      .post('/api/teacher/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        questions: generateMockQuestions(100),
        durationMinutes: 120
      })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('password');
    expect(response.body.password).toHaveLength(8);
  });

  test('PUT /api/teacher/exams/:id/publish - should publish exam', async () => {
    const response = await request(app)
      .put(`/api/teacher/exams/${examId}/publish`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    
    expect(response.body.isPublic).toBe(true);
  });
});
```

**Student Endpoints**
```typescript
describe('Student API', () => {
  test('POST /api/student/exams/:id/start - should start exam with correct password', async () => {
    const response = await request(app)
      .post(`/api/student/exams/${examId}/start`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ password: examPassword })
      .expect(200);
    
    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('questions');
    expect(response.body.questions).toHaveLength(100);
  });

  test('POST /api/student/answers/save - should auto-save answer', async () => {
    const response = await request(app)
      .post('/api/student/answers/save')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        sessionId: sessionId,
        questionId: questionId,
        answer: 'A'
      })
      .expect(200);
    
    expect(response.body.saved).toBe(true);
  });

  test('POST /api/student/exams/:id/submit - should submit exam', async () => {
    const response = await request(app)
      .post(`/api/student/exams/${examId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ sessionId: sessionId })
      .expect(200);
    
    expect(response.body).toHaveProperty('score');
    expect(response.body.score).toBeGreaterThanOrEqual(0);
    expect(response.body.score).toBeLessThanOrEqual(100);
  });
});
```

#### Database Integration Testing

```typescript
describe('Database Operations', () => {
  test('should enforce subject uniqueness for teachers', async () => {
    await teacherService.registerTeacher('teacher1', 'pass', subjectId);
    await expect(
      teacherService.registerTeacher('teacher2', 'pass', subjectId)
    ).rejects.toThrow('Subject already assigned');
  });

  test('should prevent duplicate exam sessions', async () => {
    await examService.startExam(studentId, examId, password);
    await expect(
      examService.startExam(studentId, examId, password)
    ).rejects.toThrow('Exam already started');
  });

  test('should maintain referential integrity', async () => {
    // Attempt to delete subject with associated exams
    await expect(
      adminService.deleteSubject(subjectId)
    ).rejects.toThrow('Cannot delete subject with existing exams');
  });
});
```

### End-to-End Testing

**Framework**: Playwright or Cypress

**Focus**: Critical user workflows across all three portals

#### Admin Portal E2E Tests

```typescript
describe('Admin Portal E2E', () => {
  test('complete subject and student management workflow', async () => {
    // Login as admin
    await page.goto('http://exam.skoolific.com/admin');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'adminpass');
    await page.click('button[type="submit"]');
    
    // Create subject
    await page.click('text=Subjects');
    await page.fill('[name="subjectName"]', 'Physics');
    await page.click('button:has-text("Create Subject")');
    await expect(page.locator('text=Physics')).toBeVisible();
    
    // Upload students
    await page.click('text=Students');
    await page.setInputFiles('[type="file"]', 'test/fixtures/students.xlsx');
    await page.click('button:has-text("Upload")');
    await expect(page.locator('text=50 students imported')).toBeVisible();
    
    // Download credentials
    await page.click('button:has-text("Download Credentials")');
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('credentials');
  });
});
```

#### Teacher Portal E2E Tests

```typescript
describe('Teacher Portal E2E', () => {
  test('complete exam creation and publishing workflow', async () => {
    // Register teacher
    await page.goto('http://exam.skoolific.com/teacher');
    await page.click('text=Sign Up');
    await page.fill('[name="username"]', 'teacher_physics');
    await page.fill('[name="password"]', 'teacherpass');
    await page.selectOption('[name="subject"]', 'Physics');
    await page.click('button[type="submit"]');
    
    // Create exam via Excel import
    await page.click('text=Create Exam');
    await page.click('button:has-text("Download Template")');
    await page.setInputFiles('[type="file"]', 'test/fixtures/exam_questions.xlsx');
    await page.click('button:has-text("Import")');
    
    // Set duration
    await page.fill('[name="hours"]', '2');
    await page.fill('[name="minutes"]', '0');
    
    // Finish and publish
    await page.click('button:has-text("Finish")');
    const password = await page.locator('[data-testid="exam-password"]').textContent();
    expect(password).toHaveLength(8);
    
    await page.click('button:has-text("Make Public")');
    await expect(page.locator('text=Exam published')).toBeVisible();
  });
});
```

#### Student Portal E2E Tests

```typescript
describe('Student Portal E2E', () => {
  test('complete exam taking workflow', async () => {
    // Login as student
    await page.goto('http://exam.skoolific.com/student');
    await page.fill('[name="username"]', 'student001');
    await page.fill('[name="password"]', 'studentpass');
    await page.click('button[type="submit"]');
    
    // Start exam
    await page.click('text=Physics Exam');
    await page.fill('[name="password"]', examPassword);
    await page.click('button:has-text("Start Exam")');
    
    // Verify timer started
    await expect(page.locator('[data-testid="timer"]')).toBeVisible();
    
    // Answer questions
    await page.click('input[value="A"]');
    await expect(page.locator('[data-testid="question-1"]')).toHaveClass(/answered/);
    
    // Navigate using overview panel
    await page.click('[data-testid="question-50"]');
    await expect(page.locator('text=Question 50 of 100')).toBeVisible();
    
    // Flag question
    await page.click('button:has-text("Flag")');
    await expect(page.locator('[data-testid="question-50"]')).toHaveClass(/flagged/);
    
    // Submit exam
    await page.click('button:has-text("Finish")');
    await page.click('button:has-text("Confirm Submit")');
    
    // View results
    await expect(page.locator('text=Your Score:')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toContainText('/100');
  });
});
```

### Performance Testing

**Tool**: Artillery or k6

**Scenarios**:

1. **Concurrent Exam Taking**: 100 students taking exams simultaneously
2. **Bulk Import**: Importing 1000 students via Excel
3. **Auto-Save Load**: 100 students auto-saving answers every 5 seconds
4. **Results Dashboard**: Admin viewing results for 500 students across 10 subjects

```yaml
# artillery-config.yml
config:
  target: 'http://exam.skoolific.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Student takes exam"
    flow:
      - post:
          url: "/api/student/login"
          json:
            username: "{{ $randomString() }}"
            password: "testpass"
          capture:
            - json: "$.token"
              as: "token"
      - post:
          url: "/api/student/exams/{{ examId }}/start"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            password: "{{ examPassword }}"
      - loop:
          - post:
              url: "/api/student/answers/save"
              headers:
                Authorization: "Bearer {{ token }}"
              json:
                questionId: "{{ $randomUUID() }}"
                answer: "{{ $randomChoice(['A','B','C','D']) }}"
          count: 100
```

### Security Testing

**Focus Areas**:

1. **Authentication**: Brute force protection, session hijacking prevention
2. **Authorization**: Role-based access control enforcement
3. **Input Validation**: SQL injection, XSS prevention
4. **Password Security**: Secure generation, hashing strength
5. **Exam Integrity**: Password protection, one-time access enforcement

```typescript
describe('Security Tests', () => {
  test('should prevent SQL injection in login', async () => {
    const response = await request(app)
      .post('/api/student/login')
      .send({
        username: "admin' OR '1'='1",
        password: "anything"
      })
      .expect(401);
  });

  test('should prevent XSS in question text', async () => {
    const response = await request(app)
      .post('/api/teacher/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        questions: [{
          question: '<script>alert("XSS")</script>',
          A: 'Option A',
          B: 'Option B',
          C: 'Option C',
          D: 'Option D',
          correctAnswer: 'A'
        }]
      });
    
    const exam = await examService.getExam(response.body.id);
    expect(exam.questions[0].question).not.toContain('<script>');
  });

  test('should enforce rate limiting on login', async () => {
    const attempts = Array.from({ length: 6 }, () =>
      request(app)
        .post('/api/student/login')
        .send({ username: 'student', password: 'wrong' })
    );
    
    const responses = await Promise.all(attempts);
    expect(responses[5].status).toBe(429); // Too Many Requests
  });
});
```

### Test Data Management

**Strategy**: Use factories and fixtures for consistent test data

```typescript
// test/factories/examFactory.ts
export const createExam = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  subjectId: faker.datatype.uuid(),
  teacherId: faker.datatype.uuid(),
  password: faker.random.alphaNumeric(8),
  durationMinutes: 120,
  isPublic: false,
  isFinished: false,
  ...overrides
});

export const createQuestions = (count = 100) =>
  Array.from({ length: count }, (_, i) => ({
    id: faker.datatype.uuid(),
    originalOrder: i + 1,
    questionText: faker.lorem.sentence(),
    optionA: faker.lorem.words(3),
    optionB: faker.lorem.words(3),
    optionC: faker.lorem.words(3),
    optionD: faker.lorem.words(3),
    correctAnswer: faker.helpers.arrayElement(['A', 'B', 'C', 'D'])
  }));
```

### Continuous Integration

**Pipeline**: GitHub Actions or GitLab CI

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: exam_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run property-based tests
        run: npm run test:property
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/exam_test
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Test Coverage Goals

- **Overall Code Coverage**: 80%
- **Business Logic Coverage**: 90%
- **API Endpoint Coverage**: 100%
- **Critical Path Coverage**: 100% (exam taking, score calculation, authentication)

### Testing Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after each test
3. **Mocking**: Mock external dependencies (email, file system) in unit tests
4. **Realistic Data**: Use realistic test data that matches production patterns
5. **Error Cases**: Test both happy paths and error scenarios
6. **Performance**: Keep unit tests fast (<100ms each), integration tests reasonable (<5s each)
7. **Documentation**: Document complex test scenarios and edge cases
8. **Maintenance**: Regularly review and update tests as requirements change



## Authentication and Authorization

### Authentication Strategy

The system implements **role-based authentication** with different strategies for each user type:

#### Admin and Teacher Authentication

**Strategy**: Session-based authentication with persistent sessions

**Implementation**:
```typescript
// express-session configuration
app.use(session({
  store: new PostgreSQLStore({
    pool: pgPool,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'strict'
  }
}));
```

**Login Flow**:
1. User submits username and password
2. Server validates credentials against database
3. Password verified using bcrypt.compare()
4. Session created and stored in PostgreSQL
5. Session ID returned in HTTP-only cookie
6. Subsequent requests authenticated via session cookie

**Logout Flow**:
1. User clicks logout
2. Server destroys session from database
3. Session cookie cleared
4. User redirected to login page

#### Student Authentication

**Strategy**: Stateless JWT-based authentication (no session persistence)

**Implementation**:
```typescript
// JWT configuration
const generateStudentToken = (studentId: string) => {
  return jwt.sign(
    { userId: studentId, role: 'student' },
    process.env.JWT_SECRET,
    { expiresIn: '2h' } // Short-lived token
  );
};
```

**Login Flow**:
1. Student submits username and password
2. Server validates credentials
3. JWT token generated with 2-hour expiration
4. Token returned in response body
5. Client stores token in memory (not localStorage)
6. Token included in Authorization header for API requests

**Security Rationale**:
- No persistent sessions for students (requirement 12.2, 12.3)
- Token expires after 2 hours of inactivity
- Token not stored in localStorage (XSS protection)
- Requires re-authentication after browser close

### Authorization Strategy

**Role-Based Access Control (RBAC)**:

```typescript
enum Role {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

// Middleware for role-based authorization
const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// Usage in routes
app.get('/api/admin/subjects', requireRole(Role.ADMIN), adminController.getSubjects);
app.get('/api/teacher/exams', requireRole(Role.TEACHER), teacherController.getExams);
app.get('/api/student/exams', requireRole(Role.STUDENT), studentController.getExams);
```

### Access Control Matrix

| Resource | Admin | Teacher | Student |
|----------|-------|---------|---------|
| Create Subject | ✓ | ✗ | ✗ |
| View All Subjects | ✓ | ✗ | ✗ |
| Import Students | ✓ | ✗ | ✗ |
| View All Results | ✓ | ✗ | ✗ |
| View Exam Passwords | ✓ | ✗ | ✗ |
| Register Teacher | ✗ | ✓ (self) | ✗ |
| Create Exam | ✗ | ✓ (own subject) | ✗ |
| Publish Exam | ✗ | ✓ (own exam) | ✗ |
| View Subject Results | ✗ | ✓ (own subject) | ✗ |
| View Available Exams | ✗ | ✗ | ✓ |
| Take Exam | ✗ | ✗ | ✓ (once per exam) |
| View Own Results | ✗ | ✗ | ✓ |

### Password Security

**Password Hashing**:
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

**Password Generation** (for students):
```typescript
import crypto from 'crypto';

export const generateSecurePassword = (): string => {
  const length = 10;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};
```

**Exam Password Generation**:
```typescript
export const generateExamPassword = (): string => {
  const length = 8;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};
```

### Security Measures

**Rate Limiting**:
```typescript
import rateLimit from 'express-rate-limit';

// Login rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/*/login', loginLimiter, authController.login);

// Exam password rate limiting
const examPasswordLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 attempts
  message: 'Too many incorrect password attempts. Please wait before trying again.',
  keyGenerator: (req) => `${req.user.id}:${req.params.examId}`
});

app.post('/api/student/exams/:id/start', examPasswordLimiter, examController.startExam);
```

**CORS Configuration**:
```typescript
import cors from 'cors';

app.use(cors({
  origin: 'https://exam.skoolific.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Input Sanitization**:
```typescript
import { body, validationResult } from 'express-validator';
import xss from 'xss';

// Sanitize all text inputs
const sanitizeInput = (input: string): string => {
  return xss(input, {
    whiteList: {}, // No HTML allowed
    stripIgnoreTag: true
  });
};

// Validation middleware
const validateExamCreation = [
  body('questions').isArray({ min: 100, max: 100 }),
  body('questions.*.questionText').trim().notEmpty().customSanitizer(sanitizeInput),
  body('questions.*.optionA').trim().notEmpty().customSanitizer(sanitizeInput),
  body('questions.*.optionB').trim().notEmpty().customSanitizer(sanitizeInput),
  body('questions.*.optionC').trim().notEmpty().customSanitizer(sanitizeInput),
  body('questions.*.optionD').trim().notEmpty().customSanitizer(sanitizeInput),
  body('questions.*.correctAnswer').isIn(['A', 'B', 'C', 'D']),
  body('durationMinutes').isInt({ min: 1, max: 300 })
];
```

## PWA Configuration

### Service Worker Setup

**vite-plugin-pwa Configuration**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Web Exam System - Student Portal',
        short_name: 'Exam Portal',
        description: 'Take exams and view results',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/student/',
        start_url: '/student/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/exam\.skoolific\.com\/api\/student\/exams$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'exam-list-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/exam\.skoolific\.com\/api\/student\/results$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'results-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 10 // 10 minutes
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ]
});
```

### Offline Functionality

**Offline Detection**:
```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
```

**Offline Answer Storage**:
```typescript
// src/services/offlineStorage.ts
interface PendingAnswer {
  questionId: string;
  answer: string;
  timestamp: number;
}

export class OfflineStorage {
  private static STORAGE_KEY = 'pending_answers';

  static savePendingAnswer(sessionId: string, questionId: string, answer: string) {
    const pending = this.getPendingAnswers(sessionId);
    pending.push({ questionId, answer, timestamp: Date.now() });
    localStorage.setItem(`${this.STORAGE_KEY}_${sessionId}`, JSON.stringify(pending));
  }

  static getPendingAnswers(sessionId: string): PendingAnswer[] {
    const data = localStorage.getItem(`${this.STORAGE_KEY}_${sessionId}`);
    return data ? JSON.parse(data) : [];
  }

  static clearPendingAnswers(sessionId: string) {
    localStorage.removeItem(`${this.STORAGE_KEY}_${sessionId}`);
  }

  static async syncPendingAnswers(sessionId: string, apiClient: any) {
    const pending = this.getPendingAnswers(sessionId);
    
    for (const answer of pending) {
      try {
        await apiClient.saveAnswer(sessionId, answer.questionId, answer.answer);
      } catch (error) {
        console.error('Failed to sync answer:', error);
        throw error;
      }
    }
    
    this.clearPendingAnswers(sessionId);
  }
}
```

**Offline UI Indicator**:
```typescript
// src/components/OfflineIndicator.tsx
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      <span>⚠️ You are offline. Answers are being saved locally and will sync when connection is restored.</span>
    </div>
  );
};
```

### Installation Prompt

```typescript
// src/components/InstallPrompt.tsx
import { useState, useEffect } from 'react';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="install-prompt">
      <p>Install the Exam Portal app for quick access</p>
      <button onClick={handleInstall}>Install</button>
      <button onClick={() => setShowPrompt(false)}>Not now</button>
    </div>
  );
};
```

## Deployment Strategy

### Server Setup (VPS: 76.13.48.245)

#### 1. System Requirements

- **OS**: Ubuntu 22.04 LTS
- **Node.js**: v18.x LTS
- **PostgreSQL**: 14.x
- **Nginx**: Latest stable
- **PM2**: Latest (process manager)
- **SSL**: Let's Encrypt (Certbot)

#### 2. Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### 3. PostgreSQL Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE exam_system;
CREATE USER exam_user WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE exam_system TO exam_user;

# Exit psql
\q

# Run migrations
cd /var/www/exam-system/api
npm run migrate
```

#### 4. Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/exam-system
sudo chown -R $USER:$USER /var/www/exam-system

# Clone repository
cd /var/www/exam-system
git clone https://github.com/SharkDevSol/exam.git .

# Install dependencies
cd api
npm ci --production
cd ../app
npm ci

# Build frontend
npm run build

# Create environment file
cd /var/www/exam-system/api
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://exam_user:secure_password_here@localhost:5432/exam_system
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://exam.skoolific.com
EOF

# Set proper permissions
chmod 600 .env
```

#### 5. PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'exam-api',
    script: './dist/server.js',
    cwd: '/var/www/exam-system/api',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/pm2/exam-api-error.log',
    out_file: '/var/log/pm2/exam-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
```

```bash
# Start application with PM2
cd /var/www/exam-system/api
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command that PM2 outputs

# Monitor application
pm2 monit
```

#### 6. Nginx Configuration

```nginx
# /etc/nginx/sites-available/exam.skoolific.com
server {
    listen 80;
    server_name exam.skoolific.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name exam.skoolific.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/exam.skoolific.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/exam.skoolific.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory for static files
    root /var/www/exam-system/app/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Admin portal
    location /admin {
        try_files $uri $uri/ /index.html;
    }

    # Teacher portal
    location /teacher {
        try_files $uri $uri/ /index.html;
    }

    # Student portal
    location /student {
        try_files $uri $uri/ /index.html;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker (no cache)
    location /sw.js {
        add_header Cache-Control "no-cache";
        proxy_cache_bypass $http_pragma;
        proxy_cache_revalidate on;
        expires off;
        access_log off;
    }

    # Manifest file
    location /manifest.json {
        add_header Cache-Control "no-cache";
    }

    # Default location
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/exam.skoolific.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 7. SSL Certificate Setup

```bash
# Obtain SSL certificate
sudo certbot --nginx -d exam.skoolific.com

# Test auto-renewal
sudo certbot renew --dry-run

# Auto-renewal is configured via cron
```

#### 8. Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Check status
sudo ufw status
```

### Continuous Deployment

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd api && npm ci
          cd ../app && npm ci
      
      - name: Run tests
        run: |
          cd api && npm test
          cd ../app && npm test
      
      - name: Build frontend
        run: cd app && npm run build
      
      - name: Build backend
        run: cd api && npm run build
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: 76.13.48.245
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/exam-system
            git pull origin main
            cd api
            npm ci --production
            npm run build
            cd ../app
            npm ci
            npm run build
            pm2 restart exam-api
            sudo systemctl reload nginx
```

### Monitoring and Maintenance

#### Log Management

```bash
# Setup log rotation
sudo cat > /etc/logrotate.d/exam-system << EOF
/var/log/pm2/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

#### Database Backups

```bash
# Create backup script
sudo cat > /usr/local/bin/backup-exam-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/exam-system"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U exam_user exam_system | gzip > $BACKUP_DIR/exam_system_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "exam_system_*.sql.gz" -mtime +30 -delete
EOF

sudo chmod +x /usr/local/bin/backup-exam-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-exam-db.sh") | crontab -
```

#### Health Checks

```bash
# Create health check script
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ $API_STATUS -ne 200 ]; then
    echo "API health check failed with status $API_STATUS"
    pm2 restart exam-api
    # Send alert (email, Slack, etc.)
fi

# Check database connection
psql -U exam_user -d exam_system -c "SELECT 1" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Database connection failed"
    # Send alert
fi
EOF

chmod +x /usr/local/bin/health-check.sh

# Run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/health-check.sh") | crontab -
```

### Rollback Strategy

```bash
# Create rollback script
cat > /var/www/exam-system/rollback.sh << 'EOF'
#!/bin/bash

# Get previous commit
PREVIOUS_COMMIT=$(git rev-parse HEAD~1)

echo "Rolling back to commit: $PREVIOUS_COMMIT"

# Checkout previous commit
git checkout $PREVIOUS_COMMIT

# Rebuild
cd api
npm ci --production
npm run build

cd ../app
npm ci
npm run build

# Restart services
pm2 restart exam-api
sudo systemctl reload nginx

echo "Rollback complete"
EOF

chmod +x /var/www/exam-system/rollback.sh
```

### Performance Optimization

**Database Connection Pooling**:
```typescript
// api/src/config/database.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

**Redis Caching** (optional enhancement):
```typescript
// Cache exam data to reduce database load
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3
});

export const cacheExam = async (examId: string, data: any) => {
  await redis.setex(`exam:${examId}`, 3600, JSON.stringify(data));
};

export const getCachedExam = async (examId: string) => {
  const cached = await redis.get(`exam:${examId}`);
  return cached ? JSON.parse(cached) : null;
};
```

## Summary

This design document provides a comprehensive blueprint for the Web Exam System, covering:

- **Architecture**: Multi-layered architecture with clear separation between portals
- **Components**: Detailed component specifications for frontend and backend
- **Data Models**: Complete database schema with relationships and indexes
- **Correctness Properties**: Six key properties for property-based testing of core algorithms
- **Error Handling**: Comprehensive error handling strategies across all layers
- **Testing Strategy**: Multi-layered testing approach with unit, integration, E2E, and property-based tests
- **Authentication**: Role-based authentication with different strategies per user type
- **PWA Configuration**: Progressive Web App setup for student portal
- **Deployment**: Complete deployment strategy with monitoring and maintenance

The system is designed to be secure, scalable, and maintainable, with emphasis on exam integrity, user experience, and operational reliability.

