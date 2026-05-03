# Requirements Document

## Introduction

The Web Exam System is a multi-role web-based platform for managing and conducting online examinations. The system supports three distinct user roles: Administrators who manage subjects and students, Teachers who create and publish exams, and Students who take exams and view results. The system provides comprehensive exam management including question randomization, timed assessments, auto-save functionality, and detailed result tracking across multiple subjects.

## Glossary

- **Admin_Portal**: The administrative interface accessible at exam.skoolific.com/admin for system management
- **Teacher_Portal**: The teacher interface accessible at exam.skoolific.com/teacher for exam creation and result viewing
- **Student_Portal**: The student interface accessible at exam.skoolific.com/student for taking exams and viewing results
- **Subject**: An academic subject created by administrators and assigned to teachers
- **Exam**: A 100-question multiple-choice assessment created by a teacher for a specific subject
- **Exam_Password**: A unique password generated for each exam that students must enter to access the exam
- **Question_Randomization**: The process of presenting exam questions in different orders to different students
- **Timer**: A countdown mechanism that tracks remaining time for an individual student's exam session
- **Auto_Save**: Automatic storage of student answers without requiring manual save action
- **Flagged_Question**: A question marked by a student for later review during the exam
- **Public_Exam**: An exam that has been made available to all students by the teacher
- **Session_Persistence**: The ability to remain logged in across browser sessions
- **PWA**: Progressive Web App capability allowing the student portal to be installed as a standalone application
- **Excel_Template**: A predefined spreadsheet format for bulk data import/export
- **Result**: The outcome of a completed exam showing score and answer details
- **Question_Overview_Panel**: A visual grid displaying all 100 questions with status indicators
- **Subject_Exclusivity**: The rule that prevents multiple teachers from being assigned to the same subject

## Requirements

### Requirement 1: Admin Subject Management

**User Story:** As an administrator, I want to create and manage subjects, so that teachers can be assigned to specific academic areas.

#### Acceptance Criteria

1. WHEN the administrator enters a subject name and clicks save, THE Admin_Portal SHALL create a new subject in the system
2. THE Admin_Portal SHALL display all created subjects in the subject management interface
3. THE Admin_Portal SHALL allow administrators to view which subjects have been assigned to teachers
4. WHEN a subject is created, THE Admin_Portal SHALL make it available for teacher selection during sign-up

### Requirement 2: Admin Student Bulk Import

**User Story:** As an administrator, I want to upload student lists via Excel, so that I can efficiently register multiple students at once.

#### Acceptance Criteria

1. WHEN the administrator uploads an Excel file with a single column of student names, THE Admin_Portal SHALL parse each name and create a student account
2. FOR EACH student name in the uploaded file, THE Admin_Portal SHALL generate a unique username
3. FOR EACH student name in the uploaded file, THE Admin_Portal SHALL generate a unique password
4. WHEN student accounts are created, THE Admin_Portal SHALL provide a downloadable Excel file containing the format: row number, student name, generated username, and generated password
5. THE Admin_Portal SHALL validate that the uploaded Excel file contains at least one student name before processing

### Requirement 3: Admin Results Dashboard

**User Story:** As an administrator, I want to view all student results across all subjects, so that I can monitor overall academic performance.

#### Acceptance Criteria

1. THE Admin_Portal SHALL display results for all students across all subjects
2. THE Admin_Portal SHALL show each student's score per subject
3. THE Admin_Portal SHALL calculate and display each student's total score across all subjects
4. THE Admin_Portal SHALL allow administrators to filter results by student or subject

### Requirement 4: Admin Session Management

**User Story:** As an administrator, I want my login session to persist, so that I don't have to re-authenticate frequently.

#### Acceptance Criteria

1. WHEN an administrator successfully logs in, THE Admin_Portal SHALL create a persistent session
2. WHEN an administrator closes and reopens the browser, THE Admin_Portal SHALL maintain the authenticated session
3. THE Admin_Portal SHALL allow administrators to explicitly log out to end the session

### Requirement 5: Teacher Authentication and Subject Assignment

**User Story:** As a teacher, I want to sign up with a username, password, and subject selection, so that I can create exams for my assigned subject.

