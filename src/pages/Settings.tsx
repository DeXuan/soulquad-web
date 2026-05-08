import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    api.logout();
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      icon: '👤',
      label: '账号设置',
      onClick: () => navigate('/profile/me')
    },
    {
      icon: '🔔',
      label: '通知设置',
      onClick: () => {}
    },
    {
      icon: '🔒',
      label: '隐私设置',
      onClick: () => {}
    },
    {
      icon: '👁️',
      label: '主题',
      onClick: () => toggleTheme(),
      right: theme === 'dark' ? '🌙 深色' : '☀️ 浅色'
    },
    {
      icon: '🗣️',
      label: '意见反馈',
      onClick: () => {}
    },
    {
      icon: '📖',
      label: '关于我们',
      onClick: () => {}
    }
  ];

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>设置</h1>
        </div>

        <div className="card" style={{ padding: '0' }}>
          {menuItems.map((item, index) => (
            <div
              key={item.label}
              onClick={item.onClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                borderBottom: index < menuItems.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <span style={{ fontSize: '1.25rem', marginRight: '1rem' }}>{item.icon}</span>
              <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
              {item.right && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {item.right}
                </span>
              )}
              {!item.right && <span style={{ color: 'var(--text-muted)' }}>›</span>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="btn btn-secondary btn-full"
            style={{ color: '#ef4444', borderColor: '#ef4444' }}
          >
            退出登录
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          SoulQuad v1.0.0
        </p>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1200
            }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '1rem',
                padding: '1.5rem',
                width: '80%',
                maxWidth: '300px',
                textAlign: 'center'
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: '1rem' }}>确定要退出登录吗？</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  取消
                </button>
                <button
                  onClick={handleLogout}
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}