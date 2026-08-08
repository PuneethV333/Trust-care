import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/layout/AuthProvider'
import {
  RequireAuth,
  RequireGuest,
  RequireOnboarding,
} from './components/layout/guards'
import HomePage from './pages/home'
import OnboardingPage from './pages/onboarding'
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
                <HomePage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
