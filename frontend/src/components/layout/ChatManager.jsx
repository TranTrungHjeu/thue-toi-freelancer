import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChatBubble, ElectronicsChip } from 'iconoir-react';
import marketplaceApi from '../../api/marketplaceApi';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
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

  const [isLauncherOpen, setLauncherOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeChats, setActiveChats] = useState([]);
  const [minimizedChats, setMinimizedChats] = useState([]);

  const [aiChatState, setAiChatState] = useState({
    id: 'ai-chat',
    type: 'ai',
    title: t('layout.aiChat.title', 'Trợ lý Thuê Tôi'),
    messages: [],
  });

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
    }
  }, [isLauncherOpen, userId]);

  const openChat = (chatId, chatType = 'contract') => {
    const chatToOpen = chatType === 'ai'
      ? { ...aiChatState, onAiMessage: handleAiMessage }
      : conversations.find(c => c.id === chatId);

    if (!chatToOpen) return;

    // If it's minimized, un-minimize it.
    if (minimizedChats.some(c => c.id === chatId)) {
      setMinimizedChats(prev => prev.filter(c => c.id !== chatId));
    }
    // If it's not already active, add it.
    if (!activeChats.some(c => c.id === chatId)) {
      setActiveChats(prev => [...prev, chatToOpen]);
    }
  };

  const closeChat = (chatId) => {
    setActiveChats(prev => prev.filter(c => c.id !== chatId));
    setMinimizedChats(prev => prev.filter(c => c.id !== chatId));
  };

  const toggleMinimize = (chatId) => {
    if (minimizedChats.some(c => c.id === chatId)) {
      setMinimizedChats(prev => prev.filter(c => c.id !== chatId));
    } else {
      setMinimizedChats(prev => [...prev, ...activeChats.filter(c => c.id === chatId)]);
    }
  };

  const visibleWindows = useMemo(() => activeChats.filter(c => !minimizedChats.some(mc => mc.id === c.id)), [activeChats, minimizedChats]);
  const minimizedWindows = useMemo(() => activeChats.filter(c => minimizedChats.some(mc => mc.id === c.id)), [activeChats, minimizedChats]);
  const hasOpenChat = activeChats.length > 0;

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
      <div className={`fixed bottom-24 right-6 z-[110] lg:bottom-6 ${hasOpenChat ? 'hidden' : ''}`}>
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
                {/* Contract chat entries */}
                {conversations.map((convo, index) => (
                  <button
                    key={convo.id}
                    onClick={() => { openChat(convo.id, 'contract'); setLauncherOpen(false); }}
                    className="w-full text-left p-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-secondary-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-secondary-700">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-slate-800 truncate" title={convo.fullTitle}>{convo.title}</div>
                      <div className="text-xs text-slate-500 truncate">{getPreview(convo.latestMessage)}</div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        <button
          onClick={toggleLauncher}
          className="chat-launcher-round-icon flex h-16 w-16 items-center justify-center bg-teal-500 text-white shadow-lg hover:bg-teal-600 transition-transform hover:scale-105"
          aria-label="Open chat"
        >
          <ChatBubble className="h-8 w-8" />
        </button>
      </div>
    </>
  );
};

export default ChatManager;
