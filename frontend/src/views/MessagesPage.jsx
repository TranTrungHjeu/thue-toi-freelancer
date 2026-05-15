"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Attachment, ChatBubble, Search, SendSolid, Xmark } from 'iconoir-react';

import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import marketplaceApi from '../api/marketplaceApi';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../hooks/useI18n';
import { createMessageRealtimeClient } from '../api/realtimeClient';
import { formatAttachmentSize, normalizeAttachments } from '../utils/attachments';
import { formatDateTime } from '../utils/formatters';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const getPreview = (message) => {
  if (!message) return 'Chưa có tin nhắn.';
  if (message.messageType === 'file') {
    const attachmentNames = normalizeAttachments(message.attachments)
      .map((attachment) => attachment.name)
      .filter(Boolean)
      .join(', ');
    return message.content || attachmentNames || '[Tệp đính kèm]';
  }
  return message.content || 'Tin nhắn trống.';
};

const hasAttachments = (attachments) => normalizeAttachments(attachments).length > 0;

const ContractAvatar = ({ contractId, active }) => (
  <div className={`flex h-11 w-11 shrink-0 items-center justify-center border text-sm font-black ${
    active ? 'border-primary-600 bg-primary-600 text-white' : 'border-secondary-900 bg-secondary-900 text-white'
  }`}>
    #{contractId}
  </div>
);

const MessageAttachmentLinks = ({ attachments, isSender }) => {
  const normalizedAttachments = normalizeAttachments(attachments);

  if (normalizedAttachments.length === 0) {
    return null;
  }

  return (
    <div className={`mt-2 flex max-w-full flex-col gap-2 ${isSender ? 'items-end' : 'items-start'}`}>
      {normalizedAttachments.map((attachment, index) => {
        const meta = [formatAttachmentSize(attachment.size), attachment.contentType].filter(Boolean).join(' - ');
        return (
          <a
            key={`${attachment.url}-${index}`}
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className={`max-w-full border px-3 py-2 text-xs font-semibold underline-offset-2 hover:underline ${
              isSender
                ? 'border-slate-500 bg-slate-800 text-slate-100'
                : 'border-slate-300 bg-white text-primary-700 hover:border-primary-500'
            }`}
          >
            <span className="block truncate">{attachment.name}</span>
            {meta && <span className={`block font-medium ${isSender ? 'text-slate-300' : 'text-slate-500'}`}>{meta}</span>}
          </a>
        );
      })}
    </div>
  );
};

