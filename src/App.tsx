import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import CalendarApp from './components/CalendarApp';

export default function App() {
  const { isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return <CalendarApp onLogout={logout} />;
}
