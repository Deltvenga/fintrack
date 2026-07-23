import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  AuthProvider,
  GuestRoute,
  ProtectedRoute,
} from './components/ProtectedRoute'
import { ThemeProvider } from './components/ThemeProvider'
import { GirlyAmbience } from './components/GirlyAmbience'
import { EvaAmbience } from './components/EvaAmbience'
import { ThemeToggle } from './components/ThemeToggle'
import { AddExpensePage } from './pages/AddExpensePage'
import { GroupPage } from './pages/GroupPage'
import { GroupsPage } from './pages/GroupsPage'
import { JoinPage } from './pages/JoinPage'
import { LoginPage } from './pages/LoginPage'
import { PlanningPage } from './pages/PlanningPage'
import { PlanOverviewPage } from './pages/PlanOverviewPage'
import { RegisterPage } from './pages/RegisterPage'
import { BalanceChartPage } from './pages/BalanceChartPage'
import { CategoryDetailPage } from './pages/CategoryDetailPage'
import { SummaryPage } from './pages/SummaryPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <GirlyAmbience />
            <EvaAmbience />
            <ThemeToggle />
            <Routes>
            <Route path="/" element={<Navigate to="/groups" replace />} />

            <Route path="/join/:inviteCode" element={<JoinPage />} />

            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/groups/:groupId" element={<GroupPage />} />
              <Route path="/groups/:groupId/summary" element={<SummaryPage />} />
              <Route path="/groups/:groupId/summary/chart" element={<BalanceChartPage />} />
              <Route path="/groups/:groupId/summary/category/:categoryKey" element={<CategoryDetailPage />} />
              <Route path="/groups/:groupId/planning" element={<PlanningPage />} />
              <Route path="/groups/:groupId/planning/overview" element={<PlanOverviewPage />} />
              <Route path="/groups/:groupId/add" element={<AddExpensePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/groups" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
