# Implementation Plan: Web Exam System

## Overview

This implementation plan breaks down the Web Exam System into incremental, manageable tasks. The system consists of three portals (Admin, Teacher, Student) with a React + Vite frontend, Node.js + Express backend, and PostgreSQL database. The implementation follows a bottom-up approach: database → backend API → frontend components → integration → deployment.

## Tasks

- [x] 1. Project setup and infrastructure
  - Initialize monorepo structure with separate `api` and `app` directories
  - Set up TypeScript configuration for both frontend and backend
  - Configure Vite for React with CSS Modules support
  - Set up ESLint and Prettier for code quality
  - Initialize Git repository with appropriate .gitignore files
  - Create package.json files with all required dependencies
  - _Requirements: 30.1-30.8_

- [x] 2. Database schema and migrations
  - [x] 2.1 Create PostgreSQL database schema
    - Create tables: admins, teachers, students, subjects, exams, questions, exam_sessions, answers, flagged_questions, results, sessions
    - Define all foreign key relationships and constraints
    - Add unique constraints (teacher-subject, student-exam session)
    - _Requirements: 30.1-30.8_
  
  - [x] 2.2 Create database indexes for performance
    - Add indexes on foreign keys and frequently queried columns
    - Create unique indexes for username fields
    - Add composite indexes for common query patterns
    - _Requirements: 30.1-30.8_
  
  - [x] 2.3 Set up database migration system
    - Configure migration tool (node-pg-migrate or similar)
    - Create initial migration files for schema
    - Add seed data for development/testing
    - _Requirements: 30.1-30.8_

- [x] 3. Backend core infrastructure
  - [x] 3.1 Set up Express server with TypeScript
    - Create Express app with TypeScript configuration
    - Set up middleware (cors, body-parser, helmet)
    - Configure environment variables with dotenv
    - Create database connection pool with pg library
    - _Requirements: 30.1-30.8_
  
  - [x] 3.2 Implement authentication middleware
    - Create bcrypt password hashing utilities (salt rounds: 12)
    - Implement JWT token generation and verification
    - Set up express-session with PostgreSQL store for admin/teacher
    - Create role-based access control middleware
    - _Requirements: 4.1-4.3, 6.1-6.3, 12.1-12.3_
  
  - [x] 3.3 Implement security middleware
    - Add rate limiting for login endpoints (5 attempts per 15 minutes)
    - Add rate limiting for exam password attempts (3 attempts per 5 minutes)
    - Implement input sanitization with xss library
    - Add request validation with express-validator
    - _Requirements: 10.5, 14.5_
  
  - [ ]* 3.4 Write unit tests for authentication utilities
    - Test password hashing and verification
    - Test JWT token generation and validation
    - Test session creation and validation
    - Test role-based access control logic
    - _Requirements: 4.1-4.3, 6.1-6.3, 12.1-12.3_

- [x] 4. Core algorithm implementations
  - [x] 4.1 Implement question randomization algorithm
    - Create Fisher-Yates shuffle function for question order
    - Ensure deterministic randomization per student-exam pair
    - Store randomized order in exam_sessions table
    - _Requirements: 16.1-16.3_
  
  - [ ]* 4.2 Write property test for question randomization
    - **Property 1: Question Randomization Preserves All Questions**
    - **Validates: Requirements 16.1, 16.3**
    - Test that all 100 questions are present exactly once
    - Test that no duplicates or omissions occur
  
  - [ ]* 4.3 Write property test for randomization uniqueness
    - **Property 2: Question Randomization Produces Different Orders**
    - **Validates: Requirements 16.2**
    - Test that different students receive different orders
  
  - [x] 4.4 Implement password generation utilities
    - Create exam password generator (8 chars, alphanumeric)
    - Create student password generator (10 chars, secure)
    - Create username generator from student names
    - _Requirements: 2.2, 2.3, 10.2_
  
  - [ ]* 4.5 Write property test for password generation
    - **Property 3: Password Generation Produces Valid Format**
    - **Validates: Requirements 10.2**
    - Test password length and character set constraints
  
  - [x] 4.6 Implement score calculation function
    - Create function to compare student answers with correct answers
    - Calculate score as count of matching answers (0-100)
    - _Requirements: 11.2, 24.2, 25.1_
  
  - [ ]* 4.7 Write property test for score calculation
    - **Property 4: Score Calculation Accuracy**
    - **Validates: Requirements 11.2, 24.2, 25.1**
    - Test score equals count of matching answers
    - Test score is always between 0 and 100
  
  - [x] 4.8 Implement timer calculation utilities
    - Create function to calculate remaining time
    - Handle timer initialization and expiry logic
    - _Requirements: 15.1-15.5_
  
  - [ ]* 4.9 Write property test for timer calculations
    - **Property 5: Timer Calculation Consistency**
    - **Validates: Requirements 15.1, 15.3, 15.4**
    - Test remaining time calculation accuracy

