import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, SoulDescription } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Match, User } from '../types';
import { QUADRANT_INFO } from '../data/mbti';

const TIER_INFO = {
  legend: { name: '传奇', emoji: '🏆', color: '#fbbf24' },
  top: { name: '顶尖', emoji: '⭐', color: '#a855f7' },
  excellent: { name: '优秀', emoji: '✨', color: '#22c55e' },
  ordinary: { name: '普通', emoji: '👤', color: '#94a3b8' }
};

export function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchUsers, setMatchUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [soulDesc, setSoulDesc] = useState<SoulDescription | null>(null);

  useEffect(() => {
    loadMatches();
    if (user?.ai_description) {
      try {
        setSoulDesc(JSON.parse(user.ai_description));
      } catch {
        // ignore
      }
    }
  }, []);

  const loadMatches = async () => {
    try {
      const matchList = await api.getMatches();
      setMatches(matchList);

      const userMap: Record<string, User> = {};
      for (const match of matchList) {
        if (match.user_a_liked && match.user_b_liked) {
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
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const desc = await api.generateSoulDescription();
      setSoulDesc(desc);
      updateUser({ ai_description: JSON.stringify(desc) });
    } catch (err) {
      console.error('Failed to generate AI description:', err);
      alert('生成失败，请重试');
    } finally {
      setGeneratingAI(false);
    }
  };

  const matchedUsers = matches.filter(m => m.mutual_liked);
  const tierInfo = user?.user_tier ? TIER_INFO[user.user_tier] : TIER_INFO.ordinary;

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem', maxWidth: '900px' }}>
        {/* Header Section */}
        <div className="fade-in" style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            你好，{user?.nickname} {user?.soul_quadrant && QUADRANT_INFO[user.soul_quadrant]?.emoji}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {user?.soul_quadrant ? (
              <>
                你的灵魂象限是{' '}
                <strong style={{ color: 'var(--primary)' }}>
                  {QUADRANT_INFO[user.soul_quadrant]?.name}
                </strong>
              </>
            ) : (
              '完成灵魂测试以获得更精准的匹配'
            )}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="quadrant-grid fade-in stagger-1" style={{ marginBottom: '2rem' }}>
          <Link to="/discover" className="quadrant-cell explorer" style={{ textDecoration: 'none', color: 'white' }}>
            <span className="emoji">🔍</span>
            <span className="name">发现</span>
            <span className="desc">浏览匹配</span>
          </Link>
          <Link to="/messages" className="quadrant-cell builder" style={{ textDecoration: 'none', color: 'white' }}>
            <span className="emoji">💬</span>
            <span className="name">消息</span>
            <span className="desc">{matchedUsers.length} 个匹配</span>
          </Link>
          <Link to="/leaderboard" className="quadrant-cell artist" style={{ textDecoration: 'none', color: 'white' }}>
            <span className="emoji">🏆</span>
            <span className="name">排行</span>
            <span className="desc">{tierInfo.emoji} {tierInfo.name}</span>
          </Link>
          <Link to="/profile/me" className="quadrant-cell philosopher" style={{ textDecoration: 'none', color: 'white' }}>
            <span className="emoji">👤</span>
            <span className="name">我的</span>
            <span className="desc">个人资料</span>
          </Link>
        </div>

        {/* AI Description Card */}
        {soulDesc ? (
          <div className="ai-card fade-in stagger-2">
            <div className="ai-card-header">
              <span className="icon">✨</span>
              <h3>AI 灵魂解读</h3>
            </div>
            <div className="ai-card-content">
              {soulDesc.description}
            </div>
          </div>
        ) : (
          <button
            onClick={handleGenerateAI}
            className="btn btn-primary btn-full fade-in stagger-2"
            style={{ marginBottom: '2rem', padding: '1rem' }}
            disabled={generatingAI}
          >
            {generatingAI ? '🤖 AI 分析中...' : '🤖 生成 AI 灵魂解读'}
          </button>
        )}

        {/* Matches Section */}
        <div className="fade-in stagger-3">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            你的灵魂匹配
          </h2>

          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
            </div>
          ) : matchedUsers.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💫</div>
              <h3 style={{ marginBottom: '0.5rem' }}>还没有匹配</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                去发现页浏览并喜欢其他人，开始你的灵魂之旅
              </p>
              <Link to="/discover" className="btn btn-primary">
                开始发现
              </Link>
            </div>
          ) : (
            <div className="match-list">
              {matchedUsers.map(match => {
                const matchUser = matchUsers[match.id];
                if (!matchUser) return null;

                return (
                  <div
                    key={match.id}
                    className="match-item"
                    onClick={() => navigate(`/chat/${match.id}`)}
                  >
                    <div
                      className="user-avatar"
                      style={{
                        background: matchUser.soul_quadrant === 'explorer' ? 'linear-gradient(135deg, #f59e0b, #f97316)' :
                                    matchUser.soul_quadrant === 'builder' ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
                                    matchUser.soul_quadrant === 'artist' ? 'linear-gradient(135deg, #ec4899, #d946ef)' :
                                    'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      }}
                    >
                      {matchUser.nickname[0]}
                    </div>
                    <div className="match-item-info">
                      <div className="match-item-name">
                        {matchUser.nickname}
                        {matchUser.soul_quadrant && (
                          <span style={{ fontSize: '0.875rem' }}>
                            {QUADRANT_INFO[matchUser.soul_quadrant]?.emoji}
                          </span>
                        )}
                      </div>
                      <div className="match-item-meta">
                        {matchUser.mbti || '未设置'}
                      </div>
                    </div>
                    <div className="match-badge">
                      {match.soulmate_index}% 契合
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}