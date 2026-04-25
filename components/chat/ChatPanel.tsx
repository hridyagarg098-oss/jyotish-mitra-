'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_CHIPS = [
  'Career kab sudhrega?',
  'Shadi kab hogi?',
  'Kaun sa ratan pehnu?',
  'Lucky day kaun sa hai?',
  'Meri dasha kab khatam hogi?',
  'Health ke baare mein batao',
];

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [kundliId, setKundliId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [chatCount, setChatCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Load user + kundli info
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setIsLoggedIn(true);

      const { data: profile } = await supabase
        .from('users')
        .select('name, chat_count_today, plan')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserName(profile.name?.split(' ')[0] || 'friend');
        setChatCount(profile.chat_count_today || 0);
        if (profile.plan === 'free' && (profile.chat_count_today || 0) >= 5) {
          setLimitReached(true);
        }
      }

      const { data: kundli } = await supabase
        .from('kundlis')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (kundli) setKundliId(kundli.id);
    })();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    if (limitReached) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    // Add empty AI message that we'll fill
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), kundliId }),
      });

      if (res.status === 429) {
        const errData = await res.json();
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, content: errData.message || 'Free messages khatam. Upgrade karein.' } : m
        ));
        setLimitReached(true);
        return;
      }

      if (res.status === 401) {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, content: 'Pehle login karein. 🙏' } : m
        ));
        return;
      }

      if (!res.ok || !res.body) {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, content: 'Kuch gadbad ho gayi. Dobara try karein.' } : m
        ));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, content: accumulated } : m
        ));
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }

      setChatCount(c => c + 1);
      if (chatCount + 1 >= 5) setLimitReached(true);
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { ...m, content: 'Network error. Please check connection.' } : m
      ));
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, limitReached, kundliId, chatCount]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              onClick={() => setIsOpen(true)}
              style={{
                position: 'relative',
                width: 60, height: 60,
                borderRadius: '50%',
                background: 'var(--gold-mid)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                boxShadow: '0 4px 24px rgba(186,117,23,0.4)',
              }}
              title="AI Pandit se Poochho"
            >
              {/* Pulse ring */}
              <span className="chat-trigger-ring" />
              <span style={{ position: 'relative', zIndex: 1 }}>✦</span>
              {/* Unread badge */}
              {messages.length === 0 && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#27ae60',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#fff', fontWeight: 700,
                }}>
                  ✓
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 24, right: 24,
              width: 400, height: 560,
              borderRadius: 20,
              background: 'var(--bg-2)',
              border: '1px solid var(--gold-border-strong)',
              boxShadow: '0 -4px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(186,117,23,0.1)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              height: 56,
              background: 'var(--bg-3)',
              borderBottom: '1px solid var(--gold-border)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: 10,
              flexShrink: 0,
            }}>
              {/* Online dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#27ae60',
                boxShadow: '0 0 6px #27ae60',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gold-bright)' }}>
                  ✦ Jyotish Mitra
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: -1 }}>
                  Aapki kundli ke hisaab se jawab
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-3)', cursor: 'pointer', padding: 4,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              {messages.length === 0 ? (
                /* Initial state */
                <div style={{ textAlign: 'center', paddingTop: 20 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>
                    <span className="devanagari" style={{ color: 'var(--gold-bright)' }}>ॐ</span>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 17,
                    color: 'var(--gold-bright)',
                    marginBottom: 6,
                  }}>
                    Namaskar{userName ? `, ${userName}` : ''}! 🙏
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
                    {kundliId
                      ? 'Main aapki kundli dekh sakta hoon. Kya poochna chahte hain?'
                      : 'AI Pandit se koi bhi sawal poochho.'}
                  </p>

                  {/* Suggested chips */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    textAlign: 'left',
                  }}>
                    {SUGGESTED_CHIPS.map(chip => (
                      <button
                        key={chip}
                        onClick={() => { setInput(chip); sendMessage(chip); }}
                        style={{
                          padding: '8px 10px',
                          fontSize: 12,
                          background: 'var(--gold-dim)',
                          border: '1px solid var(--gold-border)',
                          borderRadius: 8,
                          color: 'var(--text-1)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s, border-color 0.15s',
                          fontFamily: 'var(--font-body)',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--gold-mid)';
                          (e.currentTarget as HTMLElement).style.color = '#08020f';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--gold-dim)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Messages list */
                <>
                  {messages.map(msg => (
                    <div key={msg.id}>
                      {msg.role === 'assistant' && (
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>
                          ✦ AI Pandit · {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      <div
                        className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {msg.content}
                        {msg.role === 'assistant' && msg.content === '' && isStreaming && (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 20 }}>
                            {[0, 1, 2].map(i => (
                              <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Limit reached banner */}
            {limitReached && (
              <div style={{
                padding: '10px 16px',
                background: 'rgba(186,117,23,0.15)',
                borderTop: '1px solid var(--gold-border)',
                fontSize: 12,
                color: 'var(--gold-bright)',
                textAlign: 'center',
              }}>
                5 free messages khatam.{' '}
                <a href="/upgrade" style={{ color: 'var(--gold-bright)', fontWeight: 700 }}>
                  Pro upgrade karein →
                </a>
              </div>
            )}

            {/* Login prompt */}
            {!isLoggedIn && (
              <div style={{
                padding: '10px 16px',
                background: 'rgba(186,117,23,0.15)',
                borderTop: '1px solid var(--gold-border)',
                fontSize: 12,
                color: 'var(--gold-bright)',
                textAlign: 'center',
              }}>
                <a href="/auth" style={{ color: 'var(--gold-bright)', fontWeight: 700 }}>
                  Login karein →
                </a>{' '}
                aur AI Pandit se baat karein
              </div>
            )}

            {/* Input row */}
            <div style={{
              borderTop: '1px solid var(--gold-border)',
              padding: '10px 12px',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
              flexShrink: 0,
              background: 'var(--bg-2)',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Apna sawal likho..."
                disabled={isStreaming || limitReached || !isLoggedIn}
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  resize: 'none',
                  lineHeight: 1.5,
                  maxHeight: 72,
                  overflowY: 'auto',
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming || limitReached}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: input.trim() && !isStreaming ? 'var(--gold-mid)' : 'var(--bg-3)',
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <Send size={15} color={input.trim() && !isStreaming ? '#08020f' : 'var(--text-3)'} />
              </button>
            </div>

            {/* Message counter */}
            {isLoggedIn && !limitReached && (
              <div style={{
                padding: '4px 16px 8px',
                fontSize: 10,
                color: 'var(--text-3)',
                background: 'var(--bg-2)',
                textAlign: 'center',
              }}>
                {5 - chatCount} free messages remaining today
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
