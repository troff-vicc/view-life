import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AIChatPage from './pages/AIChatPage'
import TaskDetailPage from './pages/TaskDetailPage'
import ProfilePage from './pages/ProfilePage'
import CreateTaskPage from './pages/CreateTaskPage'

function App() {
  const token = localStorage.getItem('access_token')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={token ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        <Route path="/ai" element={token ? <AIChatPage /> : <Navigate to="/login" />} />
        <Route path="/task/:id" element={<TaskDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/create" element={<CreateTaskPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App