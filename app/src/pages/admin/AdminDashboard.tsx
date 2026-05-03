import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks';
import { Button } from '../../components';
import SubjectManagement from './SubjectManagement';
import StudentManagement from './StudentManagement';
import ResultsDashboard from './ResultsDashboard';
import ExamPasswordView from './ExamPasswordView';
import styles from './AdminDashboard.module.css';

type Tab = 'subjects' | 'students' | 'results' | 'passwords';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('subjects');
  const { logoutWithSession } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutWithSession();
    navigate('/admin/login');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Admin Portal</h1>
          <Button onClick={handleLogout} variant="secondary">
            Logout
          </Button>
        </div>
      </header>

      <div className={styles.content}>
        <nav className={styles.nav}>
          <button
            className={`${styles.navButton} ${activeTab === 'subjects' ? styles.active : ''}`}
            onClick={() => setActiveTab('subjects')}
          >
            Subjects
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'students' ? styles.active : ''}`}
            onClick={() => setActiveTab('students')}
          >
            Students
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'results' ? styles.active : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Results
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'passwords' ? styles.active : ''}`}
            onClick={() => setActiveTab('passwords')}
          >
            Exam Passwords
          </button>
        </nav>

        <main className={styles.main}>
          {activeTab === 'subjects' && <SubjectManagement />}
          {activeTab === 'students' && <StudentManagement />}
          {activeTab === 'results' && <ResultsDashboard />}
          {activeTab === 'passwords' && <ExamPasswordView />}
        </main>
      </div>
    </div>
  );
}
