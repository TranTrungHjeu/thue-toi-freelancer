"use client";

﻿import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { ChatBubble, Attachment, SendSolid } from 'iconoir-react';
import marketplaceApi from '../../api/marketplaceApi';
import { formatDateTime } from '../../utils/formatters';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../hooks/useAuth';
import { createMessageRealtimeClient } from '../../api/realtimeClient';

const getPreview = (message) => {
  if (!message) return 'Chưa có tin nhắn.';
  if (message.messageType === 'file') {
    return message.content || '[Tệp đính kèm]';
  }
  return message.content || 'Tin nhắn trống.';
};

const isExternalLink = (value) => /^https?:\/\//i.test(value || '');

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
  const dropdownRef = useRef(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.contract.id === selectedContractId) || null,
    [items, selectedContractId],
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    const loadInbox = async () => {
      setLoading(true);
      try {
        const contractsResponse = await marketplaceApi.getMyContracts();
        const contracts = (contractsResponse.data || []).slice(0, 12);
        const messageResponses = await Promise.all(
          contracts.map(async (contract) => {
            const response = await marketplaceApi.getMessagesByContract(contract.id);
            const contractMessages = response.data || [];
            const latest = contractMessages[contractMessages.length - 1] || null;
            return { contract, latest };
          }),
        );

        const normalized = messageResponses
          .filter((item) => item.latest)
          .sort((a, b) => new Date(b.latest.sentAt || 0) - new Date(a.latest.sentAt || 0));

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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedContractId) return;
    let mounted = true;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await marketplaceApi.getMessagesByContract(selectedContractId);
        if (mounted) setMessages(response.data || []);
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    };

    loadMessages();
    return () => {
      mounted = false;
    };
  }, [isOpen, selectedContractId]);

  useEffect(() => {
    if (!isOpen || !selectedContractId) return undefined;

    const realtimeClient = createMessageRealtimeClient({
      contractId: selectedContractId,
      onMessage: (incomingMessage) => {
        setMessages((previous) => {
          if (previous.some((message) => message.id === incomingMessage.id)) {
            return previous;
          }
          return [...previous, incomingMessage];
        });
        setItems((previous) =>
          previous
            .map((item) =>
              item.contract.id === selectedContractId ? { ...item, latest: incomingMessage } : item,
            )
            .sort((a, b) => new Date(b.latest?.sentAt || 0) - new Date(a.latest?.sentAt || 0)),
        );
      },
    });

    return () => {
      realtimeClient.close();
    };
  }, [isOpen, selectedContractId]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedContractId) return;
    if (!content.trim() && !attachments.trim()) return;

    setSubmitting(true);
    try {
      const nextMessageType = attachments.trim() ? 'file' : 'text';
      await marketplaceApi.sendMessage({
        contractId: selectedContractId,
        messageType: nextMessageType,
        content: content.trim(),
        attachments: attachments.trim(),
      });
      setContent('');
      setAttachments('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="relative inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-secondary-900"
        title="Tin nhắn"
      >
        <ChatBubble className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 h-[min(78vh,40rem)] w-[min(94vw,60rem)] overflow-hidden border border-slate-200 bg-white shadow-2xl">
          <div className="grid h-full grid-cols-[16rem_1fr]">
            <div className="flex h-full flex-col border-r border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Trò chuyện</span>
                <Link href="/workspace/contracts" onClick={() => setIsOpen(false)} className="text-xs font-semibold text-primary-700 hover:underline">
                  Mở trang đầy đủ
                </Link>
              </div>

              <div className="flex-1 overflow-auto">
                {loading && <div className="px-3 py-3 text-sm text-slate-500">Đang tải...</div>}
                {!loading && items.length === 0 && <div className="px-3 py-3 text-sm text-slate-500">Chưa có cuộc trò chuyện.</div>}
                {!loading &&
                  items.map(({ contract, latest }) => (
                    <button
                      key={contract.id}
                      type="button"
                      onClick={() => setSelectedContractId(contract.id)}
                      className={`w-full border-b border-slate-100 px-3 py-3 text-left transition-colors ${
                        selectedContractId === contract.id ? 'bg-primary-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-secondary-900">Hợp đồng #{contract.id}</span>
                        <span className="shrink-0 text-[11px] text-slate-500">{formatDateTime(latest.sentAt, locale)}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-600">{getPreview(latest)}</p>
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex h-full min-h-0 flex-col bg-slate-50/30">
              <div className="border-b border-slate-100 px-4 py-3">
                <span className="text-sm font-bold text-secondary-900">
                  {selectedItem ? `Hội thoại hợp đồng #${selectedItem.contract.id}` : 'Chọn một hội thoại'}
                </span>
              </div>

              <div className="flex-1 overflow-auto px-4 py-4">
                {loadingMessages && <div className="text-sm text-slate-500">Đang tải tin nhắn...</div>}
                {!loadingMessages && !selectedContractId && <div className="text-sm text-slate-500">Chưa chọn hội thoại.</div>}
                {!loadingMessages &&
                  selectedContractId &&
                  messages.map((message) => {
                    const isSender = message.senderId === user?.id;
                    return (
                      <div key={message.id} className={`mb-3 flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] border px-3 py-2.5 text-sm shadow-sm ${isSender ? 'border-secondary-900 bg-secondary-900 text-white' : 'border-slate-200 bg-white text-slate-800'}`}>
                          <div className="leading-relaxed">{getPreview(message)}</div>
                          {message.messageType === 'file' && message.attachments && (
                            isExternalLink(message.attachments) ? (
                              <a
                                href={message.attachments}
                                target="_blank"
                                rel="noreferrer"
                                className={`mt-1.5 block text-xs font-semibold underline ${isSender ? 'text-slate-200' : 'text-primary-700'}`}
                              >
                                Mở tệp đính kèm
                              </a>
                            ) : (
                              <div className={`mt-1.5 text-xs ${isSender ? 'text-slate-300' : 'text-slate-500'}`}>
                                Tệp: {message.attachments}
                              </div>
                            )
                          )}
                          <div className={`mt-1.5 text-[11px] ${isSender ? 'text-slate-300' : 'text-slate-400'}`}>
                            {formatDateTime(message.sentAt, locale)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
                  <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200">
                    <Attachment className="h-5 w-5" />
                    <input
                      type="file"
                      className="hidden"
                      disabled={!selectedContractId || submitting || uploadingAttachment}
                      onChange={async (event) => {
                        const selectedFile = event.target.files?.[0];
                        if (selectedFile && selectedContractId) {
                          setUploadingAttachment(true);
                          try {
                            const response = await marketplaceApi.uploadMessageAttachment(
                              selectedContractId,
                              selectedFile,
                            );
                            const uploadedUrl = response.data || '';
                            setAttachments(uploadedUrl);
                            if (!content.trim()) setContent(selectedFile.name);
                          } catch {
                            setAttachments('');
                          } finally {
                            setUploadingAttachment(false);
                          }
                        }
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder={uploadingAttachment ? 'Đang tải tệp lên...' : (attachments ? 'Đã đính kèm tệp' : 'Nhập tin nhắn...')}
                    className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary-500"
                    disabled={!selectedContractId || submitting || uploadingAttachment}
                  />
                  <button
                    type="submit"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedContractId || submitting || uploadingAttachment || (!content.trim() && !attachments.trim())}
                    title="Gửi"
                  >
                    <SendSolid className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationInbox;
