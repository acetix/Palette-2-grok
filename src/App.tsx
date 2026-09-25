import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ScrollTopButton } from './components/Layout'
import HomePage from './pages/HomePage'
import TemplatesPage from './pages/TemplatesPage'
import CalordetelPage from './pages/CalordetelPage'
import PrivacyPage from './pages/PrivacyPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/calordetel" element={<CalordetelPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ScrollTopButton />
    </BrowserRouter>
  )
}
