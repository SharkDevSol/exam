import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJWT } from '../../hooks';
import { Button, Input } from '../../components';
import { getErrorMessage } from '../../services/api';
import styles from './StudentLogin.module.css';

export default function StudentLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithJWT } = useJWT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginWithJWT(username, password);
      navigate('/student');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1>Student Portal</h1>
        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            error={error && !username ? 'Username is required' : undefined}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            error={error && !password ? 'Password is required' : undefined}
          />
          {error && <div className={styles.error}>{error}</div>}
          <Button type="submit" loading={loading} fullWidth>
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
