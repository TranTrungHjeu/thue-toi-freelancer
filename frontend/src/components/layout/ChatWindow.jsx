import React, { useEffect, useRef, useState } from 'react';
import {
  Xmark,
  Minus,
  SendSolid,
  Attachment,
  ChatBubble,
  ElectronicsChip,
  Phone,
  VideoCamera,
} from 'iconoir-react';
import marketplaceApi from '../../api/marketplaceApi';
import aiChatApi from '../../api/aiChatApi';
import { createMessageRealtimeClient } from '../../api/realtimeClient';
import { normalizeAttachments } from '../../utils/attachments';
import { formatDateTime } from '../../utils/formatters';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getAccessToken } from '../../api/axiosClient';
import adminApi from '../../api/adminApi';
import { AiChatRichText } from '../features/aiChatRichText';
import Spinner from '../common/Spinner';
import VideoCallModal from '../common/VideoCallModal';

const nextId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2, 9)}`;
};

const formatMessageTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const ChatWindow = ({
  chat,
  onClose,
  onToggleMinimize,
  isMinimized,
  onMessageReceived // Callback for unread count
}) => {
  const { locale } = useI18n();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callRoomName, setCallRoomName] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isAi = chat.type === 'ai';
  const isSupport = chat.type === 'support';
  const contractId = (!isAi && !isSupport) ? chat.id : null;

  useEffect(() => {
    if (isMinimized) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMinimized]);

  useEffect(() => {
    if (isMinimized) return;
    inputRef.current?.focus();
  }, [isMinimized]);

  // Load initial messages
  useEffect(() => {
    let mounted = true;
    if (isAi) {
      setMessages(chat.messages || []);
      return;
    }
    if (isSupport) {
      const loadSupportMessages = async () => {
        setLoading(true);
        try {
          const response = chat.adminViewUserId
            ? await adminApi.getSupportMessages(chat.adminViewUserId)
            : await marketplaceApi.getSupportMessages();
          if (mounted) setMessages(response.data || []);
        } catch (error) {
          console.error('Failed to load support messages:', error);
        } finally {
          if (mounted) setLoading(false);
        }
      };
      loadSupportMessages();
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      try {
        const response = await marketplaceApi.getMessagesByContract(contractId);
        if (mounted) setMessages(response.data || []);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMessages();
    return () => { mounted = false; };
  }, [contractId, isAi, chat.messages]);

  // Realtime subscription for support messages (via ChatManager hub)
  useEffect(() => {
    if (isAi || !isSupport) return;

    const handleSupportMessage = (event) => {
      const message = event.detail;
      console.log('[ChatWindowSupport] Event received:', message);
      if (!message || !message.id) return;

      // Filter logic for Admin view vs User view
      if (chat.adminViewUserId) {
        // Admin view: only show messages involving this specific user
        const isRelevant = message.senderId === chat.adminViewUserId || message.recipientId === chat.adminViewUserId;
        console.log(`[ChatWindowSupport] Admin filter (viewing user ${chat.adminViewUserId}): isRelevant = ${isRelevant}`);
        if (!isRelevant) return;
      } else {
        // Regular user view: Since they only have one support chat, any support message received by their socket is for them.
        // But let's be safe and check if it's not a message for someone else (shouldn't happen with user-scoped sessions)
        console.log('[ChatWindowSupport] User view: processing support message');
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) {
          console.log('[ChatWindowSupport] Message already in state, skipping duplicate:', message.id);
          return prev;
        }
        return [...prev, message];
      });

      if (onMessageReceived && !isMinimized) {
        onMessageReceived(message);
      }
    };

    window.addEventListener('thuetoi:support-message', handleSupportMessage);
    return () => window.removeEventListener('thuetoi:support-message', handleSupportMessage);
  }, [isSupport, isAi, chat.id, chat.adminViewUserId, isMinimized, onMessageReceived]);

  // Realtime subscription for contract messages
  useEffect(() => {
    if (isAi || isSupport || !contractId) return;

    const realtimeClient = createMessageRealtimeClient({
      contractId,
      onMessage: (incomingMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMessage.id)) return prev;
          return [...prev, incomingMessage];
        });
      },
    });

    return () => realtimeClient.close();
  }, [contractId, isAi, isSupport]);

  const handleStartCall = (isVideo) => {
    if (!contractId || isSupport) return;
    setCallRoomName(`thuetoi-contract-${contractId}`);
    setIsCallOpen(true);
    marketplaceApi.sendMessage({
      contractId,
      messageType: 'text',
      content: `[CALL_INVITATION] ${isVideo ? 'Video' : 'Thoại'}`,
      attachments: []
    }).catch(err => console.error('Call notify error:', err));
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text && !fileToUpload && !isAi && !isSupport) return;
    if (!text && isAi) return;
    if (sending) return;

    setSending(true);
    try {
      if (isAi) {
        const userMsg = {
          id: nextId(),
          role: 'user',
          content: text,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));
        const res = await aiChatApi.send(history);
        const reply = res?.data?.reply ?? res?.data?.data?.reply;
        const items = res?.data?.items ?? res?.data?.data?.items ?? [];

        const botMsg = {
          id: nextId(),
          role: 'assistant',
          content: reply || 'Error: Empty reply',
          items,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, botMsg]);
        if (chat.onAiMessage) chat.onAiMessage([...messages, userMsg, botMsg]);
      } else if (isSupport) {
        let uploaded = [];
        if (fileToUpload) {
          const response = await marketplaceApi.uploadFiles('support', [fileToUpload]);
          uploaded = normalizeAttachments(response.data || []);
        }

        const messagePayload = {
          content: text,
          attachments: uploaded,
          messageType: uploaded.length > 0 ? 'file' : 'text'
        };

        // Optimistically add the user's message to the UI
        const newUserMessage = {
          id: `temp_${Date.now()}`, // Temporary ID
          senderId: user.id,
          senderRole: user.role, // Assuming user object has role
          content: text,
          attachments: uploaded,
          messageType: messagePayload.messageType,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setFileToUpload(null);

        try {
          if (chat.adminViewUserId) {
            await adminApi.sendSupportMessage({
              recipientId: chat.adminViewUserId,
              ...messagePayload
            });
          } else {
            await marketplaceApi.sendSupportMessage(messagePayload);
          }
        } catch (error) {
          addToast('Failed to send message: ' + error.message, 'error');
          // TODO: Handle error state for the sent message (e.g., show an error icon)
        }
      } else {
        let uploaded = [];
        if (fileToUpload) {
          const response = await marketplaceApi.uploadFiles('messages', [fileToUpload], { contractId });
          uploaded = normalizeAttachments(response.data || []);
        }

        await marketplaceApi.sendMessage({
          contractId,
          messageType: uploaded.length > 0 ? 'file' : 'text',
          content: text,
          attachments: uploaded,
        });

        setInput('');
        setFileToUpload(null);
      }
    } catch (error) {
      addToast(error.message || 'Error sending message', 'error');
    } finally {
      setSending(false);
    }
  };

  if (isMinimized) {
    return (
      <div
        onClick={onToggleMinimize}
        className="flex h-10 w-64 cursor-pointer items-center justify-between rounded-t-lg bg-secondary-900 px-3 text-white shadow-lg transition-all hover:bg-secondary-800"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`h-2 w-2 shrink-0 rounded-full ${isAi ? 'bg-emerald-400' : isSupport ? 'bg-amber-400' : 'bg-primary-400'}`} />
          <span className="truncate text-xs font-bold">{chat.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="rounded p-0.5 hover:bg-white/20"
          >
            <Xmark className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[450px] w-80 flex-col rounded-t-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
      {/* Header - sticky to top */}
      <div
        className={`sticky top-0 z-10 flex-shrink-0 flex items-center justify-between px-3 py-2.5 text-white shadow-sm cursor-pointer ${isAi ? 'bg-gradient-to-r from-primary-700 to-primary-600' : 'bg-secondary-900'}`}
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`h-2 w-2 shrink-0 rounded-full ${isAi ? 'bg-emerald-400' : isSupport ? 'bg-amber-400' : 'bg-primary-400'} animate-pulse`} />
          <div className="flex flex-col min-w-0">
            <span className="truncate text-xs font-bold uppercase tracking-wider">{chat.title}</span>
            {isAi && <span className="text-[10px] text-primary-100">AI Assistant</span>}
            {isSupport && <span className="text-[10px] text-amber-100">Hỗ trợ trực tuyến</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(!isAi && !isSupport) && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleStartCall(false); }}
                className="rounded p-1 hover:bg-white/20 text-white"
                title="Gọi thoại"
              >
                <Phone className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleStartCall(true); }}
                className="rounded p-1 hover:bg-white/20 text-emerald-300 hover:text-emerald-400"
                title="Gọi Video"
              >
                <VideoCamera className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-white/20 mx-1 shrink-0" />
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}
            className="rounded p-1 hover:bg-white/20"
            title="Minimize"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="rounded p-1 hover:bg-white/20"
            title="Close"
          >
            <Xmark className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-3 space-y-3">
        {loading && <div className="text-center py-4"><Spinner size="sm" /></div>}

        {messages.length === 0 && !loading && (
          <div className="text-center py-8 px-4">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <ChatBubble className="h-5 w-5" />
            </div>
            <p className="text-xs text-slate-500">
              {isAi ? 'Bắt đầu trò chuyện với trợ lý AI của bạn.' : 'Chưa có tin nhắn nào trong hội thoại này.'}
            </p>
          </div>
        )}

        {messages.map((m, idx) => {
          const isUser = isAi ? m.role === 'user' : m.senderId === user?.id;
          const isBot = isAi && m.role === 'assistant';
          const isAdmin = isSupport && m.senderRole === 'ADMIN';
          return (
            <div key={m.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm relative overflow-hidden ${
                isUser
                  ? (isAi ? 'bg-primary-600 text-white' : 'bg-secondary-900 text-white')
                  : isBot
                    ? 'bg-primary-50 border border-primary-200 text-slate-900 border-l-4 border-l-primary-500'
                    : isAdmin
                      ? 'bg-amber-50 border border-amber-200 text-slate-900 border-l-4 border-l-amber-500'
                      : 'bg-white border border-slate-200 text-slate-800'
              }`}>
                {isBot && (
                  <div className="mb-1 flex items-center gap-1 text-[9px] font-bold text-primary-600 uppercase tracking-tight">
                    <ElectronicsChip className="h-3 w-3" />
                    Trợ lý Thuê Tôi
                  </div>
                )}
                {isBot ? (
                  <AiChatRichText text={m.content} />
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                )}

                {!isAi && m.messageType === 'file' && (
                  <div className="mt-2 border-t border-white/10 pt-2 flex flex-col gap-1">
                    {normalizeAttachments(m.attachments).map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-semibold underline hover:opacity-80"
                      >
                        <Attachment className="h-3 w-3" />
                        {att.name || 'Download'}
                      </a>
                    ))}
                  </div>
                )}

                <div className={`mt-1 text-[9px] opacity-70 ${isUser ? 'text-right' : 'text-left'}`}>
                  {formatDateTime(m.sentAt || m.createdAt, locale)}
                </div>
              </div>
            </div>
          );
        })}
        {sending && isAi && (
          <div className="flex justify-start">
            <div className="bg-primary-50 border border-primary-200 rounded-2xl px-3 py-2 text-xs shadow-sm flex items-center gap-2 border-l-4 border-l-primary-500">
              <Spinner size="xs" inline tone="current" />
              <span className="text-primary-700 font-medium">Trợ lý Thuê Tôi đang trả lời...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="flex-shrink-0 border-t border-slate-100 bg-white p-2">
        {fileToUpload && (
          <div className="mb-2 flex items-center justify-between rounded-md bg-primary-50 px-2 py-1 text-[10px] text-primary-700">
            <span className="truncate flex-1">File: {fileToUpload.name}</span>
            <button onClick={() => setFileToUpload(null)} className="ml-1"><Xmark className="h-3 w-3" /></button>
          </div>
        )}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1 focus-within:border-primary-400 focus-within:bg-white transition-all">
          {(!isAi) && (
            <label className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition">
              <Attachment className="h-4 w-4" />
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFileToUpload(e.target.files?.[0])}
              />
            </label>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Aa"
            className="h-8 flex-1 bg-transparent px-1 text-xs outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={(!input.trim() && !fileToUpload) || sending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-primary-600 text-white transition hover:bg-primary-700 disabled:opacity-50 disabled:bg-slate-300"
          >
            <SendSolid className="h-4 w-4" />
          </button>
        </div>
      </form>

      <VideoCallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        roomName={callRoomName}
        displayName={user?.fullName || `Người dùng #${user?.id}`}
      />
    </div>
  );
};

export default ChatWindow;
