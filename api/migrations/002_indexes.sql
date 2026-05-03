-- Performance indexes for foreign keys and frequently queried columns

-- Teachers indexes
CREATE INDEX idx_teachers_subject ON teachers(subject_id);

-- Exams indexes
CREATE INDEX idx_exams_subject ON exams(subject_id);
CREATE INDEX idx_exams_teacher ON exams(teacher_id);
CREATE INDEX idx_exams_public ON exams(is_public) WHERE is_public = true;

-- Questions indexes
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_questions_exam_order ON questions(exam_id, original_order);

-- Exam sessions indexes
CREATE INDEX idx_exam_sessions_student ON exam_sessions(student_id);
CREATE INDEX idx_exam_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX idx_exam_sessions_student_exam ON exam_sessions(student_id, exam_id);

-- Answers indexes
CREATE INDEX idx_answers_session ON answers(exam_session_id);
CREATE INDEX idx_answers_question ON answers(question_id);

-- Flagged questions indexes
CREATE INDEX idx_flagged_session ON flagged_questions(exam_session_id);

-- Results indexes
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_exam ON results(exam_id);
CREATE INDEX idx_results_session ON results(exam_session_id);

-- Composite indexes for common queries
CREATE INDEX idx_results_student_exam ON results(student_id, exam_id);
