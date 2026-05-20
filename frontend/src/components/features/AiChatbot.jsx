import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubble, SendSolid, Xmark, ElectronicsChip } from 'iconoir-react';
import Spinner from '../common/Spinner';
import { Text, Caption } from '../common/Typography';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../../hooks/useToast';
import aiChatApi from '../../api/aiChatApi';
import { loadAiChatMessages, saveAiChatMessages } from '../../utils/sessionAiChat';
import { AiChatRichText } from './aiChatRichText';

const nextId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2, 9)}`;
};

const formatMessageTime = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const getItemLabel = (type) => {
  if (type === 'project') {
    return 'Dự án';
  }
  if (type === 'freelancer') {
    return 'Freelancer';
  }
  return 'Kết quả';
};

const AiChatbot = ({ user }) => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const copy = t('layout.aiChat') || {};
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setMessages([]);
      return;
    }
    const stored = loadAiChatMessages(userId).map((m) => ({
      id: m.id || nextId(),
      role: m.role,
      content: m.content,
      items: m.items,
      createdAt: m.createdAt || new Date().toISOString(),
    }));
    setMessages(stored);
  }, [userId]);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const persist = useCallback(
    (next) => {
      if (userId) {
        saveAiChatMessages(userId, next);
      }
    },
    [userId]
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !userId || sending) {
      return;
    }

    const userMsg = {
      id: nextId(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const historyForApi = [...messages, userMsg].map(({ role, content }) => ({ role, content }));
    setInput('');
    setMessages((prev) => {
      const next = [...prev, userMsg];
      persist(next);
      return next;
    });
    setSending(true);

    try {
      const res = await aiChatApi.send(historyForApi);
      const reply = res?.data?.reply ?? res?.data?.data?.reply;
      const items = res?.data?.items ?? res?.data?.data?.items ?? [];
      if (!reply || typeof reply !== 'string') {
        throw new Error(copy.error || 'Empty reply');
      }
      const botMsg = {
        id: nextId(),
        role: 'assistant',
        content: reply.trim(),
        items,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => {
        const next = [...prev, botMsg];
        persist(next);
        return next;
      });
    } catch (err) {
      addToast(err?.message || copy.error || 'Error', 'error');
    } finally {
      setSending(false);
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex flex-col items-end gap-3 md:bottom-6">
      {open && (
        <div className="pointer-events-auto relative flex h-[min(38rem,calc(100vh-7.5rem))] w-[min(100vw-1.5rem,30rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 px-4 py-3 text-white">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-white/15">
                  <ChatBubble className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{copy.title || 'Trợ lý Thuê Tôi'}</div>
                  <Caption className="text-[10px] font-medium normal-case tracking-normal text-primary-100">
                    Hệ thống AI chuyên gia
                  </Caption>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg border border-white/25 p-1.5 transition hover:bg-white/10"
              aria-label={copy.close || 'Close'}
              onClick={() => setOpen(false)}
            >
              <Xmark className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2">
            <p className="text-[11px] font-medium text-slate-600">
              Tư vấn theo dữ liệu dự án thực tế
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>

          <div
            ref={listRef}
            className="flex-1 min-h-0 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100/60 p-4 pb-[120px]"
            style={{ overflowAnchor: 'none' }}
          >
            {messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/85 p-4 shadow-sm">
                <Text className="text-sm font-medium text-slate-700">
                  {copy.empty || 'Xin chào! Mình có thể tư vấn dự án phù hợp theo kỹ năng, ngân sách và tiến độ.'}
                </Text>
                <p className="mt-2 text-xs text-slate-500">
                  Gợi ý: “Tìm dự án React lương từ 8 triệu” hoặc “Đề xuất freelancer NodeJS phù hợp”.
                </p>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`max-w-[92%] rounded-2xl border px-3.5 py-3 text-sm leading-snug relative overflow-hidden ${
                    isUser
                      ? 'ml-auto border-primary-300 bg-primary-600 text-white shadow-sm'
                      : 'mr-auto border-primary-200 bg-primary-50 text-slate-900 shadow-sm border-l-4 border-l-primary-500'
                  }`}
                >
                  <div className={`mb-1.5 flex items-center justify-between gap-3 text-[10px] ${
                    isUser ? 'text-primary-100' : 'text-primary-600'
                  }`}>
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wide">
                      {!isUser && <ElectronicsChip className="h-3.5 w-3.5" />}
                      {isUser ? 'Bạn' : 'Trợ lý Thuê Tôi'}
                    </span>
                    <span>{formatMessageTime(m.createdAt)}</span>
                  </div>

                  {m.role === 'assistant' ? (
                    <>
                      <AiChatRichText text={m.content} />
                      {m.items && m.items.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                          {m.items.map((item, idx) => (
                            <div
                              key={`${item.id}-${idx}`}
                              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:border-primary-300 hover:bg-white"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <span className="inline-flex rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                                    {getItemLabel(item.type)}
                                  </span>
                                  <h4 className="mt-1.5 truncate text-sm font-semibold text-slate-900" title={item.title}>
                                    {item.title}
                                  </h4>
                                  <p className="mt-1 truncate text-xs text-slate-500" title={item.subtitle}>
                                    {item.subtitle}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpen(false);
                                    navigate(item.route);
                                  }}
                                  className="shrink-0 rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary-700 transition hover:border-primary-300 hover:bg-primary-50"
                                >
                                  Xem chi tiết
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              );
            })}

            {sending && (
              <div className="mr-auto flex max-w-[78%] items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700 shadow-sm">
                <Spinner size="sm" inline tone="current" label="Đang xử lý..." />
                <span className="font-medium">Trợ lý Thuê Tôi đang suy nghĩ...</span>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3 h-[108px] flex flex-col justify-center z-10">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                className="h-[52px] flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                rows={2}
                placeholder={copy.placeholder || 'Nhập yêu cầu của bạn...'}
                value={input}
                disabled={sending}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="button"
                className="h-[52px] w-[52px] shrink-0 flex items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm transition-all hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                disabled={sending || !input.trim()}
                onClick={handleSend}
                aria-label={copy.send || 'Send'}
              >
                <SendSolid className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
              Enter để gửi • Shift + Enter để xuống dòng
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border border-primary-700/70 bg-primary-600 text-white shadow-[0_10px_24px_-8px_rgba(37,99,235,0.75)] transition hover:-translate-y-0.5 hover:bg-primary-700"
        aria-label={copy.openLabel || 'AI chat'}
        onClick={() => setOpen((v) => !v)}
      >
        <ChatBubble className="h-7 w-7" strokeWidth={2} />
        <span className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
          AI
        </span>
      </button>
    </div>
  );
};

export default AiChatbot;

