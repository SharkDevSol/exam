import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useSession } from '../../hooks';
import { Button } from '../../components';
import ExamCreation from './ExamCreation';
import TeacherResults from './TeacherResults';
import styles from './TeacherDashboard.module.css';

export default function TeacherDashboard() {
  const { user, logoutWithSession } = useSession();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutWithSession();
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className={styles.container}>
      <nav className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.logo}>Teacher Portal</h2>
          <p className={styles.username}>{user?.userId}</p>
        </div>

        <div className={styles.nav}>
          <Link 
            to="/teacher/exams" 
            className={`${styles.navLink} ${isActive('/teacher/exams') ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>📝</span>
            Exam Management
          </Link>
          <Link 
            to="/teacher/results" 
            className={`${styles.navLink} ${isActive('/teacher/results') ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>📊</span>
            Results
          </Link>
        </div>

        <div className={styles.sidebarFooter}>
          <Button variant="secondary" fullWidth onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </nav>

      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to="/teacher/exams" replace />} />
          <Route path="/exams/*" element={<ExamCreation />} />
          <Route path="/results" element={<TeacherResults />} />
        </Routes>
      </main>
    </div>
  );
}
