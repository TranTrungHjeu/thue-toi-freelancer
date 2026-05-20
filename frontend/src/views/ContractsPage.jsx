import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import InlineErrorBlock from '../components/common/InlineErrorBlock';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import FileUpload from '../components/common/FileUpload';
import StatMetricCard from '../components/common/StatMetricCard';
import InfoPanel from '../components/common/InfoPanel';
import InteractiveRating from '../components/common/InteractiveRating';
import ChatBubble from '../components/features/ChatBubble';
import { H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import { useWebSocket } from '../hooks/useWebSocket';
import marketplaceApi from '../api/marketplaceApi';
import { createMessageRealtimeClient } from '../api/realtimeClient';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getContractStatusMeta,
  getMilestoneStatusMeta,
} from '../utils/formatters';
import { formatAttachmentSize, normalizeAttachments } from '../utils/attachments';
import { splitApiFormError } from '../utils/formError';
import ReportModal from '../components/common/ReportModal';
import VideoCallModal from '../components/common/VideoCallModal';
import {
  WarningTriangle,
  Clock,
  Coins,
  ChatBubble as ChatIcon,
  Attachment,
  Calendar,
  CheckCircle,
  Play,
  NavArrowRight,
  Send,
  User,
  PageSearch,
  Phone,
  VideoCamera
} from 'iconoir-react';

const initialMilestoneForm = { title: '', amount: '', dueDate: '' };
const initialMessageForm = { messageType: 'text', content: '', attachments: [] };
const initialReviewForm = { rating: 5, comment: '' };

const getContractsSupplementaryCopy = (locale) => {
  if (locale === 'en') {
    return {
      realtimeCaption: 'Realtime sync',
      realtimeConnected: 'Connected to live contract updates',
      realtimeDisconnected: 'Realtime waiting for connection',
      transactionsCaption: 'Transactions',
      transactionsTitle: 'Payment history',
      transactionsLoading: 'Loading transaction history...',
      transactionsEmptyTitle: 'No transactions yet',
      transactionsEmptyDescription: 'When a milestone or contract completion triggers a payment event, it will appear here.',
      transactionsId: 'Transaction #{id}',
      transactionsMethod: 'Method: {value}',
      transactionsCreatedAt: 'Created at: {value}',
      transactionMethodFallback: 'System generated',
      transactionMethodContract: 'Contract completion',
      transactionMethodMilestone: 'Milestone completion',
      transactionStatusPending: 'Pending',
      transactionStatusCompleted: 'Completed',
      transactionStatusFailed: 'Failed',
      milestoneActionsCaption: 'Milestone actions',
      milestoneComplete: 'Mark completed',
      milestoneCancel: 'Cancel milestone',
      milestoneProcessing: 'Updating...',
      milestoneCompletedSuccess: 'Milestone marked as completed successfully.',
      milestoneCancelledSuccess: 'Milestone cancelled successfully.',
      milestoneUpdateError: 'Could not update the milestone status.',
      realtimeRefreshError: 'Could not sync the latest contract update.',
      messageAttachmentsLabel: 'Message attachments',
    };
  }

  return {
    realtimeCaption: 'Đồng bộ realtime',
    realtimeConnected: 'Đã kết nối cập nhật hợp đồng trực tiếp',
    realtimeDisconnected: 'Realtime đang chờ kết nối',
    transactionsCaption: 'Giao dịch',
    transactionsTitle: 'Lịch sử thanh toán',
    transactionsLoading: 'Đang tải lịch sử giao dịch...',
    transactionsEmptyTitle: 'Chưa có giao dịch',
    transactionsEmptyDescription: 'Khi milestone hoặc việc hoàn thành hợp đồng kích hoạt thanh toán, hệ thống sẽ hiển thị tại đây.',
    transactionsId: 'Giao dịch #{id}',
    transactionsMethod: 'Phương thức: {value}',
    transactionsCreatedAt: 'Tạo lúc: {value}',
    transactionMethodFallback: 'Hệ thống tạo tự động',
    transactionMethodContract: 'Hoàn thành hợp đồng',
    transactionMethodMilestone: 'Hoàn thành milestone',
    transactionStatusPending: 'Chờ xử lý',
    transactionStatusCompleted: 'Hoàn thành',
    transactionStatusFailed: 'Thất bại',
    milestoneActionsCaption: 'Thao tác milestone',
    milestoneComplete: 'Đánh dấu hoàn thành',
    milestoneCancel: 'Hủy milestone',
    milestoneProcessing: 'Đang cập nhật...',
    milestoneCompletedSuccess: 'Đã cập nhật milestone sang trạng thái hoàn thành.',
    milestoneCancelledSuccess: 'Đã hủy milestone thành công.',
    milestoneUpdateError: 'Không thể cập nhật trạng thái milestone.',
    realtimeRefreshError: 'Không thể đồng bộ cập nhật hợp đồng mới nhất.',
    messageAttachmentsLabel: 'Tệp đính kèm tin nhắn',
  };
};

const toLocalDateTimeOrNull = (value) => (value ? `${value}T00:00:00` : null);

const resolveParticipantLabel = (participantId, contract, currentUserId, translate) => {
  if (participantId === currentUserId) return translate('contractsPage.participants.you');
  if (!contract) return translate('contractsPage.participants.user', { id: participantId });
  if (participantId === contract.customerId) return translate('contractsPage.participants.customer');
  if (participantId === contract.freelancerId) return translate('contractsPage.participants.freelancer');
  return translate('contractsPage.participants.user', { id: participantId });
};

const toDisplayText = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};

const buildMessagePreview = (message, translate) => {
  if (message?.messageType === 'file') {
    const attachmentNames = normalizeAttachments(message.attachments)
      .map((attachment) => attachment.name)
      .filter(Boolean)
      .join(', ');
    return toDisplayText(message.content) || attachmentNames || translate('contractsPage.messagePreview.file');
  }
  return toDisplayText(message?.content) || translate('contractsPage.messagePreview.empty');
};

const MessageAttachmentLinks = ({ attachments, isSender }) => {
  const normalizedAttachments = normalizeAttachments(attachments);

  if (normalizedAttachments.length === 0) {
    return null;
  }

  return (
    <div className={`flex max-w-full flex-col gap-2 mt-1.5 ${isSender ? 'items-end' : 'items-start'}`}>
      {normalizedAttachments.map((attachment, index) => {
        const sizeLabel = formatAttachmentSize(attachment.size);
        const meta = [sizeLabel, attachment.contentType].filter(Boolean).join(' - ');

        return (
          <a
            key={`${attachment.url}-${index}`}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 shadow-sm transition-all hover:border-primary-500"
          >
            <Attachment className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[200px]">{attachment.name}</span>
            {meta && <span className="text-[10px] font-normal text-slate-400">({meta})</span>}
          </a>
        );
      })}
    </div>
  );
};

