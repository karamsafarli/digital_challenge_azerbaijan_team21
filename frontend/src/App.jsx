import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Passenger from './pages/Passenger.jsx';
import OperatorLayout from './layouts/OperatorLayout.jsx';
import Overview from './pages/operator/Overview.jsx';
import Fleet from './pages/operator/Fleet.jsx';
import ReportsFeed from './pages/operator/ReportsFeed.jsx';
import Announcements from './pages/operator/Announcements.jsx';
import History from './pages/operator/History.jsx';
import Settings from './pages/operator/Settings.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import FullScreenLoader from './components/FullScreenLoader.jsx';
import { homePathFor, useAuth } from './context/AuthContext.jsx';

function Home() {
  const { user, checking } = useAuth();
  if (checking) return <FullScreenLoader />;
  return <Navigate to={user ? homePathFor(user) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute role="PASSENGER">
            <Passenger />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator"
        element={
          <ProtectedRoute role="OPERATOR">
            <OperatorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="fleet" element={<Fleet />} />
        <Route path="reports" element={<ReportsFeed />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
