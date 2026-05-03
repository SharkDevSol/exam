import { useState, useEffect, FormEvent } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { Button, Input, Loading, Table } from '../../components';
import styles from './SubjectManagement.module.css';

interface Subject {
  id: string;
  name: string;
  created_at: string;
}

interface SubjectAssignment {
  teacher_username: string;
  assigned_at: string;
}

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<SubjectAssignment | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/subjects');
      setSubjects(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await api.post('/admin/subjects', { name: newSubjectName });
      setSubjects([...subjects, response.data]);
      setNewSubjectName('');
      setSuccess(`Subject "${response.data.name}" created successfully`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const viewAssignment = async (subjectId: string) => {
    try {
      setSelectedSubject(subjectId);
      const response = await api.get(`/admin/subjects/${subjectId}/assignments`);
      setAssignment(response.data);
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number } };
        if (axiosError.response?.status === 404) {
          setAssignment(null);
        }
      }
    }
  };

  if (loading) {
    return <Loading />;
  }

  const columns = [
    { key: 'name', header: 'Subject Name' },
    { 
      key: 'created_at', 
      header: 'Created At',
      render: (subject: Subject) => new Date(subject.created_at).toLocaleDateString()
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (subject: Subject) => (
        <Button
          size="small"
          variant="secondary"
          onClick={() => viewAssignment(subject.id)}
        >
          View Assignment
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Subject Management</h2>
      <p className={styles.description}>
        Create and manage academic subjects. Teachers can be assigned to subjects during registration.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <Input
            label="Subject Name"
            type="text"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="e.g., Mathematics, Physics, Chemistry"
            required
            disabled={submitting}
          />
          <Button type="submit" disabled={submitting || !newSubjectName.trim()}>
            {submitting ? 'Creating...' : 'Create Subject'}
          </Button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
      </form>

      <div className={styles.tableSection}>
        <h3 className={styles.subheading}>All Subjects ({subjects.length})</h3>
        {subjects.length === 0 ? (
          <p className={styles.emptyState}>No subjects created yet. Create your first subject above.</p>
        ) : (
          <Table 
            columns={columns} 
            data={subjects} 
            keyExtractor={(subject) => subject.id}
          />
        )}
      </div>

      {selectedSubject && (
        <div className={styles.assignmentInfo}>
          <h3 className={styles.subheading}>Teacher Assignment</h3>
          {assignment ? (
            <div className={styles.assignmentCard}>
              <p>
                <strong>Teacher:</strong> {assignment.teacher_username}
              </p>
              <p>
                <strong>Assigned:</strong> {new Date(assignment.assigned_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className={styles.noAssignment}>No teacher assigned to this subject yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