#### Acceptance Criteria

1. WHEN a teacher signs up, THE Teacher_Portal SHALL require a username, password, and subject selection
2. THE Teacher_Portal SHALL display only subjects that have not been assigned to other teachers
3. WHEN a teacher selects a subject during sign-up, THE Teacher_Portal SHALL assign that subject exclusively to the teacher
4. WHEN a subject is assigned to a teacher, THE Teacher_Portal SHALL hide that subject from other teachers' sign-up subject selection
5. WHEN a teacher has an existing account, THE Teacher_Portal SHALL allow sign-in with username and password

### Requirement 6: Teacher Session Management

**User Story:** As a teacher, I want my login session to persist, so that I can continue working without repeated authentication.

#### Acceptance Criteria

1. WHEN a teacher successfully logs in, THE Teacher_Portal SHALL create a persistent session
2. WHEN a teacher closes and reopens the browser, THE Teacher_Portal SHALL maintain the authenticated session
3. THE Teacher_Portal SHALL allow teachers to explicitly log out to end the session

### Requirement 7: Exam Question Count Validation

**User Story:** As a teacher, I want exams to contain exactly 100 questions, so that all exams maintain a consistent format.

#### Acceptance Criteria

1. THE Teacher_Portal SHALL enforce that each exam contains exactly 100 questions
2. WHEN a teacher attempts to create an exam with fewer than 100 questions, THE Teacher_Portal SHALL prevent exam creation and display an error message
3. WHEN a teacher attempts to create an exam with more than 100 questions, THE Teacher_Portal SHALL prevent exam creation and display an error message
4. THE Teacher_Portal SHALL display a question counter showing the current number of questions added

### Requirement 8: Manual Exam Question Entry

**User Story:** As a teacher, I want to manually enter exam questions, so that I can create custom assessments.

#### Acceptance Criteria

1. THE Teacher_Portal SHALL provide 100 question input forms, each containing fields for question text, option A, option B, option C, option D, and correct answer selection
2. THE Teacher_Portal SHALL allow teachers to select the correct answer from options A, B, C, or D for each question
3. THE Teacher_Portal SHALL validate that all fields are completed for each question before allowing exam creation
4. THE Teacher_Portal SHALL allow teachers to edit any question before finalizing the exam

### Requirement 9: Excel-Based Exam Question Import

**User Story:** As a teacher, I want to upload exam questions via Excel, so that I can efficiently create exams from existing question banks.

#### Acceptance Criteria

1. THE Teacher_Portal SHALL provide a downloadable Excel template with columns: question, A, B, C, D, Answer
2. WHEN a teacher uploads a completed Excel template, THE Teacher_Portal SHALL parse all 100 questions
3. WHEN the Excel file is parsed, THE Teacher_Portal SHALL display all questions in editable form for teacher review
4. THE Teacher_Portal SHALL validate that the uploaded Excel file contains exactly 100 questions
5. THE Teacher_Portal SHALL validate that each row contains values for all required columns: question, A, B, C, D, Answer
6. WHEN the Excel file contains invalid data, THE Teacher_Portal SHALL display specific error messages indicating which rows have issues

### Requirement 10: Exam Configuration and Publishing

**User Story:** As a teacher, I want to set exam duration and generate access passwords, so that I can control exam timing and security.

#### Acceptance Criteria

1. THE Teacher_Portal SHALL allow teachers to set exam duration in hours and minutes
2. WHEN an exam is created, THE Teacher_Portal SHALL generate a unique exam password
3. THE Teacher_Portal SHALL display the generated exam password to the teacher in the Teacher_Portal
4. THE Admin_Portal SHALL display the generated exam password to administrators for oversight purposes
5. THE System SHALL NOT send, push, display, or transmit the exam password to students through any automated means
6. WHEN a teacher clicks the "Public" button, THE Teacher_Portal SHALL make the exam available to all students
7. WHEN a teacher clicks the "Finish" button, THE Teacher_Portal SHALL save the exam and mark it as complete
8. THE Teacher_Portal SHALL prevent students from accessing an exam until it is marked as public

### Requirement 11: Teacher Results View

**User Story:** As a teacher, I want to view student results for my subject only, so that I can assess performance in my assigned area.

