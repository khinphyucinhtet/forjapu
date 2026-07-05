import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppNotificationBridge from './components/AppNotificationBridge'
import ProtectedRoute from './components/ProtectedRoute'
import DrawingWhiteboard from './pages/DrawingWhiteboard'
import JapuChat from './pages/JapuChat'
import JapuHistory from './pages/JapuHistory'
import JapuHome from './pages/JapuHome'
import JapuReminders from './pages/JapuReminders'
import JapuSettings from './pages/JapuSettings'
import JapuWhiteboard from './pages/JapuWhiteboard'
import Login from './pages/Login'
import PinkyChat from './pages/PinkyChat'
import PinkyAnalytics from './pages/PinkyAnalytics'
import PinkyDashboard from './pages/PinkyDashboard'
import PinkySettings from './pages/PinkySettings'
import ProfileJapu from './pages/profile_japu'
import ProfilePinky from './pages/profile_pinky'
import ReminderManagement from './pages/ReminderManagement'
import SplashScreen from './pages/SplashScreen'
import { hydrateCurrentUser, initializeMockData } from './utils/storage'

export default function App() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function bootstrapApp() {
      initializeMockData()
      await hydrateCurrentUser()

      if (isMounted) {
        setIsReady(true)
      }
    }

    bootstrapApp()

    return () => {
      isMounted = false
    }
  }, [])

  if (!isReady) {
    return (
      <div className="auth-shell splash-shell">
        <div className="phone-preview-card">
          <h1>ForJapu</h1>
          <p>Reminder Web App for Japu Layy is loading..</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AppNotificationBridge />
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/welcome" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/pinky"
          element={
            <ProtectedRoute allowedRoles={['pinky']}>
              <PinkyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pinky/reminders"
          element={
            <ProtectedRoute allowedRoles={['pinky']}>
              <ReminderManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pinky/send"
          element={
            <ProtectedRoute allowedRoles={['pinky']}>
              <Navigate to="/pinky/board" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pinky/board"
          element={
            <ProtectedRoute allowedRoles={['pinky']}>
              <DrawingWhiteboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pinky/chat"
          element={
            <ProtectedRoute allowedRoles={['pinky']}>
              <PinkyChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pinky/analytics"
          element={
            <ProtectedRoute allowedRoles={['pinky']}>
              <PinkyAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pinky/settings"
          element={
            <ProtectedRoute allowedRoles={['pinky']}>
              <PinkySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pinky/profile"
          element={
            <ProtectedRoute allowedRoles={['pinky']}>
              <ProfilePinky />
            </ProtectedRoute>
          }
        />

        <Route
          path="/japu"
          element={
            <ProtectedRoute allowedRoles={['japu']}>
              <JapuHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/japu/reminders"
          element={
            <ProtectedRoute allowedRoles={['japu']}>
              <JapuReminders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/japu/board"
          element={
            <ProtectedRoute allowedRoles={['japu']}>
              <JapuWhiteboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/japu/chat"
          element={
            <ProtectedRoute allowedRoles={['japu']}>
              <JapuChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/japu/history"
          element={
            <ProtectedRoute allowedRoles={['japu']}>
              <JapuHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/japu/settings"
          element={
            <ProtectedRoute allowedRoles={['japu']}>
              <JapuSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/japu/profile"
          element={
            <ProtectedRoute allowedRoles={['japu']}>
              <ProfileJapu />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
