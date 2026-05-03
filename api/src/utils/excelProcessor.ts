import XLSX from 'xlsx';

/**
 * Question interface for Excel processing
 */
export interface ExcelQuestion {
  question: string;
  A: string;
  B: string;
  C: string;
  D: string;
  Answer: 'A' | 'B' | 'C' | 'D';
}

/**
 * Generate Excel template for exam questions
 * Returns buffer that can be sent as download
 */
export function generateExamTemplate(): Buffer {
  const headers = ['question', 'A', 'B', 'C', 'D', 'Answer'];
  
  // Create example row
  const exampleRow = {
    question: 'What is 2 + 2?',
    A: '3',
    B: '4',
    C: '5',
    D: '6',
    Answer: 'B'
  };
  
  // Create 100 empty rows (plus 1 example)
  const data = [exampleRow];
  for (let i = 0; i < 99; i++) {
    data.push({
      question: '',
      A: '',
      B: '',
      C: '',
      D: '',
      Answer: ''
    });
  }
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 60 }, // question
    { wch: 30 }, // A
    { wch: 30 }, // B
    { wch: 30 }, // C
    { wch: 30 }, // D
    { wch: 10 }, // Answer
  ];
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Questions');
  
  // Generate buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Parse Excel file and extract questions
 * Validates that exactly 100 questions are present with all required fields
 */
export function parseExamQuestions(buffer: Buffer): ExcelQuestion[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json<any>(worksheet);
  
  // Validate count
  if (data.length !== 100) {
    throw new Error(`Excel file must contain exactly 100 questions. Found: ${data.length}`);
  }
  
  // Validate and transform each row
  const questions: ExcelQuestion[] = [];
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because Excel is 1-indexed and has header row
    
    // Check required fields
    if (!row.question || row.question.trim() === '') {
      errors.push(`Row ${rowNum}: Question text is required`);
    }
    if (!row.A || row.A.trim() === '') {
      errors.push(`Row ${rowNum}: Option A is required`);
    }
    if (!row.B || row.B.trim() === '') {
      errors.push(`Row ${rowNum}: Option B is required`);
    }
    if (!row.C || row.C.trim() === '') {
      errors.push(`Row ${rowNum}: Option C is required`);
    }
    if (!row.D || row.D.trim() === '') {
      errors.push(`Row ${rowNum}: Option D is required`);
    }
    if (!row.Answer || !['A', 'B', 'C', 'D'].includes(row.Answer.toUpperCase())) {
      errors.push(`Row ${rowNum}: Answer must be A, B, C, or D`);
    }
    
    questions.push({
      question: row.question?.toString().trim() || '',
      A: row.A?.toString().trim() || '',
      B: row.B?.toString().trim() || '',
      C: row.C?.toString().trim() || '',
      D: row.D?.toString().trim() || '',
      Answer: row.Answer?.toString().toUpperCase() as 'A' | 'B' | 'C' | 'D',
    });
  });
  
  if (errors.length > 0) {
    throw new Error(`Validation errors:\n${errors.join('\n')}`);
  }
  
  return questions;
}

/**
 * Generate Excel file with student credentials
 */
export interface StudentCredential {
  name: string;
  username: string;
  password: string;
}

export function generateCredentialsFile(students: StudentCredential[]): Buffer {
  // Format data as required: "1.Ahmed, username='user1', password='pass1'"
  const data = students.map((student, index) => ({
    Entry: `${index + 1}.${student.name}, username="${student.username}", password="${student.password}"`
  }));
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column width
  worksheet['!cols'] = [{ wch: 80 }];
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Credentials');
  
  // Generate buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Parse Excel file with student names (single column)
 */
export function parseStudentNames(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
  
  // Extract names from first column, skip empty rows
  const names = data
    .map(row => row[0])
    .filter(name => name && name.toString().trim() !== '')
    .map(name => name.toString().trim());
  
  if (names.length === 0) {
    throw new Error('Excel file must contain at least one student name');
  }
  
  return names;
}