#### Acceptance Criteria

1. THE Teacher_Portal SHALL display results only for exams in the teacher's assigned subject
2. THE Teacher_Portal SHALL show each student's score for the teacher's subject
3. THE Teacher_Portal SHALL display which questions each student answered correctly and incorrectly
4. THE Teacher_Portal SHALL allow teachers to view results sorted by student name or score

### Requirement 12: Student Authentication Without Persistence

**User Story:** As a student, I want to log in with my credentials without the system saving my login, so that my account remains secure on shared devices.

#### Acceptance Criteria

1. THE Student_Portal SHALL allow students to log in with username and password
2. THE Student_Portal SHALL NOT create a persistent session for students
3. WHEN a student closes the browser, THE Student_Portal SHALL require re-authentication on next access
4. THE Student_Portal SHALL NOT provide a "remember me" or "save account" option

### Requirement 13: Student Portal PWA Installation

**User Story:** As a student, I want to install the student portal as an app, so that I can access it quickly from my device home screen.

#### Acceptance Criteria

1. THE Student_Portal SHALL be installable as a Progressive Web App
2. WHEN a student installs the PWA, THE Student_Portal SHALL create a home screen icon
3. WHEN the PWA is launched, THE Student_Portal SHALL open in standalone mode without browser UI
4. THE Student_Portal SHALL function offline for previously loaded content where applicable

### Requirement 14: Exam Discovery and Access

**User Story:** As a student, I want to view all available exams and enter passwords to start them, so that I can take assessments when ready.

#### Acceptance Criteria

1. THE Student_Portal SHALL display all public exams to authenticated students
2. WHEN a student selects an exam, THE Student_Portal SHALL prompt for the exam password
3. THE Student_Portal SHALL require students to obtain the exam password from their teacher through manual communication
4. WHEN a student enters the correct exam password, THE Student_Portal SHALL start the exam and initialize the timer
5. WHEN a student enters an incorrect exam password, THE Student_Portal SHALL display an error message and prevent exam access
6. THE Student_Portal SHALL prevent students from accessing an exam they have already completed

### Requirement 15: Individual Student Timer Management

**User Story:** As a student, I want the exam timer to start when I begin the exam, so that I have the full allocated time regardless of when others start.

#### Acceptance Criteria

1. WHEN a student enters the correct exam password, THE Student_Portal SHALL start a countdown timer for that student
2. THE Student_Portal SHALL display the remaining time prominently during the exam
3. THE Student_Portal SHALL calculate the timer independently for each student based on their individual start time
4. WHEN the timer reaches zero, THE Student_Portal SHALL automatically submit the exam and close the exam interface
5. THE Student_Portal SHALL continue the timer countdown even if the student navigates between questions

### Requirement 16: Question Randomization Per Student

**User Story:** As a student, I want to receive questions in a randomized order, so that exam integrity is maintained across all test-takers.

#### Acceptance Criteria

1. WHEN a student starts an exam, THE Student_Portal SHALL randomize the order of all 100 questions for that student
2. THE Student_Portal SHALL ensure that different students receive different question orders for the same exam
3. THE Student_Portal SHALL maintain the randomized order consistently for a student throughout their exam session
4. THE Student_Portal SHALL preserve the original question numbering in the question overview panel

### Requirement 17: Single Question Display with Navigation

**User Story:** As a student, I want to view one question at a time with navigation controls, so that I can focus on each question individually.

#### Acceptance Criteria

1. THE Student_Portal SHALL display exactly one question per page
2. THE Student_Portal SHALL provide a "Next" button to advance to the following question
3. THE Student_Portal SHALL provide a "Back" button to return to the previous question
4. WHEN a student is on the first question, THE Student_Portal SHALL disable the "Back" button
5. WHEN a student is on the last question, THE Student_Portal SHALL disable the "Next" button
6. THE Student_Portal SHALL display the current question number and total question count

### Requirement 18: Question Flagging

**User Story:** As a student, I want to flag questions for review, so that I can easily return to uncertain answers before submitting.

#### Acceptance Criteria

