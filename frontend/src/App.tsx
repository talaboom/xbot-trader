import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'

const LandingPage        = lazy(() => import('./pages/LandingPage'))
const LoginPage          = lazy(() => import('./pages/LoginPage'))
const RegisterPage       = lazy(() => import('./pages/RegisterPage'))
const PricingPage        = lazy(() => import('./pages/PricingPage'))
const PaymentPage        = lazy(() => import('./pages/PaymentPage'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'))
const DashboardPage      = lazy(() => import('./pages/DashboardPage'))
const StrategiesPage     = lazy(() => import('./pages/StrategiesPage'))
const TradeHistoryPage   = lazy(() => import('./pages/TradeHistoryPage'))
const SettingsPage       = lazy(() => import('./pages/SettingsPage'))
const LeaderboardPage    = lazy(() => import('./pages/LeaderboardPage'))
const MarketPage         = lazy(() => import('./pages/MarketPage'))
const AIAssistantPage    = lazy(() => import('./pages/AIAssistantPage'))
const TermsPage          = lazy(() => import('./pages/TermsPage'))
const PrivacyPage        = lazy(() => import('./pages/PrivacyPage'))
const RiskPage           = lazy(() => import('./pages/RiskPage'))
const OAuthCallbackPage  = lazy(() => import('./pages/OAuthCallbackPage'))
const BacktestPage       = lazy(() => import('./pages/BacktestPage'))
const BacktestResultPage = lazy(() => import('./pages/BacktestResultPage'))
const SECRadarPage       = lazy(() => import('./pages/SECRadarPage'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span style={{ color: '#10b981', fontSize: '14px' }}>Loading...</span>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"               element={<LandingPage />} />
                <Route path="/login"          element={<LoginPage />} />
                <Route path="/register"       element={<RegisterPage />} />
                <Route path="/pricing"        element={<PricingPage />} />
                <Route path="/payment"        element={<PaymentPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/terms"          element={<TermsPage />} />
                <Route path="/privacy"        element={<PrivacyPage />} />
                <Route path="/risk"           element={<RiskPage />} />
                <Route path="/auth/callback"  element={<OAuthCallbackPage />} />
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/dashboard"   element={<DashboardPage />} />
                  <Route path="/markets"     element={<MarketPage />} />
                  <Route path="/strategies"  element={<StrategiesPage />} />
                  <Route path="/assistant"   element={<AIAssistantPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/trades"      element={<TradeHistoryPage />} />
                  <Route path="/settings"    element={<SettingsPage />} />
                  <Route path="/backtest"    element={<BacktestPage />} />
                  <Route path="/backtest/:id" element={<BacktestResultPage />} />
                  <Route path="/sec-radar"   element={<SECRadarPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
