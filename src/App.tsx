import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  AuthProvider,
  GuestRoute,
  ProtectedRoute,
} from './components/ProtectedRoute'
import { AddExpensePage } from './pages/AddExpensePage'
import { GroupPage } from './pages/GroupPage'
import { GroupsPage } from './pages/GroupsPage'
import { LoginPage } from './pages/LoginPage'
import { PlanningPage } from './pages/PlanningPage'
import { RegisterPage } from './pages/RegisterPage'
import { SummaryPage } from './pages/SummaryPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-dvh bg-slate-50 text-slate-900">
          <Routes>
            <Route path="/" element={<Navigate to="/groups" replace />} />

            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/groups/:groupId" element={<GroupPage />} />
              <Route path="/groups/:groupId/summary" element={<SummaryPage />} />
              <Route path="/groups/:groupId/planning" element={<PlanningPage />} />
              <Route path="/groups/:groupId/add" element={<AddExpensePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/groups" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
