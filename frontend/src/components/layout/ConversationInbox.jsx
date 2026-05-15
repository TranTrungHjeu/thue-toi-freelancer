"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { ArrowUpRightSquare, Attachment, ChatBubble, NavArrowDown, SendSolid, Xmark } from 'iconoir-react';
import marketplaceApi from '../../api/marketplaceApi';
import { formatDateTime } from '../../utils/formatters';
import { formatAttachmentSize, normalizeAttachments } from '../../utils/attachments';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../hooks/useAuth';
import { createMessageRealtimeClient } from '../../api/realtimeClient';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const getPreview = (message) => {
  if (!message) return 'Chưa có tin nhắn.';
  if (message.messageType === 'file') {
    const attachmentNames = normalizeAttachments(message.attachments)
      .map((attachment) => attachment.name)
      .filter(Boolean)
      .join(', ');
    if (!message.content && attachmentNames) return attachmentNames;
    return message.content || '[Tệp đính kèm]';
  }
  return message.content || 'Tin nhắn trống.';
};

const hasAttachments = (attachments) => normalizeAttachments(attachments).length > 0;

const getMessageTime = (message) => new Date(message?.sentAt || 0).getTime();

const MessageAttachmentLinks = ({ attachments, isSender }) => {
  const normalizedAttachments = normalizeAttachments(attachments);

  if (normalizedAttachments.length === 0) {
    return null;
  }

  return (
    <div className={`mt-2 flex max-w-full flex-col gap-2 ${isSender ? 'items-end' : 'items-start'}`}>
      {normalizedAttachments.map((attachment, index) => {
        const sizeLabel = formatAttachmentSize(attachment.size);
        const meta = [sizeLabel, attachment.contentType].filter(Boolean).join(' - ');

        return (
          <a
            key={`${attachment.url}-${index}`}
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className={`max-w-full border px-2.5 py-2 text-xs font-semibold underline-offset-2 hover:underline ${
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

const ConversationInbox = () => {
  const { locale } = useI18n();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [readByContract, setReadByContract] = useState({});
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  const selectedContractIdRef = useRef(selectedContractId);

  const selectedItem = useMemo(
    () => items.find((item) => item.contract.id === selectedContractId) || null,
    [items, selectedContractId],
  );

  const normalizedDraftAttachments = useMemo(() => normalizeAttachments(attachments), [attachments]);

  const readStorageKey = user?.id ? `thuetoi_message_reads_${user.id}` : null;
  const contractSubscriptionKey = useMemo(
    () => [...new Set(items.map((item) => item.contract.id).filter(Boolean))]
      .sort((first, second) => Number(first) - Number(second))
      .join(','),
    [items],
  );

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    selectedContractIdRef.current = selectedContractId;
  }, [selectedContractId]);

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
        // Ignore local persistence failures; unread state can be rebuilt from latest messages.
      }
      return next;
    });
  }, [readStorageKey]);

  const unreadConversationCount = useMemo(() => (
    items.filter(({ contract, latest }) => {
      if (!latest || latest.senderId === user?.id) return false;
      const readTime = new Date(readByContract[contract.id] || 0).getTime();
      return getMessageTime(latest) > readTime;
    }).length
  ), [items, readByContract, user?.id]);

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
    if (!user?.id) return;
    let mounted = true;

    const loadInbox = async () => {
      setLoading(true);
      try {
        const contractsResponse = await marketplaceApi.getMyContracts();
        const contracts = contractsResponse.data || [];
        const messageResponses = await Promise.all(
          contracts.map(async (contract) => {
            const response = await marketplaceApi.getMessagesByContract(contract.id);
            const contractMessages = response.data || [];
            const latest = contractMessages[contractMessages.length - 1] || null;
            return { contract, latest };
          }),
        );

        const normalized = messageResponses
          .sort((a, b) => new Date(b.latest?.sentAt || 0) - new Date(a.latest?.sentAt || 0));

        if (!mounted) return;
        setItems(normalized);
        if (normalized.length > 0) {
          setSelectedContractId((previous) => previous || normalized[0].contract.id);
        } else {
          setSelectedContractId(null);
          setMessages([]);
        }
      } catch {
        if (mounted) {
          setItems([]);
          setSelectedContractId(null);
          setMessages([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadInbox();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isOpen || !selectedContractId) return;
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
  }, [isOpen, markContractRead, selectedContractId, user?.id]);

  useEffect(() => {
    if (!user?.id || !contractSubscriptionKey) return undefined;

    const realtimeClients = contractSubscriptionKey.split(',').map((contractId) =>
      createMessageRealtimeClient({
        contractId,
        onMessage: (incomingMessage) => {
          const incomingContractId = Number(incomingMessage.contractId || contractId);
          const isSelectedConversation = selectedContractIdRef.current === incomingContractId;

          if (isSelectedConversation) {
            setMessages((previous) => {
              if (previous.some((message) => message.id === incomingMessage.id)) {
                return previous;
              }
              return [...previous, incomingMessage];
            });
          }

          setItems((previous) =>
            previous
              .map((item) =>
                item.contract.id === incomingContractId ? { ...item, latest: incomingMessage } : item,
              )
              .sort((a, b) => new Date(b.latest?.sentAt || 0) - new Date(a.latest?.sentAt || 0)),
          );

          if (isOpenRef.current && isSelectedConversation && incomingMessage.senderId !== user?.id) {
            markContractRead(incomingContractId, incomingMessage.sentAt);
          }
        },
      }),
    );

    return () => {
      realtimeClients.forEach((client) => client.close());
    };
  }, [contractSubscriptionKey, markContractRead, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, loadingMessages, isOpen]);

  const handleSelectConversation = (contractId, latest) => {
    setSelectedContractId(contractId);
    if (latest?.sentAt) {
      markContractRead(contractId, latest.sentAt);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedContractId) return;
    if (!content.trim() && !hasAttachments(attachments)) return;

    setSubmitting(true);
    setUploadError('');
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
      setUploadError(error?.message || 'Không gửi được tin nhắn.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    if (!selectedFile || !selectedContractId) return;

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('Tệp tối đa 5MB.');
      return;
    }

    setUploadingAttachment(true);
    setUploadError('');
    try {
      const response = await marketplaceApi.uploadMessageAttachment(selectedContractId, selectedFile);
      const uploadedAttachments = normalizeAttachments(response.data || []);
      if (uploadedAttachments.length === 0) {
        setUploadError('Không nhận được metadata tệp từ CDN.');
        return;
      }
      setAttachments(uploadedAttachments);
      if (!content.trim()) setContent(selectedFile.name);
    } catch (error) {
      setAttachments('');
      setUploadError(error?.message || 'Tải tệp lên thất bại.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-[120] lg:bottom-6 lg:right-6">
      {!isOpen && (
        <div className="relative h-14 w-14">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex h-14 w-14 items-center justify-center overflow-hidden border border-secondary-900 bg-secondary-900 text-white shadow-2xl transition hover:bg-slate-800"
            style={{ borderRadius: '9999px', clipPath: 'circle(50% at 50% 50%)' }}
          title="Tin nhắn"
        >
            <ChatBubble className="h-6 w-6" />
          </button>
          {unreadConversationCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-white bg-primary-600 px-1 text-center text-[11px] font-bold text-white"
              style={{ borderRadius: '9999px' }}
            >
              {unreadConversationCount > 9 ? '9+' : unreadConversationCount}
            </span>
          )}
        </div>
      )}

      {isOpen && (
        <section className="flex h-[calc(100dvh-7rem)] max-h-[34rem] w-[min(94vw,27rem)] flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl lg:h-[calc(100dvh-3rem)] lg:max-h-[40rem]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-secondary-900 px-4 py-3 text-white">
            <div>
              <div className="text-sm font-bold">Tin nhắn</div>
              <div className="text-[11px] font-medium text-slate-300">
                {selectedItem ? `Hợp đồng #${selectedItem.contract.id}` : 'Chọn hội thoại'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/workspace/messages"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center border border-slate-600 text-slate-100 hover:border-white"
                title="Mở trang tin nhắn"
                aria-label="Mở trang tin nhắn"
              >
                <ArrowUpRightSquare className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center border border-slate-600 text-slate-100 hover:border-white"
                title="Đóng"
              >
                <Xmark className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
            {loading && <div className="text-xs font-medium text-slate-500">Đang tải hội thoại...</div>}
            {!loading && items.length === 0 && (
              <div className="text-xs font-medium text-slate-500">Chưa có hội thoại nào.</div>
            )}
            {!loading && items.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {items.map(({ contract, latest }) => (
                  <button
                    key={contract.id}
                    type="button"
                    onClick={() => handleSelectConversation(contract.id, latest)}
                    className={`min-w-[10rem] border px-3 py-2 text-left transition ${
                      selectedContractId === contract.id
                        ? 'border-secondary-900 bg-white'
                        : 'border-slate-200 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-bold text-secondary-900">#{contract.id}</span>
                      <NavArrowDown className="h-3 w-3 rotate-[-90deg] text-slate-400" />
                    </div>
                    <div className="mt-1 truncate text-[11px] text-slate-500">{getPreview(latest)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-4">
            {loadingMessages && <div className="text-sm text-slate-500">Đang tải tin nhắn...</div>}
            {!loadingMessages && !selectedContractId && (
              <div className="text-sm text-slate-500">Chọn một hội thoại để bắt đầu.</div>
            )}
            {!loadingMessages &&
              selectedContractId &&
              messages.map((message) => {
                const isSender = message.senderId === user?.id;
                return (
                  <div key={message.id} className={`mb-3 flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] border px-3 py-2.5 text-sm shadow-sm ${isSender ? 'border-secondary-900 bg-secondary-900 text-white' : 'border-slate-200 bg-white text-slate-800'}`}>
                      <div className="whitespace-pre-wrap leading-relaxed">{getPreview(message)}</div>
                      {message.messageType === 'file' && (
                        <MessageAttachmentLinks attachments={message.attachments} isSender={isSender} />
                      )}
                      <div className={`mt-1.5 text-[11px] ${isSender ? 'text-slate-300' : 'text-slate-400'}`}>
                        {formatDateTime(message.sentAt, locale)}
                      </div>
                    </div>
                  </div>
                );
              })}
            <div ref={messagesEndRef} />
          </div>

          {normalizedDraftAttachments.length > 0 && (
            <div className="border-t border-slate-200 bg-white px-3 py-2">
              {normalizedDraftAttachments.map((attachment, index) => (
                <div key={`${attachment.url}-${index}`} className="flex items-center justify-between gap-3 border border-slate-200 px-2 py-2 text-xs">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-primary-700">{attachment.name}</div>
                    <div className="text-slate-500">{formatAttachmentSize(attachment.size) || 'CDN'} {attachment.contentType}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachments('')}
                    className="shrink-0 text-xs font-bold text-slate-500 hover:text-red-600"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <div className="border-t border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {uploadError}
            </div>
          )}

          <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 border border-slate-200 bg-white p-2">
              <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center bg-slate-100 text-slate-700 transition hover:bg-slate-200">
                <Attachment className="h-5 w-5" />
                <input
                  type="file"
                  className="hidden"
                  disabled={!selectedContractId || submitting || uploadingAttachment}
                  onChange={handleFileChange}
                />
              </label>
              <input
                type="text"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={uploadingAttachment ? 'Đang tải tệp lên CDN...' : 'Nhập tin nhắn...'}
                className="h-10 min-w-0 flex-1 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary-500"
                disabled={!selectedContractId || submitting || uploadingAttachment}
              />
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-secondary-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!selectedContractId || submitting || uploadingAttachment || (!content.trim() && !hasAttachments(attachments))}
                title="Gửi"
              >
                <SendSolid className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-1 text-[11px] font-medium text-slate-400">Tối đa 5MB mỗi tệp.</div>
          </form>
        </section>
      )}
    </div>
  );
};

export default ConversationInbox;
