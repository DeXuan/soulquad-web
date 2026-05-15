import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SoulTest } from './pages/SoulTest';
import { Dashboard } from './pages/Dashboard';
import { Discover } from './pages/Discover';
import { Messages } from './pages/Messages';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Leaderboard } from './pages/Leaderboard';
import { Moments } from './pages/Moments';
import { BottomTabBar } from './components/BottomTabBar';
import { NotificationBell } from './components/NotificationBell';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <div className="app-content">{children}</div>
      <BottomTabBar />
    </div>
  );
}

function App() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <BrowserRouter>
      {isAuthenticated && (
        <div className="app-header">
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="logo-icon" style={{
                width: '32px',
                height: '32px',
                background: 'var(--gradient-primary)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}>🔮</div>
              <span style={{
                fontWeight: 700,
                fontSize: '1rem',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>灵魂象限</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button className="theme-toggle" onClick={toggleTheme} title="切换主题">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <NotificationBell />
            </div>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/discover" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/discover" replace /> : <Register />} />

        <Route
          path="/soul-test"
          element={
            <ProtectedRoute>
              <SoulTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <AppLayout><Discover /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <AppLayout><Messages /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:matchId"
          element={
            <ProtectedRoute>
              <AppLayout><Chat /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/*"
          element={
            <ProtectedRoute>
              <AppLayout><Profile /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout><Settings /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/moments"
          element={
            <ProtectedRoute>
              <AppLayout><Moments /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <AppLayout><Leaderboard /></AppLayout>
            </ProtectedRoute>
          }
        />

        {user && !user.profile_completed && (
          <Route path="*" element={<Navigate to="/soul-test" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;