import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, City, SoulDescription } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types';
import { MBTI_TYPES, QUADRANT_INFO } from '../data/mbti';
import { AvatarUpload } from '../components/AvatarUpload';

const TIER_INFO = {
  legend: { name: '传奇', emoji: '🏆', color: '#fbbf24' },
  top: { name: '顶尖', emoji: '⭐', color: '#a855f7' },
  excellent: { name: '优秀', emoji: '✨', color: '#22c55e' },
  ordinary: { name: '普通', emoji: '👤', color: '#94a3b8' }
};

export function Profile() {
  const params = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser, logout } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');

  // AI Description state
  const [generatingAI, setGeneratingAI] = useState(false);
  const [soulDesc, setSoulDesc] = useState<SoulDescription | null>(null);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [cities, setCities] = useState<City[]>([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const isOwn = !params.id || params.id === 'me' || params.id === currentUser?.id;
  const isViewingMe = params.id === 'me' || !params.id;

  useEffect(() => {
    if (isViewingMe && currentUser) {
      setProfileUser(currentUser);
      if (currentUser.ai_description) {
        try {
          setSoulDesc(JSON.parse(currentUser.ai_description));
        } catch {
          // ignore
        }
      }
      setLoading(false);
    } else if (params.id) {
      loadUser(params.id);
    }
  }, [params.id, currentUser, isViewingMe]);

  useEffect(() => {
    if (editing) {
      loadCities();
    }
  }, [editing]);

  const loadCities = async () => {
    try {
      const data = await api.getCities();
      setCities(data);
    } catch {
      // ignore
    }
  };

  const filteredCities = cities.filter(c =>
    c.name.includes(citySearch) || c.province.includes(citySearch)
  );

  const loadUser = async (id: string) => {
    try {
      const user = await api.getUser(id);
      setProfileUser(user);
    } catch {
      navigate('/discover');
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

  const handleSaveProfile = async () => {
    if (!editData.nickname) {
      alert('昵称不能为空');
      return;
    }
    try {
      const result = await api.updateProfile(editData);
      setProfileUser(result);
      updateUser(result);
      setEditing(false);
      alert(result.message || '保存成功');
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('保存失败');
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      api.logout();
      logout();
      navigate('/login');
    }
  };

  const handleAvatarUpload = (data: string) => {
    if (profileUser) {
      const updated = { ...profileUser, avatar_data: data };
      setProfileUser(updated);
      updateUser({ avatar_data: data });
      if (editing) {
        setEditData(prev => ({ ...prev, avatar_data: data }));
      }
    }
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

  if (!profileUser) {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
          <p style={{ color: 'var(--text-secondary)' }}>用户不存在</p>
        </div>
      </div>
    );
  }

  const mbtiInfo = profileUser.mbti ? MBTI_TYPES[profileUser.mbti] : null;
  const quadrantInfo = profileUser.soul_quadrant ? QUADRANT_INFO[profileUser.soul_quadrant] : null;
  const tierInfo = TIER_INFO[profileUser.user_tier as keyof typeof TIER_INFO] || TIER_INFO.ordinary;
  const avatarToShow = profileUser.avatar_data || (profileUser.avatar_url?.startsWith('data:') ? profileUser.avatar_url : null);

  return (
    <div className="page">
      <div style={{ padding: '16px 12px' }}>
        {/* Profile Header */}
        <div className="profile-header" style={{ textAlign: 'center' }}>
          {isOwn ? (
            <div style={{ marginBottom: '1rem' }}>
              <AvatarUpload
                currentAvatar={avatarToShow || undefined}
                onUpload={handleAvatarUpload}
              />
            </div>
          ) : (
            <div style={{
              width: '96px',
              height: '96px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              backgroundImage: avatarToShow ? `url(${avatarToShow})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: avatarToShow ? undefined : 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 600
            }}>
              {!avatarToShow && profileUser.nickname[0]}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {isOwn ? (
              editing ? (
                <input
                  type="text"
                  value={editData.nickname || profileUser.nickname}
                  onChange={e => setEditData({ ...editData, nickname: e.target.value })}
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    color: 'var(--text-primary)',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}
                />
              ) : (
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{profileUser.nickname}</h1>
              )
            ) : (
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{profileUser.nickname}</h1>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1rem' }}>{tierInfo.emoji}</span>
            <span style={{ color: tierInfo.color }}>{tierInfo.name}</span>
            {profileUser.mbti && <span>·</span>}
            {profileUser.mbti && <span>🧭 {profileUser.mbti}</span>}
            {quadrantInfo && <span>·</span>}
            {quadrantInfo && <span>{quadrantInfo.emoji}</span>}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {profileUser.age}岁 · {profileUser.gender === 'male' ? '男' : profileUser.gender === 'female' ? '女' : '其他'}
            {profileUser.city && ` · ${profileUser.city}`}
          </p>
        </div>

        {/* Edit/Save Button for Own Profile */}
        {isOwn && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {editing ? (
              <>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveProfile}>
                  保存
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>
                  取消
                </button>
              </>
            ) : (
              <button className="btn btn-secondary btn-full" onClick={() => {
                const gender = profileUser.gender;
                const defaultHeight = gender === 'male' ? 175 : gender === 'female' ? 160 : 170;
                setEditData({
                  nickname: profileUser.nickname,
                  age: profileUser.age,
                  gender: profileUser.gender,
                  bio: profileUser.bio,
                  city: profileUser.city,
                  height: profileUser.height || defaultHeight,
                  education: profileUser.education
                });
                setEditing(true);
              }}>
                ✏️ 编辑资料
              </button>
            )}
          </div>
        )}

        {/* AI Soul Description */}
        {isOwn && (
          soulDesc ? (
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
              style={{ marginBottom: '1.5rem', padding: '1rem' }}
              disabled={generatingAI}
            >
              {generatingAI ? '🤖 AI 分析中...' : '🤖 生成 AI 灵魂解读'}
            </button>
          )
        )}

        {/* Profile Info (when editing) */}
        {isOwn && editing && (
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>基本信息</h3>

            <div className="form-group">
              <label>年龄</label>
              <input
                type="number"
                value={editData.age || profileUser.age}
                onChange={e => setEditData({ ...editData, age: parseInt(e.target.value) })}
                min={18}
                max={100}
              />
            </div>

            <div className="form-group">
              <label>性别</label>
              <select
                value={editData.gender || profileUser.gender}
                onChange={e => setEditData({ ...editData, gender: e.target.value as any })}
              >
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div className="form-group">
              <label>城市</label>
              <div
                onClick={() => setShowCityPicker(true)}
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.625rem 0.875rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: editData.city || profileUser.city ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {editData.city || profileUser.city || '选择城市'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>▼</span>
              </div>
            </div>

            <div className="form-group">
              <label>身高 (cm)</label>
              <input
                type="number"
                value={editData.height || profileUser.height || ''}
                onChange={e => setEditData({ ...editData, height: parseInt(e.target.value) })}
                placeholder="如：170"
              />
            </div>

            <div className="form-group">
              <label>学历</label>
              <select
                value={editData.education || profileUser.education || ''}
                onChange={e => setEditData({ ...editData, education: e.target.value })}
              >
                <option value="">请选择</option>
                <option value="高中">高中</option>
                <option value="本科">本科</option>
                <option value="硕士">硕士</option>
                <option value="博士">博士</option>
              </select>
            </div>

            <div className="form-group">
              <label>职业</label>
              <input
                type="text"
                value={editData.occupation || profileUser.occupation || ''}
                onChange={e => setEditData({ ...editData, occupation: e.target.value })}
                placeholder="如：产品经理"
              />
            </div>

            <div className="form-group">
              <label>年收入 (万)</label>
              <input
                type="number"
                value={editData.annual_income || profileUser.annual_income || ''}
                onChange={e => setEditData({ ...editData, annual_income: parseInt(e.target.value) })}
                placeholder="如：20"
              />
            </div>

            <div className="form-group">
              <label>个人简介</label>
              <textarea
                value={editData.bio || profileUser.bio || ''}
                onChange={e => setEditData({ ...editData, bio: e.target.value })}
                placeholder="介绍一下自己..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {/* Profile Info (when not editing) */}
        {!editing && (
          <>
            {profileUser.bio && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>个人简介</h3>
                <p style={{ color: 'var(--text-primary)' }}>{profileUser.bio}</p>
              </div>
            )}

            {mbtiInfo && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🧭</span>
                  <span style={{ fontWeight: 600 }}>{profileUser.mbti}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{mbtiInfo.name}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{mbtiInfo.description}</p>
              </div>
            )}
          </>
        )}

        {/* Action Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '14px 8px', background: 'var(--bg-card)', borderRadius: '12px', cursor: 'pointer' }} onClick={() => navigate('/soul-test')}>
            <span style={{ fontSize: '1.5rem' }}>🧪</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>灵魂测试</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '14px 8px', background: 'var(--bg-card)', borderRadius: '12px', cursor: 'pointer' }} onClick={() => navigate('/messages')}>
            <span style={{ fontSize: '1.5rem' }}>💬</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>我的匹配</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '14px 8px', background: 'var(--bg-card)', borderRadius: '12px', cursor: 'pointer' }} onClick={() => setActiveSection(activeSection === 'likes' ? '' : 'likes')}>
            <span style={{ fontSize: '1.5rem' }}>❤️</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>我的喜欢</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '14px 8px', background: 'var(--bg-card)', borderRadius: '12px', cursor: 'pointer' }} onClick={() => navigate('/settings')}>
            <span style={{ fontSize: '1.5rem' }}>⚙️</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>设置</span>
          </div>
        </div>

        {/* Likes Section */}
        {activeSection === 'likes' && (
          <LikesSection />
        )}

        {/* Blocklist Section */}
        {activeSection === 'blocklist' && (
          <BlocklistSection />
        )}

        {/* Help Section */}
        {activeSection === 'help' && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>帮助与反馈</h3>
            <div className="settings-list">
              <div
                className="settings-item"
                onClick={() => setActiveSection('faq')}
                style={{ cursor: 'pointer' }}
              >
                <div className="settings-item-left">
                  <span className="icon">📖</span>
                  <span className="text">常见问题</span>
                </div>
                <span className="arrow">›</span>
              </div>
              <div className="settings-item">
                <div className="settings-item-left">
                  <span className="icon">💬</span>
                  <span className="text">联系客服</span>
                </div>
                <span className="arrow">›</span>
              </div>
              <div className="settings-item">
                <div className="settings-item-left">
                  <span className="icon">📜</span>
                  <span className="text">用户协议</span>
                </div>
                <span className="arrow">›</span>
              </div>
              <div className="settings-item">
                <div className="settings-item-left">
                  <span className="icon">🔒</span>
                  <span className="text">隐私政策</span>
                </div>
                <span className="arrow">›</span>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        {activeSection === 'faq' && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                onClick={() => setActiveSection('help')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer'
                }}
              >
                ←
              </button>
              <h3>常见问题</h3>
            </div>
            <FAQList />
          </div>
        )}

        {/* City Picker Modal */}
        {showCityPicker && (
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1200,
              display: 'flex',
              alignItems: 'flex-end'
            }}
            onClick={() => setShowCityPicker(false)}
          >
            <div
              style={{
                width: '100%',
                maxHeight: '70vh',
                background: 'var(--bg-secondary)',
                borderRadius: '16px 16px 0 0',
                padding: '1.5rem',
                overflow: 'auto'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>选择城市</h3>
                <button onClick={() => setShowCityPicker(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
              </div>
              <input
                type="text"
                placeholder="搜索城市..."
                value={citySearch}
                onChange={e => setCitySearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  marginBottom: '1rem'
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {filteredCities.slice(0, 50).map(city => (
                  <button
                    key={city.code}
                    onClick={() => {
                      setEditData({ ...editData, city: city.name });
                      setShowCityPicker(false);
                      setCitySearch('');
                    }}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: (editData.city || profileUser.city) === city.name ? 'var(--primary)' : 'var(--bg-glass)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer'
                    }}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Version & Logout */}
        <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            SoulQuad v1.0.0
          </p>
          {isOwn && (
            <button
              onClick={handleLogout}
              className="btn btn-ghost"
              style={{ color: '#ef4444', fontSize: '0.875rem' }}
            >
              退出登录
            </button>
          )}
        </div>

        {/* Send Message Button (for other users) */}
        {!isOwn && (
          <button
            className="btn btn-primary btn-large btn-full"
            style={{ marginTop: '1.5rem' }}
            onClick={async () => {
              try {
                const result = await api.likeUser(profileUser.id);
                if (result.matched) {
                  alert('匹配成功！');
                  navigate('/messages');
                } else {
                  alert('已发送喜欢');
                  navigate('/discover');
                }
              } catch {
                alert('操作失败');
              }
            }}
          >
            ♥ 发送喜欢
          </button>
        )}
      </div>
    </div>
  );
}

// Likes Section Component
function LikesSection() {
  const navigate = useNavigate();
  const [likes, setLikes] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLikes();
  }, []);

  const loadLikes = async () => {
    try {
      const data = await api.getLikes();
      setLikes(data);
    } catch (err) {
      console.error('Failed to load likes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLike = async (userId: string) => {
    if (!confirm('确定取消喜欢？')) return;
    try {
      await api.cancelLike(userId);
      setLikes(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to cancel like:', err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>加载中...</div>;
  }

  if (likes.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💔</div>
        <p style={{ color: 'var(--text-secondary)' }}>还没有喜欢过任何人</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>我喜欢的人</h3>
      {likes.map(user => (
        <div key={user.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', padding: '1rem', cursor: 'pointer' }} onClick={() => navigate(`/profile/${user.id}`)}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: user.avatar_data ? `url(${user.avatar_data}) center/cover no-repeat` : 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>
            {!user.avatar_data && user.nickname[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{user.nickname}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {user.mbti || '未设置'} · {user.age}岁
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ color: '#ef4444', fontSize: '0.8125rem' }}
            onClick={() => handleCancelLike(user.id)}
          >
            取消
          </button>
        </div>
      ))}
    </div>
  );
}

// Blocklist Section Component
function BlocklistSection() {
  const [blocklist, setBlocklist] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlocklist();
  }, []);

  const loadBlocklist = async () => {
    try {
      const data = await api.getBlockList();
      setBlocklist(data);
    } catch (err) {
      console.error('Failed to load blocklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    if (!confirm('确定解除拉黑？')) return;
    try {
      await api.unblockUser(userId);
      setBlocklist(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to unblock:', err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>加载中...</div>;
  }

  if (blocklist.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
        <p style={{ color: 'var(--text-secondary)' }}>没有拉黑任何人</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>黑名单</h3>
      {blocklist.map(user => (
        <div key={user.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', padding: '1rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'var(--bg-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>
            {user.nickname[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{user.nickname}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {user.mbti || '未设置'}
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem' }}
            onClick={() => handleUnblock(user.id)}
          >
            解除
          </button>
        </div>
      ))}
    </div>
  );
}

// FAQ List Component
function FAQList() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const faqs = [
    {
      id: 'mbti',
      question: '什么是 MBTI 测试？',
      answer: 'MBTI（迈尔斯-布里格斯类型指标）是一种性格测试，帮助你了解自己的性格类型。它通过四个维度来分析你的性格倾向：外向/内向、感觉/直觉、思考/情感、判断/知觉。'
    },
    {
      id: 'quadrant',
      question: '灵魂象限是什么？',
      answer: '灵魂象限是根据你的 MBTI 类型将你归类到四个不同的群体：探险家、建造者、艺术家、思想家。每个象限都有其独特的特质和匹配的偏好。'
    },
    {
      id: 'match',
      question: '匹配是如何工作的？',
      answer: '当你喜欢某个用户时，如果对方也喜欢你，你们就会匹配成功这时你们可以开始聊天。灵魂契合度是基于你们的 MBTI 类型和灵魂象限计算的。'
    },
    {
      id: 'ai',
      question: 'AI 灵魂解读是什么？',
      answer: 'AI 灵魂解读是基于你的 MBTI 类型、价值观和兴趣爱好，由 AI 为你生成的个性化灵魂描述。它可以帮助你更好地了解自己。'
    },
    {
      id: 'tier',
      question: '用户等级有什么区别？',
      answer: '用户等级分为普通、优秀、顶尖、传奇四个等级。通过获得喜欢和匹配来提升等级。等级越高的用户在排行榜上越靠前，也更有可能被推荐给其他用户。'
    }
  ];

  return (
    <div>
      {faqs.map(faq => (
        <div
          key={faq.id}
          style={{
            borderBottom: '1px solid var(--border)',
            padding: '0.75rem 0'
          }}
        >
          <div
            onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontWeight: 500 }}>{faq.question}</span>
            <span style={{
              fontSize: '1.25rem',
              transform: expanded === faq.id ? 'rotate(45deg)' : 'none',
              transition: 'transform 0.2s'
            }}>+</span>
          </div>
          {expanded === faq.id && (
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              marginTop: '0.5rem',
              lineHeight: 1.6
            }}>
              {faq.answer}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}