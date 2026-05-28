import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

const TABS = [
  { path: '/discover', label: '发现', icon: '🔍', matchPaths: ['/discover'] },
  { path: '/messages', label: '消息', icon: '💬', matchPaths: ['/messages', '/chat'] },
  { path: '/moments', label: '动态', icon: '📝', matchPaths: ['/moments'] },
  { path: '/leaderboard', label: '排行', icon: '🏆', matchPaths: ['/leaderboard'] },
  { path: '/profile', label: '我的', icon: '👤', matchPaths: ['/profile', '/dashboard'] },
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

  const isActive = (tab: typeof TABS[number]) => {
    return tab.matchPaths.some(p => location.pathname.startsWith(p));
  };

  return (
    <nav className="bottom-tab-bar">
      {TABS.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`bottom-tab-item ${isActive(tab) ? 'active' : ''}`}
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