- [x] 5. Excel processing utilities
  - [x] 5.1 Implement Excel template generation
    - Create function to generate Excel template with columns: question, A, B, C, D, Answer
    - Include 100 empty rows and header labels
    - _Requirements: 9.1, 28.1-28.5_
  
  - [x] 5.2 Implement Excel parsing for questions
    - Parse uploaded Excel files with xlsx library
    - Validate exactly 100 questions with all required fields
    - Return structured question data
    - _Requirements: 9.2-9.6_
  
  - [x] 5.3 Implement Excel parsing for student bulk import
    - Parse single-column Excel files with student names
    - Generate credentials for each student
    - Create downloadable credentials Excel file
    - _Requirements: 2.1-2.5, 29.1-29.5_
  
  - [ ]* 5.4 Write property test for Excel round-trip
    - **Property 6: Excel Import Round-Trip Preservation**
    - **Validates: Requirements 9.2, 9.4, 9.5**
    - Test that exported and re-imported questions are identical
  
  - [ ]* 5.5 Write unit tests for Excel processing
    - Test template generation format
    - Test parsing validation errors
    - Test credential file generation format
    - _Requirements: 2.1-2.5, 9.1-9.6, 28.1-28.5, 29.1-29.5_

- [x] 6. Checkpoint - Core utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Admin API endpoints
  - [x] 7.1 Implement admin authentication endpoints
    - POST /api/admin/login - authenticate admin with session creation
    - POST /api/admin/logout - destroy admin session
    - _Requirements: 4.1-4.3_
  
  - [x] 7.2 Implement subject management endpoints
    - POST /api/admin/subjects - create new subject
    - GET /api/admin/subjects - list all subjects
    - GET /api/admin/subjects/:id/assignments - view teacher assignments
    - _Requirements: 1.1-1.4_
  
  - [x] 7.3 Implement student bulk import endpoints
    - POST /api/admin/students/bulk-import - upload Excel and create students
    - GET /api/admin/students/credentials/:batchId - download credentials
    - _Requirements: 2.1-2.5, 29.1-29.5_
  
  - [x] 7.4 Implement admin results endpoints
    - GET /api/admin/results - fetch all student results
    - GET /api/admin/results?studentId=:id - filter by student
    - GET /api/admin/results?subjectId=:id - filter by subject
    - _Requirements: 3.1-3.4_
  
  - [x] 7.5 Implement exam password viewing endpoints
    - GET /api/admin/exams/passwords - fetch all exam passwords
    - GET /api/admin/exams/passwords?subjectId=:id - filter by subject
    - GET /api/admin/exams/passwords?teacherId=:id - filter by teacher
    - _Requirements: 10.4, 31.1-31.5_
  
  - [ ]* 7.6 Write integration tests for admin endpoints
    - Test authentication flow with session persistence
    - Test subject creation and listing
    - Test bulk import with Excel file
    - Test results retrieval and filtering
    - Test exam password visibility
    - _Requirements: 1.1-4.3, 10.4, 29.1-31.5_

