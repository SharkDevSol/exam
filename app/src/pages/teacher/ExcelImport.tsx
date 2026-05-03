import { useState, ChangeEvent } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { Button } from '../../components';
import styles from './ExcelImport.module.css';

interface Question {
  question: string;
  A: string;
  B: string;
  C: string;
  D: string;
  Answer: 'A' | 'B' | 'C' | 'D';
}

interface ExcelImportProps {
  onImport: (questions: Question[]) => void;
}

export default function ExcelImport({ onImport }: ExcelImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (!validTypes.includes(selectedFile.type)) {
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
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      const response = await api.get('/teacher/exams/template', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'exam_questions_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/teacher/exams/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onImport(response.data.questions);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.heading}>Step 1: Download Template</h3>
        <p className={styles.description}>
          Download the Excel template with the correct format for exam questions.
        </p>
        <Button
          onClick={handleDownloadTemplate}
          disabled={downloading}
          variant="secondary"
        >
          {downloading ? 'Downloading...' : '📥 Download Template'}
        </Button>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.section}>
        <h3 className={styles.heading}>Step 2: Upload Completed Template</h3>
        <p className={styles.description}>
          Upload your completed Excel file with exactly 100 questions.
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.uploadArea}>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          <label htmlFor="file-input" className={styles.fileLabel}>
            <span className={styles.fileIcon}>📄</span>
            <span className={styles.fileName}>
              {file ? file.name : 'Choose Excel file'}
            </span>
          </label>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          fullWidth
        >
          {uploading ? 'Uploading...' : '📤 Upload & Import Questions'}
        </Button>
      </div>

      <div className={styles.instructions}>
        <h4 className={styles.instructionsHeading}>Instructions:</h4>
        <ol className={styles.instructionsList}>
          <li>Download the Excel template using the button above</li>
          <li>Fill in all 100 questions with the following columns:
            <ul>
              <li><strong>question:</strong> The question text</li>
              <li><strong>A, B, C, D:</strong> The four answer options</li>
              <li><strong>Answer:</strong> The correct answer (A, B, C, or D)</li>
            </ul>
          </li>
          <li>Save your completed Excel file</li>
          <li>Upload the file using the upload button above</li>
          <li>Review the imported questions before finalizing the exam</li>
        </ol>
      </div>
    </div>
  );
}
