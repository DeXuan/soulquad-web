import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, LeaderboardUser } from '../services/api';
import { QUADRANT_INFO } from '../data/mbti';

const TIER_INFO = {
  legend: { name: '传奇', emoji: '🏆', color: '#fbbf24' },
  top: { name: '顶尖', emoji: '⭐', color: '#a855f7' },
  excellent: { name: '优秀', emoji: '✨', color: '#22c55e' },
  ordinary: { name: '普通', emoji: '👤', color: '#94a3b8' }
};

type LeaderboardType = 'hot' | 'new' | 'city';
type ProfileTab = 'profile' | 'soul' | 'stats';

export function Leaderboard() {
  const navigate = useNavigate();
  const [type, setType] = useState<LeaderboardType>('hot');
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>('profile');

  useEffect(() => {
    loadLeaderboard();
  }, [type]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaderboard(type);
      setLeaders(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#1a1a2e' };
    if (index === 1) return { background: 'linear-gradient(135deg, #94a3b8, #64748b)', color: '#1a1a2e' };
    if (index === 2) return { background: 'linear-gradient(135deg, #cd7f32, #a0522d)', color: 'white' };
    return { background: 'var(--bg-dark)', color: 'var(--text-secondary)' };
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>🏆 排行榜</span>
        </div>

        {/* Leaderboard Type Tabs */}
        <div className="leaderboard-tabs">
          <button
            className={`leaderboard-tab ${type === 'hot' ? 'active' : ''}`}
            onClick={() => setType('hot')}
          >
            🔥 热门榜
          </button>
          <button
            className={`leaderboard-tab ${type === 'new' ? 'active' : ''}`}
            onClick={() => setType('new')}
          >
            ⭐ 新人大榜
          </button>
          <button
            className={`leaderboard-tab ${type === 'city' ? 'active' : ''}`}
            onClick={() => setType('city')}
          >
            📍 同城榜
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            加载中...
          </div>
        ) : leaders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏅</div>
            <h3 style={{ marginBottom: '0.5rem' }}>暂无数据</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {type === 'hot' && '成为第一个上榜的用户吧！'}
              {type === 'new' && '新用户注册即可上榜'}
              {type === 'city' && '开启定位即可查看同城榜'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leaders.map((user, index) => {
              const tierInfo = TIER_INFO[user.user_tier as keyof typeof TIER_INFO] || TIER_INFO.ordinary;
              const quadrant = QUADRANT_INFO[user.soul_quadrant as keyof typeof QUADRANT_INFO];
              const rankEmoji = getRankEmoji(index);

              return (
                <div
                  key={user.id}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedUser(user)}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    ...getRankStyle(index)
                  }}>
                    {rankEmoji || (index + 1)}
                  </div>

                  <div
                    className="user-avatar"
                    style={{
                      width: '50px',
                      height: '50px',
                      fontSize: '1.25rem',
                      background: user.avatar_data ? `url(${user.avatar_data}) center/cover` : user.avatar_url ? `url(${user.avatar_url}) center/cover` : tierInfo.color,
                      overflow: 'hidden'
                    }}
                  >
                    {!user.avatar_data && !user.avatar_url && user.nickname[0]}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{user.nickname}</span>
                      <span style={{ fontSize: '1rem' }}>{tierInfo.emoji}</span>
                      {quadrant && <span style={{ fontSize: '0.875rem' }}>{quadrant.emoji}</span>}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {user.mbti || '未设置'}
                      {user.like_count !== undefined && ` · 被 ${user.like_count} 人喜欢`}
                      {user.match_count !== undefined && ` · ${user.match_count} 次匹配`}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: index < 3 ? '#fbbf24' : tierInfo.color
                    }}>
                      {user.soul_score}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      灵魂分数
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'flex-end'
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              width: '100%',
              maxHeight: '85vh',
              background: 'var(--bg-secondary)',
              borderRadius: '16px 16px 0 0',
              padding: '1.5rem',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{selectedUser.nickname} 的主页</h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <button
                onClick={() => setProfileTab('profile')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: profileTab === 'profile' ? 'var(--primary)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                👤 基本资料
              </button>
              <button
                onClick={() => setProfileTab('soul')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: profileTab === 'soul' ? 'var(--primary)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                ✨ 灵魂信息
              </button>
              <button
                onClick={() => setProfileTab('stats')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: profileTab === 'stats' ? 'var(--primary)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                📊 数据统计
              </button>
            </div>

            {/* Tab Content */}
            {profileTab === 'profile' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      margin: '0 auto 1rem',
                      background: selectedUser.avatar_data ? `url(${selectedUser.avatar_data}) center/cover` : selectedUser.avatar_url ? `url(${selectedUser.avatar_url}) center/cover` : 'var(--gradient-primary)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 600,
                      overflow: 'hidden'
                    }}
                  >
                    {!selectedUser.avatar_data && !selectedUser.avatar_url && selectedUser.nickname[0]}
                  </div>
                  <h2 style={{ marginBottom: '0.25rem' }}>{selectedUser.nickname}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {TIER_INFO[selectedUser.user_tier as keyof typeof TIER_INFO]?.emoji} {TIER_INFO[selectedUser.user_tier as keyof typeof TIER_INFO]?.name}
                  </p>
                </div>
                <div className="card">
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>MBTI 类型</p>
                  <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{selectedUser.mbti || '未设置'}</p>
                </div>
              </div>
            )}

            {profileTab === 'soul' && (
              <div>
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>灵魂象限</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{QUADRANT_INFO[selectedUser.soul_quadrant as keyof typeof QUADRANT_INFO]?.emoji}</span>
                    <span style={{ fontWeight: 600 }}>{QUADRANT_INFO[selectedUser.soul_quadrant as keyof typeof QUADRANT_INFO]?.name}</span>
                  </div>
                </div>
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>灵魂分数</p>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fbbf24' }}>{selectedUser.soul_score}</div>
                </div>
              </div>
            )}

            {profileTab === 'stats' && (
              <div>
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>被喜欢次数</p>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedUser.like_count || 0}</div>
                </div>
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>匹配次数</p>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedUser.match_count || 0}</div>
                </div>
              </div>
            )}

            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                setSelectedUser(null);
                navigate(`/profile/${selectedUser.id}`);
              }}
            >
              查看完整主页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}