- [x] 8. Teacher API endpoints
  - [x] 8.1 Implement teacher authentication endpoints
    - POST /api/teacher/register - register with username, password, subject
    - POST /api/teacher/login - authenticate teacher with session creation
    - POST /api/teacher/logout - destroy teacher session
    - GET /api/teacher/subjects/available - list unassigned subjects
    - _Requirements: 5.1-5.5, 6.1-6.3_
  
  - [x] 8.2 Implement exam creation endpoints
    - POST /api/teacher/exams - create exam with 100 questions
    - PUT /api/teacher/exams/:id - update exam details
    - Validate exactly 100 questions on creation
    - Generate exam password automatically
    - _Requirements: 7.1-7.4, 8.1-8.4, 10.1-10.3_
  
  - [x] 8.3 Implement exam question import endpoints
    - GET /api/teacher/exams/template - download Excel template
    - POST /api/teacher/exams/import - upload and parse Excel questions
    - _Requirements: 9.1-9.6, 28.1-28.5_
  
  - [x] 8.4 Implement exam publishing endpoints
    - PUT /api/teacher/exams/:id/publish - make exam public
    - PUT /api/teacher/exams/:id/finish - mark exam as finished
    - _Requirements: 10.6-10.8_
  
  - [x] 8.5 Implement teacher results endpoints
    - GET /api/teacher/results - fetch results for teacher's subject
    - GET /api/teacher/results/:studentId/:examId - detailed student results
    - _Requirements: 11.1-11.4_
  
  - [ ]* 8.6 Write integration tests for teacher endpoints
    - Test registration with subject assignment exclusivity
    - Test exam creation with question count validation
    - Test Excel import and template download
    - Test exam publishing workflow
    - Test results viewing for own subject only
    - _Requirements: 5.1-11.4, 28.1-28.5_

- [x] 9. Student API endpoints
  - [x] 9.1 Implement student authentication endpoints
    - POST /api/student/login - authenticate student with JWT (no session persistence)
    - _Requirements: 12.1-12.3_
  
  - [x] 9.2 Implement exam discovery endpoints
    - GET /api/student/exams - list all public exams
    - POST /api/student/exams/:id/start - start exam with password validation
    - _Requirements: 14.1-14.6, 23.1-23.4_
  
  - [x] 9.3 Implement exam session endpoints
    - GET /api/student/exams/:id/questions - fetch randomized questions
    - GET /api/student/exams/:id/timer - get remaining time
    - _Requirements: 15.1-15.5, 16.1-16.3, 17.1-17.6_
  
  - [x] 9.4 Implement answer management endpoints
    - POST /api/student/answers/save - auto-save answer
    - PUT /api/student/answers/:id - update existing answer
    - POST /api/student/questions/:id/flag - flag question for review
    - DELETE /api/student/questions/:id/flag - unflag question
    - _Requirements: 18.1-18.5, 20.1-20.4, 21.1-21.4_
  
  - [x] 9.5 Implement exam submission endpoints
    - POST /api/student/exams/:id/submit - submit exam with validation
    - Return list of unanswered questions if incomplete
    - Calculate and store final score
    - _Requirements: 22.1-22.5_
  
  - [x] 9.6 Implement student results endpoints
    - GET /api/student/results - fetch all results grouped by subject
    - GET /api/student/results/:examId - detailed exam results
    - _Requirements: 24.1-24.6, 25.1-25.4_
  
  - [ ]* 9.7 Write integration tests for student endpoints
    - Test stateless JWT authentication (no persistence)
    - Test exam password validation with rate limiting
    - Test question randomization per student
    - Test auto-save functionality
    - Test exam submission with validation
    - Test one-time exam access enforcement
    - _Requirements: 12.1-25.4_

- [x] 10. Checkpoint - Backend API complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend shared components and utilities
  - [x] 11.1 Set up React Router for three portals
    - Configure routes for /admin, /teacher, /student
    - Implement protected route components with role checking
    - _Requirements: All portal requirements_
  
  - [x] 11.2 Create authentication context and hooks
    - Create AuthContext for managing auth state
    - Implement useAuth hook for accessing auth state
    - Create useSession hook for admin/teacher persistence
    - Create useJWT hook for student stateless auth
    - _Requirements: 4.1-4.3, 6.1-6.3, 12.1-12.3_
  
  - [x] 11.3 Create API client utilities
    - Create axios instance with interceptors
    - Implement request/response error handling
    - Add token/session management to requests
    - _Requirements: All API requirements_
  
  - [x] 11.4 Create shared UI components
    - Button, Input, Select, Modal, Loading spinner
    - Table component for displaying data
    - Form validation utilities
    - CSS Modules for component styling
    - _Requirements: All UI requirements_
  
  - [ ]* 11.5 Write unit tests for shared components
    - Test authentication context and hooks
    - Test API client error handling
    - Test UI component rendering and interactions

