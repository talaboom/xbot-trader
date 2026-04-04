import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PricingPage from './pages/PricingPage'
import PaymentPage from './pages/PaymentPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import DashboardPage from './pages/DashboardPage'
import StrategiesPage from './pages/StrategiesPage'
import TradeHistoryPage from './pages/TradeHistoryPage'
import SettingsPage from './pages/SettingsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import MarketPage from './pages/MarketPage'
import AIAssistantPage from './pages/AIAssistantPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/markets" element={<MarketPage />} />
            <Route path="/strategies" element={<StrategiesPage />} />
            <Route path="/assistant" element={<AIAssistantPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/trades" element={<TradeHistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
