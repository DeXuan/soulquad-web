import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

const TIER_INFO = {
  legend: { name: '传奇', emoji: '🏆', color: '#fbbf24' },
  top: { name: '顶尖', emoji: '⭐', color: '#a855f7' },
  excellent: { name: '优秀', emoji: '✨', color: '#22c55e' },
  ordinary: { name: '普通', emoji: '👤', color: '#94a3b8' }
};

export function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const tierInfo = user?.user_tier ? TIER_INFO[user.user_tier] : TIER_INFO.ordinary;

  const menuItems = [
    {
      icon: '👤',
      label: '账号设置',
      desc: '修改昵称、头像等信息',
      onClick: () => navigate('/profile/me')
    },
    {
      icon: '🔔',
      label: '通知设置',
      desc: '管理推送和消息提醒',
      onClick: () => {}
    },
    {
      icon: '🔒',
      label: '隐私设置',
      desc: '控制谁可以看到你的信息',
      onClick: () => {}
    },
    {
      icon: '👁️',
      label: '主题模式',
      desc: theme === 'dark' ? '深色模式' : '浅色模式',
      onClick: () => toggleTheme(),
      right: theme === 'dark' ? '🌙' : '☀️'
    },
    {
      icon: '🗣️',
      label: '意见反馈',
      desc: '帮助我们做得更好',
      onClick: () => {}
    },
    {
      icon: '📖',
      label: '关于我们',
      desc: '版本信息和使用条款',
      onClick: () => {}
    }
  ];

  return (
    <div className="page">
      <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem', maxWidth: '634px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
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

          {/* User Info Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 600
            }}>
              {user?.nickname?.[0] || '用户'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{user?.nickname}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>{tierInfo.emoji}</span>
                <span style={{ color: tierInfo.color }}>{tierInfo.name}</span>
                <span style={{ margin: '0 0.25rem' }}>·</span>
                <span>SoulQuad v1.0.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
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
                transition: 'background 0.2s',
                gap: '1rem'
              }}
              className="hover-bg"
            >
              <span style={{ fontSize: '1.5rem', width: '36px', textAlign: 'center' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: '0.125rem' }}>{item.label}</div>
                {item.desc && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                )}
              </div>
              {item.right ? (
                <span style={{ fontSize: '1.25rem' }}>{item.right}</span>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>›</span>
              )}
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'transparent',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              color: '#ef4444',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            退出登录
          </button>
        </div>

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
                width: '85%',
                maxWidth: '320px',
                textAlign: 'center'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👋</div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>确定要退出登录吗？</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                退出后你可以重新登录继续使用 SoulQuad
              </p>
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
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  确定退出
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .hover-bg:hover {
          background: var(--bg-secondary);
        }
      `}</style>
    </div>
  );
}