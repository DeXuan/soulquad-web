import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

const TABS = [
  { path: '/discover', label: '发现', icon: '🔍' },
  { path: '/messages', label: '消息', icon: '💬' },
  { path: '/moments', label: '动态', icon: '📝' },
  { path: '/leaderboard', label: '排行', icon: '🏆' },
  { path: '/profile', label: '我的', icon: '👤' },
];

export function BottomTabBar() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const data = await api.getUnreadCount();
      setUnreadCount(data.count);
    } catch {
      // ignore
    }
  };

  const isActive = (path: string) => {
    if (path === '/discover') {
      return location.pathname === '/discover';
    }
    if (path === '/moments') {
      return location.pathname.startsWith('/moments');
    }
    if (path === '/messages') {
      return location.pathname.startsWith('/messages') || location.pathname.startsWith('/chat');
    }
    if (path === '/leaderboard') {
      return location.pathname === '/leaderboard';
    }
    if (path === '/profile') {
      return location.pathname.startsWith('/profile') || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  return (
    <nav className="bottom-tab-bar">
      {TABS.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`bottom-tab-item ${isActive(tab.path) ? 'active' : ''}`}
        >
          <div className="bottom-tab-icon">
            <span>{tab.icon}</span>
            {tab.path === '/messages' && unreadCount > 0 && (
              <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </div>
          <span className="bottom-tab-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}