- [x] 12. Admin Portal frontend
  - [x] 12.1 Implement admin login page
    - Create login form with username and password fields
    - Handle authentication with session persistence
    - Redirect to dashboard on success
    - _Requirements: 4.1-4.3_
  
  - [x] 12.2 Implement subject management interface
    - Create form to add new subjects
    - Display list of all subjects
    - Show teacher assignments for each subject
    - _Requirements: 1.1-1.4_
  
  - [x] 12.3 Implement student bulk import interface
    - Create file upload component for Excel files
    - Display upload progress and validation errors
    - Show success message with import count
    - Provide download button for credentials file
    - _Requirements: 2.1-2.5, 29.1-29.5_
  
  - [x] 12.4 Implement results dashboard
    - Display all student results in table format
    - Add filters for student and subject
    - Show individual subject scores and total scores
    - Implement sorting by student name or score
    - _Requirements: 3.1-3.4_
  
  - [x] 12.5 Implement exam password viewing interface
    - Display all exams with passwords in table
    - Show subject, teacher, status for each exam
    - Add filters for subject and teacher
    - Display passwords in readable format
    - _Requirements: 10.4, 31.1-31.5_
  
  - [ ]* 12.6 Write integration tests for admin portal
    - Test login flow with session persistence
    - Test subject creation workflow
    - Test bulk import with file upload
    - Test results filtering and display
    - Test exam password visibility

- [x] 13. Teacher Portal frontend
  - [x] 13.1 Implement teacher registration and login pages
    - Create registration form with username, password, subject selection
    - Display only unassigned subjects in dropdown
    - Create login form with session persistence
    - _Requirements: 5.1-5.5, 6.1-6.3_
  
  - [x] 13.2 Implement exam creation interface
    - Create form for exam metadata (duration)
    - Display question counter (must be exactly 100)
    - Show validation errors for question count
    - _Requirements: 7.1-7.4_
  
  - [x] 13.3 Implement manual question entry interface
    - Create 100 question input forms
    - Each form has fields: question text, options A-D, correct answer
    - Validate all fields are completed
    - Allow editing before finalization
    - _Requirements: 8.1-8.4_
  
  - [x] 13.4 Implement Excel question import interface
    - Add "Download Template" button
    - Create file upload component for Excel import
    - Display parsed questions in editable form
    - Show validation errors with specific row numbers
    - _Requirements: 9.1-9.6, 28.1-28.5_
  
  - [x] 13.5 Implement exam publishing interface
    - Display generated exam password prominently
    - Add "Make Public" button to publish exam
    - Add "Finish" button to save exam
    - Show exam status (draft, public, finished)
    - _Requirements: 10.1-10.8_
  
  - [x] 13.6 Implement teacher results interface
    - Display results for teacher's subject only
    - Show student scores in table format
    - Add detailed view for individual student answers
    - Show correct/incorrect indicators for each question
    - Implement sorting by student name or score
    - _Requirements: 11.1-11.4_
  
  - [ ]* 13.7 Write integration tests for teacher portal
    - Test registration with subject exclusivity
    - Test exam creation with question count validation
    - Test Excel import workflow
    - Test exam publishing flow
    - Test results viewing for own subject

