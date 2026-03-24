import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import marketplaceApi from '../api/marketplaceApi';
import {
  buildBudgetRange,
  formatCurrency,
  formatDate,
  formatDateTime,
  getBidStatusMeta,
  getProjectStatusMeta,
} from '../utils/formatters';

const initialProjectForm = {
  title: '',
  description: '',
  budgetMin: '',
  budgetMax: '',
  deadline: '',
};

const initialBidForm = {
  price: '',
  estimatedTime: '',
  message: '',
};

const formatDateForInput = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

const toIsoDateOrNull = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const buildProjectUpdatePayload = (project, statusOverride) => ({
  title: project.title,
  description: project.description || '',
  budgetMin: Number(project.budgetMin),
  budgetMax: Number(project.budgetMax),
  deadline: toIsoDateOrNull(project.deadline),
  status: statusOverride ?? project.status,
});

const ProjectsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { locale, t } = useI18n();
  const copy = t('projectsPage');
  const [loading, setLoading] = useState(true);
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [bidForm, setBidForm] = useState(initialBidForm);
  const [projects, setProjects] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectBids, setSelectedProjectBids] = useState([]);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [loadingProjectBids, setLoadingProjectBids] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectActionId, setProjectActionId] = useState(null);
  const [bidActionId, setBidActionId] = useState(null);

  const isCustomer = user?.role === 'customer';

  const loadPageData = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    try {
      if (isCustomer) {
        const projectsResponse = await marketplaceApi.getMyProjects();
        setProjects(projectsResponse.data || []);
      } else {
        const [projectsResponse, bidsResponse] = await Promise.all([
          marketplaceApi.getAllProjects(),
          marketplaceApi.getMyBids(),
        ]);
        setProjects(projectsResponse.data || []);
        setMyBids(bidsResponse.data || []);
      }
    } catch (error) {
      addToast(error?.message || t('toasts.projects.loadPageError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, isCustomer, t, user]);

  const loadProjectBids = useCallback(async (project) => {
    setSelectedProject(project);
    setLoadingProjectBids(true);

    try {
      const response = await marketplaceApi.getBidsByProject(project.id);
      setSelectedProjectBids(response.data || []);
    } catch (error) {
      addToast(error?.message || t('toasts.projects.loadBidsError'), 'error');
    } finally {
      setLoadingProjectBids(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const customerProjectSummary = useMemo(() => {
    return projects.reduce((accumulator, project) => {
      accumulator.total += 1;
      if (project.status === 'open') {
        accumulator.open += 1;
      }
      if (project.status === 'cancelled') {
        accumulator.cancelled += 1;
      }
      return accumulator;
    }, { total: 0, open: 0, cancelled: 0 });
  }, [projects]);

  const handleProjectFieldChange = (field) => (event) => {
    setProjectForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleBidFieldChange = (field) => (event) => {
    setBidForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const resetProjectComposer = () => {
    setProjectForm(initialProjectForm);
    setEditingProjectId(null);
  };

  const startEditingProject = (project) => {
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title || '',
      description: project.description || '',
      budgetMin: project.budgetMin ?? '',
      budgetMax: project.budgetMax ?? '',
      deadline: formatDateForInput(project.deadline),
    });
  };

  const handleSubmitProject = async (event) => {
    event.preventDefault();
    setSubmittingProject(true);

    const payload = {
      title: projectForm.title,
      description: projectForm.description,
      budgetMin: Number(projectForm.budgetMin),
      budgetMax: Number(projectForm.budgetMax),
      deadline: toIsoDateOrNull(projectForm.deadline),
    };

    try {
      if (editingProjectId) {
        await marketplaceApi.updateProject(editingProjectId, payload);
        addToast(t('toasts.projects.updateSuccess'), 'success');
      } else {
        await marketplaceApi.createProject(payload);
        addToast(t('toasts.projects.createSuccess'), 'success');
      }
      resetProjectComposer();
      await loadPageData();
    } catch (error) {
      addToast(error?.message || t('toasts.projects.saveError'), 'error');
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleCancelProject = async (project) => {
    setProjectActionId(project.id);
    try {
      await marketplaceApi.updateProject(project.id, buildProjectUpdatePayload(project, 'cancelled'));
      addToast(t('toasts.projects.cancelSuccess'), 'success');
      if (selectedProject?.id === project.id) {
        setSelectedProject((previous) => previous ? { ...previous, status: 'cancelled' } : previous);
      }
      if (editingProjectId === project.id) {
        resetProjectComposer();
      }
      await loadPageData();
    } catch (error) {
      addToast(error?.message || t('toasts.projects.cancelError'), 'error');
    } finally {
      setProjectActionId(null);
    }
  };

  const handleAcceptBid = async (bidId) => {
    setBidActionId(bidId);
    try {
      await marketplaceApi.acceptBid(bidId);
      addToast(t('toasts.projects.acceptSuccess'), 'success');
      await loadPageData();
      if (selectedProject) {
        await loadProjectBids({ ...selectedProject, status: 'in_progress' });
      }
    } catch (error) {
      addToast(error?.message || t('toasts.projects.acceptError'), 'error');
    } finally {
      setBidActionId(null);
    }
  };

  const handleRejectBid = async (bidId) => {
    setBidActionId(bidId);
    try {
      await marketplaceApi.updateBidStatus(bidId, 'rejected');
      addToast(t('toasts.projects.rejectSuccess'), 'success');
      if (selectedProject) {
        await loadProjectBids(selectedProject);
      }
      await loadPageData();
    } catch (error) {
      addToast(error?.message || t('toasts.projects.rejectError'), 'error');
    } finally {
      setBidActionId(null);
    }
  };

  const handleWithdrawBid = async (bidId) => {
    setBidActionId(bidId);
    try {
      await marketplaceApi.updateBidStatus(bidId, 'withdrawn');
      addToast(t('toasts.projects.withdrawSuccess'), 'success');
      await loadPageData();
    } catch (error) {
      addToast(error?.message || t('toasts.projects.withdrawError'), 'error');
    } finally {
      setBidActionId(null);
    }
  };

  const handleSubmitBid = async (event) => {
    event.preventDefault();
    if (!selectedProject) {
      addToast(t('toasts.projects.selectProjectWarning'), 'warning');
      return;
    }

    setSubmittingBid(true);
    try {
      await marketplaceApi.createBid({
        projectId: selectedProject.id,
        price: Number(bidForm.price),
        estimatedTime: bidForm.estimatedTime,
        message: bidForm.message,
        attachments: '',
      });
      addToast(t('toasts.projects.submitSuccess'), 'success');
      setBidForm(initialBidForm);
      await loadPageData();
    } catch (error) {
      addToast(error?.message || t('toasts.projects.submitError'), 'error');
    } finally {
      setSubmittingBid(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            {copy.hero.caption}
          </Caption>
          <H1 className="mt-3 text-4xl">
            {isCustomer ? copy.hero.titleCustomer : copy.hero.titleFreelancer}
          </H1>
          <Text className="mt-4 text-slate-600">
            {copy.hero.description}
          </Text>
        </Card>

        <Card className="border-2 border-secondary-900 bg-secondary-900 p-6 text-white">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-100">
            {copy.note.caption}
          </Caption>
          <H2 className="mt-3 text-2xl text-white">
            {isCustomer ? copy.note.titleCustomer : copy.note.titleFreelancer}
          </H2>
          <Text className="mt-4 text-sm text-slate-300">
            {isCustomer ? copy.note.descriptionCustomer : copy.note.descriptionFreelancer}
          </Text>
        </Card>
      </section>

      {isCustomer ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Card className="border-2 border-slate-200 bg-white p-5">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {copy.stats.total}
              </Caption>
              <div className="mt-4 text-4xl font-black text-secondary-900">
                {loading ? '...' : customerProjectSummary.total}
              </div>
            </Card>
            <Card className="border-2 border-slate-200 bg-white p-5">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {copy.stats.open}
              </Caption>
              <div className="mt-4 text-4xl font-black text-secondary-900">
                {loading ? '...' : customerProjectSummary.open}
              </div>
            </Card>
            <Card className="border-2 border-slate-200 bg-white p-5">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {copy.stats.cancelled}
              </Caption>
              <div className="mt-4 text-4xl font-black text-secondary-900">
                {loading ? '...' : customerProjectSummary.cancelled}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-2 border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                    {editingProjectId ? copy.customerComposer.captionUpdate : copy.customerComposer.captionCreate}
                  </Caption>
                  <H2 className="mt-2 text-2xl">
                    {editingProjectId ? copy.customerComposer.titleUpdate : copy.customerComposer.titleCreate}
                  </H2>
                </div>
                {editingProjectId && (
                  <Button variant="ghost" onClick={resetProjectComposer}>
                    {copy.customerComposer.cancelEdit}
                  </Button>
                )}
              </div>

              {editingProjectId && (
                <Callout className="mt-5" type="info" title={copy.customerComposer.updateModeTitle}>
                  {copy.customerComposer.updateModeDescription}
                </Callout>
              )}

              <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmitProject}>
                <Input label={copy.customerComposer.titleLabel} placeholder={copy.customerComposer.titlePlaceholder} value={projectForm.title} onChange={handleProjectFieldChange('title')} />
                <Textarea label={copy.customerComposer.descriptionLabel} placeholder={copy.customerComposer.descriptionPlaceholder} value={projectForm.description} onChange={handleProjectFieldChange('description')} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label={copy.customerComposer.budgetMinLabel} type="number" min="0" value={projectForm.budgetMin} onChange={handleProjectFieldChange('budgetMin')} />
                  <Input label={copy.customerComposer.budgetMaxLabel} type="number" min="0" value={projectForm.budgetMax} onChange={handleProjectFieldChange('budgetMax')} />
                </div>
                <Input label={copy.customerComposer.deadlineLabel} type="date" value={projectForm.deadline} onChange={handleProjectFieldChange('deadline')} />
                <Button type="submit" disabled={submittingProject}>
                  {submittingProject
                    ? (editingProjectId ? copy.customerComposer.submitUpdating : copy.customerComposer.submitCreating)
                    : (editingProjectId ? copy.customerComposer.submitUpdate : copy.customerComposer.submitCreate)}
                </Button>
              </form>
            </Card>

            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {copy.customerList.caption}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {copy.customerList.title}
              </H2>
              <div className="mt-5 flex flex-col gap-3">
                {projects.map((project) => {
                  const statusMeta = getProjectStatusMeta(project.status, locale);
                  const canManageProject = project.status === 'open' || project.status === 'cancelled';
                  const isCancellingProject = projectActionId === project.id;

                  return (
                    <div key={project.id} className="border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-secondary-900">{project.title}</div>
                          <Caption className="text-xs text-slate-500">
                            {t('projectsPage.customerList.deadline', { date: formatDate(project.deadline, locale) })}
                          </Caption>
                        </div>
                        <Badge color={statusMeta.color}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <Text className="mt-3 text-sm text-slate-600">
                        {project.description || copy.customerList.descriptionFallback}
                      </Text>
                      <div className="mt-3 text-sm font-semibold text-slate-700">
                        {t('projectsPage.customerList.budget', { value: buildBudgetRange(project, locale) })}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => loadProjectBids(project)}>
                          {copy.customerList.viewBids}
                        </Button>
                        {canManageProject && (
                          <Button variant="ghost" onClick={() => startEditingProject(project)}>
                            {copy.customerList.edit}
                          </Button>
                        )}
                        {project.status === 'open' && (
                          <Button
                            variant="danger"
                            disabled={isCancellingProject}
                            onClick={() => handleCancelProject(project)}
                          >
                            {isCancellingProject ? copy.customerList.cancelling : copy.customerList.cancel}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!loading && projects.length === 0 && (
                  <Callout type="info" title={copy.customerList.emptyTitle}>
                    {copy.customerList.emptyDescription}
                  </Callout>
                )}
              </div>
            </Card>
          </section>

          {selectedProject && (
            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {copy.projectBids.caption}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {t('projectsPage.projectBids.title', { title: selectedProject.title })}
              </H2>
              <div className="mt-2">
                <Badge color={getProjectStatusMeta(selectedProject.status, locale).color}>
                  {getProjectStatusMeta(selectedProject.status, locale).label}
                </Badge>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {loadingProjectBids && (
                  <Text className="text-sm text-slate-500">
                    {copy.projectBids.loading}
                  </Text>
                )}

                {!loadingProjectBids && selectedProjectBids.map((bid) => {
                  const statusMeta = getBidStatusMeta(bid.status, locale);
                  const isHandlingBid = bidActionId === bid.id;
                  const canProcessBid = selectedProject.status === 'open' && bid.status === 'pending';

                  return (
                    <div key={bid.id} className="border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-secondary-900">
                            {bid.freelancer?.fullName || t('projectsPage.projectBids.freelancerFallback', { id: bid.freelancer?.id || bid.id })}
                          </div>
                          <Caption className="text-xs text-slate-500">
                            {t('projectsPage.projectBids.proposedAt', { value: formatDateTime(bid.createdAt, locale) })}
                          </Caption>
                        </div>
                        <Badge color={statusMeta.color}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <div className="mt-3 text-sm font-semibold text-slate-700">
                        {t('projectsPage.projectBids.price', { value: formatCurrency(bid.price, locale) })}
                      </div>
                      <Text className="mt-2 text-sm text-slate-600">
                        {bid.message || copy.projectBids.messageFallback}
                      </Text>
                      <Text className="mt-2 text-sm text-slate-500">
                        {t('projectsPage.projectBids.estimatedTime', { value: bid.estimatedTime || copy.projectBids.estimatedFallback })}
                      </Text>
                      {canProcessBid && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button disabled={isHandlingBid} onClick={() => handleAcceptBid(bid.id)}>
                            {isHandlingBid ? copy.projectBids.processing : copy.projectBids.accept}
                          </Button>
                          <Button disabled={isHandlingBid} variant="danger" onClick={() => handleRejectBid(bid.id)}>
                            {isHandlingBid ? copy.projectBids.processing : copy.projectBids.reject}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!loadingProjectBids && selectedProjectBids.length === 0 && (
                  <Callout type="info" title={copy.projectBids.emptyTitle}>
                    {copy.projectBids.emptyDescription}
                  </Callout>
                )}
              </div>
            </Card>
          )}
        </>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-2 border-slate-200 bg-white p-6">
            <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
              {copy.marketplace.caption}
            </Caption>
            <H2 className="mt-2 text-2xl">
              {copy.marketplace.title}
            </H2>
            <div className="mt-5 flex flex-col gap-3">
              {projects.map((project) => {
                const statusMeta = getProjectStatusMeta(project.status, locale);
                return (
                  <div key={project.id} className="border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-secondary-900">{project.title}</div>
                      <Caption className="text-xs text-slate-500">
                          {t('projectsPage.marketplace.owner', { name: project.user?.fullName || t('projectsPage.marketplace.ownerFallback', { id: project.user?.id || '---' }) })}
                      </Caption>
                    </div>
                      <Badge color={statusMeta.color}>
                        {statusMeta.label}
                      </Badge>
                    </div>
                    <Text className="mt-3 text-sm text-slate-600">
                      {project.description || copy.marketplace.descriptionFallback}
                    </Text>
                    <div className="mt-3 text-sm font-semibold text-slate-700">
                      {t('projectsPage.marketplace.budget', { value: buildBudgetRange(project, locale) })}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      {t('projectsPage.marketplace.deadline', { date: formatDate(project.deadline, locale) })}
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => setSelectedProject(project)}>
                        {copy.marketplace.select}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {!loading && projects.length === 0 && (
                <Callout type="info" title={copy.marketplace.emptyTitle}>
                  {copy.marketplace.emptyDescription}
                </Callout>
              )}
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {copy.bidComposer.caption}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {selectedProject ? t('projectsPage.bidComposer.titleSelected', { title: selectedProject.title }) : copy.bidComposer.titleDefault}
              </H2>
              {!selectedProject ? (
                <Callout type="info" title={copy.bidComposer.emptyTitle}>
                  {copy.bidComposer.emptyDescription}
                </Callout>
              ) : (
                <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmitBid}>
                  <Input label={copy.bidComposer.priceLabel} type="number" min="0" value={bidForm.price} onChange={handleBidFieldChange('price')} />
                  <Input label={copy.bidComposer.estimatedLabel} placeholder={copy.bidComposer.estimatedPlaceholder} value={bidForm.estimatedTime} onChange={handleBidFieldChange('estimatedTime')} />
                  <Textarea label={copy.bidComposer.messageLabel} placeholder={copy.bidComposer.messagePlaceholder} value={bidForm.message} onChange={handleBidFieldChange('message')} />
                  <Button type="submit" disabled={submittingBid}>
                    {submittingBid ? copy.bidComposer.submitting : copy.bidComposer.submit}
                  </Button>
                </form>
              )}
            </Card>

            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {copy.myBids.caption}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {copy.myBids.title}
              </H2>
              <div className="mt-5 flex flex-col gap-3">
                {myBids.map((bid) => {
                  const statusMeta = getBidStatusMeta(bid.status, locale);
                  const isHandlingBid = bidActionId === bid.id;

                  return (
                    <div key={bid.id} className="border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-secondary-900">
                            {bid.project?.title || t('projectsPage.myBids.projectFallback', { id: bid.project?.id || bid.id })}
                          </div>
                          <Caption className="text-xs text-slate-500">
                            {t('projectsPage.myBids.price', { value: formatCurrency(bid.price, locale) })}
                          </Caption>
                        </div>
                        <Badge color={statusMeta.color}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <Text className="mt-3 text-sm text-slate-600">
                        {bid.message || copy.myBids.messageFallback}
                      </Text>
                      <Text className="mt-2 text-sm text-slate-500">
                        {t('projectsPage.myBids.estimatedTime', { value: bid.estimatedTime || copy.myBids.estimatedFallback })}
                      </Text>
                      {bid.status === 'pending' && (
                        <div className="mt-4">
                          <Button disabled={isHandlingBid} variant="danger" onClick={() => handleWithdrawBid(bid.id)}>
                            {isHandlingBid ? copy.myBids.processing : copy.myBids.withdraw}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!loading && myBids.length === 0 && (
                  <Callout type="info" title={copy.myBids.emptyTitle}>
                    {copy.myBids.emptyDescription}
                  </Callout>
                )}
              </div>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProjectsPage;
