import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Match, User, Notification } from '../types';
import { QUADRANT_INFO } from '../data/mbti';

type MessageTab = 'match' | 'chat' | 'system';

export function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MessageTab>('chat');
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchUsers, setMatchUsers] = useState<Record<string, User>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load matches
      const matchList = await api.getMatches();
      setMatches(matchList);

      // Load matched users for chat list
      const userMap: Record<string, User> = {};
      for (const match of matchList) {
        if (match.mutual_liked) {
          const otherUserId = match.oder_a_id === user?.id ? match.oder_b_id : match.oder_a_id;
          try {
            const otherUser = await api.getUser(otherUserId);
            userMap[match.id] = otherUser;
          } catch {
            // ignore
          }
        }
      }
      setMatchUsers(userMap);

      // Load notifications
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const matchedList = matches.filter(m => m.mutual_liked);
  const unreadMatchCount = notifications.filter(n => !n.read && n.type === 'like').length;
  const unreadSystemCount = notifications.filter(n => !n.read && n.type === 'system').length;

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
          <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ padding: '16px 12px' }}>
        {/* Tabs */}
        <div className="message-tabs">
          <button
            className={`message-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 聊天
            {matchedList.length > 0 && <span className="tab-badge" />}
          </button>
          <button
            className={`message-tab ${activeTab === 'match' ? 'active' : ''}`}
            onClick={() => setActiveTab('match')}
          >
            💕 匹配
            {unreadMatchCount > 0 && <span className="tab-badge" />}
          </button>
          <button
            className={`message-tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            🔔 系统
            {unreadSystemCount > 0 && <span className="tab-badge" />}
          </button>
        </div>

        {/* Chat List */}
        {activeTab === 'chat' && (
          <div>
            {matchedList.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <h3 style={{ marginBottom: '0.5rem' }}>暂无消息</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  去发现页找到你的灵魂伴侣，开始对话吧
                </p>
                <Link to="/discover" className="btn btn-primary">
                  发现匹配
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {matchedList.map(match => {
                  const matchUser = matchUsers[match.id];
                  if (!matchUser) return null;

                  const quadrantInfo = matchUser.soul_quadrant ?
                    QUADRANT_INFO[matchUser.soul_quadrant] : null;

                  return (
                    <div
                      key={match.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-card)', borderRadius: '12px', cursor: 'pointer' }}
                      onClick={() => navigate(`/chat/${match.id}`)}
                    >
                      <div
                        className="user-avatar"
                        style={{
                          width: '50px',
                          height: '50px',
                          fontSize: '1.25rem',
                          background: matchUser.soul_quadrant === 'explorer' ? 'linear-gradient(135deg, #f59e0b, #f97316)' :
                                      matchUser.soul_quadrant === 'builder' ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
                                      matchUser.soul_quadrant === 'artist' ? 'linear-gradient(135deg, #ec4899, #d946ef)' :
                                      'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        }}
                      >
                        {matchUser.nickname[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600 }}>{matchUser.nickname}</span>
                          {quadrantInfo && (
                            <span style={{ fontSize: '0.875rem' }}>{quadrantInfo.emoji}</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{matchUser.mbti || '未设置'}</span>
                          <span>·</span>
                          <span>{match.soulmate_index}% 契合</span>
                        </div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        borderRadius: '2rem',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        💕 匹配
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Match Notifications */}
        {activeTab === 'match' && (
          <div>
            {notifications.filter(n => n.type === 'like' || n.type === 'match').length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💕</div>
                <h3 style={{ marginBottom: '0.5rem' }}>暂无匹配通知</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  去发现页发送喜欢，开启你的灵魂之旅
                </p>
                <Link to="/discover" className="btn btn-primary">
                  开始发现
                </Link>
              </div>
            ) : (
              <div>
                {notifications
                  .filter(n => n.type === 'like' || n.type === 'match')
                  .map(notif => (
                    <div
                      key={notif.id}
                      style={{ display: 'flex', gap: '12px', padding: '14px 16px', background: notif.read ? 'var(--bg-card)' : 'var(--bg-hover)', borderRadius: '12px', marginBottom: '12px' }}
                      onClick={async () => {
                        if (!notif.read) {
                          await api.markNotificationRead(notif.id);
                          loadData();
                        }
                        if (notif.data) {
                          const data = JSON.parse(notif.data);
                          if (data.matchId) {
                            navigate(`/chat/${data.matchId}`);
                          }
                        }
                      }}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: notif.type === 'match' ? 'linear-gradient(135deg, #ec4899, #d946ef)' : 'linear-gradient(135deg, #ef4444, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                        {notif.type === 'match' ? '💕' : '❤️'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{notif.title}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>{notif.content}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(notif.created_at)}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* System Notifications */}
        {activeTab === 'system' && (
          <div>
            {notifications.filter(n => n.type === 'system').length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
                <h3 style={{ marginBottom: '0.5rem' }}>暂无系统通知</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  系统消息会在这里显示
                </p>
              </div>
            ) : (
              <div>
                {notifications
                  .filter(n => n.type === 'system')
                  .map(notif => (
                    <div
                      key={notif.id}
                      style={{ display: 'flex', gap: '12px', padding: '14px 16px', background: notif.read ? 'var(--bg-card)' : 'var(--bg-hover)', borderRadius: '12px', marginBottom: '12px' }}
                      onClick={async () => {
                        if (!notif.read) {
                          await api.markNotificationRead(notif.id);
                          loadData();
                        }
                      }}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #64748b, #475569)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                        📢
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{notif.title}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>{notif.content}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(notif.created_at)}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}