const MessagesPage = () => {
  const { user } = useAuth();
  const { locale } = useI18n();
  const [items, setItems] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState('');
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [, setReadByContract] = useState({});
  const messagesEndRef = useRef(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.contract.id === selectedContractId) || null,
    [items, selectedContractId],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return items;
    return items.filter(({ contract, latest }) =>
      `hợp đồng #${contract.id} ${getPreview(latest)}`.toLowerCase().includes(normalizedSearch),
    );
  }, [items, search]);

  const normalizedDraftAttachments = useMemo(() => normalizeAttachments(attachments), [attachments]);

  const readStorageKey = user?.id ? `thuetoi_message_reads_${user.id}` : null;

  const markContractRead = useCallback((contractId, sentAt) => {
    if (!contractId || !readStorageKey) return;
    const readTime = sentAt || new Date().toISOString();
    setReadByContract((previous) => {
      const previousTime = new Date(previous[contractId] || 0).getTime();
      const nextTime = new Date(readTime || 0).getTime();
      if (previousTime >= nextTime) return previous;

      const next = { ...previous, [contractId]: readTime };
      try {
        window.localStorage.setItem(readStorageKey, JSON.stringify(next));
      } catch {
        // Local read state is a UX hint; failures should not block messaging.
      }
      return next;
    });
  }, [readStorageKey]);

  useEffect(() => {
    if (!readStorageKey) {
      setReadByContract({});
      return;
    }

    try {
      setReadByContract(JSON.parse(window.localStorage.getItem(readStorageKey) || '{}'));
    } catch {
      setReadByContract({});
    }
  }, [readStorageKey]);

  useEffect(() => {
    let mounted = true;

    const loadInbox = async () => {
      setLoadingInbox(true);
      try {
        const contractsResponse = await marketplaceApi.getMyContracts();
        const contracts = contractsResponse.data || [];
        const messageResponses = await Promise.all(
          contracts.map(async (contract) => {
            const response = await marketplaceApi.getMessagesByContract(contract.id);
            const contractMessages = response.data || [];
            return {
              contract,
              latest: contractMessages[contractMessages.length - 1] || null,
            };
          }),
        );

        const normalized = messageResponses
          .sort((a, b) => new Date(b.latest?.sentAt || 0) - new Date(a.latest?.sentAt || 0));

        if (!mounted) return;
        setItems(normalized);
        if (normalized.length > 0) {
          setSelectedContractId((previous) => previous || normalized[0].contract.id);
        }
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoadingInbox(false);
      }
    };

    loadInbox();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedContractId) return;
    let mounted = true;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await marketplaceApi.getMessagesByContract(selectedContractId);
        if (mounted) {
          const nextMessages = response.data || [];
          setMessages(nextMessages);
          const latestMessage = nextMessages[nextMessages.length - 1];
          if (latestMessage?.senderId !== user?.id) {
            markContractRead(selectedContractId, latestMessage.sentAt);
          }
        }
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    };

    loadMessages();
    return () => {
      mounted = false;
    };
  }, [markContractRead, selectedContractId, user?.id]);

  useEffect(() => {
    if (!selectedContractId) return undefined;

    const realtimeClient = createMessageRealtimeClient({
      contractId: selectedContractId,
      onMessage: (incomingMessage) => {
        setMessages((previous) =>
          previous.some((message) => message.id === incomingMessage.id)
            ? previous
            : [...previous, incomingMessage],
        );
        setItems((previous) =>
          previous
            .map((item) =>
              item.contract.id === selectedContractId ? { ...item, latest: incomingMessage } : item,
            )
            .sort((a, b) => new Date(b.latest?.sentAt || 0) - new Date(a.latest?.sentAt || 0)),
        );
        if (incomingMessage.senderId !== user?.id) {
          markContractRead(selectedContractId, incomingMessage.sentAt);
        }
      },
    });

    return () => realtimeClient.close();
  }, [markContractRead, selectedContractId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, loadingMessages]);

  const handleSelectConversation = (contractId, latest) => {
    setSelectedContractId(contractId);
    if (latest?.sentAt) {
      markContractRead(contractId, latest.sentAt);
    }
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    if (!selectedFile || !selectedContractId) return;
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFormError('Tệp tối đa 5MB.');
      return;
    }

    setUploadingAttachment(true);
    setFormError('');
    try {
      const response = await marketplaceApi.uploadMessageAttachment(selectedContractId, selectedFile);
      const uploadedAttachments = normalizeAttachments(response.data || []);
      if (uploadedAttachments.length === 0) {
        setFormError('Không nhận được metadata tệp từ CDN.');
        return;
      }
      setAttachments(uploadedAttachments);
      if (!content.trim()) setContent(selectedFile.name);
    } catch (error) {
      setFormError(error?.message || 'Tải tệp lên thất bại.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedContractId || (!content.trim() && !hasAttachments(attachments))) return;

    setSubmitting(true);
    setFormError('');
    try {
      const hasFiles = hasAttachments(attachments);
      const response = await marketplaceApi.sendMessage({
        contractId: selectedContractId,
        messageType: hasFiles ? 'file' : 'text',
        content: content.trim(),
        attachments: hasFiles ? attachments : [],
      });
      const sentMessage = response.data;
      if (sentMessage?.id) {
        setMessages((previous) =>
          previous.some((message) => message.id === sentMessage.id) ? previous : [...previous, sentMessage],
        );
        setItems((previous) =>
          previous
            .map((item) =>
              item.contract.id === selectedContractId ? { ...item, latest: sentMessage } : item,
            )
            .sort((a, b) => new Date(b.latest?.sentAt || 0) - new Date(a.latest?.sentAt || 0)),
        );
        markContractRead(selectedContractId, sentMessage.sentAt);
      }
      setContent('');
      setAttachments('');
    } catch (error) {
      setFormError(error?.message || 'Không gửi được tin nhắn.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-7xl flex-col gap-4 overflow-hidden">
      <section className="flex shrink-0 flex-col justify-between gap-3 border border-primary-700 bg-primary-600 px-4 py-4 text-white shadow-sm md:flex-row md:items-center md:px-5">
        <div className="flex items-center gap-3">
          <ChatBubble className="h-7 w-7" />
          <div>
            <h1 className="text-xl font-black leading-tight md:text-2xl">Tin nhắn</h1>
            <p className="mt-0.5 text-sm font-medium text-primary-50">Quản lý cuộc trò chuyện theo từng hợp đồng.</p>
          </div>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 overflow-hidden border border-slate-200 bg-white shadow-sm lg:grid-cols-[20rem_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm hội thoại..."
                className="[&_.ui-field]:pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingInbox && <div className="p-4 text-sm font-medium text-slate-500">Đang tải hội thoại...</div>}
            {!loadingInbox && filteredItems.length === 0 && (
              <div className="p-4 text-sm font-medium text-slate-500">Không có hội thoại phù hợp.</div>
            )}
            {!loadingInbox && filteredItems.map(({ contract, latest }) => {
              const active = selectedContractId === contract.id;
              return (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => handleSelectConversation(contract.id, latest)}
                  className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition ${
                    active ? 'bg-primary-50' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <ContractAvatar contractId={contract.id} active={active} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-black text-secondary-900">Hợp đồng #{contract.id}</span>
                      <span className="shrink-0 text-[11px] font-medium text-slate-400">
                        {latest?.sentAt ? formatDateTime(latest.sentAt, locale) : 'Mới'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500">{getPreview(latest)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col bg-slate-50">
          {!selectedContractId && (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon={ChatBubble}
                title="Chọn một cuộc trò chuyện"
                description="Chọn một hợp đồng ở danh sách bên trái để xem và gửi tin nhắn."
                className="w-full border-slate-200 bg-white"
              />
            </div>
          )}

          {selectedContractId && (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Hội thoại</div>
                  <h2 className="mt-1 text-lg font-black text-secondary-900">
                    Hợp đồng #{selectedItem?.contract.id || selectedContractId}
                  </h2>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
                {loadingMessages && <div className="text-sm font-medium text-slate-500">Đang tải tin nhắn...</div>}
                {!loadingMessages && messages.map((message) => {
                  const isSender = message.senderId === user?.id;
                  return (
                    <div key={message.id} className={`mb-4 flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[min(38rem,82%)] border px-4 py-3 text-sm shadow-sm ${
                        isSender
                          ? 'border-secondary-900 bg-secondary-900 text-white'
                          : 'border-slate-200 bg-white text-slate-800'
                      }`}>
                        <div className="whitespace-pre-wrap leading-relaxed">{getPreview(message)}</div>
                        {message.messageType === 'file' && (
                          <MessageAttachmentLinks attachments={message.attachments} isSender={isSender} />
                        )}
                        <div className={`mt-2 text-[11px] ${isSender ? 'text-slate-300' : 'text-slate-400'}`}>
                          {formatDateTime(message.sentAt, locale)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {normalizedDraftAttachments.length > 0 && (
                <div className="border-t border-slate-200 bg-white px-4 py-3">
                  {normalizedDraftAttachments.map((attachment, index) => (
                    <div key={`${attachment.url}-${index}`} className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-primary-700">{attachment.name}</div>
                        <div className="text-xs text-slate-500">
                          {formatAttachmentSize(attachment.size) || 'CDN'} {attachment.contentType}
                        </div>
                      </div>
                      <button type="button" onClick={() => setAttachments('')} className="text-slate-500 hover:text-red-600">
                        <Xmark className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formError && (
                <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200">
                    <Attachment className="h-5 w-5" />
                    <input
                      type="file"
                      className="hidden"
                      disabled={submitting || uploadingAttachment}
                      onChange={handleFileChange}
                    />
                  </label>
                  <Input
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder={uploadingAttachment ? 'Đang tải tệp lên CDN...' : 'Nhập tin nhắn...'}
                    disabled={submitting || uploadingAttachment}
                    className="min-w-0 flex-1"
                  />
                  <button
                    type="submit"
                    className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-primary-600 bg-primary-600 text-white shadow-sm transition hover:border-primary-700 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submitting || uploadingAttachment || (!content.trim() && !hasAttachments(attachments))}
                  >
                    <SendSolid className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-400">Tối đa 5MB mỗi tệp.</div>
              </form>
            </>
          )}
        </main>
      </section>
    </div>
  );
};

export default MessagesPage;
