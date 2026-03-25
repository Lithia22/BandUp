import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Toaster } from '../../frontend/src/components/ui/sonner'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
import StudentDashboard from './pages/student/StudentDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminQuestions from './pages/admin/questions/AdminQuestions'
import AdminReading from './pages/admin/questions/reading/AdminReading'
import AdminReadingEditor from './pages/admin/questions/reading/AdminReadingEditor'
import AdminListening from './pages/admin/questions/listening/AdminListening'
import AdminListeningEditor from './pages/admin/questions/listening/AdminListeningEditor'
import AdminWriting from './pages/admin/questions/writing/AdminWriting'
import AdminWritingEditor from './pages/admin/questions/writing/AdminWritingEditor'
import AdminSpeaking from './pages/admin/questions/speaking/AdminSpeaking'
import AdminSpeakingEditor from './pages/admin/questions/speaking/AdminSpeakingEditor'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import StudentAnalytics from './pages/student/StudentAnalytics'
import Reading from './pages/student/reading/Reading'
import ReadingQuiz from './pages/student/reading/ReadingQuiz'
import ReadingResults from './pages/student/reading/ReadingResults'
import Listening from './pages/student/listening/Listening'
import ListeningQuiz from './pages/student/listening/ListeningQuiz'
import ListeningResults from './pages/student/listening/ListeningResults'
import Writing from './pages/student/writing/Writing'
import WritingQuiz from './pages/student/writing/WritingQuiz'
import WritingResults from './pages/student/writing/WritingResults'
import Speaking from './pages/student/speaking/Speaking'
import SpeakingBooklets from './pages/student/speaking/SpeakingBooklets'
import SpeakingQuiz from './pages/student/speaking/SpeakingQuiz'
import SpeakingResults from './pages/student/speaking/SpeakingResults'
import api from './services/api'

function ProtectedRoute() {
  const [isValid, setIsValid] = useState(null)
  const token = localStorage.getItem('bandup_token')

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValid(false)
        return
      }
      try {
        await api.get('/auth/verify')
        setIsValid(true)
      } catch {
        localStorage.removeItem('bandup_token')
        localStorage.removeItem('bandup_role')
        localStorage.removeItem('bandup_name')
        setIsValid(false)
      }
    }
    verifyToken()
  }, [token])

  if (isValid === null) return null
  if (!isValid) return <Navigate to="/login" replace />
  return <Outlet />
}

function AdminRoute() {
  const role = localStorage.getItem('bandup_role')
  if (role !== 'admin') return <Navigate to="/student" replace />
  return <Outlet />
}

function StudentRoute() {
  const role = localStorage.getItem('bandup_role')
  if (role !== 'student') return <Navigate to="/admin" replace />
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
      { path: '/profile', element: <Profile /> },
      {
        element: <AdminRoute />,
        children: [
          { path: '/admin', element: <AdminDashboard /> },
          { path: '/admin/analytics', element: <AdminAnalytics /> },
          { path: '/admin/questions', element: <AdminQuestions /> },
          { path: '/admin/reading', element: <AdminReading /> },
          { path: '/admin/reading/editor', element: <AdminReadingEditor /> },
          {
            path: '/admin/reading/editor/:setNumber',
            element: <AdminReadingEditor />,
          },
          { path: '/admin/listening', element: <AdminListening /> },
          {
            path: '/admin/listening/editor',
            element: <AdminListeningEditor />,
          },
          {
            path: '/admin/listening/editor/:setNumber',
            element: <AdminListeningEditor />,
          },
          { path: '/admin/writing', element: <AdminWriting /> },
          { path: '/admin/writing/editor', element: <AdminWritingEditor /> },
          {
            path: '/admin/writing/editor/:setNumber',
            element: <AdminWritingEditor />,
          },
          { path: '/admin/speaking', element: <AdminSpeaking /> },
          { path: '/admin/speaking/editor', element: <AdminSpeakingEditor /> },
          {
            path: '/admin/speaking/editor/:setNumber',
            element: <AdminSpeakingEditor />,
          },
        ],
      },
      {
        element: <StudentRoute />,
        children: [
          { path: '/student', element: <StudentDashboard /> },
          { path: '/analytics', element: <StudentAnalytics /> },
          { path: '/reading', element: <Reading /> },
          { path: '/reading/:setNumber', element: <ReadingQuiz /> },
          { path: '/reading/:setNumber/results', element: <ReadingResults /> },
          { path: '/listening', element: <Listening /> },
          { path: '/listening/:setNumber', element: <ListeningQuiz /> },
          {
            path: '/listening/:setNumber/results',
            element: <ListeningResults />,
          },
          { path: '/writing', element: <Writing /> },
          { path: '/writing/:setNumber', element: <WritingQuiz /> },
          { path: '/writing/:setNumber/results', element: <WritingResults /> },
          { path: '/speaking', element: <Speaking /> },
          { path: '/speaking/:setNumber', element: <SpeakingBooklets /> },
          {
            path: '/speaking/:setNumber/:partNumber',
            element: <SpeakingBooklets />,
          },
          {
            path: '/speaking/:setNumber/:partNumber/:candidateNumber',
            element: <SpeakingQuiz />,
          },
          {
            path: '/speaking/:setNumber/:partNumber/:candidateNumber/results',
            element: <SpeakingResults />,
          },
        ],
      },
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