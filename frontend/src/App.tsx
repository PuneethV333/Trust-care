import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/layout/AuthProvider'
import { AppShell } from './components/layout/AppShell'
import {
  RequireAdmin,
  RequireAuth,
  RequireGuest,
  RequireOnboarding,
} from './components/layout/guards'
import AdminPage from './pages/admin'
import BookingsPage from './pages/bookings'
import HelperDetailPage from './pages/helper-detail'
import HomePage from './pages/home'
import OnboardingPage from './pages/onboarding'
import EarningsPage from './pages/earnings'
import ProfilePage from './pages/profile'
import SearchPage from './pages/search'
import SignInPage from './pages/sign-in'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/sign-in"
            element={
              <RequireGuest>
                <SignInPage />
              </RequireGuest>
            }
          />
          <Route
            path="/onboarding"
            element={
              <RequireOnboarding>
                <OnboardingPage />
              </RequireOnboarding>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="helpers/:helperId" element={<HelperDetailPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="earnings" element={<EarningsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="admin"
              element={
                <RequireAdmin>
                  <AdminPage />
                </RequireAdmin>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App