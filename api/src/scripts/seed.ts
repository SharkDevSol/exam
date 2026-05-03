import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SALT_ROUNDS = 12;

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database...');
    
    // Create admin account
    const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    await client.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
      ['admin', adminPassword]
    );
    console.log('  ✅ Admin account created (username: admin, password: admin123)');
    
    // Create subjects
    const subjects = ['Mathematics', 'English', 'Biology', 'Chemistry', 'Physics'];
    for (const subject of subjects) {
      await client.query(
        'INSERT INTO subjects (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [subject]
      );
    }
    console.log(`  ✅ Created ${subjects.length} subjects`);
    
    // Create sample teacher
    const teacherPassword = await bcrypt.hash('teacher123', SALT_ROUNDS);
    const mathSubject = await client.query('SELECT id FROM subjects WHERE name = $1', ['Mathematics']);
    if (mathSubject.rows.length > 0) {
      await client.query(
        'INSERT INTO teachers (username, password_hash, subject_id) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        ['teacher_math', teacherPassword, mathSubject.rows[0].id]
      );
      console.log('  ✅ Sample teacher created (username: teacher_math, password: teacher123)');
    }
    
    // Create sample students
    const studentPassword = await bcrypt.hash('student123', SALT_ROUNDS);
    const students = [
      { name: 'Ahmed Ali', username: 'student001', admission: '2024001' },
      { name: 'Fatima Hassan', username: 'student002', admission: '2024002' },
      { name: 'Mohammed Ibrahim', username: 'student003', admission: '2024003' },
    ];
    
    for (const student of students) {
      await client.query(
        'INSERT INTO students (name, username, password_hash, admission_number) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING',
        [student.name, student.username, studentPassword, student.admission]
      );
    }
    console.log(`  ✅ Created ${students.length} sample students (password: student123)`);
    
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
