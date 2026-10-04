import { Navigate, Outlet, Route, Routes } from 'react-router'
import { BottomNav, type NavItem } from '../ui/BottomNav'
import { RoleGate } from '../auth/RoleGate'
import { Placeholder } from './Placeholder'
import { Today } from '../features/trainee/Today'
import { SessionScreen } from '../features/trainee/SessionScreen'
import { ExerciseScreen } from '../features/trainee/ExerciseScreen'
import { FinishScreen } from '../features/trainee/FinishScreen'
import { History } from '../features/trainee/History'
import { SwitchUser } from '../auth/SwitchUser'
import { CoachHome } from '../features/coach/CoachHome'
import { CoachSessions } from '../features/coach/CoachSessions'
import { CoachSessionDetail } from '../features/coach/CoachSessionDetail'
import { CoachProgress } from '../features/coach/CoachProgress'

const traineeNav: NavItem[] = [
  { to: '/lucas', label: 'Today', icon: 'home' },
  { to: '/lucas/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/lucas/history', label: 'History', icon: 'history' },
  { to: '/lucas/goals', label: 'Goals', icon: 'goal' },
]

const coachNav: NavItem[] = [
  { to: '/coach', label: 'Home', icon: 'home' },
  { to: '/coach/sessions', label: 'Sessions', icon: 'list' },
  { to: '/coach/progress', label: 'Progress', icon: 'chart' },
  { to: '/coach/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/coach/plan', label: 'Plan', icon: 'plan' },
]

const NAV_H = { ['--nav-h' as string]: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }

function TraineeLayout() {
  return (
    <div className="flex min-h-dvh flex-col" style={NAV_H}>
      <div className="flex-1"><Outlet /></div>
      <BottomNav items={traineeNav} />
    </div>
  )
}

function CoachLayout() {
  return (
    <div className="flex min-h-dvh flex-col" style={NAV_H}>
      <div className="flex-1"><Outlet /></div>
      <BottomNav items={coachNav} />
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleGate />} />

      <Route path="/lucas" element={<RoleGate require="trainee"><TraineeLayout /></RoleGate>}>
        <Route index element={<Today />} />
        <Route path="session/:sessionId" element={<SessionScreen />} />
        <Route path="session/:sessionId/exercise/:order" element={<ExerciseScreen />} />
        <Route path="session/:sessionId/finish" element={<FinishScreen />} />
        <Route path="calendar" element={<Placeholder title="Calendar" />} />
        <Route path="history" element={<History />} />
        <Route path="goals" element={<Placeholder title="Goals" />} />
      </Route>

      <Route path="/coach" element={<RoleGate require="coach"><CoachLayout /></RoleGate>}>
        <Route index element={<CoachHome />} />
        <Route path="sessions" element={<CoachSessions />} />
        <Route path="sessions/:sessionId" element={<CoachSessionDetail />} />
        <Route path="progress" element={<CoachProgress />} />
        <Route path="settings" element={<Placeholder title="Settings" />} />
        <Route path="calendar" element={<Placeholder title="Calendar" />} />
        <Route path="plan" element={<Placeholder title="Plan" />} />
      </Route>

      <Route path="/switch-user" element={<SwitchUser />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
