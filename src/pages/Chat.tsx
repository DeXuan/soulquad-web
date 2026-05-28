import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Message, Match, User } from '../types';
import { QUADRANT_INFO } from '../data/mbti';

const EMOJI_CATEGORIES = [
  { name: '笑脸', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '🤔', '🤨'] },
  { name: '爱心', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🥀', '🌹', '🌺', '🌸', '💐'] },
  { name: '手势', emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤏', '✍️'] },
  { name: '庆祝', emojis: ['🎉', '🎊', '🎈', '🎁', '🎀', '🏆', '🥇', '🥈', '🥉', '🏅', '⭐', '🌟', '✨', '💫', '🎯', '🎱', '🎮', '🕹️', '🎲', '🧩'] },
  { name: '物品', emojis: ['💼', '📱', '💻', '⌚', '📷', '🎥', '📚', '✏️', '📝', '💰', '💳', '🔑', '🎵', '🎶', '📻', '🎤', '🎧', '🎷', '🎸', '🎺'] },
  { name: '自然', emojis: ['🌞', '🌙', '⭐', '🌟', '💫', '☁️', '⛅', '🌈', '☔', '❄️', '🌊', '🔥', '💧', '🌿', '🌸', '🌺', '🌻', '🍀', '🍁', '🌴'] },
];

export function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [match, setMatch] = useState<Match | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  // audioBlob managed via ref for reliable async access
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId) return;

    loadChat();
    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadChat = async () => {
    if (!matchId) return;

    try {
      const [messageList, matchData] = await Promise.all([
        api.getMessages(matchId),
        api.getMatches()
      ]);

      setMessages(messageList);

      const currentMatch = matchData.find(m => m.id === matchId);
      if (!currentMatch) {
        setLoading(false);
        return;
      }
      setMatch(currentMatch);
      const otherUserId = currentMatch.oder_a_id === user?.id
        ? currentMatch.oder_b_id
        : currentMatch.oder_a_id;
      const other = await api.getUser(otherUserId);
      setOtherUser(other);
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const token = localStorage.getItem('soulquad_token');
    if (!token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      auth: { token }
    });

    socket.on('connect', () => {
      if (matchId) {
        socket.emit('join_room', matchId);
      }
    });

    socket.on('new_message', (message: Message) => {
      if (message.match_id === matchId) {
        setMessages(prev => {
          // Deduplicate: skip if message ID already exists
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        if (message.sender_id !== user?.id) {
          api.markMessagesRead(matchId!);
        }
      }
    });

    socketRef.current = socket;
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !matchId || sending) return;

    setSending(true);
    try {
      const sentMessage = await api.sendMessage(matchId, newMessage.trim());
      setNewMessage('');
      // Add message to local state immediately for instant feedback
      // Socket will deduplicate if it also arrives via 'new_message' event
      setMessages(prev => {
        if (prev.some(m => m.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !matchId) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    setSending(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Compress image
      const img = new Image();
      img.src = imageData;
      await new Promise(resolve => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      const maxWidth = 800; // Max width to prevent huge images
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedImage = canvas.toDataURL('image/jpeg', 0.7); // 70% quality

      await api.sendImageMessage(matchId, compressedImage);
      // Don't add to state - socket 'new_message' event handles it
    } catch (err) {
      console.error('Failed to send image:', err);
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const audioBlobRef = useRef<Blob | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        audioBlobRef.current = blob;
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorder || !matchId) return;

    // Wait for onstop to fire and produce the blob
    const blob = await new Promise<Blob | null>((resolve) => {
      const prevOnStop = mediaRecorder.onstop?.bind(mediaRecorder);
      mediaRecorder.onstop = function (e) {
        prevOnStop?.(e);
        // Use setTimeout to allow state update from prevOnStop
        setTimeout(() => resolve(audioBlobRef.current), 0);
      };
      mediaRecorder.stop();
      setRecording(false);
    });

    if (!blob) return;

    setSending(true);
    try {
      const reader = new FileReader();
      const audioData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      await api.sendAudioMessage(matchId, audioData);
    } catch (err) {
      console.error('Failed to send audio:', err);
    } finally {
      setSending(false);
      audioBlobRef.current = null;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === yesterday.toDateString()) return '昨天';
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const renderMessageContent = (message: Message) => {
    if (message.message_type === 'image') {
      return (
        <img
          src={message.content}
          alt=""
          style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '12px', cursor: 'pointer' }}
          onClick={() => window.open(message.content, '_blank')}
        />
      );
    }
    if (message.message_type === 'audio') {
      return (
        <audio controls src={message.content} style={{ height: '36px' }} />
      );
    }
    return <span>{message.content}</span>;
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

  const quadrantInfo = otherUser?.soul_quadrant ?
    QUADRANT_INFO[otherUser.soul_quadrant] : null;

  if (!user) return null;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button
          onClick={() => navigate('/messages')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '1.25rem',
            padding: '0.5rem',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <div
          className="user-avatar"
          style={{
            width: '40px',
            height: '40px',
            fontSize: '1rem',
            background: otherUser?.avatar_data
              ? `url(${otherUser.avatar_data}) center/cover`
              : otherUser?.soul_quadrant === 'explorer' ? 'linear-gradient(135deg, #f59e0b, #f97316)' :
                otherUser?.soul_quadrant === 'builder' ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
                otherUser?.soul_quadrant === 'artist' ? 'linear-gradient(135deg, #ec4899, #d946ef)' :
                'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: otherUser?.avatar_data ? 'transparent' : 'white'
          }}
        >
          {otherUser?.avatar_data ? '' : otherUser?.nickname[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{otherUser?.nickname}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {quadrantInfo && <span>{quadrantInfo.emoji}</span>}
            <span>{otherUser?.mbti || '未设置'}</span>
            {match && <span>·</span>}
            {match && <span>{match.soulmate_index}% 契合</span>}
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💫</div>
            <p>你们是灵魂匹配！</p>
            <p style={{ fontSize: '0.875rem' }}>发送消息开始深入了解彼此</p>
          </div>
        ) : (
          <>


            <div style={{ textAlign: 'center', padding: '0.5rem' }}>
              <span style={{
                background: 'var(--bg-card)',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                {match?.created_at ? formatDate(match.created_at) : ''}
              </span>
            </div>
            {messages.map((message, index) => {
              const isSent = message.sender_id === user?.id;
              const prev = index > 0 ? messages[index - 1] : null;

              // Show date separator when day changes
              const showDate = !prev ||
                formatDate(prev.created_at) !== formatDate(message.created_at);

              // Show time label when gap > 5 minutes or day changes (WeChat style)
              const timeDiff = prev
                ? (new Date(message.created_at).getTime() - new Date(prev.created_at).getTime()) / 60000
                : Infinity;
              const showTime = timeDiff > 5;

              return (
                <div key={message.id}>
                  {showDate && (
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                      <span style={{
                        background: 'var(--bg-card)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                      }}>
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  )}
                  {showTime && !showDate && (
                    <div style={{ textAlign: 'center', padding: '0.25rem 0' }}>
                      <span style={{
                        fontSize: '0.6875rem',
                        color: 'var(--text-muted)'
                      }}>
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`message-row ${isSent ? 'sent' : 'received'}`}
                    style={{
                      display: 'flex',
                      flexDirection: isSent ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: '8px',
                      margin: '4px 12px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {!isSent && (
                      <div
                        className="chat-avatar"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          flexShrink: 0,
                          background: otherUser?.avatar_data
                            ? `url(${otherUser.avatar_data}) center/cover`
                            : otherUser?.soul_quadrant === 'explorer' ? 'linear-gradient(135deg, #f59e0b, #f97316)' :
                              otherUser?.soul_quadrant === 'builder' ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
                              otherUser?.soul_quadrant === 'artist' ? 'linear-gradient(135deg, #ec4899, #d946ef)' :
                              'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: otherUser?.avatar_data ? 'transparent' : 'white'
                        }}
                      >
                        {otherUser?.avatar_data ? '' : otherUser?.nickname[0]}
                      </div>
                    )}
                    <div
                      className="message-bubble"
                      style={{
                        maxWidth: '65%',
                        padding: '9px 13px',
                        borderRadius: '6px',
                        fontSize: '0.9375rem',
                        lineHeight: 1.45,
                        wordBreak: 'break-word',
                        background: isSent ? '#95ec69' : '#fff',
                        color: '#000'
                      }}
                    >
                      {renderMessageContent(message)}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          style={{
            position: 'absolute',
            bottom: '70px',
            left: '10px',
            width: '320px',
            maxHeight: '280px',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            zIndex: 100
          }}
        >
          <div style={{ display: 'flex', overflowX: 'auto', padding: '8px', borderBottom: '1px solid var(--border)' }}>
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => setActiveEmojiCategory(i)}
                style={{
                  padding: '4px 8px',
                  background: i === activeEmojiCategory ? 'var(--primary)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div style={{ padding: '8px', overflowY: 'auto', maxHeight: '200px' }}>
            {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => handleEmojiSelect(emoji)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  padding: '4px',
                  cursor: 'pointer'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* More Menu */}
      {showMoreMenu && (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            right: '10px',
            width: '180px',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            zIndex: 100
          }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => { fileInputRef.current?.click(); setShowMoreMenu(false); }}
          >
            <span style={{ fontSize: '1.25rem' }}>📷</span>
            <span>图片</span>
          </div>
          <div
            style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => { /* Video call placeholder */ setShowMoreMenu(false); }}
          >
            <span style={{ fontSize: '1.25rem' }}>📹</span>
            <span>视频通话</span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: 'none' }}
      />

      <form className="chat-input" onSubmit={handleSend}>
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0 4px'
          }}
        >
          😊
        </button>
        <button
          type="button"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0 4px'
          }}
        >
          ➕
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={recording ? '录音中...' : '发送消息...'}
          disabled={sending || recording}
          style={{ flex: 1 }}
        />
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            style={{
              background: '#ef4444',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 12px',
              color: 'white',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            发送
          </button>
        ) : newMessage.trim() ? (
          <button type="submit" disabled={!newMessage.trim() || sending}>
            发送
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0 4px'
            }}
          >
            🎤
          </button>
        )}
      </form>
    </div>
  );
}