1. THE Student_Portal SHALL provide a "Flag" button on each question page
2. WHEN a student clicks the "Flag" button, THE Student_Portal SHALL mark that question as flagged
3. THE Student_Portal SHALL display flagged questions with a visual indicator in the question overview panel
4. WHEN a student clicks the "Flag" button on an already flagged question, THE Student_Portal SHALL remove the flag
5. THE Student_Portal SHALL maintain flag status when students navigate between questions

### Requirement 19: Question Overview Panel

**User Story:** As a student, I want to see an overview of all questions with status indicators, so that I can track my progress and navigate efficiently.

#### Acceptance Criteria

1. THE Student_Portal SHALL display a question overview panel showing all 100 questions as numbered cards
2. WHEN a student answers a question, THE Student_Portal SHALL display that question number in blue in the overview panel
3. WHEN a student flags a question, THE Student_Portal SHALL display a flag indicator on that question number in the overview panel
4. WHEN a student clicks a question number in the overview panel, THE Student_Portal SHALL navigate directly to that question
5. THE Student_Portal SHALL highlight the current question in the overview panel

### Requirement 20: Answer Auto-Save

**User Story:** As a student, I want my answers to be saved automatically, so that I don't lose progress if my connection is interrupted.

#### Acceptance Criteria

1. WHEN a student selects an answer, THE Student_Portal SHALL automatically save that answer without requiring manual action
2. THE Student_Portal SHALL save answers locally and synchronize with the server
3. WHEN a student navigates away from a question, THE Student_Portal SHALL ensure the answer is saved before loading the next question
4. THE Student_Portal SHALL allow students to change saved answers at any time before final submission

### Requirement 21: Answer Modification Before Submission

**User Story:** As a student, I want to change my answers before submitting the exam, so that I can correct mistakes or update responses.

#### Acceptance Criteria

1. THE Student_Portal SHALL allow students to navigate to any previously answered question
2. WHEN a student selects a different answer for a previously answered question, THE Student_Portal SHALL update the saved answer
3. THE Student_Portal SHALL reflect answer changes immediately in the question overview panel
4. THE Student_Portal SHALL maintain all answer changes until final exam submission

### Requirement 22: Exam Submission with Validation

**User Story:** As a student, I want to be warned about unanswered questions before submitting, so that I don't accidentally submit an incomplete exam.

#### Acceptance Criteria

1. THE Student_Portal SHALL provide a "Finish" button to submit the exam
2. WHEN a student clicks "Finish" and has unanswered questions, THE Student_Portal SHALL display a list of unanswered question numbers
3. WHEN a student clicks "Finish" and all questions are answered, THE Student_Portal SHALL display a final confirmation dialog
4. WHEN a student confirms submission, THE Student_Portal SHALL submit all answers and close the exam interface
5. THE Student_Portal SHALL prevent further changes after successful submission

### Requirement 23: One-Time Exam Access

**User Story:** As a student, I want each exam to be available only once, so that the assessment remains fair and valid.

#### Acceptance Criteria

1. WHEN a student completes and submits an exam, THE Student_Portal SHALL mark that exam as completed for that student
2. THE Student_Portal SHALL prevent students from accessing an exam they have already completed
3. WHEN a student attempts to access a completed exam, THE Student_Portal SHALL display a message indicating the exam has been taken
4. THE Student_Portal SHALL allow students to view results for completed exams without retaking them

### Requirement 24: Student Subject-Based Results View

**User Story:** As a student, I want to view my results organized by subject, so that I can see my performance in each academic area.

#### Acceptance Criteria

1. THE Student_Portal SHALL display results grouped by subject
2. FOR EACH completed exam, THE Student_Portal SHALL show the student's score in the format "X out of 100"
3. THE Student_Portal SHALL display all questions from the exam with the student's selected answers
4. WHEN a student answered a question correctly, THE Student_Portal SHALL mark that question in green
5. WHEN a student answered a question incorrectly, THE Student_Portal SHALL display both the student's incorrect answer and the correct answer
6. WHEN a student did not answer a question, THE Student_Portal SHALL display the question as unanswered and show the correct answer

### Requirement 25: Student Total Score Calculation

**User Story:** As a student, I want to see my total score across all subjects, so that I can understand my overall academic performance.

