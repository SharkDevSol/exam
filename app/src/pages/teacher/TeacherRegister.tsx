import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import { Button, Input, Select, Loading } from '../../components';
import styles from './TeacherRegister.module.css';

interface Subject {
  id: string;
  name: string;
}

export default function TeacherRegister() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSubjects, setFetchingSubjects] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableSubjects();
  }, []);

  const fetchAvailableSubjects = async () => {
    try {
      setFetchingSubjects(true);
      const response = await api.get('/teacher/subjects/available');
      setSubjects(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFetchingSubjects(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!subjectId) {
      setError('Please select a subject');
      return;
    }

    setLoading(true);

    try {
      await api.post('/teacher/register', {
        username,
        password,
        subjectId,
      });
      
      // Registration successful, redirect to login
      navigate('/teacher/login', { 
        state: { message: 'Registration successful! Please sign in.' } 
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (fetchingSubjects) {
    return (
      <div className={styles.container}>
        <div className={styles.registerBox}>
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.registerBox}>
        <h1 className={styles.title}>Teacher Registration</h1>
        <p className={styles.subtitle}>Create your account to start managing exams</p>

        {subjects.length === 0 ? (
          <div className={styles.noSubjects}>
            <p>No subjects available for assignment.</p>
            <p className={styles.noSubjectsHint}>
              All subjects have been assigned to teachers. Please contact the administrator.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password (min 6 characters)"
              required
              disabled={loading}
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              disabled={loading}
            />

            <Select
              label="Subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              disabled={loading}
              options={[
                { value: '', label: 'Select a subject' },
                ...subjects.map((subject) => ({
                  value: subject.id,
                  label: subject.name,
                })),
              ]}
            />

            <p className={styles.hint}>
              Note: Once you select a subject, it will be exclusively assigned to you and unavailable to other teachers.
            </p>

            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        )}

        <div className={styles.footer}>
          <p>
            Already have an account?{' '}
            <Link to="/teacher/login" className={styles.link}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
