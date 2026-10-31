import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Passenger from './pages/Passenger.jsx';
import Operator from './pages/Operator.jsx';
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
            <Operator />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
