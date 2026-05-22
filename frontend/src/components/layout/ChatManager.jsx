import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChatBubble, ElectronicsChip, Headset, User as UserIcon } from 'iconoir-react';
import marketplaceApi from '../../api/marketplaceApi';
import adminApi from '../../api/adminApi';
import ChatWindow from './ChatWindow';
import { getAccessToken } from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { useNotifications } from '../../hooks/useNotifications';
import { loadAiChatMessages, saveAiChatMessages } from '../../utils/sessionAiChat';
import './ChatManager.css';

const CHAT_WIDTH = 320; // in pixels
const CHAT_SPACING = 16; // in pixels
const CONTRACT_TITLE_MAX_LENGTH = 28;

const truncateText = (value, maxLength = CONTRACT_TITLE_MAX_LENGTH) => {
  const text = String(value || '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
};

const getContractTitle = (contract) => (
  contract?.projectTitle
  || contract?.project?.title
  || contract?.title
  || contract?.projectName
  || contract?.name
  || `Hợp đồng #${contract?.id || ''}`
);

const loadProjectTitleMap = async (contracts) => {
  const projectIds = [...new Set(contracts.map((contract) => contract.projectId).filter(Boolean))];
  const entries = await Promise.all(
    projectIds.map(async (projectId) => {
      try {
        const response = await marketplaceApi.getProject(projectId);
        return [projectId, response.data?.title || ''];
      } catch {
        return [projectId, ''];
      }
    }),
  );
  return new Map(entries);
};

const getPreview = (message) => {
  if (!message) return 'Chưa có tin nhắn.';
  if (message.messageType === 'file') {
    return message.content || '[Tệp đính kèm]';
  }
  return message.content || 'Tin nhắn trống.';
};

const ChatManager = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const { isSupportChatOpen, closeSupportChat } = useNotifications();

  const [isLauncherOpen, setLauncherOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [supportConversations, setSupportConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeChats, setActiveChats] = useState([]);
  const [minimizedChats, setMinimizedChats] = useState([]);
  const [unreadUserIds, setUnreadUserIds] = useState(new Set());

  const socketRef = useRef(null);
  const activeChatsRef = useRef([]);
  const minimizedChatsRef = useRef([]);

  useEffect(() => {
    activeChatsRef.current = activeChats;
    minimizedChatsRef.current = minimizedChats;
  }, [activeChats, minimizedChats]);

  const [aiChatState, setAiChatState] = useState({
    id: 'ai-chat',
    type: 'ai',
    title: t('layout.aiChat.title', 'Trợ lý Thuê Tôi'),
    messages: [],
  });

  const supportChatState = useMemo(() => ({
    id: 'support-chat',
    type: 'support',
    title: t('layout.navigation.supportChat'),
  }), [t]);

  const userId = user?.id;

  // Load AI chat history from session
  useEffect(() => {
    if (!userId) return;
    const storedMessages = loadAiChatMessages(userId).map(m => ({
      ...m,
      id: m.id || `id_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: m.createdAt || new Date().toISOString(),
    }));
    setAiChatState(prev => ({ ...prev, messages: storedMessages }));
  }, [userId]);

  const handleAiMessage = useCallback((updatedMessages) => {
    if (!userId) return;
    saveAiChatMessages(userId, updatedMessages);
    setAiChatState(prev => ({ ...prev, messages: updatedMessages }));
  }, [userId]);

  const toggleLauncher = () => setLauncherOpen(prev => !prev);

  const fetchConversations = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const contractsResponse = await marketplaceApi.getMyContracts();
      const contracts = (contractsResponse.data || []);
      const projectTitleMap = await loadProjectTitleMap(contracts);
      const messagePromises = contracts.map(async (contract) => {
        const res = await marketplaceApi.getMessagesByContract(contract.id, { limit: 1 });
        return {
          contract: {
            ...contract,
            projectTitle: projectTitleMap.get(contract.projectId),
          },
          latest: res.data?.[0],
        };
      });
      const results = await Promise.all(messagePromises);

      const allConversations = results
        .filter(item => item.latest)
        .sort((a, b) => new Date(b.latest.sentAt) - new Date(a.latest.sentAt))
        .map(({ contract, latest }) => ({
          id: contract.id,
          type: 'contract',
          title: truncateText(getContractTitle(contract)),
          fullTitle: getContractTitle(contract),
          latestMessage: latest,
        }));
      setConversations(allConversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLauncherOpen) {
      fetchConversations();
      if (user?.role === 'ADMIN') {
        fetchSupportUsers();
      }
    }
  }, [isLauncherOpen, userId]);

  const fetchSupportUsers = async () => {
    try {
      const response = await adminApi.getAllUsers();
      if (response.success) {
        setSupportConversations(response.data.filter(u => u.role !== 'ADMIN'));
      }
    } catch (error) {
      console.error("Failed to fetch support users:", error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const connectWebSocket = () => {
      const token = getAccessToken();
      if (!token || token === 'null') return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/support?token=${token}`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const message = data.event === 'SUPPORT_MESSAGE_CREATED' ? data.data : data;

          console.log('[ChatManagerWS] Received message:', message);

          if (message && message.id) {
            // Broadcast to any open ChatWindows
            window.dispatchEvent(new CustomEvent('thuetoi:support-message', { detail: message }));

            if (message.senderId && message.senderId !== userId) {
              const isChatActive = activeChatsRef.current.some(c =>
                (c.id === 'support-chat' && !c.adminViewUserId) ||
                (c.adminViewUserId === message.senderId)
              );
              const isMinimized = minimizedChatsRef.current.some(c =>
                (c.id === 'support-chat' && !c.adminViewUserId) ||
                (c.adminViewUserId === message.senderId)
              );

              if (!isChatActive || isMinimized) {
                setUnreadUserIds(prev => new Set([...prev, message.senderId]));
              }
            }
          }
        } catch (err) {
          console.error('[ChatManagerWS] Error:', err);
        }
      };

      socket.onclose = () => setTimeout(connectWebSocket, 5000);
    };

    connectWebSocket();
    return () => socketRef.current?.close();
  }, [userId]);

  const openChat = (chatId, chatType = 'contract', extraData = {}) => {
    let chatToOpen;
    const uniqueId = chatType === 'support' && extraData.adminViewUserId
      ? `support-${extraData.adminViewUserId}`
      : chatId;

    if (chatType === 'ai') {
      chatToOpen = { ...aiChatState, onAiMessage: handleAiMessage };
    } else if (chatType === 'support') {
      if (extraData.adminViewUserId) {
        chatToOpen = {
          id: uniqueId,
          type: 'support',
          title: extraData.title || 'Support',
          adminViewUserId: extraData.adminViewUserId
        };
      } else {
        chatToOpen = supportChatState;
      }
    } else {
      chatToOpen = conversations.find(c => c.id === chatId);
    }

    if (!chatToOpen) return;

    // Clear unread for this user
    if (chatType === 'support') {
      if (extraData.adminViewUserId) {
        setUnreadUserIds(prev => {
          const next = new Set(prev);
          next.delete(extraData.adminViewUserId);
          return next;
        });
      } else {
        // For regular user, just clear everything (they only have one support chat)
        setUnreadUserIds(new Set());
      }
    }

    // If it's minimized, un-minimize it.
    if (minimizedChats.some(c => c.id === uniqueId)) {
      setMinimizedChats(prev => prev.filter(c => c.id !== uniqueId));
    }
    // If it's not already active, add it.
    if (!activeChats.some(c => c.id === uniqueId)) {
      setActiveChats(prev => [...prev, chatToOpen]);
    }
  };

  const closeChat = (chatId) => {
    if (chatId === 'support-chat') {
      closeSupportChat();
    }
    setActiveChats(prev => prev.filter(c => c.id !== chatId));
    setMinimizedChats(prev => prev.filter(c => c.id !== chatId));
  };

  const toggleMinimize = (chatId) => {
    if (minimizedChats.some(c => c.id === chatId)) {
      setMinimizedChats(prev => prev.filter(c => c.id !== chatId));
      // When un-minimizing, clear unread if it's a support chat
      const chat = activeChats.find(c => c.id === chatId);
      if (chat?.type === 'support') {
        if (chat.adminViewUserId) {
          setUnreadUserIds(prev => {
            const next = new Set(prev);
            next.delete(chat.adminViewUserId);
            return next;
          });
        } else {
          setUnreadUserIds(new Set());
        }
      }
    } else {
      setMinimizedChats(prev => [...prev, ...activeChats.filter(c => c.id === chatId)]);
    }
  };

  const visibleWindows = useMemo(() => {
    const list = [...activeChats];
    if (isSupportChatOpen && !list.some(c => c.id === 'support-chat')) {
      list.push(supportChatState);
    }
    return list.filter(c => !minimizedChats.some(mc => mc.id === c.id));
  }, [activeChats, minimizedChats, isSupportChatOpen, supportChatState]);
  const minimizedWindows = useMemo(() => activeChats.filter(c => minimizedChats.some(mc => mc.id === c.id)), [activeChats, minimizedChats]);
  const hasOpenChat = activeChats.length > 0 || isSupportChatOpen;

  return (
    <>
      {/* Chat Dock */}
      <div className="fixed bottom-20 right-4 z-[100] flex items-end justify-end gap-4 pointer-events-none lg:bottom-0">
        {/* Render active, non-minimized windows */}
        {visibleWindows.map((chat) => (
          <div key={chat.id} className="pointer-events-auto">
            <ChatWindow
              chat={chat}
              onClose={() => closeChat(chat.id)}
              onToggleMinimize={() => toggleMinimize(chat.id)}
              isMinimized={false}
              onMessageReceived={(msg) => {
                if (chat.adminViewUserId === msg.senderId) {
                  // Already open and visible, no need to mark as unread
                }
              }}
            />
          </div>
        ))}
        {/* Render minimized windows */}
        {minimizedWindows.map((chat) => (
          <div key={chat.id} className="pointer-events-auto">
            <ChatWindow
              chat={chat}
              onClose={() => closeChat(chat.id)}
              onToggleMinimize={() => toggleMinimize(chat.id)}
              isMinimized={true}
            />
          </div>
        ))}
      </div>

      {/* Launcher Button */}
      <div className={`fixed bottom-24 right-6 z-[110] lg:bottom-6 ${hasOpenChat ? "hidden" : ""}`}>
        {isLauncherOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-80 max-h-[60vh] overflow-y-auto rounded-lg bg-white shadow-2xl border border-slate-200 p-2 flex flex-col">
            <div className="p-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-secondary-900">{t('layout.conversations')}</h3>
            </div>
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
            ) : (
              <>
                {/* AI Chat entry */}
                <button
                  onClick={() => { openChat('ai-chat', 'ai'); setLauncherOpen(false); }}
                  className="w-full text-left p-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-primary-100 flex items-center justify-center rounded-lg shadow-inner">
                    <ElectronicsChip className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-slate-800 truncate">{aiChatState.title}</div>
                    <div className="text-xs text-slate-500 truncate">{getPreview(aiChatState.messages[aiChatState.messages.length - 1])}</div>
                  </div>
                </button>
                {/* Support Chat entry */}
                <button
                  onClick={() => { openChat('support-chat', 'support'); setLauncherOpen(false); }}
                  className="w-full text-left p-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-amber-100 flex items-center justify-center rounded-lg shadow-inner">
                    <Headset className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-slate-800 truncate">{supportChatState.title}</div>
                    <div className="text-xs text-slate-500 truncate">Hỗ trợ trực tuyến</div>
                  </div>
                </button>

                {/* Support Chat List for Admin */}
                {user?.role === 'ADMIN' && supportConversations.length > 0 && (
                  <>
                    <div className="p-2 border-t border-slate-100 mt-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hỗ trợ khách hàng</h4>
                    </div>
                    {supportConversations.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          openChat(`support-${u.id}`, 'support', { adminViewUserId: u.id, title: u.fullName });
                          setLauncherOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-3 relative"
                      >
                        <div className="w-8 h-8 bg-slate-100 flex items-center justify-center rounded-full">
                          <UserIcon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs text-slate-800 truncate">{u.fullName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{u.role}</div>
                        </div>
                        {unreadUserIds.has(u.id) && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full shadow-sm" />
                        )}
                      </button>
                    ))}
                  </>
                )}

                {/* Contract chat entries */}
                {conversations.map((convo, index) => (
                  <button
                    key={convo.id}
                    onClick={() => {
                      openChat(convo.id, "contract");
                      setLauncherOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-secondary-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-secondary-700">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-slate-800 truncate" title={convo.fullTitle}>
                        {convo.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{getPreview(convo.latestMessage)}</div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        <div className="relative">
          <button
            onClick={toggleLauncher}
            className="chat-launcher-round-icon flex h-16 w-16 items-center justify-center bg-teal-500 text-white shadow-lg transition-transform hover:scale-105 hover:bg-teal-600"
            aria-label="Open chat"
          >
            <ChatBubble className="h-8 w-8" />
          </button>
          {unreadUserIds.size > 0 && (
            <div
              className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 flex h-5 w-5 animate-bounce items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
              style={{ borderRadius: '50%' }}
            >
              {unreadUserIds.size}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatManager;