- [x] 14. Student Portal frontend - Core exam interface
  - [x] 14.1 Implement student login page
    - Create login form (no "remember me" option)
    - Use JWT authentication without persistence
    - Redirect to exam list on success
    - _Requirements: 12.1-12.3_
  
  - [x] 14.2 Implement exam discovery interface
    - Display all public exams in card/list format
    - Show exam subject, duration, status
    - Hide completed exams or show "Already taken" message
    - _Requirements: 14.1-14.3, 14.6, 23.1-23.4_
  
  - [x] 14.3 Implement exam password entry modal
    - Show modal when student selects an exam
    - Input field for exam password
    - Display error message for incorrect password
    - Rate limit password attempts (3 per 5 minutes)
    - _Requirements: 14.2-14.5_
  
  - [x] 14.4 Implement exam header component
    - Display student name, subject name with icon, school name, admission number
    - Add "Back" button with confirmation dialog
    - _Requirements: 26.1-26.5_
  
  - [x] 14.5 Implement timer component
    - Display countdown timer prominently
    - Update every second
    - Store timer state in localStorage for persistence
    - Auto-submit exam when timer reaches zero
    - _Requirements: 15.1-15.5_
  
  - [x] 14.6 Implement single question display component
    - Display one question at a time with question text
    - Show four radio button options (A, B, C, D)
    - Highlight selected answer
    - Display current question number and total (e.g., "Question 5 of 100")
    - _Requirements: 17.1-17.6, 27.1-27.4_
  
  - [x] 14.7 Implement question navigation controls
    - Add "Next" button (disabled on last question)
    - Add "Back" button (disabled on first question)
    - Add "Flag" button to mark questions for review
    - Show flag status visually
    - _Requirements: 17.2-17.5, 18.1-18.5_
  
  - [x] 14.8 Implement question overview panel
    - Display all 100 questions as numbered cards/buttons
    - Color-code answered questions (blue)
    - Show flag indicator on flagged questions
    - Highlight current question
    - Allow direct navigation by clicking question numbers
    - _Requirements: 19.1-19.5_
  
  - [ ]* 14.9 Write integration tests for exam interface
    - Test exam password validation
    - Test timer initialization and countdown
    - Test question navigation (next, back, direct)
    - Test question flagging
    - Test overview panel status updates

- [x] 15. Student Portal frontend - Answer management and submission
  - [x] 15.1 Implement auto-save functionality
    - Trigger save when answer is selected
    - Queue failed saves for retry with exponential backoff
    - Store answers in localStorage as backup
    - Sync localStorage answers when connection restored
    - _Requirements: 20.1-20.4_
  
  - [x] 15.2 Implement answer modification
    - Allow changing answers by selecting different option
    - Update auto-save when answer changes
    - Reflect changes in overview panel immediately
    - _Requirements: 21.1-21.4_
  
  - [x] 15.3 Implement exam submission interface
    - Add "Finish" button to submit exam
    - Validate all questions are answered
    - Show list of unanswered question numbers if incomplete
    - Display final confirmation dialog
    - Prevent further changes after submission
    - _Requirements: 22.1-22.5_
  
  - [x] 15.4 Implement offline detection and handling
    - Detect online/offline status
    - Display offline indicator banner
    - Queue API requests when offline
    - Sync queued requests when connection restored
    - _Requirements: 20.1-20.4_
  
  - [ ]* 15.5 Write integration tests for answer management
    - Test auto-save with network failures
    - Test answer modification workflow
    - Test submission validation
    - Test offline mode with localStorage backup

- [x] 16. Student Portal frontend - Results viewing
  - [x] 16.1 Implement results list interface
    - Display results grouped by subject
    - Show score for each exam (X out of 100)
    - Calculate and display total score across all subjects
    - _Requirements: 24.1-24.3, 25.1-25.4_
  
  - [x] 16.2 Implement detailed results view
    - Display all questions from completed exam
    - Show student's selected answer for each question
    - Mark correct answers in green
    - Show both incorrect answer and correct answer for wrong questions
    - Display correct answer for unanswered questions
    - _Requirements: 24.3-24.6_
  
  - [ ]* 16.3 Write integration tests for results viewing
    - Test results grouping by subject
    - Test total score calculation
    - Test detailed results display with color coding

- [x] 17. Checkpoint - Frontend portals complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. PWA configuration for Student Portal
  - [x] 18.1 Configure vite-plugin-pwa
    - Install and configure vite-plugin-pwa with Workbox
    - Set up manifest.json with app metadata
    - Configure service worker for auto-update
    - _Requirements: 13.1-13.4_
  
  - [x] 18.2 Create PWA manifest and icons
    - Generate app icons in multiple sizes (72x72 to 512x512)
    - Configure manifest with name, theme color, display mode
    - Set scope and start_url to /student/
    - _Requirements: 13.1-13.4_
  
  - [x] 18.3 Implement service worker caching strategies
    - Cache static assets with CacheFirst strategy
    - Cache API responses with NetworkFirst strategy
    - Configure runtime caching for exam and results endpoints
    - _Requirements: 13.4_
  
  - [x] 18.4 Implement install prompt component
    - Detect beforeinstallprompt event
    - Show custom install prompt UI
    - Handle user acceptance/rejection
    - _Requirements: 13.1-13.2_
  
  - [ ]* 18.5 Write tests for PWA functionality
    - Test service worker registration
    - Test offline caching behavior
    - Test install prompt display

