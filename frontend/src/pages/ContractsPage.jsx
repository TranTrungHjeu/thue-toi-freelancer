import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import InteractiveRating from '../components/common/InteractiveRating';
import ChatBubble from '../components/features/ChatBubble';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import marketplaceApi from '../api/marketplaceApi';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getContractStatusMeta,
  getMilestoneStatusMeta,
} from '../utils/formatters';

const initialMilestoneForm = { title: '', amount: '', dueDate: '' };
const initialMessageForm = { messageType: 'text', content: '', attachments: '' };
const initialReviewForm = { rating: 5, comment: '' };

const toLocalDateTimeOrNull = (value) => (value ? `${value}T00:00:00` : null);
const isExternalLink = (value) => /^https?:\/\//i.test(value || '');

const resolveParticipantLabel = (participantId, contract, currentUserId, translate) => {
  if (participantId === currentUserId) return translate('contractsPage.participants.you');
  if (!contract) return translate('contractsPage.participants.user', { id: participantId });
  if (participantId === contract.clientId) return translate('contractsPage.participants.customer');
  if (participantId === contract.freelancerId) return translate('contractsPage.participants.freelancer');
  return translate('contractsPage.participants.user', { id: participantId });
};

const buildMessagePreview = (message, translate) => {
  if (message?.messageType === 'file') {
    return message.content || translate('contractsPage.messagePreview.file');
  }
  return message?.content || translate('contractsPage.messagePreview.empty');
};

const ContractsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { locale, t } = useI18n();
  const copy = t('contractsPage');
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState(initialMilestoneForm);
  const [messageForm, setMessageForm] = useState(initialMessageForm);
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [reviewComposerKey, setReviewComposerKey] = useState(0);
  const [submittingMilestone, setSubmittingMilestone] = useState(false);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeContractAction, setActiveContractAction] = useState(null);
  const selectedContractIdRef = useRef(null);

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

  const isCustomerOnSelectedContract = Boolean(selectedContract && user?.id === selectedContract.clientId);
  const canCloseSelectedContract = selectedContract?.status === 'in_progress';
  const canCreateMilestone = Boolean(selectedContract && isCustomerOnSelectedContract && canCloseSelectedContract);
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
    await Promise.all([loadMilestones(contractId), loadMessages(contractId), loadReviews(contractId)]);
  }, [loadMessages, loadMilestones, loadReviews]);

  useEffect(() => {
    if (!user?.id) return;
    const loadPage = async () => {
      setLoading(true);
      try {
        await loadContracts();
      } catch (error) {
        addToast(error?.message || t('toasts.contracts.loadListError'), 'error');
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [addToast, loadContracts, t, user?.id]);

  const resetMilestoneForm = () => setMilestoneForm(initialMilestoneForm);
  const resetMessageForm = () => setMessageForm(initialMessageForm);
  const resetReviewComposer = () => {
    setReviewForm(initialReviewForm);
    setReviewComposerKey((previous) => previous + 1);
  };

  const refreshSelectedContractData = async (contractId) => {
    await loadContracts();
    if (!contractId) return;
    try {
      await loadContractWorkspace(contractId);
    } catch (error) {
      addToast(error?.message || t('toasts.contracts.loadWorkspaceError'), 'error');
    }
  };

  const handleSelectContract = async (contract) => {
    selectedContractIdRef.current = contract.id;
    setSelectedContractId(contract.id);
    resetMilestoneForm();
    resetMessageForm();
    resetReviewComposer();
    try {
      await loadContractWorkspace(contract.id);
    } catch (error) {
      addToast(error?.message || t('toasts.contracts.loadWorkspaceError'), 'error');
    }
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
      addToast(error?.message || t('toasts.contracts.milestoneError'), 'error');
    } finally {
      setSubmittingMilestone(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!selectedContract) return;
    setSubmittingMessage(true);
    try {
      await marketplaceApi.sendMessage({
        contractId: selectedContract.id,
        messageType: messageForm.messageType,
        content: messageForm.content,
        attachments: messageForm.attachments,
      });
      addToast(t('toasts.contracts.messageSuccess'), 'success');
      resetMessageForm();
      await loadMessages(selectedContract.id);
    } catch (error) {
      addToast(error?.message || t('toasts.contracts.messageError'), 'error');
    } finally {
      setSubmittingMessage(false);
    }
  };

  const handleCreateReview = async (event) => {
    event.preventDefault();
    if (!selectedContract) return;
    setSubmittingReview(true);
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
      addToast(error?.message || t('toasts.contracts.reviewError'), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">{copy.hero.caption}</Caption>
          <H1 className="mt-3 text-4xl">{copy.hero.title}</H1>
          <Text className="mt-4 text-slate-600">
            {copy.hero.description}
          </Text>
        </Card>
        <Card className="border-2 border-secondary-900 bg-secondary-900 p-6 text-white">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-100">{copy.hero.processCaption}</Caption>
          <H2 className="mt-3 text-2xl text-white">{copy.hero.processTitle}</H2>
          <Text className="mt-4 text-sm text-slate-300">
            {copy.hero.processDescription}
          </Text>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-slate-200 bg-white p-5"><Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.stats.total}</Caption><div className="mt-4 text-4xl font-black text-secondary-900">{loading ? '...' : contractSummary.total}</div></Card>
        <Card className="border-2 border-slate-200 bg-white p-5"><Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.stats.inProgress}</Caption><div className="mt-4 text-4xl font-black text-secondary-900">{loading ? '...' : contractSummary.inProgress}</div></Card>
        <Card className="border-2 border-slate-200 bg-white p-5"><Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.stats.completed}</Caption><div className="mt-4 text-4xl font-black text-secondary-900">{loading ? '...' : contractSummary.completed}</div></Card>
        <Card className="border-2 border-slate-200 bg-white p-5"><Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.stats.cancelled}</Caption><div className="mt-4 text-4xl font-black text-secondary-900">{loading ? '...' : contractSummary.cancelled}</div></Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">{copy.list.caption}</Caption>
          <H2 className="mt-2 text-2xl">{copy.list.title}</H2>
          <div className="mt-5 flex flex-col gap-3">
            {contracts.map((contract) => {
              const statusMeta = getContractStatusMeta(contract.status, locale);
              const isSelected = selectedContractId === contract.id;
              return (
                <div key={contract.id} className={`border p-4 ${isSelected ? 'border-primary-500 bg-primary-50/40' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><div className="text-sm font-bold text-secondary-900">{t('contractsPage.list.contractNumber', { id: contract.id })}</div><Caption className="text-xs text-slate-500">{t('contractsPage.list.projectNumber', { id: contract.projectId })}</Caption></div>
                    <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">{t('contractsPage.list.value', { value: formatCurrency(contract.totalAmount, locale) })}</div>
                  <div className="mt-1 text-sm text-slate-500">{t('contractsPage.list.start', { value: formatDateTime(contract.startDate, locale) })}</div>
                  <div className="mt-4"><Button variant="outline" onClick={() => handleSelectContract(contract)}>{isSelected ? copy.list.viewingDetail : copy.list.openDetail}</Button></div>
                </div>
              );
            })}
            {!loading && contracts.length === 0 && <Callout type="info" title={copy.list.emptyTitle}>{copy.list.emptyDescription}</Callout>}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-2 border-slate-200 bg-white p-6">
            <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">{copy.detail.caption}</Caption>
            <H2 className="mt-2 text-2xl">{selectedContract ? t('contractsPage.detail.selectedTitle', { id: selectedContract.id }) : copy.detail.defaultTitle}</H2>
            {!selectedContract ? (
              <Callout type="info" title={copy.detail.emptyTitle}>{copy.detail.emptyDescription}</Callout>
            ) : (
              <div className="mt-5 flex flex-col gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border border-slate-200 bg-slate-50 p-4">
                    <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.statusCard.caption}</Caption>
                    <div className="mt-3"><Badge color={getContractStatusMeta(selectedContract.status, locale).color}>{getContractStatusMeta(selectedContract.status, locale).label}</Badge></div>
                    <div className="mt-4 text-sm text-slate-600">{t('contractsPage.statusCard.value', { value: formatCurrency(selectedContract.totalAmount, locale) })}</div>
                    <div className="mt-2 text-sm text-slate-500">{t('contractsPage.statusCard.progress', { value: selectedContract.progress ?? 0 })}</div>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 p-4">
                    <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.relatedInfo.caption}</Caption>
                    <div className="mt-3 text-sm text-slate-700">{t('contractsPage.relatedInfo.project', { id: selectedContract.projectId })}</div>
                    <div className="mt-2 text-sm text-slate-700">{t('contractsPage.relatedInfo.customer', { id: selectedContract.clientId })}</div>
                    <div className="mt-2 text-sm text-slate-700">{t('contractsPage.relatedInfo.freelancer', { id: selectedContract.freelancerId })}</div>
                    <div className="mt-2 text-sm text-slate-500">{t('contractsPage.relatedInfo.start', { value: formatDateTime(selectedContract.startDate, locale) })}</div>
                    <div className="mt-2 text-sm text-slate-500">{t('contractsPage.relatedInfo.end', { value: formatDateTime(selectedContract.endDate, locale) })}</div>
                  </div>
                </div>

                <div className="border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">{copy.update.caption}</Caption>
                      <H2 className="mt-2 text-xl">{copy.update.title}</H2>
                      <Text className="mt-2 text-sm text-slate-600">{copy.update.description}</Text>
                    </div>
                    {canCloseSelectedContract ? (
                      <div className="flex flex-wrap gap-3">
                        <Button disabled={Boolean(activeContractAction)} onClick={() => handleUpdateContractStatus('completed')}>{activeContractAction === `${selectedContract.id}:completed` ? copy.update.updating : copy.update.complete}</Button>
                        <Button variant="danger" disabled={Boolean(activeContractAction)} onClick={() => handleUpdateContractStatus('cancelled')}>{activeContractAction === `${selectedContract.id}:cancelled` ? copy.update.updating : copy.update.cancel}</Button>
                      </div>
                    ) : <Badge color={getContractStatusMeta(selectedContract.status, locale).color}>{copy.update.ended}</Badge>}
                  </div>
                </div>

                <div className="border border-slate-200 bg-white p-5">
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">{copy.milestones.caption}</Caption>
                  <H2 className="mt-2 text-xl">{copy.milestones.title}</H2>
                  {canCreateMilestone && (
                    <form className="mt-5 flex flex-col gap-4 border border-slate-200 bg-slate-50 p-4" onSubmit={handleCreateMilestone}>
                      <Input label={copy.milestones.titleLabel} value={milestoneForm.title} onChange={(event) => setMilestoneForm((previous) => ({ ...previous, title: event.target.value }))} />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input label={copy.milestones.valueLabel} type="number" min="0" value={milestoneForm.amount} onChange={(event) => setMilestoneForm((previous) => ({ ...previous, amount: event.target.value }))} />
                        <Input label={copy.milestones.dueDateLabel} type="date" value={milestoneForm.dueDate} onChange={(event) => setMilestoneForm((previous) => ({ ...previous, dueDate: event.target.value }))} />
                      </div>
                      <Button type="submit" disabled={submittingMilestone}>{submittingMilestone ? copy.milestones.submitting : copy.milestones.submit}</Button>
                    </form>
                  )}
                  {!canCreateMilestone && isCustomerOnSelectedContract && <Callout className="mt-5" type="info" title={copy.milestones.customerLockedTitle}>{copy.milestones.customerLockedDescription}</Callout>}
                  {!canCreateMilestone && !isCustomerOnSelectedContract && <Callout className="mt-5" type="info" title={copy.milestones.freelancerLockedTitle}>{copy.milestones.freelancerLockedDescription}</Callout>}
                  <div className="mt-5 flex flex-col gap-3">
                    {loadingMilestones && <Text className="text-sm text-slate-500">{copy.milestones.loading}</Text>}
                    {!loadingMilestones && milestones.map((milestone) => {
                      const statusMeta = getMilestoneStatusMeta(milestone.status, locale);
                      return (
                        <div key={milestone.id} className="border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div><div className="text-sm font-bold text-secondary-900">{milestone.title}</div><Caption className="text-xs text-slate-500">{t('contractsPage.milestones.due', { value: formatDate(milestone.dueDate, locale) })}</Caption></div>
                            <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-700">{t('contractsPage.milestones.value', { value: formatCurrency(milestone.amount, locale) })}</div>
                        </div>
                      );
                    })}
                    {!loadingMilestones && milestones.length === 0 && <Callout type="info" title={copy.milestones.emptyTitle}>{copy.milestones.emptyDescription}</Callout>}
                  </div>
                </div>

                <div className="border border-slate-200 bg-white p-5">
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">{copy.messages.caption}</Caption>
                  <H2 className="mt-2 text-xl">{copy.messages.title}</H2>
                  {canSendMessage ? (
                    <div className="mt-5 flex flex-col gap-4">
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" variant={messageForm.messageType === 'text' ? 'primary' : 'ghost'} onClick={() => setMessageForm({ messageType: 'text', content: '', attachments: '' })}>{copy.messages.textType}</Button>
                        <Button type="button" variant={messageForm.messageType === 'file' ? 'primary' : 'ghost'} onClick={() => setMessageForm({ messageType: 'file', content: '', attachments: '' })}>{copy.messages.fileType}</Button>
                      </div>
                      <form className="flex flex-col gap-4 border border-slate-200 bg-slate-50 p-4" onSubmit={handleSendMessage}>
                        {messageForm.messageType === 'text' ? (
                          <Textarea label={copy.messages.contentLabel} value={messageForm.content} onChange={(event) => setMessageForm((previous) => ({ ...previous, content: event.target.value }))} />
                        ) : (
                          <>
                            <Input label={copy.messages.attachmentLabel} value={messageForm.attachments} onChange={(event) => setMessageForm((previous) => ({ ...previous, attachments: event.target.value }))} />
                            <Textarea label={copy.messages.attachmentNoteLabel} value={messageForm.content} onChange={(event) => setMessageForm((previous) => ({ ...previous, content: event.target.value }))} />
                          </>
                        )}
                        <Button type="submit" disabled={submittingMessage}>{submittingMessage ? copy.messages.submitting : copy.messages.submit}</Button>
                      </form>
                    </div>
                  ) : <Callout className="mt-5" type="info" title={copy.messages.lockedTitle}>{copy.messages.lockedDescription}</Callout>}
                  <div className="mt-5 flex flex-col gap-4">
                    {loadingMessages && <Text className="text-sm text-slate-500">{copy.messages.loading}</Text>}
                    {!loadingMessages && messages.map((message) => {
                      const isSender = message.senderId === user?.id;
                      return (
                        <div key={message.id} className="flex flex-col gap-2">
                          <Caption className={`text-[11px] uppercase tracking-[0.16em] ${isSender ? 'text-right text-primary-700' : 'text-slate-500'}`}>{resolveParticipantLabel(message.senderId, selectedContract, user?.id, t)}</Caption>
                          <ChatBubble message={buildMessagePreview(message, t)} time={formatDateTime(message.sentAt, locale)} isSender={isSender} status={t('status.message.sent')} />
                          {message.messageType === 'file' && message.attachments && (
                            isExternalLink(message.attachments) ? (
                              <a href={message.attachments} target="_blank" rel="noreferrer" className={`text-sm font-semibold text-primary-700 underline ${isSender ? 'self-end' : 'self-start'}`}>{copy.messages.openAttachment}</a>
                            ) : (
                              <Text className={`text-sm text-slate-500 ${isSender ? 'self-end text-right' : 'self-start'}`}>{t('contractsPage.messages.attachmentInline', { value: message.attachments })}</Text>
                            )
                          )}
                        </div>
                      );
                    })}
                    {!loadingMessages && messages.length === 0 && <Callout type="info" title={copy.messages.emptyTitle}>{copy.messages.emptyDescription}</Callout>}
                  </div>
                </div>

                <div className="border border-slate-200 bg-white p-5">
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">{copy.reviews.caption}</Caption>
                  <H2 className="mt-2 text-xl">{copy.reviews.title}</H2>
                  {selectedContract.status !== 'completed' && <Callout className="mt-5" type="info" title={copy.reviews.lockedTitle}>{copy.reviews.lockedDescription}</Callout>}
                  {selectedContract.status === 'completed' && canCreateReview && (
                    <form className="mt-5 flex flex-col gap-4 border border-slate-200 bg-slate-50 p-4" onSubmit={handleCreateReview}>
                      <InteractiveRating key={`review-${selectedContract.id}-${reviewComposerKey}`} label={copy.reviews.ratingLabel} initialRating={reviewForm.rating} onChange={(rating) => setReviewForm((previous) => ({ ...previous, rating }))} />
                      <Textarea label={copy.reviews.commentLabel} value={reviewForm.comment} onChange={(event) => setReviewForm((previous) => ({ ...previous, comment: event.target.value }))} />
                      <Button type="submit" disabled={submittingReview}>{submittingReview ? copy.reviews.submitting : copy.reviews.submit}</Button>
                    </form>
                  )}
                  {selectedContract.status === 'completed' && currentUserReview && <Callout className="mt-5" type="success" title={copy.reviews.submittedTitle}>{t('contractsPage.reviews.submittedDescription', { rating: currentUserReview.rating })}</Callout>}
                  <div className="mt-5 flex flex-col gap-3">
                    {loadingReviews && <Text className="text-sm text-slate-500">{copy.reviews.loading}</Text>}
                    {!loadingReviews && reviews.map((review) => {
                      const badgeColor = review.rating >= 4 ? 'success' : review.rating === 3 ? 'warning' : 'error';
                      return (
                        <div key={review.id} className="border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div><div className="text-sm font-bold text-secondary-900">{resolveParticipantLabel(review.reviewerId, selectedContract, user?.id, t)}</div><Caption className="text-xs text-slate-500">{t('contractsPage.reviews.sentAt', { value: formatDateTime(review.createdAt, locale) })}</Caption></div>
                            <Badge color={badgeColor}>{review.rating}/5</Badge>
                          </div>
                          <Text className="mt-3 text-sm text-slate-600">{review.comment || copy.reviews.commentFallback}</Text>
                          {review.reply && <div className="mt-3 border border-slate-200 bg-white p-3"><Caption className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{copy.reviews.reply}</Caption><Text className="mt-2 text-sm text-slate-600">{review.reply}</Text></div>}
                        </div>
                      );
                    })}
                    {!loadingReviews && reviews.length === 0 && selectedContract.status === 'completed' && <Callout type="info" title={copy.reviews.emptyTitle}>{copy.reviews.emptyDescription}</Callout>}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ContractsPage;
