import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../../hooks';
import { Button, Input } from '../../components';
import { getErrorMessage } from '../../services/api';
import styles from './TeacherLogin.module.css';

export default function TeacherLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithSession } = useSession();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginWithSession(username, password, 'teacher');
      navigate('/teacher');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Teacher Portal</h1>
        <p className={styles.subtitle}>Sign in to manage exams and view results</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
          />

          <Button type="submit" disabled={loading} fullWidth>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className={styles.footer}>
          <p>
            Don't have an account?{' '}
            <Link to="/teacher/register" className={styles.link}>
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
