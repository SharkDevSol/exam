import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { Button } from '../../components';
import StudentBulkImport from './StudentBulkImport';
import styles from './StudentManagement.module.css';

interface Student {
  id: string;
  name: string;
  username: string;
  admissionNumber: string | null;
  createdAt: string;
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/students');
      setStudents(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await api.get('/admin/students/export', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_export_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* Import Section */}
      <section className={styles.importSection}>
        <StudentBulkImport onImportSuccess={fetchStudents} />
      </section>

      {/* Students List Section */}
      <section className={styles.listSection}>
        <div className={styles.listHeader}>
          <h2 className={styles.heading}>All Students ({students.length})</h2>
          <div className={styles.actions}>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <Button onClick={handleExport} disabled={students.length === 0 || exporting}>
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className={styles.empty}>
            {searchTerm ? 'No students found matching your search.' : 'No students imported yet.'}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Batch</th>
                  <th>Imported</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{student.name}</td>
                    <td className={styles.username}>{student.username}</td>
                    <td>{student.admissionNumber || 'N/A'}</td>
                    <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

