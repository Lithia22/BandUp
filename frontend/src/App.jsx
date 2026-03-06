import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import StudentDashboard from './pages/student/StudentDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import Reading from './pages/student/reading/Reading'
import ReadingQuiz from './pages/student/reading/ReadingQuiz'
import ReadingResults from './pages/student/reading/ReadingResults'
import Listening from './pages/student/listening/Listening'
import ListeningQuiz from './pages/student/listening/ListeningQuiz'
import ListeningResults from './pages/student/listening/ListeningResults'
import Writing from './pages/student/writing/Writing'
import WritingQuiz from './pages/student/writing/WritingQuiz'
import WritingResults from './pages/student/writing/WritingResults'

function ProtectedRoute() {
  const token = localStorage.getItem('bandup_token')
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

function DashboardRedirect() {
  const role = localStorage.getItem('bandup_role')
  if (role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/student" replace />
}

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Auth mode="login" /> },
  { path: '/signup', element: <Auth mode="signup" /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <DashboardRedirect /> },
      { path: '/student', element: <StudentDashboard /> },
      { path: '/admin', element: <AdminDashboard /> },
      { path: '/reading', element: <Reading /> },
      { path: '/reading/:setNumber', element: <ReadingQuiz /> },
      { path: '/reading/:setNumber/results', element: <ReadingResults /> },
      { path: '/listening', element: <Listening /> },
      { path: '/listening/:setNumber', element: <ListeningQuiz /> },
      { path: '/listening/:setNumber/results', element: <ListeningResults /> },
      { path: '/writing', element: <Writing /> },
      { path: '/writing/:setNumber', element: <WritingQuiz /> },
      { path: '/writing/:setNumber/results', element: <WritingResults /> },
    ],
  },
])

export default function App() {
  return (
    <>
      <Toaster position="bottom-right" />
      <RouterProvider router={router} />
    </>
  )
}
