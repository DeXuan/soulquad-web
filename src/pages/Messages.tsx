import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Match, User, Notification } from '../types';
import { QUADRANT_INFO } from '../data/mbti';

type MessageTab = 'match' | 'chat' | 'social' | 'system';

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

  // Start chat with a user (find or create match)
  const handleStartChat = async (targetUserId: string) => {
    if (!targetUserId) {
      alert('无法确定用户信息');
      return;
    }
    try {
      // Try to find existing match
      const matchList = await api.getMatches();
      const existingMatch = matchList.find(m =>
        (m.oder_a_id === user?.id && m.oder_b_id === targetUserId) ||
        (m.oder_a_id === targetUserId && m.oder_b_id === user?.id)
      );

      if (existingMatch) {
        if (existingMatch.mutual_liked) {
          navigate(`/chat/${existingMatch.id}`);
        } else {
          // Try to like back to create mutual match
          try {
            const result = await api.likeUser(targetUserId);
            if (result.matched) {
              const allMatches = await api.getMatches();
              const newMatch = allMatches.find(m =>
                (m.oder_a_id === user?.id && m.oder_b_id === targetUserId) ||
                (m.oder_a_id === targetUserId && m.oder_b_id === user?.id)
              );
              if (newMatch) {
                navigate(`/chat/${newMatch.id}`);
              }
            } else {
              alert('你们还不是匹配状态，已发送喜欢等待对方回应');
            }
          } catch {
            alert('你们还不是匹配状态，无法私聊');
          }
        }
      } else {
        // Send like to create connection
        const result = await api.likeUser(targetUserId);
        if (result.matched) {
          const allMatches = await api.getMatches();
          const newMatch = allMatches.find(m =>
            (m.oder_a_id === user?.id && m.oder_b_id === targetUserId) ||
            (m.oder_a_id === targetUserId && m.oder_b_id === user?.id)
          );
          if (newMatch) {
            navigate(`/chat/${newMatch.id}`);
          }
        } else {
          alert('已发送喜欢，等待对方回应后即可私聊');
        }
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
      alert('操作失败，请重试');
    }
  };

  // Get liker/commenter user ID from moment likes/comments if not in notification data
  const getInteractingUserId = async (notifData: any): Promise<string | null> => {
    // If userId is directly in data, use it
    if (notifData.userId) return notifData.userId;
    if (notifData.targetUserId) return notifData.targetUserId;

    // Try to get from moment likes - find who liked this moment most recently (excluding current user)
    if (notifData.momentId) {
      try {
        const comments = await api.getMomentComments(notifData.momentId);
        if (comments && comments.length > 0) {
          // Get the most recent comment's user
          const latestComment = comments[comments.length - 1];
          return latestComment.user_id;
        }
      } catch {
        // ignore
      }
    }
    return null;
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
          <button
            className={`message-tab ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            💬 社交
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
                        const notifData = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
                        if (notifData.matchId) {
                          navigate(`/chat/${notifData.matchId}`);
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

        {/* Social Notifications (Likes & Comments on Moments) */}
        {activeTab === 'social' && (
          <div>
            {notifications.filter(n => n.type === 'moment_like' || n.type === 'moment_comment' || n.type === 'like' || n.type === 'comment').length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <h3 style={{ marginBottom: '0.5rem' }}>暂无社交互动</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  发布动态后，有人点赞或评论会在这里显示
                </p>
              </div>
            ) : (
              <div>
                {notifications
                  .filter(n => n.type === 'moment_like' || n.type === 'moment_comment' || n.type === 'like' || n.type === 'comment')
                  .map(notif => {
                    const notifData = notif.data && typeof notif.data === 'object' ? notif.data : {};
                    return (
                      <div
                        key={notif.id}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '14px 16px',
                          background: notif.read ? 'var(--bg-card)' : 'var(--bg-hover)',
                          borderRadius: '12px',
                          marginBottom: '12px',
                          flexDirection: 'column'
                        }}
                        onClick={async () => {
                          if (!notif.read) {
                            await api.markNotificationRead(notif.id);
                            loadData();
                          }
                        }}
                      >
                        {/* Header row */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: notif.type.includes('comment') ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #f97316)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0
                          }}>
                            {notif.type.includes('comment') ? '💬' : '❤️'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, marginBottom: '2px' }}>{notif.title}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>{notif.content}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(notif.created_at)}</div>
                          </div>
                        </div>

                        {/* Content preview and actions */}
                        {notifData.momentId && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            background: 'var(--bg-dark)',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)'
                          }}>
                            动态内容: {notif.content.split(':').pop()?.trim() || '查看详情'}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to moment detail
                              if (notifData.momentId) {
                                navigate(`/moments?moment=${notifData.momentId}`);
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg-dark)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              fontSize: '0.8125rem',
                              cursor: 'pointer'
                            }}
                          >
                            📖 查看动态
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Get the user who interacted via getInteractingUserId
                              const strangerUserId = await getInteractingUserId(notifData);
                              if (strangerUserId) {
                                handleStartChat(strangerUserId);
                              } else {
                                alert('无法确定互动用户');
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem 0.75rem',
                              background: 'var(--primary)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white',
                              fontSize: '0.8125rem',
                              cursor: 'pointer'
                            }}
                          >
                            💬 私聊
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}