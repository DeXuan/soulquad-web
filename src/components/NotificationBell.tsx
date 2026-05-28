import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Notification } from '../types';

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const result = await api.getUnreadCount();
      setCount(result.count);
    } catch (err) {
      // Ignore
    }
  };

  const loadNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (err) {
      // Ignore
    }
  };

  const handleBellClick = async () => {
    if (!showDropdown) {
      await loadNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const markAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setCount(prev => Math.max(0, prev - 1));
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    await api.markAllNotificationsRead();
    setCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match': return '💕';
      case 'message': return '💬';
      case 'like': return '❤️';
      case 'daily_pick': return '⭐';
      default: return '🔔';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleBellClick}
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          position: 'relative',
          padding: '0.5rem'
        }}
      >
        🔔
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: 'var(--error)',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.625rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '320px',
          maxHeight: '400px',
          overflow: 'auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border)'
          }}>
            <span style={{ fontWeight: 600 }}>通知</span>
            {count > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                全部已读
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              暂无通知
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  background: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.1)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.25rem' }}>{getNotificationIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{n.content}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}