#### Acceptance Criteria

1. THE Student_Portal SHALL calculate the total score by summing scores from all completed exams
2. THE Student_Portal SHALL display the total score in the format "X out of Y" where Y is the total possible points across all subjects
3. THE Student_Portal SHALL update the total score automatically when new exam results are available
4. THE Student_Portal SHALL display both individual subject scores and the cumulative total score

### Requirement 26: Exam Interface Header Information

**User Story:** As a student, I want to see my information and exam details at the top of the exam interface, so that I can confirm I'm taking the correct exam.

#### Acceptance Criteria

1. THE Student_Portal SHALL display the student's name in the exam interface header
2. THE Student_Portal SHALL display the subject name with an icon in the exam interface header
3. THE Student_Portal SHALL display the school name in the exam interface header
4. THE Student_Portal SHALL display the student's admission number in the exam interface header
5. THE Student_Portal SHALL provide a "Back" button in the header to exit the exam with confirmation

### Requirement 27: Multiple Choice Answer Selection

**User Story:** As a student, I want to select one answer from four options for each question, so that I can respond to multiple-choice questions.

#### Acceptance Criteria

1. THE Student_Portal SHALL display four answer options (A, B, C, D) for each question
2. WHEN a student clicks an answer option, THE Student_Portal SHALL select that option and deselect any previously selected option
3. THE Student_Portal SHALL visually indicate which option is currently selected
4. THE Student_Portal SHALL allow students to change their selected option at any time before submission

### Requirement 28: Excel Template Generation for Teachers

**User Story:** As a teacher, I want to download a properly formatted Excel template, so that I can prepare exam questions offline.

#### Acceptance Criteria

1. THE Teacher_Portal SHALL provide a "Download Template" button in the exam creation interface
2. WHEN a teacher clicks "Download Template", THE Teacher_Portal SHALL generate an Excel file with columns: question, A, B, C, D, Answer
3. THE Excel_Template SHALL contain 100 empty rows for question entry
4. THE Excel_Template SHALL include header labels for each column
5. THE Excel_Template SHALL include instructions or examples in the first row

### Requirement 29: Student Credential Distribution

**User Story:** As an administrator, I want to download student credentials in a formatted Excel file, so that I can print and distribute login information.

#### Acceptance Criteria

1. WHEN student accounts are created via bulk import, THE Admin_Portal SHALL generate a downloadable Excel file
2. THE Excel file SHALL contain columns: row number, student name, username, password
3. THE Excel file SHALL format each row as: "1.Ahmed, username='generated_user', password='generated_pass'"
4. THE Excel file SHALL include all students from the uploaded batch
5. THE Admin_Portal SHALL allow administrators to download the credential file multiple times

### Requirement 30: Database Schema for Multi-Role System

**User Story:** As a system, I want to store data for administrators, teachers, students, subjects, exams, questions, and results, so that all system functionality is supported.

#### Acceptance Criteria

1. THE System SHALL store administrator accounts with authentication credentials
2. THE System SHALL store teacher accounts with authentication credentials and assigned subject
3. THE System SHALL store student accounts with authentication credentials
4. THE System SHALL store subjects with unique identifiers and names
5. THE System SHALL store exams with subject association, duration, password, and public status
6. THE System SHALL store questions with exam association, question text, four options, and correct answer
7. THE System SHALL store student answers with student association, question association, selected answer, and timestamp
8. THE System SHALL store exam results with student association, exam association, score, and completion timestamp

### Requirement 31: Admin Exam Password Visibility

**User Story:** As an administrator, I want to view exam passwords for all exams in the system, so that I can provide oversight and support teachers with exam access management.

#### Acceptance Criteria

1. THE Admin_Portal SHALL display exam passwords for all exams across all subjects
2. THE Admin_Portal SHALL show the exam password alongside each exam's details including subject, teacher, and status
3. THE Admin_Portal SHALL allow administrators to view exam passwords for both public and non-public exams
4. THE Admin_Portal SHALL allow administrators to filter or search exams by subject or teacher to locate specific exam passwords
5. THE Admin_Portal SHALL display exam passwords in a readable format without requiring additional actions to reveal them
