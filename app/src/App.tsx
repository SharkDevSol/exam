import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Admin components
import { AdminLogin, AdminDashboard } from './pages/admin';

// Teacher components
import { TeacherLogin, TeacherRegister, TeacherDashboard } from './pages/teacher';

// Student components
import { StudentLogin, ExamDiscovery, ExamInterface, StudentResults } from './pages/student';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/student/login" replace />} />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Teacher routes */}
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/teacher/register" element={<TeacherRegister />} />
          <Route 
            path="/teacher/*" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Student routes */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route 
            path="/student" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamDiscovery />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/exam/:examId" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamInterface />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/results" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentResults />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/results/:examId" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentResults />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
