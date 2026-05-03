import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { Loading, Table, Select } from '../../components';
import styles from './ExamPasswordView.module.css';

interface ExamPassword {
  exam_id: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_username: string;
  password: string;
  duration_minutes: number;
  is_public: boolean;
  is_finished: boolean;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  username: string;
}

export default function ExamPasswordView() {
  const [exams, setExams] = useState<ExamPassword[]>([]);
  const [filteredExams, setFilteredExams] = useState<ExamPassword[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [exams, subjectFilter, teacherFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsResponse, subjectsResponse] = await Promise.all([
        api.get('/admin/exams/passwords'),
        api.get('/admin/subjects'),
      ]);
      
      setExams(examsResponse.data);
      setSubjects(subjectsResponse.data);
      
      // Extract unique teachers from exams
      const teacherMap = new Map<string, Teacher>();
      examsResponse.data.forEach((exam: ExamPassword) => {
        if (!teacherMap.has(exam.teacher_id)) {
          teacherMap.set(exam.teacher_id, {
            id: exam.teacher_id,
            username: exam.teacher_username,
          });
        }
      });
      setTeachers(Array.from(teacherMap.values()));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exams];

    if (subjectFilter) {
      filtered = filtered.filter((exam) => exam.subject_id === subjectFilter);
    }

    if (teacherFilter) {
      filtered = filtered.filter((exam) => exam.teacher_id === teacherFilter);
    }

    setFilteredExams(filtered);
  };

  const getStatusBadge = (exam: ExamPassword) => {
    if (exam.is_finished) {
      return <span className={`${styles.badge} ${styles.badgeFinished}`}>Finished</span>;
    }
    if (exam.is_public) {
      return <span className={`${styles.badge} ${styles.badgePublic}`}>Public</span>;
    }
    return <span className={`${styles.badge} ${styles.badgeDraft}`}>Draft</span>;
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const columns = [
    { key: 'subject_name', header: 'Subject' },
    { key: 'teacher_username', header: 'Teacher' },
    {
      key: 'password',
      header: 'Exam Password',
      render: (exam: ExamPassword) => (
        <span className={styles.password}>{exam.password}</span>
      ),
    },
    {
      key: 'duration_minutes',
      header: 'Duration',
      render: (exam: ExamPassword) => {
        const hours = Math.floor(exam.duration_minutes / 60);
        const minutes = exam.duration_minutes % 60;
        return `${hours}h ${minutes}m`;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (exam: ExamPassword) => getStatusBadge(exam),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (exam: ExamPassword) => new Date(exam.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Exam Passwords</h2>
      <p className={styles.description}>
        View exam passwords for all exams across all subjects. Use filters to find specific exams by subject or teacher.
      </p>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <Select
            label="Filter by Subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            options={[
              { value: '', label: 'All Subjects' },
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </div>

        <div className={styles.filterGroup}>
          <Select
            label="Filter by Teacher"
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            options={[
              { value: '', label: 'All Teachers' },
              ...teachers.map((t) => ({ value: t.id, label: t.username })),
            ]}
          />
        </div>
      </div>

      {exams.length === 0 ? (
        <p className={styles.emptyState}>
          No exams created yet. Teachers need to create exams first.
        </p>
      ) : (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{exams.length}</div>
              <div className={styles.statLabel}>Total Exams</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {exams.filter((e) => e.is_public).length}
              </div>
              <div className={styles.statLabel}>Public Exams</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {exams.filter((e) => !e.is_public && !e.is_finished).length}
              </div>
              <div className={styles.statLabel}>Draft Exams</div>
            </div>
          </div>

          <div className={styles.tableSection}>
            <h3 className={styles.subheading}>
              Exam Passwords ({filteredExams.length})
            </h3>
            <Table 
              columns={columns} 
              data={filteredExams} 
              keyExtractor={(exam) => exam.exam_id}
            />
          </div>

          <div className={styles.infoBox}>
            <h3 className={styles.subheading}>About Exam Passwords</h3>
            <p className={styles.infoText}>
              Exam passwords are automatically generated when teachers create exams. Students must
              obtain these passwords from their teachers to access exams. Passwords are displayed
              in readable format for easy distribution.
            </p>
            <p className={styles.infoText}>
              <strong>Status meanings:</strong>
            </p>
            <ul className={styles.infoList}>
              <li><strong>Draft:</strong> Exam created but not yet published to students</li>
              <li><strong>Public:</strong> Exam is available for students to take</li>
              <li><strong>Finished:</strong> Exam has been completed and closed</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
