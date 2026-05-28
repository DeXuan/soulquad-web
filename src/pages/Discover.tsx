import { useState, useEffect, useCallback } from 'react';
import { api, City } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types';
import { MBTI_TYPES, QUADRANT_INFO, calculateSoulCompatibility } from '../data/mbti';

type LocationMode = 'world' | 'city';
type MatchMode = 'matchmaking' | 'friendship' | 'companion';

interface FilterParams {
  gender?: string;
  age_min?: number;
  age_max?: number;
  education?: string;
  mode?: string;
}

export function Discover() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [matched, setMatched] = useState(false);

  // New features
  const [locationMode, setLocationMode] = useState<LocationMode>('city');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<MatchMode>('matchmaking');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({});

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const data = await api.getCities();
      setCities(data);
    } catch {
      // ignore
    }
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        location_mode?: string;
        city_code?: string;
        gender?: string;
        age_min?: number;
        age_max?: number;
        education?: string;
        mode?: string;
      } = {
        location_mode: locationMode,
        mode: mode
      };

      if (locationMode === 'city' && selectedCity) {
        params.city_code = selectedCity.code;
      }

      if (filters.gender && filters.gender !== 'all') {
        params.gender = filters.gender;
      }
      if (filters.age_min) params.age_min = filters.age_min;
      if (filters.age_max) params.age_max = filters.age_max;
      if (filters.education) params.education = filters.education;

      const data = await api.getPotentialMatches(params);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [locationMode, selectedCity, mode, filters]);

  useEffect(() => {
    setCurrentIndex(0);
    loadUsers();
  }, [locationMode, selectedCity, mode, filters]);

  const handleLike = useCallback(async () => {
    if (currentIndex >= users.length || actionLoading) return;

    setActionLoading(true);
    try {
      const result = await api.likeUser(users[currentIndex].id);
      setMatched(result.matched);
      setTimeout(() => {
        setMatched(false);
        setCurrentIndex(prev => prev + 1);
      }, 1500);
    } catch (err) {
      console.error('Failed to like:', err);
    } finally {
      setActionLoading(false);
    }
  }, [currentIndex, users, actionLoading]);

  const handlePass = useCallback(async () => {
    if (currentIndex >= users.length || actionLoading) return;

    setActionLoading(true);
    try {
      await api.passUser(users[currentIndex].id);
      setCurrentIndex(prev => prev + 1);
    } catch (err) {
      console.error('Failed to pass:', err);
    } finally {
      setActionLoading(false);
    }
  }, [currentIndex, users, actionLoading]);

  const filteredCities = cities.filter(c =>
    c.name.includes(searchQuery) || c.province.includes(searchQuery)
  );

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setShowCityPicker(false);
    setSearchQuery('');
    setLocationMode('city');
  };

  const handleModeChange = (newMode: MatchMode) => {
    setMode(newMode);
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

  if (currentIndex >= users.length) {
    return (
      <div className="page">
        <div style={{ padding: '4rem 12px 0', maxWidth: '430px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ marginBottom: '0.5rem' }}>暂时没有更多了</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            稍后再来看看，也许明天会有新的灵魂伴侣出现
          </p>
          <button className="btn btn-secondary" onClick={() => setCurrentIndex(0)}>
            重新浏览
          </button>
        </div>
      </div>
    );
  }

  const currentUser = users[currentIndex];
  const mbtiInfo = currentUser.mbti ? MBTI_TYPES[currentUser.mbti] : null;
  const quadrantInfo = currentUser.soul_quadrant ? QUADRANT_INFO[currentUser.soul_quadrant] : null;

  return (
    <div className="page">
      <div style={{ padding: '16px 12px', maxWidth: '430px', margin: '0 auto' }}>
        {/* Location & Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <button
            className={`location-selector ${locationMode === 'world' ? 'active' : ''}`}
            onClick={() => setLocationMode('world')}
          >
            🌍 世界
          </button>
          <button
            className={`location-selector ${locationMode === 'city' ? 'active' : ''}`}
            onClick={() => {
              setLocationMode('city');
              setShowCityPicker(true);
            }}
          >
            📍 {selectedCity ? selectedCity.name : '城市'}
          </button>

          <div style={{ flex: 1 }} />

          <button
            className="btn btn-ghost"
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            onClick={() => setShowFilter(true)}
          >
            ⚡ 筛选
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mode-selector" style={{ marginBottom: '12px' }}>
          <button
            className={`mode-btn ${mode === 'matchmaking' ? 'active' : ''}`}
            onClick={() => handleModeChange('matchmaking')}
          >
            💍 相亲
          </button>
          <button
            className={`mode-btn ${mode === 'friendship' ? 'active' : ''}`}
            onClick={() => handleModeChange('friendship')}
          >
            🤝 交友
          </button>
          <button
            className={`mode-btn ${mode === 'companion' ? 'active' : ''}`}
            onClick={() => handleModeChange('companion')}
          >
            🎮 搭子
          </button>
        </div>

        <div style={{ marginBottom: '12px', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {currentIndex + 1} / {users.length}
          </span>
        </div>

        <div className="soul-card" style={{ maxWidth: '430px', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{
            position: 'relative',
            height: '75vh',
            minHeight: '500px',
            maxHeight: '700px',
            background: currentUser.soul_quadrant === 'explorer' ? 'linear-gradient(135deg, #f59e0b, #f97316)' :
                        currentUser.soul_quadrant === 'builder' ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
                        currentUser.soul_quadrant === 'artist' ? 'linear-gradient(135deg, #ec4899, #d946ef)' :
                        'linear-gradient(135deg, #6366f1, #8b5cf6)'
          }}>
            <img
              src={currentUser.avatar_url}
              alt={currentUser.nickname}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>

          <div className="soul-card-body" style={{ padding: '24px 16px 16px' }}>
            <h3 className="soul-card-name">{currentUser.nickname}</h3>
            <p className="soul-card-info">
              {currentUser.age}岁 · {currentUser.gender === 'male' ? '男' : currentUser.gender === 'female' ? '女' : '其他'}
              {currentUser.height && ` · ${currentUser.height}cm`}
            </p>

            {(currentUser.education || currentUser.city) && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {currentUser.education && `🏛️ ${currentUser.education}`}
                {currentUser.has_house && ' 🏠 有房'}
                {currentUser.has_car && ' 🚗 有车'}
              </p>
            )}

            {currentUser.mbti && (
              <div className="soul-card-mbti">
                <span>🧭</span>
                <span>{currentUser.mbti}</span>
                {mbtiInfo && <span>- {mbtiInfo.name}</span>}
              </div>
            )}

            {quadrantInfo && (
              <div className="soul-card-quadrant">
                <span>{quadrantInfo.emoji}</span>
                <span>{quadrantInfo.name}</span>
              </div>
            )}

            {currentUser.bio && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {currentUser.bio}
              </p>
            )}

            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'var(--bg-dark)',
              borderRadius: '0.75rem',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                💡 第1层解锁信息（双方互赞后可见完整资料）
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                灵魂契合度预估：{user?.mbti && currentUser.mbti ?
                  calculateSoulCompatibility(user.mbti, currentUser.mbti) : 60}%
              </p>
            </div>
          </div>

          {matched && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(34, 197, 94, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              borderRadius: '1.5rem',
              zIndex: 10
            }}>
              <div style={{ fontSize: '4rem' }}>💕</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>匹配成功！</div>
              <p style={{ opacity: 0.9 }}>你们互相喜欢</p>
            </div>
          )}

          <div className="soul-card-actions">
            <button
              className="btn-pass"
              onClick={handlePass}
              disabled={actionLoading}
              title="跳过"
            >
              ✕
            </button>
            <button
              className="btn-like"
              onClick={handleLike}
              disabled={actionLoading}
              title="喜欢"
            >
              ♥
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            同时喜欢对方时，系统会通知你们并解锁更多信息
          </p>
        </div>
      </div>

      {/* City Picker Modal */}
      {showCityPicker && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
              <button onClick={() => setShowCityPicker(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem' }}>✕</button>
            </div>
            <input
              type="text"
              placeholder="搜索城市..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
                  onClick={() => handleCitySelect(city)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: selectedCity?.code === city.code ? 'var(--primary)' : 'var(--bg-glass)',
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

      {/* Filter Panel */}
      {showFilter && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1200
          }}
          onClick={() => setShowFilter(false)}
        >
          <div className="filter-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>筛选条件</h3>
              <button onClick={() => setShowFilter(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div className="filter-section">
              <h4>性别</h4>
              <div className="filter-options">
                {[
                  { value: 'all', label: '不限' },
                  { value: 'male', label: '男' },
                  { value: 'female', label: '女' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`filter-chip ${(filters.gender || 'all') === opt.value ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, gender: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>年龄范围</h4>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="最小"
                  value={filters.age_min || ''}
                  onChange={e => setFilters({ ...filters, age_min: parseInt(e.target.value) || undefined })}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>至</span>
                <input
                  type="number"
                  placeholder="最大"
                  value={filters.age_max || ''}
                  onChange={e => setFilters({ ...filters, age_max: parseInt(e.target.value) || undefined })}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div className="filter-section">
              <h4>学历要求</h4>
              <div className="filter-options">
                {['不限', '本科', '硕士', '博士', '其他'].map(opt => (
                  <button
                    key={opt}
                    className={`filter-chip ${filters.education === opt || (opt === '不限' && !filters.education) ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, education: opt === '不限' ? undefined : opt })}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setFilters({})}
                style={{ flex: 1 }}
              >
                重置
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  loadUsers();
                  setShowFilter(false);
                }}
                style={{ flex: 1 }}
              >
                应用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}