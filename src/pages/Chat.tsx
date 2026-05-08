import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Message, Match, User } from '../types';
import { QUADRANT_INFO } from '../data/mbti';

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
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const loadChat = async () => {
    if (!matchId) return;

    try {
      const [messageList, matchData] = await Promise.all([
        api.getMessages(matchId),
        api.getMatches()
      ]);

      setMessages(messageList);

      const currentMatch = matchData.find(m => m.id === matchId);
      if (currentMatch) {
        setMatch(currentMatch);
        const otherUserId = currentMatch.oder_a_id === user?.id
          ? currentMatch.oder_b_id
          : currentMatch.oder_a_id;
        const other = await api.getUser(otherUserId);
        setOtherUser(other);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const token = localStorage.getItem('soulquad_token');
    if (!token) return;

    const socket = io('/', {
      auth: { token }
    });

    socket.on('connect', () => {
      if (matchId) {
        socket.emit('join_room', matchId);
      }
    });

    socket.on('new_message', (message: Message) => {
      if (message.match_id === matchId) {
        setMessages(prev => [...prev, message]);
        if (message.sender_id !== user?.id) {
          api.markMessagesRead(matchId!);
        }
      }
    });

    socketRef.current = socket;
  };

  const loadIcebreakers = async () => {
    if (!matchId || messages.length > 0) return;
    try {
      const data = await api.getIcebreaker(matchId);
      setIcebreakers(data.topics);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadIcebreakers();
  }, [matchId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !matchId || sending) return;

    setSending(true);
    try {
      const message = await api.sendMessage(matchId, newMessage.trim());
      setMessages(prev => [...prev, message]);
      setNewMessage('');

      socketRef.current?.emit('send_message', {
        match_id: matchId,
        content: message.content,
        message_type: 'text'
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
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
            background: otherUser?.soul_quadrant === 'explorer' ? 'linear-gradient(135deg, #f59e0b, #f97316)' :
                        otherUser?.soul_quadrant === 'builder' ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
                        otherUser?.soul_quadrant === 'artist' ? 'linear-gradient(135deg, #ec4899, #d946ef)' :
                        'linear-gradient(135deg, #6366f1, #8b5cf6)'
          }}
        >
          {otherUser?.nickname[0]}
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
            {/* Icebreaker Suggestions */}
            {icebreakers.length > 0 && (
              <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {icebreakers.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setNewMessage(topic);
                    }}
                    style={{
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border)',
                      borderRadius: '1rem',
                      padding: '0.375rem 0.875rem',
                      fontSize: '0.8125rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}

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
              const showDate = index === 0 ||
                formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

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
                  <div className={`message ${isSent ? 'sent' : 'received'}`}>
                    <div>{message.content}</div>
                    <div className="message-time">{formatTime(message.created_at)}</div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="发送消息..."
          disabled={sending}
        />
        <button type="submit" disabled={!newMessage.trim() || sending}>
          {sending ? '...' : '发送'}
        </button>
      </form>
    </div>
  );
}
