import { useState, ChangeEvent } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { Button } from '../../components';
import styles from './StudentBulkImport.module.css';

export default function StudentBulkImport({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importResult, setImportResult] = useState<{
    imported: number;
    batchId: string;
  } | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls)$/)) {
        setError('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
        setFile(null);
        return;
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds maximum limit of 10MB');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError('');
      setSuccess('');
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/admin/students/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult({
        imported: response.data.imported,
        batchId: response.data.batchId,
      });
      setSuccess(response.data.message);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Call the callback to refresh the students list
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadCredentials = async () => {
    if (!importResult) return;

    try {
      const response = await api.get(
        `/admin/students/credentials/${importResult.batchId}`,
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `student_credentials_${importResult.batchId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Student Bulk Import</h2>
      <p className={styles.description}>
        Upload an Excel file with student names to create accounts in bulk. The system will
        generate unique usernames and passwords for each student.
      </p>

      <div className={styles.instructions}>
        <h3 className={styles.subheading}>Instructions</h3>
        <ol className={styles.instructionList}>
          <li>Prepare an Excel file with a single column containing student names</li>
          <li>Each row should contain one student name</li>
          <li>Upload the file using the form below</li>
          <li>After successful import, download the credentials file</li>
          <li>The credentials file contains: row number, student name, username, and password</li>
        </ol>
      </div>

      <div className={styles.uploadSection}>
        <div className={styles.fileInputWrapper}>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className={styles.fileInput}
            disabled={uploading}
          />
          <label htmlFor="file-input" className={styles.fileLabel}>
            {file ? file.name : 'Choose Excel file...'}
          </label>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload and Import'}
        </Button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {importResult && (
        <div className={styles.resultSection}>
          <div className={styles.resultCard}>
            <h3 className={styles.subheading}>Import Successful!</h3>
            <p className={styles.resultText}>
              Successfully imported <strong>{importResult.imported}</strong> students.
            </p>
            <p className={styles.resultText}>
              Download the credentials file to get usernames and passwords for all imported students.
            </p>
            <Button onClick={handleDownloadCredentials}>
              Download Credentials
            </Button>
          </div>
        </div>
      )}

      <div className={styles.formatInfo}>
        <h3 className={styles.subheading}>Expected File Format</h3>
        <div className={styles.formatExample}>
          <table className={styles.exampleTable}>
            <thead>
              <tr>
                <th>Student Name</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ahmed Mohamed</td>
              </tr>
              <tr>
                <td>Fatima Hassan</td>
              </tr>
              <tr>
                <td>Omar Ali</td>
              </tr>
              <tr>
                <td>...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={styles.formatNote}>
          <strong>Note:</strong> The credentials file will be formatted as: "1. Ahmed Mohamed, username='ahmed_mohamed_001', password='Abc12345'"
        </p>
      </div>
    </div>
  );
}
