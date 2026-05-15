"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChatBubble, SendSolid, Xmark } from 'iconoir-react';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { Text, Caption } from '../common/Typography';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../../hooks/useToast';
import aiChatApi from '../../api/aiChatApi';
import { loadAiChatMessages, saveAiChatMessages } from '../../utils/sessionAiChat';
import { AiChatRichText } from './aiChatRichText';

const nextId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const AiChatbot = ({ user }) => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const copy = t('layout.aiChat') || {};
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

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
    }));
    setMessages(stored);
  }, [userId]);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

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

    const userMsg = { id: nextId(), role: 'user', content: text };
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
      if (!reply || typeof reply !== 'string') {
        throw new Error(copy.error || 'Empty reply');
      }
      const botMsg = { id: nextId(), role: 'assistant', content: reply.trim() };
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
        <div className="pointer-events-auto flex h-[min(32rem,calc(100vh-8rem))] w-[min(100vw-2rem,24rem)] flex-col overflow-hidden border-2 border-slate-200 bg-white shadow-2xl sm:w-[26rem]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-primary-700 px-3 py-2 text-white">
            <div>
              <div className="text-sm font-bold">{copy.title || 'AI'}</div>
              {(copy.subtitle || '').trim() ? (
                <Caption className="text-[10px] font-medium normal-case tracking-normal text-primary-100">
                  {copy.subtitle}
                </Caption>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded border border-white/30 p-1.5 hover:bg-white/10"
              aria-label={copy.close || 'Close'}
              onClick={() => setOpen(false)}
            >
              <Xmark className="h-5 w-5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.length === 0 && (
              <Text className="text-sm text-slate-600">{copy.empty || ''}</Text>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[95%] rounded border px-3 py-2.5 text-sm leading-snug ${
                  m.role === 'user'
                    ? 'ml-auto border-primary-200 bg-primary-50 text-secondary-900'
                    : 'mr-auto border-slate-200 bg-white text-secondary-900 shadow-sm'
                }`}
              >
                {m.role === 'assistant' ? (
                  <AiChatRichText text={m.content} />
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Spinner size="sm" inline tone="current" label={copy.thinking || '...'} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-2">
            <div className="flex gap-2">
              <textarea
                className="min-h-[44px] flex-1 resize-none border border-slate-200 px-2 py-2 text-sm outline-none focus:border-primary-600"
                rows={2}
                placeholder={copy.placeholder || ''}
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
              <Button
                type="button"
                variant="primary"
                className="h-11 shrink-0 self-end px-3"
                disabled={sending || !input.trim()}
                onClick={handleSend}
                aria-label={copy.send || 'Send'}
              >
                <SendSolid className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="pointer-events-auto flex h-14 w-14 items-center justify-center border-2 border-secondary-900 bg-primary-600 text-white shadow-lg transition hover:bg-primary-700"
        aria-label={copy.openLabel || 'AI chat'}
        onClick={() => setOpen((v) => !v)}
      >
        <ChatBubble className="h-7 w-7" strokeWidth={2} />
      </button>
    </div>
  );
};

export default AiChatbot;