const applyTemplate = (template, replacements = {}) =>
  Object.entries(replacements).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  );

const formatTransactionMethod = (method, copy) => {
  const normalizedMethod = `${method || ''}`.trim().toLowerCase();
  if (normalizedMethod === 'contract_completion') {
    return copy.transactionMethodContract;
  }
  if (normalizedMethod === 'milestone_completion') {
    return copy.transactionMethodMilestone;
  }
  return method || copy.transactionMethodFallback;
};

const getTransactionStatusMeta = (status, copy) => {
  const normalizedStatus = `${status || ''}`.trim().toLowerCase();
  if (normalizedStatus === 'completed') {
    return { label: copy.transactionStatusCompleted, color: 'success' };
  }
  if (normalizedStatus === 'failed') {
    return { label: copy.transactionStatusFailed, color: 'error' };
  }
  return { label: copy.transactionStatusPending, color: 'warning' };
};

const GLASS_CARD_CLASS =
  'border border-slate-200/80 bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.08)]';
const SECTION_HEADER_CAPTION_CLASS =
  'text-[10px] uppercase tracking-[0.2em] text-primary-700 font-bold';
const SECTION_HEADER_TITLE_CLASS = 'mt-1 text-2xl font-bold text-slate-900 tracking-tight';

const ContractsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { locale, t } = useI18n();
  const copy = t('contractsPage');
  const extraCopy = useMemo(() => getContractsSupplementaryCopy(locale), [locale]);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLeaving, setIsModalLeaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [milestones, setMilestones] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [milestoneForm, setMilestoneForm] = useState(initialMilestoneForm);
  const [messageForm, setMessageForm] = useState(initialMessageForm);
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [reviewComposerKey, setReviewComposerKey] = useState(0);
  const [messageRealtimeStatus, setMessageRealtimeStatus] = useState('disconnected');
  const [submittingMilestone, setSubmittingMilestone] = useState(false);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [milestoneFieldErrors, setMilestoneFieldErrors] = useState({});
  const [milestoneFormError, setMilestoneFormError] = useState('');
  const [messageFieldErrors, setMessageFieldErrors] = useState({});
  const [messageFormError, setMessageFormError] = useState('');
  const [reviewFieldErrors, setReviewFieldErrors] = useState({});
  const [reviewFormError, setReviewFormError] = useState('');
  const [activeContractAction, setActiveContractAction] = useState(null);
  const [milestoneActionId, setMilestoneActionId] = useState(null);
  const selectedContractIdRef = useRef(null);

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [targetToReport, setTargetToReport] = useState(null);

  // Call Modal State
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callRoomName, setCallRoomName] = useState('');
  const [callDisplayName, setCallDisplayName] = useState('');

  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.id === selectedContractId) || null,
    [contracts, selectedContractId],
  );

  const currentUserReview = useMemo(
    () => reviews.find((review) => review.reviewerId === user?.id) || null,
    [reviews, user?.id],
  );

  const contractSummary = useMemo(() => {
    return contracts.reduce((accumulator, contract) => {
      accumulator.total += 1;
      if (contract.status === 'in_progress') accumulator.inProgress += 1;
      if (contract.status === 'completed') accumulator.completed += 1;
      if (contract.status === 'cancelled') accumulator.cancelled += 1;
      return accumulator;
    }, { total: 0, inProgress: 0, completed: 0, cancelled: 0 });
  }, [contracts]);

  const contractTopics = useMemo(
    () => contracts.map((contract) => `/topic/contract/${contract.id}`),
    [contracts],
  );

  const isCustomerOnSelectedContract = Boolean(selectedContract && user?.id === selectedContract.customerId);
  const canCloseSelectedContract = selectedContract?.status === 'in_progress';
  const canCreateMilestone = Boolean(selectedContract && isCustomerOnSelectedContract && canCloseSelectedContract);
  const canManageMilestoneStatuses = Boolean(selectedContract && isCustomerOnSelectedContract && canCloseSelectedContract);
  const canSendMessage = Boolean(selectedContract && selectedContract.status === 'in_progress');
  const canCreateReview = Boolean(selectedContract && selectedContract.status === 'completed' && !currentUserReview);

  const loadContracts = useCallback(async () => {
    const response = await marketplaceApi.getMyContracts();
    const nextContracts = response.data || [];
    const currentSelectedId = selectedContractIdRef.current;
    setContracts(nextContracts);

    if (currentSelectedId && !nextContracts.some((contract) => contract.id === currentSelectedId)) {
      selectedContractIdRef.current = null;
      setSelectedContractId(null);
      setMilestones([]);
      setMessages([]);
      setReviews([]);
      setTransactions([]);
    }

    return nextContracts;
  }, []);

  const loadMilestones = useCallback(async (contractId) => {
    if (!contractId) {
      setMilestones([]);
      return;
    }
    setLoadingMilestones(true);
    try {
      const response = await marketplaceApi.getMilestonesByContract(contractId);
      setMilestones(response.data || []);
    } finally {
      setLoadingMilestones(false);
    }
  }, []);

  const loadTransactions = useCallback(async (contractId) => {
    if (!contractId) {
      setTransactions([]);
      return;
    }
    setLoadingTransactions(true);
    try {
      const response = await marketplaceApi.getTransactionsByContract(contractId);
      setTransactions(response.data || []);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  const loadMessages = useCallback(async (contractId) => {
    if (!contractId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const response = await marketplaceApi.getMessagesByContract(contractId);
      setMessages(response.data || []);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedContractId) {
      setMessageRealtimeStatus('disconnected');
      return undefined;
    }

    const realtimeClient = createMessageRealtimeClient({
      contractId: selectedContractId,
      onStatusChange: setMessageRealtimeStatus,
      onMessage: (incomingMessage) => {
        setMessages((previous) => {
          if (previous.some((message) => message.id === incomingMessage.id)) {
            return previous;
          }
          const next = [...previous, incomingMessage];
          next.sort((first, second) => {
            const firstSentAt = new Date(first.sentAt || 0).getTime();
            const secondSentAt = new Date(second.sentAt || 0).getTime();
            if (firstSentAt === secondSentAt) {
              return (first.id || 0) - (second.id || 0);
            }
            return firstSentAt - secondSentAt;
          });
          return next;
        });
      },
    });

    return () => {
      realtimeClient.close();
    };
  }, [selectedContractId]);

  const loadReviews = useCallback(async (contractId) => {
    if (!contractId) {
      setReviews([]);
      return;
    }
    setLoadingReviews(true);
    try {
      const response = await marketplaceApi.getReviewsByContract(contractId);
      setReviews(response.data || []);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  const loadContractWorkspace = useCallback(async (contractId) => {
    await Promise.all([loadMilestones(contractId), loadMessages(contractId), loadReviews(contractId), loadTransactions(contractId)]);
  }, [loadMessages, loadMilestones, loadReviews, loadTransactions]);

  const refreshSelectedContractData = useCallback(async (contractId) => {
    await loadContracts();
    if (!contractId) return;
    try {
      await loadContractWorkspace(contractId);
    } catch (error) {
      addToast(error?.message || t('toasts.contracts.loadWorkspaceError'), 'error');
    }
  }, [addToast, loadContractWorkspace, loadContracts, t]);

  const handleRealtimeContractMessage = useCallback(({ channel, payload }) => {
    if (channel !== 'contract' || !payload?.contractId) {
      return;
    }

    const activeContractId = selectedContractIdRef.current;
    const refreshPromise = activeContractId === payload.contractId
      ? refreshSelectedContractData(payload.contractId)
      : loadContracts();

    refreshPromise.catch((error) => {
      addToast(error?.message || extraCopy.realtimeRefreshError, 'error');
    });
  }, [addToast, extraCopy.realtimeRefreshError, loadContracts, refreshSelectedContractData]);

  const { isConnected: isRealtimeConnected } = useWebSocket(handleRealtimeContractMessage, contractTopics);

  useEffect(() => {
    if (!user?.id) return;
    const loadPage = async () => {
      setLoading(true);
      try {
        const nextContracts = await loadContracts();
        const requestedContractId = Number(searchParams.get('contractId'));
        if (requestedContractId && nextContracts.some((contract) => contract.id === requestedContractId)) {
          const targetContract = nextContracts.find((contract) => contract.id === requestedContractId);
          if (targetContract) {
            selectedContractIdRef.current = targetContract.id;
            setSelectedContractId(targetContract.id);
            resetMilestoneForm();
            resetMessageForm();
            resetReviewComposer();
            await loadContractWorkspace(targetContract.id);
            setActiveTab('overview');
            setIsModalOpen(true);
          }
        }
      } catch (error) {
        addToast(error?.message || t('toasts.contracts.loadListError'), 'error');
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [addToast, loadContractWorkspace, loadContracts, searchParams, t, user?.id]);

  const resetMilestoneForm = () => {
    setMilestoneForm(initialMilestoneForm);
    setMilestoneFieldErrors({});
    setMilestoneFormError('');
  };
  const resetMessageForm = () => {
    setMessageForm(initialMessageForm);
    setMessageFieldErrors({});
    setMessageFormError('');
  };
  const resetReviewComposer = () => {
    setReviewForm(initialReviewForm);
    setReviewComposerKey((previous) => previous + 1);
    setReviewFieldErrors({});
    setReviewFormError('');
  };

  const uploadSelectedFiles = useCallback(async (context, files, params = {}) => {
    if (!files?.length) {
      return [];
    }

    const response = await marketplaceApi.uploadFiles(context, files, params);
    return normalizeAttachments(response.data || []);
  }, []);

  const handleSelectContract = async (contract) => {
    const next = new URLSearchParams(searchParams);
    next.set('contractId', String(contract.id));
    navigate(`${location.pathname}?${next.toString()}`, { replace: true });
    selectedContractIdRef.current = contract.id;
    setSelectedContractId(contract.id);
    resetMilestoneForm();
    resetMessageForm();
    resetReviewComposer();
    setActiveTab('overview');
    setIsModalLeaving(false);
    setIsModalOpen(true);
    try {
      await loadContractWorkspace(contract.id);
    } catch (error) {
      addToast(error?.message || t('toasts.contracts.loadWorkspaceError'), 'error');
    }
  };

  const closeModal = () => {
    setIsModalLeaving(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsModalLeaving(false);
      const next = new URLSearchParams(searchParams);
      next.delete('contractId');
      navigate(`${location.pathname}?${next.toString()}`, { replace: true });
    }, 180);
  };

  const handleUpdateContractStatus = async (status) => {
    if (!selectedContract) return;
    const actionKey = `${selectedContract.id}:${status}`;
    setActiveContractAction(actionKey);
    try {
      await marketplaceApi.updateContractStatus(selectedContract.id, status);
      addToast(
        status === 'completed'
          ? t('toasts.contracts.updateCompletedSuccess')
          : t('toasts.contracts.updateCancelledSuccess'),
        'success',
      );
      await refreshSelectedContractData(selectedContract.id);
    } catch (error) {
      addToast(error?.message || t('toasts.contracts.updateStatusError'), 'error');
    } finally {
      setActiveContractAction(null);
    }
  };

  const handleCreateMilestone = async (event) => {
    event.preventDefault();
    if (!selectedContract) return;
    setSubmittingMilestone(true);
    setMilestoneFieldErrors({});
    setMilestoneFormError('');
    try {
      await marketplaceApi.createMilestone(selectedContract.id, {
        title: milestoneForm.title,
        amount: Number(milestoneForm.amount),
        dueDate: toLocalDateTimeOrNull(milestoneForm.dueDate),
      });
      addToast(t('toasts.contracts.milestoneSuccess'), 'success');
      resetMilestoneForm();
      await refreshSelectedContractData(selectedContract.id);
    } catch (error) {
      const { fieldErrors, formError } = splitApiFormError(error, t('toasts.contracts.milestoneError'));
      setMilestoneFieldErrors(fieldErrors);
      setMilestoneFormError(formError);
    } finally {
      setSubmittingMilestone(false);
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId, status) => {
    if (!selectedContract) return;

    const actionKey = `${milestoneId}:${status}`;
    setMilestoneActionId(actionKey);
    try {
      await marketplaceApi.updateMilestoneStatus(milestoneId, status);
      addToast(
        status === 'completed' ? extraCopy.milestoneCompletedSuccess : extraCopy.milestoneCancelledSuccess,
        'success',
      );
      await refreshSelectedContractData(selectedContract.id);
    } catch (error) {
      addToast(error?.message || extraCopy.milestoneUpdateError, 'error');
    } finally {
      setMilestoneActionId(null);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!selectedContract) return;
    setSubmittingMessage(true);
    setMessageFieldErrors({});
    setMessageFormError('');
    try {
      const uploadedAttachments = messageForm.messageType === 'file'
        ? await uploadSelectedFiles('messages', messageForm.attachments, { contractId: selectedContract.id })
        : [];
      await marketplaceApi.sendMessage({
        contractId: selectedContract.id,
        messageType: messageForm.messageType,
        content: messageForm.content,
        attachments: uploadedAttachments,
      });
      addToast(t('toasts.contracts.messageSuccess'), 'success');
      resetMessageForm();
      await loadMessages(selectedContract.id);
    } catch (error) {
      const { fieldErrors, formError } = splitApiFormError(error, t('toasts.contracts.messageError'));
      setMessageFieldErrors(fieldErrors);
      setMessageFormError(formError);
    } finally {
      setSubmittingMessage(false);
    }
  };

  const handleCreateReview = async (event) => {
    event.preventDefault();
    if (!selectedContract) return;
    setSubmittingReview(true);
    setReviewFieldErrors({});
    setReviewFormError('');
    try {
      await marketplaceApi.createReview({
        contractId: selectedContract.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      addToast(t('toasts.contracts.reviewSuccess'), 'success');
      resetReviewComposer();
      await loadReviews(selectedContract.id);
    } catch (error) {
      const { fieldErrors, formError } = splitApiFormError(error, t('toasts.contracts.reviewError'));
      setReviewFieldErrors(fieldErrors);
      setReviewFormError(formError);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStartCall = (isVideo) => {
    if (!selectedContract) return;
    const roomName = `thuetoi-contract-${selectedContract.id}`;
    const displayName = user?.fullName || `Người dùng #${user?.id}`;
    setCallRoomName(roomName);
    setCallDisplayName(displayName);
    setIsCallOpen(true);

    const callType = isVideo ? 'Video' : 'Thoại';
    const messageContent = `[CALL_INVITATION] ${callType}`;

    marketplaceApi.sendMessage({
      contractId: selectedContract.id,
      messageType: 'text',
      content: messageContent,
      attachments: []
    }).then(() => {
      loadMessages(selectedContract.id);
    }).catch((err) => {
      console.error('Error sending call notification message:', err);
    });
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <div className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-52 bg-gradient-to-r from-primary-100/60 via-sky-50/50 to-indigo-100/40 blur-2xl" />

      {/* COMPACT CLEAN PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <Caption className={SECTION_HEADER_CAPTION_CLASS}>
            HỢP ĐỒNG HIỆN HỮU
          </Caption>
          <H2 className={SECTION_HEADER_TITLE_CLASS}>
            Quản lý công việc và thanh toán
          </H2>
        </div>
      </div>

      {/* METRIC CARDS SECTION */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatMetricCard label={copy.stats.total} value={contractSummary.total} isLoading={loading} />
        <StatMetricCard label={copy.stats.inProgress} value={contractSummary.inProgress} isLoading={loading} />
        <StatMetricCard label={copy.stats.completed} value={contractSummary.completed} isLoading={loading} />
        <StatMetricCard label={copy.stats.cancelled} value={contractSummary.cancelled} isLoading={loading} />
      </section>

      {/* CONTRACTS LUXURY GRID LIST */}
      <section className="mt-2 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-bold">
            {copy.list.title} ({contracts.length})
          </Caption>
        </div>

        {loading ? (
          <div className="flex items-center justify-center border border-dashed border-slate-200 bg-slate-50 p-12 rounded-2xl">
            <span className="text-sm font-semibold text-slate-500 animate-pulse">Đang tải danh sách hợp đồng...</span>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {contracts.map((contract) => {
              const statusMeta = getContractStatusMeta(contract.status, locale);
              const isSelected = selectedContractId === contract.id;

              // Mock a beautiful execution progress if dynamic one is not computed
              const computedProgress = contract.progress ?? (contract.status === 'completed' ? 100 : contract.status === 'cancelled' ? 0 : 45);

              return (
                <div
                  key={contract.id}
                  className={`group relative flex flex-col justify-between overflow-hidden border rounded-2xl p-5 transition-all duration-300 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/25 shadow-[0_18px_35px_rgba(37,99,235,0.12)] ring-1 ring-primary-500/20'
                      : 'border-slate-200/80 bg-white hover:border-primary-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    {/* Stepper Card Header */}
                    <div className="flex items-center justify-between gap-3">
                      <Caption className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {t('contractsPage.list.contractNumber', { id: contract.id })}
                      </Caption>
                      <Badge color={statusMeta.color} className="text-[9px] font-extrabold uppercase py-0.5 px-1.5 rounded">
                        {statusMeta.label}
                      </Badge>
                    </div>

                    {/* Stepper Card Project Title */}
                    <h3 className="mt-3 text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
                      Dự án #{contract.projectId}
                    </h3>

                    {/* Value Badge & Dates */}
                    <div className="mt-4 flex items-center justify-between text-xs border-b border-slate-100 pb-3">
                      <span className="text-slate-400 font-medium">Ngân sách hợp đồng</span>
                      <span className="font-extrabold text-primary-700 text-sm">
                        {formatCurrency(contract.totalAmount, locale)}
                      </span>
                    </div>

                    {/* Timeline start date info */}
                    <div className="mt-3 text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Bắt đầu: {formatDate(contract.startDate, locale)}</span>
                    </div>

                    {/* Progress Bar & percentage */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                        <span className="uppercase tracking-wider">Tiến độ thực thi</span>
                        <span>{computedProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            contract.status === 'completed'
                              ? 'bg-emerald-500'
                              : contract.status === 'cancelled'
                              ? 'bg-rose-500'
                              : 'bg-primary-500'
                          }`}
                          style={{ width: `${computedProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions button */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2 justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const targetUser = isCustomerOnSelectedContract
                          ? { id: contract.freelancerId, name: `${t('roles.freelancer')} #${contract.freelancerId}` }
                          : { id: contract.customerId, name: `${t('roles.customer')} #${contract.customerId}` };
                        setTargetToReport(targetUser);
                        setIsReportModalOpen(true);
                      }}
                      className="w-8 h-8 rounded-full border border-slate-200 hover:border-red-300 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                      title="Báo cáo vi phạm"
                    >
                      <WarningTriangle className="w-4 h-4" />
                    </button>

                    <Button
                      variant="outline"
                      className="text-xs py-1.5 h-auto flex items-center gap-1.5 group/btn"
                      onClick={() => handleSelectContract(contract)}
                    >
                      Xem chi tiết thực thi <NavArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {!loading && contracts.length === 0 && (
              <div className="col-span-full">
                <Callout type="info" title={copy.list.emptyTitle}>
                  {copy.list.emptyDescription}
                </Callout>
              </div>
            )}
          </div>
        )}
      </section>

      {/* CHI TIẾT THỰC THI FLOATING MODAL FLOW */}
      {(isModalOpen || isModalLeaving) && selectedContract && (
        <div className={`ui-modal-backdrop fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm ${isModalLeaving ? 'is-leaving' : ''}`}>
          <div className={`ui-modal-panel relative w-full max-w-4xl bg-white border border-slate-200/80 rounded-2xl shadow-[0_25px_60px_rgba(15,23,42,0.18)] max-h-[92vh] flex flex-col ${isModalLeaving ? 'is-leaving' : ''}`}>

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100 shrink-0 bg-slate-50/50 rounded-none">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Caption className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    Chi tiết thực thi
                  </Caption>
                  <span className="text-slate-300 font-normal">|</span>
                  <Caption className="text-[10px] font-bold text-slate-500 uppercase">
                    Hợp đồng #{selectedContract.id}
                  </Caption>
                  <Badge color={getContractStatusMeta(selectedContract.status, locale).color} className="text-[9px] py-0.5 px-2 font-bold uppercase rounded-none">
                    {getContractStatusMeta(selectedContract.status, locale).label}
                  </Badge>
                </div>
                <H2 className="mt-1.5 text-lg font-bold text-slate-950 tracking-tight leading-snug truncate">
                  Dự án #{selectedContract.projectId}
                </H2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-9 h-9 rounded-none border border-slate-200 hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors text-sm shadow-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Premium Stepper Tabs Selector */}
            <div className="flex border-b border-slate-100 bg-white px-5 shrink-0 overflow-x-auto relative">
              {[
                { id: 'overview', label: 'Tổng quan & SePay Escrow', icon: Coins },
                { id: 'milestones', label: `Mốc thanh toán (${milestones.length})`, icon: Calendar },
                { id: 'messages', label: 'Trao đổi thảo luận', icon: ChatIcon },
                { id: 'reviews', label: 'Đánh giá kết quả', icon: CheckCircle }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative py-3.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all duration-200 shrink-0 ${
                      isActive
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Scrollable Workspace Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/40">

              {/* TAB 1: OVERVIEW & ESCROW SEPAY */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  {/* Status Summary & Dates Info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoPanel className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-xs">
                      <Caption className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold">
                        {copy.statusCard.caption}
                      </Caption>
                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-slate-400 text-xs font-medium">Trạng thái hiện tại:</span>
                        <Badge color={getContractStatusMeta(selectedContract.status, locale).color} className="text-xs uppercase py-0.5 px-2 rounded">
                          {getContractStatusMeta(selectedContract.status, locale).label}
                        </Badge>
                      </div>
                      <div className="mt-4 text-xs text-slate-600 font-medium">
                        Tổng giá trị hợp đồng: <span className="font-extrabold text-primary-700 text-sm ml-1">{formatCurrency(selectedContract.totalAmount, locale)}</span>
                      </div>

                      {/* Stepper Status Realtime sync indicator */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Trạng thái SePay Realtime:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                          <span className="font-bold text-slate-700 text-[10px]">
                            {isRealtimeConnected ? 'ĐÃ ĐỒNG BỘ HỢP ĐỒNG' : 'ĐANG CHỜ KẾT NỐI'}
                          </span>
                        </div>
                      </div>
                    </InfoPanel>

                    <InfoPanel className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-xs">
                      <Caption className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold">
                        {copy.relatedInfo.caption}
                      </Caption>

                      <div className="mt-3.5 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Mã dự án:</span>
                          <span className="font-bold text-slate-800">#{selectedContract.projectId}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Khách hàng (Chủ dự án):</span>
                          <span className="font-bold text-slate-800">#{selectedContract.customerId}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Freelancer (Thực hiện):</span>
                          <span className="font-bold text-slate-800">#{selectedContract.freelancerId}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Ngày bắt đầu:</span>
                          <span className="font-medium text-slate-700">{formatDateTime(selectedContract.startDate, locale)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Dự kiến kết thúc:</span>
                          <span className="font-medium text-slate-700">{formatDateTime(selectedContract.endDate, locale)}</span>
                        </div>
                      </div>
                    </InfoPanel>
                  </div>

                  {/* Escrow Block Card mimicking Bank cards */}
                  {(() => {
                    const totalAmount = Number(selectedContract.totalAmount || 0);
                    const releasedGross = milestones
                      .filter((m) => (m.status || '').toLowerCase() === 'completed')
                      .reduce((sum, m) => sum + Number(m.amount || 0), 0);
                    const heldInEscrow = Math.max(totalAmount - releasedGross, 0);

                    return (
                      <div className="bg-gradient-to-br from-slate-900 via-secondary-800 to-slate-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
                        {/* Premium Glow Accents */}
                        <div className="absolute right-0 top-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl" />
                        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl" />

                        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 border-b border-white/10 pb-4">
                          <div>
                            <Caption className="text-[9px] uppercase tracking-[0.2em] text-primary-400 font-extrabold">
                              SePay Escrow Smart Contract
                            </Caption>
                            <h3 className="mt-1 text-base font-bold tracking-tight">
                              Quỹ tạm giữ bảo vệ thanh toán tự động
                            </h3>
                          </div>
                          {heldInEscrow > 0 && selectedContract.status === 'in_progress' ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 escrow-pulse" />
                              ĐANG TẠM GIỮ ESCROW
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              ĐÃ GIẢI NGÂN TOÀN BỘ
                            </span>
                          )}
                        </div>

                        <p className="mt-4 text-xs text-slate-300 leading-relaxed max-w-2xl relative z-10 font-normal">
                          Ngân sách dự án được hệ thống SePay khóa tạm giữ an toàn ngay khi hợp đồng được ký. Mỗi khi bạn hoàn thành một Mốc thanh toán (Milestone), tiền sẽ tự động chuyển từ escrow sang ví số của Freelancer.
                        </p>

                        <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3 relative z-10">
                          <div className="border border-white/5 bg-white/[0.03] p-4 rounded-xl backdrop-blur-xs">
                            <Caption className="text-[9px] uppercase tracking-[0.18em] text-slate-400 font-bold">
                              Tổng giá trị
                            </Caption>
                            <div className="mt-1 text-xl font-black tracking-tight text-white">
                              {formatCurrency(totalAmount, locale)}
                            </div>
                          </div>
                          <div className="border border-emerald-500/10 bg-emerald-950/20 p-4 rounded-xl backdrop-blur-xs">
                            <Caption className="text-[9px] uppercase tracking-[0.18em] text-emerald-400 font-bold">
                              Đã giải ngân (gộp)
                            </Caption>
                            <div className="mt-1 text-xl font-black tracking-tight text-emerald-300">
                              {formatCurrency(releasedGross, locale)}
                            </div>
                          </div>
                          <div className="border border-amber-500/10 bg-amber-950/20 p-4 rounded-xl backdrop-blur-xs">
                            <Caption className="text-[9px] uppercase tracking-[0.18em] text-amber-400 font-bold">
                              Đang giữ trong escrow
                            </Caption>
                            <div className="mt-1 text-xl font-black tracking-tight text-amber-300">
                              {formatCurrency(heldInEscrow, locale)}
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 text-[10px] text-slate-400 italic relative z-10">
                          * Phí dịch vụ nền tảng sẽ được chiết khấu trực tiếp trên từng đợt giải ngân trước khi cộng vào số dư của freelancer.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Actions for Contract Completion / Cancellation */}
                  <InfoPanel className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <Caption className="text-[10px] uppercase tracking-[0.18em] text-primary-700 font-bold">
                          {copy.update.caption}
                        </Caption>
                        <h4 className="mt-1 text-base font-bold text-slate-900">{copy.update.title}</h4>
                        <Text className="mt-2 text-xs text-slate-500 max-w-xl">{copy.update.description}</Text>
                      </div>

                      {canCloseSelectedContract ? (
                        <div className="flex flex-wrap gap-2.5">
                          <Button
                            disabled={Boolean(activeContractAction)}
                            onClick={() => handleUpdateContractStatus('completed')}
                            className="text-xs"
                          >
                            {activeContractAction === `${selectedContract.id}:completed`
                              ? copy.update.updating
                              : copy.update.complete}
                          </Button>
                          <Button
                            disabled={Boolean(activeContractAction)}
                            variant="danger"
                            onClick={() => handleUpdateContractStatus('cancelled')}
                            className="text-xs"
                          >
                            {activeContractAction === `${selectedContract.id}:cancelled`
                              ? copy.update.updating
                              : copy.update.cancel}
                          </Button>
                        </div>
                      ) : (
                        <Badge color={getContractStatusMeta(selectedContract.status, locale).color} className="text-xs py-1 px-3 uppercase rounded">
                          {copy.update.ended}
                        </Badge>
                      )}
                    </div>
                  </InfoPanel>
                </div>
              )}

              {/* TAB 2: MILESTONES (PAYMENT STEPS) */}
              {activeTab === 'milestones' && (
                <div className="flex flex-col gap-6 animate-fadeIn">

                  {/* Create milestone card if eligible */}
                  {canCreateMilestone && (
                    <Card className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-xs">
                      <Caption className="text-[10px] uppercase tracking-[0.18em] text-primary-700 font-bold">
                        Tạo mốc thanh toán mới
                      </Caption>
                      <form className="mt-4 flex flex-col gap-4" onSubmit={handleCreateMilestone}>
                        {milestoneFormError && (
                          <InlineErrorBlock title={copy.milestones.errorTitle}>
                            {milestoneFormError}
                          </InlineErrorBlock>
                        )}
                        <Input
                          label={copy.milestones.titleLabel}
                          placeholder="Ví dụ: Hoàn thiện mẫu thiết kế UI/UX trang chủ..."
                          value={milestoneForm.title}
                          onChange={(event) => setMilestoneForm((previous) => ({ ...previous, title: event.target.value }))}
                          error={milestoneFieldErrors.title}
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                          <Input
                            label={copy.milestones.valueLabel}
                            type="number"
                            min="0"
                            value={milestoneForm.amount}
                            onChange={(event) => setMilestoneForm((previous) => ({ ...previous, amount: event.target.value }))}
                            error={milestoneFieldErrors.amount}
                          />
                          <Input
                            label={copy.milestones.dueDateLabel}
                            type="date"
                            value={milestoneForm.dueDate}
                            onChange={(event) => setMilestoneForm((previous) => ({ ...previous, dueDate: event.target.value }))}
                            error={milestoneFieldErrors.dueDate}
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button type="submit" disabled={submittingMilestone} className="text-xs px-5 py-2">
                            {submittingMilestone ? copy.milestones.submitting : copy.milestones.submit}
                          </Button>
                        </div>
                      </form>
                    </Card>
                  )}

                  {!canCreateMilestone && isCustomerOnSelectedContract && (
                    <Callout type="info" title={copy.milestones.customerLockedTitle}>
                      {copy.milestones.customerLockedDescription}
                    </Callout>
                  )}

                  {!canCreateMilestone && !isCustomerOnSelectedContract && (
                    <Callout type="info" title={copy.milestones.freelancerLockedTitle}>
                      {copy.milestones.freelancerLockedDescription}
                    </Callout>
                  )}

                  {/* Vertical Milestones Timeline */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                    <Caption className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold block mb-5 border-b border-slate-100 pb-3">
                      Lộ trình giải ngân các mốc
                    </Caption>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200/80">
                      {loadingMilestones && (
                        <span className="text-xs text-slate-500 block animate-pulse">{copy.milestones.loading}</span>
                      )}

                      {!loadingMilestones && milestones.map((milestone, idx) => {
                        const statusMeta = getMilestoneStatusMeta(milestone.status, locale);
                        const isCompleted = milestone.status === 'completed';
                        const isCancelled = milestone.status === 'cancelled';

                        return (
                          <div key={milestone.id} className="relative group/milestone animate-fadeIn">

                            {/* Stepper Dot */}
                            <span className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 bg-white transition-all duration-300 ${
                              isCompleted
                                ? 'border-emerald-500 bg-emerald-500 stepper-glow'
                                : isCancelled
                                ? 'border-rose-400 bg-rose-500'
                                : 'border-amber-400 bg-amber-500'
                            }`} />

                            <div className="border border-slate-100 bg-slate-50/50 hover:bg-slate-50/80 hover:border-slate-200 p-4 rounded-xl transition-all">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900">
                                    Mốc #{idx + 1}: {milestone.title}
                                  </h4>
                                  <Caption className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    Hạn chót: {formatDate(milestone.dueDate, locale)}
                                  </Caption>
                                </div>
                                <Badge color={statusMeta.color} className="text-[9px] uppercase font-bold py-0.5 px-1.5 rounded">
                                  {statusMeta.label}
                                </Badge>
                              </div>

                              <div className="mt-3.5 flex flex-wrap items-end justify-between gap-3">
                                <div>
                                  <Caption className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                                    Giá trị giải ngân
                                  </Caption>
                                  <span className="text-sm font-extrabold text-slate-800">
                                    {formatCurrency(milestone.amount, locale)}
                                  </span>
                                </div>

                                {canManageMilestoneStatuses && milestone.status === 'pending' && (
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      disabled={Boolean(milestoneActionId)}
                                      onClick={() => handleUpdateMilestoneStatus(milestone.id, 'completed')}
                                      className="text-[10px] py-1 px-3 h-auto"
                                    >
                                      {milestoneActionId === `${milestone.id}:completed`
                                        ? extraCopy.milestoneProcessing
                                        : extraCopy.milestoneComplete}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="danger"
                                      disabled={Boolean(milestoneActionId)}
                                      onClick={() => handleUpdateMilestoneStatus(milestone.id, 'cancelled')}
                                      className="text-[10px] py-1 px-3 h-auto"
                                    >
                                      {milestoneActionId === `${milestone.id}:cancelled`
                                        ? extraCopy.milestoneProcessing
                                        : extraCopy.milestoneCancel}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {!loadingMilestones && milestones.length === 0 && (
                        <Callout type="info" title={copy.milestones.emptyTitle}>
                          {copy.milestones.emptyDescription}
                        </Callout>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MESSAGES & CHAT WORKSPACE */}
              {activeTab === 'messages' && (
                <div className="flex flex-col gap-6 animate-fadeIn">

                  {/* Chat message list area */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col gap-5 max-h-[480px] overflow-y-auto pr-1">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <Caption className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold block">
                        Lịch sử trao đổi trong hợp đồng
                      </Caption>
                      {selectedContract.status === 'in_progress' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartCall(false)}
                            className="p-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-primary-600 transition shadow-xs rounded-none flex items-center justify-center group/call"
                            title="Gọi thoại"
                          >
                            <Phone className="w-4 h-4 group-hover/call:text-primary-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartCall(true)}
                            className="p-1 bg-primary-600 hover:bg-primary-700 text-white transition shadow-xs rounded-none flex items-center justify-center border border-primary-600"
                            title="Gọi video"
                          >
                            <VideoCamera className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedContract && messageRealtimeStatus !== 'connected' && (
                      <Callout type="info" title="Kết nối trực tiếp">
                        Tin nhắn mới có thể đến chậm vài giây trong lúc đồng bộ lại đường truyền.
                      </Callout>
                    )}

                    {loadingMessages && (
                      <span className="text-xs text-slate-500 animate-pulse">{copy.messages.loading}</span>
                    )}

                    <div className="flex flex-col gap-4 mt-2">
                      {!loadingMessages && messages.map((message) => {
                        const isSender = message.senderId === user?.id;
                        const isCallInvite = message.content?.startsWith('[CALL_INVITATION]');

                        if (isCallInvite) {
                          const callType = message.content.includes('Video') ? 'Video' : 'Thoại';
                          return (
                            <div key={message.id} className="flex flex-col gap-1 w-full max-w-[280px]" style={{ alignSelf: isSender ? 'flex-end' : 'flex-start' }}>
                              <Caption className={`text-[9px] uppercase tracking-[0.14em] font-semibold ${isSender ? 'text-right text-primary-700' : 'text-slate-500'}`}>
                                {resolveParticipantLabel(message.senderId, selectedContract, user?.id, t)}
                              </Caption>
                              <div className="bg-slate-900 text-white p-4 border border-slate-700 shadow-lg flex flex-col gap-3 rounded-none relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none overflow-hidden opacity-10">
                                  {callType === 'Video' ? <VideoCamera className="w-12 h-12" /> : <Phone className="w-12 h-12" />}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-emerald-500 animate-pulse rounded-none" />
                                  <Text className="text-[11px] font-bold text-white uppercase tracking-wider">Cuộc gọi {callType} đang diễn ra</Text>
                                </div>
                                <Button
                                  type="button"
                                  onClick={() => {
                                    setCallRoomName(`thuetoi-contract-${selectedContract.id}`);
                                    setCallDisplayName(user?.fullName || `Người dùng #${user?.id}`);
                                    setIsCallOpen(true);
                                  }}
                                  className="bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-bold py-1.5 h-auto rounded-none w-full border-transparent"
                                >
                                  THAM GIA NGAY
                                </Button>
                              </div>
                              <Caption className="text-[9px] text-slate-400 mt-1 px-1">{formatDateTime(message.sentAt, locale)}</Caption>
                            </div>
                          );
                        }

                        return (
                          <div key={message.id} className="flex flex-col gap-1 max-w-[85%] self-start" style={{ alignSelf: isSender ? 'flex-end' : 'flex-start' }}>
                            <Caption className={`text-[9px] uppercase tracking-[0.14em] font-semibold ${isSender ? 'text-right text-primary-700' : 'text-slate-500'}`}>
                              {resolveParticipantLabel(message.senderId, selectedContract, user?.id, t)}
                            </Caption>
                            <ChatBubble
                              message={buildMessagePreview(message, t)}
                              time={formatDateTime(message.sentAt, locale)}
                              isSender={isSender}
                              status={t('status.message.sent')}
                            />
                            {message.messageType === 'file' && (
                              <MessageAttachmentLinks attachments={message.attachments} isSender={isSender} />
                            )}
                          </div>
                        );
                      })}

                      {!loadingMessages && messages.length === 0 && (
                        <Callout type="info" title={copy.messages.emptyTitle}>
                          {copy.messages.emptyDescription}
                        </Callout>
                      )}
                    </div>
                  </div>

                  {/* Send Message area */}
                  {canSendMessage ? (
                    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                      {/* Selection of message types */}
                      <div className="flex gap-2 mb-4">
                        <button
                          type="button"
                          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                            messageForm.messageType === 'text'
                              ? 'bg-primary-50 border-primary-500 text-primary-700'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                          onClick={() => {
                            setMessageForm({ messageType: 'text', content: '', attachments: [] });
                            setMessageFieldErrors({});
                            setMessageFormError('');
                          }}
                        >
                          Gửi tin nhắn chữ
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                            messageForm.messageType === 'file'
                              ? 'bg-primary-50 border-primary-500 text-primary-700'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                          onClick={() => {
                            setMessageForm({ messageType: 'file', content: '', attachments: [] });
                            setMessageFieldErrors({});
                            setMessageFormError('');
                          }}
                        >
                          Đính kèm tài liệu bàn giao
                        </button>
                      </div>

                      <form className="flex flex-col gap-4" onSubmit={handleSendMessage}>
                        {messageFormError && (
                          <InlineErrorBlock title={copy.messages.errorTitle}>
                            {messageFormError}
                          </InlineErrorBlock>
                        )}

                        {messageForm.messageType === 'text' ? (
                          <Textarea
                            label={copy.messages.contentLabel}
                            placeholder="Nhập nội dung trao đổi..."
                            value={messageForm.content}
                            onChange={(event) => setMessageForm((previous) => ({ ...previous, content: event.target.value }))}
                            error={messageFieldErrors.content}
                            rows={3}
                          />
                        ) : (
                          <>
                            <FileUpload
                              label={extraCopy.messageAttachmentsLabel || copy.messages.attachmentLabel}
                              value={messageForm.attachments}
                              onChange={(attachments) => {
                                setMessageForm((previous) => ({ ...previous, attachments }));
                                setMessageFieldErrors((previous) => ({ ...previous, attachments: '' }));
                                setMessageFormError('');
                              }}
                              maxFiles={5}
                              disabled={submittingMessage}
                              error={messageFieldErrors.attachments}
                            />
                            <Textarea
                              label={copy.messages.attachmentNoteLabel}
                              placeholder="Mô tả ngắn gọn về tệp bàn giao..."
                              value={messageForm.content}
                              onChange={(event) => setMessageForm((previous) => ({ ...previous, content: event.target.value }))}
                              error={messageFieldErrors.content}
                              rows={2}
                            />
                          </>
                        )}

                        <div className="flex justify-end pt-2">
                          <Button type="submit" disabled={submittingMessage} className="text-xs px-5 py-2 flex items-center gap-1.5 rounded-none h-9">
                            Gửi tin nhắn <Send className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <Callout type="info" title={copy.messages.lockedTitle}>
                      {copy.messages.lockedDescription}
                    </Callout>
                  )}
                </div>
              )}

              {/* TAB 4: TRANSACTIONS & REVIEWS */}
              {activeTab === 'reviews' && (
                <div className="flex flex-col gap-6 animate-fadeIn">

                  {/* Reviews Section */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                    <Caption className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold block mb-4 border-b border-slate-100 pb-3">
                      Đánh giá & nghiệm thu
                    </Caption>

                    {selectedContract.status !== 'completed' && (
                      <Callout type="info" title={copy.reviews.lockedTitle}>
                        {copy.reviews.lockedDescription}
                      </Callout>
                    )}

                    {selectedContract.status === 'completed' && canCreateReview && (
                      <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl mb-6">
                        <Caption className="text-[10px] uppercase tracking-[0.18em] text-primary-700 font-bold">
                          Gửi đánh giá của bạn
                        </Caption>
                        <form className="mt-4 flex flex-col gap-4" onSubmit={handleCreateReview}>
                          {reviewFormError && (
                            <InlineErrorBlock title={copy.reviews.errorTitle}>
                              {reviewFormError}
                            </InlineErrorBlock>
                          )}
                          <InteractiveRating
                            key={`review-${selectedContract.id}-${reviewComposerKey}`}
                            label={copy.reviews.ratingLabel}
                            initialRating={reviewForm.rating}
                            onChange={(rating) => setReviewForm((previous) => ({ ...previous, rating }))}
                            error={reviewFieldErrors.rating}
                          />
                          <Textarea
                            label={copy.reviews.commentLabel}
                            placeholder="Chia sẻ trải nghiệm làm việc..."
                            value={reviewForm.comment}
                            onChange={(event) => setReviewForm((previous) => ({ ...previous, comment: event.target.value }))}
                            error={reviewFieldErrors.comment}
                            rows={3}
                          />
                          <div className="flex justify-end">
                            <Button type="submit" disabled={submittingReview} className="text-xs px-5 py-2">
                              {submittingReview ? copy.reviews.submitting : copy.reviews.submit}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {selectedContract.status === 'completed' && currentUserReview && (
                      <Callout className="mb-6" type="success" title={copy.reviews.submittedTitle}>
                        {t('contractsPage.reviews.submittedDescription', { rating: currentUserReview.rating })}
                      </Callout>
                    )}

                    <div className="space-y-4">
                      {loadingReviews && (
                        <span className="text-xs text-slate-500 animate-pulse">{copy.reviews.loading}</span>
                      )}

                      {!loadingReviews && reviews.map((review) => {
                        const badgeColor = review.rating >= 4 ? 'success' : review.rating === 3 ? 'warning' : 'error';
                        return (
                          <div key={review.id} className="border border-slate-100 p-4 rounded-xl bg-slate-50/30">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">
                                  {resolveParticipantLabel(review.reviewerId, selectedContract, user?.id, t)}
                                </h4>
                                <Caption className="text-[10px] text-slate-400 mt-0.5">
                                  Đánh giá lúc: {formatDateTime(review.createdAt, locale)}
                                </Caption>
                              </div>
                              <Badge color={badgeColor} className="text-[10px] font-bold">
                                {review.rating}/5 ⭐
                              </Badge>
                            </div>
                            <p className="mt-3 text-xs text-slate-600 leading-relaxed font-normal">
                              {review.comment || copy.reviews.commentFallback}
                            </p>
                            {review.reply && (
                              <div className="mt-3 border border-slate-200/70 bg-white p-3 rounded-lg">
                                <Caption className="text-[9px] uppercase tracking-[0.16em] text-slate-400 font-bold block">
                                  {copy.reviews.reply}
                                </Caption>
                                <p className="mt-1 text-xs text-slate-600 font-normal">{review.reply}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {!loadingReviews && reviews.length === 0 && selectedContract.status === 'completed' && (
                        <Callout type="info" title={copy.reviews.emptyTitle}>
                          {copy.reviews.emptyDescription}
                        </Callout>
                      )}
                    </div>
                  </div>

                  {/* Payment Transactions List */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                    <Caption className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold block mb-4 border-b border-slate-100 pb-3">
                      {extraCopy.transactionsTitle}
                    </Caption>

                    <div className="space-y-4">
                      {loadingTransactions && (
                        <span className="text-xs text-slate-500 animate-pulse">{extraCopy.transactionsLoading}</span>
                      )}

                      {!loadingTransactions && transactions.map((transaction) => {
                        const statusMeta = getTransactionStatusMeta(transaction.status, extraCopy);
                        return (
                          <div key={transaction.id} className="border border-slate-100 p-4 rounded-xl bg-slate-50/30 flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <div className="text-xs font-bold text-slate-800">
                                {applyTemplate(extraCopy.transactionsId, { id: transaction.id })}
                              </div>
                              <Caption className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {applyTemplate(extraCopy.transactionsCreatedAt, { value: formatDateTime(transaction.createdAt, locale) })}
                              </Caption>
                              <p className="mt-2 text-xs text-slate-500">
                                {applyTemplate(extraCopy.transactionsMethod, { value: formatTransactionMethod(transaction.method, extraCopy) })}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-800 block">
                                {formatCurrency(transaction.amount, locale)}
                              </span>
                              <Badge color={statusMeta.color} className="mt-1.5 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded">
                                {statusMeta.label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}

                      {!loadingTransactions && transactions.length === 0 && (
                        <Callout type="info" title={extraCopy.transactionsEmptyTitle}>
                          {extraCopy.transactionsEmptyDescription}
                        </Callout>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-2.5 rounded-b-2xl">
              <Button variant="outline" className="text-xs py-2 px-5" onClick={closeModal}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="USER"
        targetId={targetToReport?.id}
        targetName={targetToReport?.name}
      />

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        roomName={callRoomName}
        displayName={callDisplayName}
      />
    </div>
  );
};

export default ContractsPage;
