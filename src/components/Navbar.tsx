import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { QUADRANT_INFO } from '../data/mbti';
import { NotificationBell } from './NotificationBell';
import { useTheme } from '../hooks/useTheme';

const TIER_INFO = {
  legend: { emoji: '🏆', color: '#fbbf24' },
  top: { emoji: '⭐', color: '#a855f7' },
  excellent: { emoji: '✨', color: '#22c55e' },
  ordinary: { emoji: '👤', color: '#94a3b8' }
};

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;
  const tierInfo = user?.user_tier ? TIER_INFO[user.user_tier] : null;

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/dashboard" className="navbar-brand">
          <div className="logo-icon">🔮</div>
          <span>灵魂象限</span>
        </Link>

        <div className="navbar-menu">
          <Link to="/discover" className={isActive('/discover') ? 'active' : ''}>
            🔍 发现
          </Link>
          <Link to="/messages" className={isActive('/messages') ? 'active' : ''}>
            💬 消息
          </Link>
          <Link to="/leaderboard" className={isActive('/leaderboard') ? 'active' : ''}>
            🏆 排行
          </Link>
          <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
            🏠 首页
          </Link>
        </div>

        <div className="navbar-user">
          <button className="theme-toggle" onClick={toggleTheme} title="切换主题">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {tierInfo && (
            <span style={{ fontSize: '1rem' }} title={user?.user_tier}>
              {tierInfo.emoji}
            </span>
          )}
          {user?.soul_quadrant && (
            <span style={{ fontSize: '1.25rem' }}>
              {QUADRANT_INFO[user.soul_quadrant]?.emoji}
            </span>
          )}
          <NotificationBell />
          <div className="user-avatar" style={{
            background: user?.avatar_data ? `url(${user.avatar_data}) center/cover` : undefined
          }}>
            {!user?.avatar_data && user?.nickname?.[0]}
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost"
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
          >
            退出
          </button>
        </div>
      </div>
    </nav>
  );
}