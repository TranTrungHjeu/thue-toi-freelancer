import React, { useState, useEffect, useRef } from 'react';
import {
  ChatBubble,
  Send,
  User as UserIcon,
  Search,
  Headset,
  Attachment,
  Xmark
} from 'iconoir-react';
import { H1, Text, Caption } from '../../components/common/Typography';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import adminApi from '../../api/adminApi';
import marketplaceApi from '../../api/marketplaceApi';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import Spinner from '../../components/common/Spinner';
import { formatDateTime } from '../../utils/formatters';
import { normalizeAttachments } from '../../utils/attachments';
import { getAccessToken } from '../../api/axiosClient';

const AdminSupportPage = () => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchUsers();
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const token = getAccessToken();
    if (!token || token === 'null') {
      console.error('[AdminSupportWebSocket] No token found.');
      return;
    }

    const wsUrl = process.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/support?token=${token}`;
    console.log('[AdminSupportWebSocket] Connecting to:', wsUrl);

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      console.log('[AdminSupportWebSocket] Raw message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('[AdminSupportWebSocket] Parsed data:', data);

        // Backend sends MessageRealtimeEvent which has 'event' and 'data' (the message)
        const message = data.event === 'SUPPORT_MESSAGE_CREATED' ? data.data : data;
        console.log('[AdminSupportWebSocket] Extracted message:', message);

        if (message && message.id) {
          // Only add message if it's related to the currently selected user
          setSelectedUser(currentSelected => {
            console.log('[AdminSupportWebSocket] Current selected user:', currentSelected?.id);
            if (currentSelected && (message.senderId === currentSelected.id || message.recipientId === currentSelected.id)) {
              console.log('[AdminSupportWebSocket] Message matches selected user, adding to list');
              setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === message.id)) {
                  console.log('[AdminSupportWebSocket] Duplicate message ignored:', message.id);
                  return prev;
                }
                return [...prev, message];
              });
            } else {
              console.log('[AdminSupportWebSocket] Message does not match selected user. Sender:', message.senderId, 'Recipient:', message.recipientId);
            }
            return currentSelected;
          });
        } else {
          console.warn('[AdminSupportWebSocket] Received message without ID:', message);
        }
      } catch (error) {
        console.error("[AdminSupportWebSocket] Error parsing message:", error);
      }
    };

    socket.onopen = () => console.log('[AdminSupportWebSocket] Connection established');
    socket.onerror = (err) => console.error('[AdminSupportWebSocket] Connection error:', err);
    socket.onclose = (event) => {
      console.log('[AdminSupportWebSocket] Connection closed:', event.code, event.reason);
      // Reconnect after 3 seconds if closed unexpectedly
      setTimeout(connectWebSocket, 3000);
    };
  };

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getAllUsers();
      if (response.success) {
        // Filter out admins from chat list to keep it focused on support
        setUsers(response.data.filter(u => u.role !== 'ADMIN'));
      }
    } catch {
      addToast(t('errors.code.ERR_SYS_01'), 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMessages = async (userId) => {
    setLoadingMessages(true);
    try {
      const response = await adminApi.getSupportMessages(userId);
      if (response.success) {
        setMessages(response.data);
      }
    } catch {
      addToast(t('errors.code.ERR_SYS_01'), 'error');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchMessages(user.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !fileToUpload) || !selectedUser || sending) return;

    setSending(true);
    try {
      let uploaded = [];
      if (fileToUpload) {
        const response = await marketplaceApi.uploadFiles('support', [fileToUpload]);
        uploaded = normalizeAttachments(response.data || []);
      }

      const response = await adminApi.sendSupportMessage({
        recipientId: selectedUser.id,
        content: newMessage,
        attachments: uploaded,
        messageType: uploaded.length > 0 ? 'file' : 'text'
      });
      if (response.success) {
        setNewMessage('');
        setFileToUpload(null);
      }
    } catch {
      addToast(t('errors.code.ERR_SYS_01'), 'error');
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-160px)]">
      <header className="flex items-center gap-3">
        <div className="flex items-center justify-center p-2 bg-primary-600 rounded-lg text-white">
          <Headset className="w-5 h-5" />
        </div>
        <div>
          <H1 className="text-2xl font-bold tracking-tight text-slate-900">Support Center</H1>
          <Caption className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Realtime Chat with Users</Caption>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 overflow-hidden">
        {/* User List */}
        <Card className="md:col-span-1 flex flex-col p-0 overflow-hidden bg-white border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingUsers ? (
              <div className="flex justify-center p-8"><Spinner size="sm" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No users found</div>
            ) : (
              filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full p-4 flex items-center gap-3 transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0 ${selectedUser?.id === user.id ? 'bg-primary-50 hover:bg-primary-50' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${user.role === 'FREELANCER' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-bold text-slate-900 truncate w-full text-left">{user.fullName}</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase">{user.role}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-3 flex flex-col p-0 overflow-hidden bg-white border-slate-200">
          {selectedUser ? (
            <>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{selectedUser.fullName}</span>
                    <span className="text-[10px] text-slate-400">{selectedUser.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {loadingMessages ? (
                  <div className="flex justify-center p-8"><Spinner size="md" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-30 italic text-slate-400 text-sm">
                    <ChatBubble className="w-12 h-12 mb-2" />
                    No messages yet. Say hello!
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.senderId === selectedUser.id
                          ? 'bg-slate-100 text-slate-800 self-start rounded-tl-none'
                          : 'bg-primary-600 text-white self-end rounded-tr-none'
                      }`}
                    >
                      <div className="break-words">{msg.content}</div>

                      {msg.messageType === 'file' && (
                        <div className={`mt-2 border-t pt-2 flex flex-col gap-1 ${msg.senderId === selectedUser.id ? 'border-slate-200' : 'border-white/10'}`}>
                          {normalizeAttachments(msg.attachments).map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 font-semibold underline hover:opacity-80"
                            >
                              <Attachment className="w-3 h-3" />
                              {att.name || 'Download'}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className={`text-[9px] mt-1 opacity-60 ${msg.senderId === selectedUser.id ? 'text-slate-500' : 'text-primary-100'}`}>
                        {formatDateTime(msg.createdAt || msg.sentAt)}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-slate-50/50">
                {fileToUpload && (
                  <div className="mb-2 flex items-center justify-between rounded-md bg-primary-50 px-3 py-1 text-[10px] text-primary-700 border border-primary-100">
                    <span className="truncate flex-1">File: {fileToUpload.name}</span>
                    <button type="button" onClick={() => setFileToUpload(null)} className="ml-1 hover:text-primary-900"><Xmark className="w-3 h-3" /></button>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition">
                    <Attachment className="w-4 h-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFileToUpload(e.target.files?.[0])}
                      disabled={sending}
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="rounded-xl px-4 h-10"
                    disabled={(!newMessage.trim() && !fileToUpload) || sending}
                  >
                    {sending ? <Spinner size="xs" tone="current" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <Headset className="w-10 h-10 text-slate-300" />
              </div>
              <H1 className="text-xl font-bold text-slate-900 mb-2">Select a User</H1>
              <Text className="text-slate-400 text-sm max-w-xs">Choose a user from the list on the left to start a support conversation.</Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminSupportPage;
