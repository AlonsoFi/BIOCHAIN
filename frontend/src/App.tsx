import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Landing from './pages/landing'
import Login from './pages/login'
import UserLanding from './pages/user/landing'
import ResearcherLanding from './pages/researcher/landing'
import UserDashboard from './pages/user/dashboard'
import HistoriaClinica from './pages/user/historia-clinica'
import UploadStudy from './pages/user/upload'
import ResearcherDashboard from './pages/researcher/dashboard'
import Marketplace from './pages/researcher/marketplace'
import DatasetDetail from './pages/researcher/dataset-detail'
import Checkout from './pages/researcher/checkout'

function App() {
  const { isAuthenticated, userType } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/user/landing" element={<UserLanding />} />
        <Route path="/researcher/landing" element={<ResearcherLanding />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas - Usuario */}
        <Route
          path="/user/dashboard"
          element={
            isAuthenticated && userType === 'contributor' ? (
              <UserDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/user/historia-clinica"
          element={
            isAuthenticated && userType === 'contributor' ? (
              <HistoriaClinica />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/user/upload"
          element={
            isAuthenticated && userType === 'contributor' ? (
              <UploadStudy />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Rutas protegidas - Investigador */}
        <Route
          path="/researcher/dashboard"
          element={
            isAuthenticated && userType === 'researcher' ? (
              <ResearcherDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/researcher/marketplace"
          element={
            isAuthenticated && userType === 'researcher' ? (
              <Marketplace />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/researcher/dataset/:id"
          element={
            isAuthenticated && userType === 'researcher' ? (
              <DatasetDetail />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/researcher/checkout/:id"
          element={
            isAuthenticated && userType === 'researcher' ? (
              <Checkout />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

