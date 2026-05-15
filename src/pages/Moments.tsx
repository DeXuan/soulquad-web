import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Moment } from '../types';
import { QUADRANT_INFO } from '../data/mbti';

export function Moments() {
  const navigate = useNavigate();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [commentingMoment, setCommentingMoment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [currentUser] = useState(() => {
    const userJson = localStorage.getItem('soulquad_user');
    return userJson ? JSON.parse(userJson) : null;
  });

  useEffect(() => {
    loadMoments();
  }, []);

  const loadMoments = async (isLoadMore = false) => {
    try {
      const p = isLoadMore ? page : 1;
      const data = await api.getMoments(p, 20);
      if (isLoadMore) {
        setMoments(prev => [...prev, ...data.moments]);
      } else {
        setMoments(data.moments);
      }
      setHasMore(data.hasMore);
      if (!isLoadMore) setPage(1);
    } catch (err) {
      console.error('Failed to load moments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadMoments(true);
    }
  };

  const handleLike = async (momentId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await api.unlikeMoment(momentId);
      } else {
        await api.likeMoment(momentId);
      }
      setMoments(prev => prev.map(m =>
        m.id === momentId
          ? { ...m, is_liked: !isLiked, like_count: isLiked ? m.like_count - 1 : m.like_count + 1 }
          : m
      ));
    } catch (err) {
      console.error('Failed to like moment:', err);
    }
  };

  const handleAddComment = async (momentId: string) => {
    if (!commentText.trim()) return;
    try {
      const comment = await api.addComment(momentId, commentText.trim());
      setMoments(prev => prev.map(m =>
        m.id === momentId
          ? { ...m, comment_count: m.comment_count + 1, comments: [...(m.comments || []), comment] }
          : m
      ));
      setCommentText('');
      setCommentingMoment(null);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleDeleteMoment = async (momentId: string) => {
    if (!window.confirm('确定删除这条动态吗？')) return;
    try {
      await api.deleteMoment(momentId);
      setMoments(prev => prev.filter(m => m.id !== momentId));
    } catch (err) {
      console.error('Failed to delete moment:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
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

  const getQuadrantStyle = (quadrant: string) => {
    const colors: Record<string, string> = {
      explorer: 'linear-gradient(135deg, #f59e0b, #f97316)',
      builder: 'linear-gradient(135deg, #22c55e, #16a34a)',
      artist: 'linear-gradient(135deg, #ec4899, #d946ef)',
      philosopher: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
    };
    return colors[quadrant] || colors.philosopher;
  };

  return (
    <div className="page" style={{ background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <div style={{ padding: '16px 12px 0' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: '22px',
              padding: '10px 20px',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + 发布
          </button>
        </div>
      </div>

      {/* Moments Feed */}
      <div style={{ padding: '0 12px' }}>
        {loading && moments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            加载中...
          </div>
        ) : moments.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            margin: '1rem 0'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <h3 style={{ marginBottom: '0.5rem' }}>还没有动态</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              成为第一个发布动态的人吧！
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {moments.map(moment => (
              <div key={moment.id} style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '16px',
                margin: '0'
              }}>
                {/* User Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.875rem' }}>
                  <div
                    onClick={() => navigate(`/profile/${moment.user_id}`)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: moment.user?.soul_quadrant
                        ? getQuadrantStyle(moment.user.soul_quadrant)
                        : 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {moment.user?.nickname?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{moment.user?.nickname || '匿名用户'}</span>
                      {moment.user?.soul_quadrant && (() => {
                        const q = moment.user!.soul_quadrant as keyof typeof QUADRANT_INFO;
                        return <span style={{ fontSize: '0.875rem' }}>{QUADRANT_INFO[q]?.emoji}</span>;
                      })()}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {formatTime(moment.created_at)}
                      {moment.location && ` · ${moment.location}`}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p style={{
                  marginBottom: '0.875rem',
                  lineHeight: 1.7,
                  fontSize: '0.9375rem',
                  wordBreak: 'break-word'
                }}>{moment.content}</p>

                {/* Images */}
                {moment.images && moment.images.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: moment.images.length === 1 ? '1fr' : 'repeat(3, 1fr)',
                    gap: '0.375rem',
                    marginBottom: '0.875rem'
                  }}>
                    {moment.images.map((img: string, i: number) => (
                      <div
                        key={i}
                        onClick={() => setSelectedImage(img)}
                        style={{
                          aspectRatio: '1',
                          background: `url(${img}) center/cover`,
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', gap: '1.75rem' }}>
                    <button
                      onClick={() => handleLike(moment.id, !!moment.is_liked)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: moment.is_liked ? '#ef4444' : 'var(--text-muted)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {moment.is_liked ? '♥' : '♡'} {moment.like_count || 0}
                    </button>
                    <button
                      onClick={() => setCommentingMoment(commentingMoment === moment.id ? null : moment.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      💬 {moment.comment_count || 0}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      🔗 分享
                    </button>
                    {currentUser && moment.user_id === currentUser.id && (
                      <button
                        onClick={() => handleDeleteMoment(moment.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ 删除
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Section */}
                {commentingMoment === moment.id && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: 'var(--bg-dark)',
                    borderRadius: '8px'
                  }}>
                    {moment.comments && moment.comments.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        {moment.comments.slice(0, 3).map((c: { id: string; user?: { nickname?: string }; content: string }) => (
                          <div key={c.id} style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{c.user?.nickname || '用户'}:</span>
                            <span style={{ marginLeft: '0.5rem' }}>{c.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="写评论..."
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.75rem',
                          background: 'var(--input-bg)',
                          border: 'none',
                          borderRadius: '20px',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem'
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(moment.id)}
                      />
                      <button
                        onClick={() => handleAddComment(moment.id)}
                        style={{
                          background: 'var(--primary)',
                          border: 'none',
                          borderRadius: '20px',
                          padding: '0.5rem 1rem',
                          color: 'white',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        发送
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                加载更多
              </button>
            )}
          </div>
        )}
      </div>

      {/* Spacer for bottom nav */}
      <div style={{ height: '80px' }} />

      {/* Create Moment Modal */}
      {showCreateModal && (
        <CreateMomentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newMoment) => {
            setMoments(prev => [newMoment, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={selectedImage}
            alt=""
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
          />
          <button
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// Create Moment Modal Component
function CreateMomentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (m: Moment) => void }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<string>('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('moment_draft');
    if (draft) {
      const parsed = JSON.parse(draft);
      if (parsed.content) setContent(parsed.content);
      if (parsed.images) setImages(parsed.images);
      if (parsed.location) setLocation(parsed.location);
    }
  }, []);

  // Save draft on change
  useEffect(() => {
    const draft = { content, images, location };
    localStorage.setItem('moment_draft', JSON.stringify(draft));
  }, [content, images, location]);

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem('moment_draft');
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      alert('请输入内容或选择图片');
      return;
    }
    setLoading(true);
    try {
      const moment = await api.createMoment({
        content: content.trim() || '分享图片',
        images: images.length > 0 ? images : undefined,
        location: location || undefined,
        is_anonymous: isAnonymous
      });
      clearDraft();
      onSuccess(moment);
    } catch (err) {
      console.error('Failed to create moment:', err);
      alert('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit to 9 images
    const remainingSlots = 9 - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      // Compress image before converting to base64
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200; // Max width to prevent huge images
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
          setImages(prev => [...prev, compressedBase64]);
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'var(--bg-secondary)',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)'
      }}>
        <button onClick={onClose} disabled={loading} style={{ background: 'none', border: 'none', fontSize: '1rem', color: 'var(--text-secondary)', cursor: loading ? 'default' : 'pointer' }}>
          取消
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            style={{
              background: isAnonymous ? 'var(--primary)' : 'var(--bg-dark)',
              border: 'none',
              borderRadius: '16px',
              padding: '0.35rem 0.85rem',
              color: isAnonymous ? 'white' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {isAnonymous ? '🔒 匿名' : '👤 实名'}
          </button>
        </div>
        <span style={{ fontWeight: 600, fontSize: '1.0625rem' }}>发布动态</span>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          style={{
            background: content.trim() ? 'var(--primary)' : 'var(--bg-dark)',
            border: 'none',
            borderRadius: '20px',
            padding: '0.5rem 1.25rem',
            color: 'white',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: content.trim() ? 'pointer' : 'default'
          }}
        >
          {loading ? '发布中...' : '发布'}
        </button>
      </div>

      {/* Content Input */}
      <div style={{ flex: 1, padding: '1.25rem' }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="分享你的想法..."
          autoFocus
          style={{
            width: '100%',
            height: '250px',
            minHeight: '150px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            resize: 'none',
            lineHeight: 1.7,
            outline: 'none',
            padding: 0
          }}
        />
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          {content.length} / 2000
        </p>

        {/* Images Preview */}
        {images.length > 0 && (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>已选 {images.length}/9 张图片</span>
              <button
                onClick={() => setImages([])}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8125rem', cursor: 'pointer' }}
              >
                清除全部
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {images.map((img: string, i: number) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1' }}>
                  <img
                    src={img}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                  />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '26px',
                      height: '26px',
                      background: 'rgba(0,0,0,0.65)',
                      border: 'none',
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)'
      }}>
        <button
          onClick={() => document.getElementById('image-input')?.click()}
          style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          📷
        </button>
        <input
          id="image-input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => setShowLocationPicker(true)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            opacity: location ? 1 : 0.6
          }}
          title={location || '添加定位'}
        >
          📍
        </button>
        <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
          @好友
        </button>
      </div>
      {location && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)'
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            📍 {location}
          </span>
          <button
            onClick={() => setLocation('')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            清除
          </button>
        </div>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          currentLocation={location}
          onSelect={(loc) => {
            setLocation(loc);
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}

// Location Picker Component
function LocationPicker({
  currentLocation,
  onSelect,
  onClose
}: {
  currentLocation: string;
  onSelect: (location: string) => void;
  onClose: () => void;
}) {
  const [cities, setCities] = useState<{ name: string; province: string }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const data = await api.getCities();
      setCities(data);
    } catch {
      // Use default cities if API fails
      setCities([
        { name: '北京', province: '北京' },
        { name: '上海', province: '上海' },
        { name: '广州', province: '广东' },
        { name: '深圳', province: '广东' },
        { name: '杭州', province: '浙江' },
        { name: '成都', province: '四川' },
        { name: '南京', province: '江苏' },
        { name: '武汉', province: '湖北' },
        { name: '西安', province: '陕西' },
        { name: '重庆', province: '重庆' },
        { name: '天津', province: '天津' },
        { name: '苏州', province: '江苏' },
        { name: '长沙', province: '湖南' },
        { name: '郑州', province: '河南' },
        { name: '沈阳', province: '辽宁' },
        { name: '青岛', province: '山东' },
        { name: '宁波', province: '浙江' },
        { name: '东莞', province: '广东' },
        { name: '佛山', province: '广东' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = cities.filter(c =>
    c.name.includes(search) || c.province.includes(search)
  );

  const groupedCities = filteredCities.reduce((acc, city) => {
    if (!acc[city.province]) acc[city.province] = [];
    acc[city.province].push(city);
    return acc;
  }, {} as Record<string, { name: string; province: string }[]>);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'flex-end'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxHeight: '75vh',
          background: 'var(--bg-secondary)',
          borderRadius: '20px 20px 0 0',
          padding: '1.25rem',
          overflow: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>选择位置</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
        </div>

        {currentLocation && (
          <button
            onClick={() => onSelect('')}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'var(--bg-dark)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              fontSize: '0.9375rem',
              cursor: 'pointer',
              marginBottom: '1rem',
              textAlign: 'left'
            }}
          >
            清除定位
          </button>
        )}

        <input
          type="text"
          placeholder="搜索城市..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontSize: '0.9375rem',
            marginBottom: '1rem'
          }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>加载中...</div>
        ) : (
          <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
            {Object.entries(groupedCities).map(([province, citiesInProvince]) => (
              <div key={province} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>
                  {province}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {citiesInProvince.map(city => (
                    <button
                      key={city.name}
                      onClick={() => onSelect(city.name)}
                      style={{
                        padding: '0.5rem 0.875rem',
                        background: currentLocation === city.name ? 'var(--primary)' : 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}