- [x] 19. Error handling and validation
  - [x] 19.1 Implement frontend error boundaries
    - Create React error boundary components
    - Display user-friendly error messages
    - Log errors for debugging
    - _Requirements: All error handling requirements_
  
  - [x] 19.2 Implement form validation
    - Add client-side validation for all forms
    - Display inline error messages
    - Prevent submission until validation passes
    - _Requirements: 7.2-7.3, 8.3, 9.5-9.6_
  
  - [x] 19.3 Implement API error handling
    - Handle network errors gracefully
    - Display appropriate error messages for different status codes
    - Implement retry logic for transient failures
    - _Requirements: All API requirements_
  
  - [ ]* 19.4 Write tests for error handling
    - Test error boundary rendering
    - Test form validation logic
    - Test API error responses

- [x] 20. Database migrations and seed data
  - [x] 20.1 Create production migration scripts
    - Finalize all migration files
    - Test migrations on clean database
    - Create rollback scripts
    - _Requirements: 30.1-30.8_
  
  - [x] 20.2 Create seed data for development
    - Create sample admin account
    - Create sample subjects
    - Create sample teacher accounts
    - Create sample student accounts
    - Create sample exams with questions
    - _Requirements: 30.1-30.8_
  
  - [ ]* 20.3 Write tests for migrations
    - Test migration up and down
    - Test data integrity after migrations

- [x] 21. Deployment preparation
  - [x] 21.1 Create production build configuration
    - Configure environment variables for production
    - Set up build scripts for frontend and backend
    - Optimize bundle size and performance
    - _Requirements: All deployment requirements_
  
  - [x] 21.2 Create Docker configuration (optional)
    - Create Dockerfile for backend
    - Create Dockerfile for frontend
    - Create docker-compose.yml for local development
    - _Requirements: All deployment requirements_
  
  - [x] 21.3 Create deployment scripts
    - Create script for VPS deployment
    - Configure PM2 ecosystem file
    - Create database backup script
    - Create health check script
    - _Requirements: All deployment requirements_
  
  - [x] 21.4 Configure Nginx
    - Create Nginx configuration file
    - Set up reverse proxy for API
    - Configure static file serving for frontend
    - Set up SSL with Let's Encrypt
    - Add security headers
    - _Requirements: All deployment requirements_

- [x] 22. Deploy to VPS (76.13.48.245)
  - [x] 22.1 Set up VPS server
    - Install Node.js, PostgreSQL, Nginx, PM2
    - Configure firewall (UFW)
    - Set up PostgreSQL database and user
    - _Requirements: All deployment requirements_
  
  - [x] 22.2 Deploy application
    - Clone repository to /var/www/exam-system
    - Install dependencies
    - Build frontend and backend
    - Run database migrations
    - Start application with PM2
    - _Requirements: All deployment requirements_
  
  - [x] 22.3 Configure domain and SSL
    - Point exam.skoolific.com to VPS IP
    - Obtain SSL certificate with Certbot
    - Configure Nginx with SSL
    - Test HTTPS access
    - _Requirements: All deployment requirements_
  
  - [x] 22.4 Set up monitoring and backups
    - Configure PM2 for auto-restart
    - Set up database backup cron job
    - Configure log rotation
    - Set up health check monitoring
    - _Requirements: All deployment requirements_

- [x] 23. Final checkpoint - System integration testing
  - Test complete workflows across all three portals
  - Verify exam taking flow from start to finish
  - Test concurrent users and performance
  - Verify PWA installation and offline functionality
  - Ensure all requirements are met
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate core algorithmic correctness properties
- Unit and integration tests validate specific examples and edge cases
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- The implementation follows a bottom-up approach: infrastructure → backend → frontend → integration → deployment
- TypeScript is used throughout for type safety and better developer experience
- All authentication and security measures are implemented according to design specifications
