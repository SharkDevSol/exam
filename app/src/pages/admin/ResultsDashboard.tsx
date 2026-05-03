import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { Loading, Table, Select } from '../../components';
import styles from './ResultsDashboard.module.css';

interface Result {
  student_id: string;
  student_name: string;
  student_username: string;
  subject_id: string;
  subject_name: string;
  exam_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function ResultsDashboard() {
  const [results, setResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [results, studentFilter, subjectFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resultsResponse, subjectsResponse] = await Promise.all([
        api.get('/admin/results'),
        api.get('/admin/subjects'),
      ]);
      setResults(resultsResponse.data);
      setSubjects(subjectsResponse.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...results];

    if (studentFilter) {
      filtered = filtered.filter(
        (r) =>
          r.student_name.toLowerCase().includes(studentFilter.toLowerCase()) ||
          r.student_username.toLowerCase().includes(studentFilter.toLowerCase())
      );
    }

    if (subjectFilter) {
      filtered = filtered.filter((r) => r.subject_id === subjectFilter);
    }

    setFilteredResults(filtered);
  };

  const calculateTotalScore = (studentId: string) => {
    const studentResults = results.filter((r) => r.student_id === studentId);
    const totalScore = studentResults.reduce((sum, r) => sum + r.score, 0);
    const totalPossible = studentResults.length * 100;
    return { totalScore, totalPossible };
  };

  const getUniqueStudents = () => {
    const studentMap = new Map<string, { id: string; name: string; username: string }>();
    results.forEach((r) => {
      if (!studentMap.has(r.student_id)) {
        studentMap.set(r.student_id, {
          id: r.student_id,
          name: r.student_name,
          username: r.student_username,
        });
      }
    });
    return Array.from(studentMap.values());
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const columns = [
    { key: 'student_name', header: 'Student Name' },
    { key: 'student_username', header: 'Username' },
    { key: 'subject_name', header: 'Subject' },
    {
      key: 'score',
      header: 'Score',
      render: (result: Result) => (
        <span className={styles.score}>
          {result.score} / {result.total_questions}
        </span>
      ),
    },
    {
      key: 'completed_at',
      header: 'Completed',
      render: (result: Result) => new Date(result.completed_at).toLocaleString(),
    },
  ];

  const uniqueStudents = getUniqueStudents();

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Results Dashboard</h2>
      <p className={styles.description}>
        View all student results across all subjects. Filter by student or subject to narrow down results.
      </p>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Filter by Student</label>
          <input
            type="text"
            placeholder="Search by name or username..."
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className={styles.filterInput}
          />
        </div>

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
      </div>

      {results.length === 0 ? (
        <p className={styles.emptyState}>No results available yet. Students need to complete exams first.</p>
      ) : (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{uniqueStudents.length}</div>
              <div className={styles.statLabel}>Total Students</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{results.length}</div>
              <div className={styles.statLabel}>Total Exams Completed</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{subjects.length}</div>
              <div className={styles.statLabel}>Subjects</div>
            </div>
          </div>

          <div className={styles.tableSection}>
            <h3 className={styles.subheading}>
              All Results ({filteredResults.length})
            </h3>
            <Table 
              columns={columns} 
              data={filteredResults} 
              keyExtractor={(result) => `${result.student_id}-${result.exam_id}`}
            />
          </div>

          {studentFilter && filteredResults.length > 0 && (
            <div className={styles.totalScoreSection}>
              <h3 className={styles.subheading}>Student Total Scores</h3>
              <div className={styles.totalScoreGrid}>
                {Array.from(new Set(filteredResults.map((r) => r.student_id))).map((studentId) => {
                  const student = filteredResults.find((r) => r.student_id === studentId);
                  const { totalScore, totalPossible } = calculateTotalScore(studentId);
                  return (
                    <div key={studentId} className={styles.totalScoreCard}>
                      <div className={styles.studentInfo}>
                        <div className={styles.studentName}>{student?.student_name}</div>
                        <div className={styles.studentUsername}>{student?.student_username}</div>
                      </div>
                      <div className={styles.totalScore}>
                        {totalScore} / {totalPossible}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
