import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Badge from '../components/common/Badge';
import Callout from '../components/common/Callout';
import InlineErrorBlock from '../components/common/InlineErrorBlock';
import SearchInput from '../components/common/SearchInput';
import Select from '../components/common/Select';
import TagInput from '../components/common/TagInput';
import FileUpload from '../components/common/FileUpload';
import StatMetricCard from '../components/common/StatMetricCard';
import InfoPanel from '../components/common/InfoPanel';
import Spinner from '../components/common/Spinner';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import useMinimumLoadingState from '../hooks/useMinimumLoadingState';
import marketplaceApi from '../api/marketplaceApi';
import {
  buildBudgetRange,
  formatCurrency,
  formatDate,
  formatDateTime,
  getBidStatusMeta,
  getProjectStatusMeta,
} from '../utils/formatters';
import { formatAttachmentSize, normalizeAttachments } from '../utils/attachments';
import { splitApiFormError } from '../utils/formError';
import ReportModal from '../components/common/ReportModal';
import { WarningTriangle } from 'iconoir-react';

const initialProjectForm = {
  title: '',
  description: '',
  budgetMin: '',
  budgetMax: '',
  deadline: '',
  skills: [],
  attachments: [],
  existingAttachments: [],
};

const initialBidForm = {
  price: '',
  estimatedTime: '',
  message: '',
  attachments: [],
};

const getProjectsSupplementaryCopy = (locale) => {
  if (locale === 'en') {
    return {
      projectSkillsLabel: 'Required skills',
      projectSkillsPlaceholder: 'Type a skill and press Enter',
      projectSkillsHint: 'Press Enter to add the skill list that fits this project.',
      projectSkillsSuggestions: 'Suggested from the skill catalog',
      invalidSkillMessage: 'This skill is not in the shared catalog yet.',
      marketplaceFiltersTitle: 'Search the marketplace',
      marketplaceFiltersDescription: 'Combine status and skill filters, then use keyword search locally to narrow the open workspace faster.',
      marketplaceSearchPlaceholder: 'Search by title, description, skill, or owner',
      marketplaceStatusLabel: 'Status',
      marketplaceSkillsLabel: 'Filter by skills',
      marketplaceSkillsPlaceholder: 'Type a skill and press Enter',
      marketplaceSkillsHint: 'Only the selected skills are sent to the backend search endpoint.',
      marketplaceResetFilters: 'Reset filters',
      marketplaceNoSkillMatches: 'No matching skills in the catalog.',
      marketplaceLoading: 'Refreshing marketplace data...',
      skillCatalogLoading: 'Loading skill catalog...',
      skillsCaption: 'Skills',
      attachmentsCaption: 'Attachments',
      projectAttachmentsLabel: 'Project attachments',
      bidAttachmentsLabel: 'Proposal attachments',
      marketplaceFiltersEmptyTitle: 'No matching projects',
      marketplaceFiltersEmptyDescription: 'Try clearing some filters or choosing a different status and skill combination.',
    };
  }

  return {
    projectSkillsLabel: 'Kỹ năng yêu cầu',
    projectSkillsPlaceholder: 'Nhập kỹ năng rồi nhấn Enter',
    projectSkillsHint: 'Nhấn Enter để thêm danh sách kỹ năng phù hợp với dự án này.',
    projectSkillsSuggestions: 'Gợi ý từ danh mục kỹ năng',
    invalidSkillMessage: 'Kỹ năng này chưa có trong danh mục dùng chung.',
    marketplaceFiltersTitle: 'Tìm kiếm trên marketplace',
    marketplaceFiltersDescription: 'Kết hợp trạng thái và kỹ năng, sau đó lọc theo từ khóa ngay trên giao diện để thu hẹp danh sách nhanh hơn.',
    marketplaceSearchPlaceholder: 'Tìm theo tiêu đề, mô tả, kỹ năng hoặc chủ dự án',
    marketplaceStatusLabel: 'Trạng thái',
    marketplaceSkillsLabel: 'Lọc theo kỹ năng',
    marketplaceSkillsPlaceholder: 'Nhập kỹ năng rồi nhấn Enter',
    marketplaceSkillsHint: 'Chỉ các kỹ năng đã chọn mới được gửi tới endpoint search của backend.',
    marketplaceResetFilters: 'Đặt lại bộ lọc',
    marketplaceNoSkillMatches: 'Không còn kỹ năng phù hợp trong danh mục.',
    marketplaceLoading: 'Đang làm mới dữ liệu marketplace...',
    skillCatalogLoading: 'Đang tải danh mục kỹ năng...',
    skillsCaption: 'Kỹ năng',
    attachmentsCaption: 'Tệp đính kèm',
    projectAttachmentsLabel: 'Tệp đính kèm dự án',
    bidAttachmentsLabel: 'Tệp đính kèm báo giá',
    marketplaceFiltersEmptyTitle: 'Không có dự án phù hợp',
    marketplaceFiltersEmptyDescription: 'Hãy thử bỏ bớt bộ lọc hoặc chọn tổ hợp trạng thái và kỹ năng khác.',
  };
};

const normalizeSkillNames = (skills) =>
  Array.isArray(skills)
    ? [...new Set(skills.map((skill) => `${skill || ''}`.trim()).filter(Boolean))]
    : [];

const matchesProjectKeyword = (project, keyword) => {
  const normalizedKeyword = `${keyword || ''}`.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }

  const searchableContent = [
    project?.title,
    project?.description,
    project?.user?.fullName,
    ...(Array.isArray(project?.skills) ? project.skills : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableContent.includes(normalizedKeyword);
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

const AttachmentLinks = ({ attachments, caption }) => {
  const normalizedAttachments = normalizeAttachments(attachments);

  if (normalizedAttachments.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {caption && (
        <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          {caption}
        </Caption>
      )}
      <div className="flex flex-wrap gap-2">
        {normalizedAttachments.map((attachment, index) => (
          <a
            key={`${attachment.url}-${index}`}
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-primary-700 underline-offset-2 hover:border-primary-500 hover:underline"
          >
            {attachment.name}
            {formatAttachmentSize(attachment.size) ? ` - ${formatAttachmentSize(attachment.size)}` : ''}
          </a>
        ))}
      </div>
    </div>
  );
};

const buildProjectUpdatePayload = (project, statusOverride) => ({
  title: project.title,
  description: project.description || '',
  budgetMin: Number(project.budgetMin),
  budgetMax: Number(project.budgetMax),
  deadline: toIsoDateOrNull(project.deadline),
  status: statusOverride ?? project.status,
  skills: normalizeSkillNames(project.skills),
  attachments: normalizeAttachments(project.attachments),
});

const ProjectsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { locale, t } = useI18n();
  const copy = t('projectsPage');
  const extraCopy = useMemo(() => getProjectsSupplementaryCopy(locale), [locale]);
  const [loading, setLoading] = useState(true);
  const visibleLoading = useMinimumLoadingState(loading, 700);
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [bidForm, setBidForm] = useState(initialBidForm);
  const [projects, setProjects] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [skillCatalog, setSkillCatalog] = useState([]);
  const [loadingSkillCatalog, setLoadingSkillCatalog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectBids, setSelectedProjectBids] = useState([]);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [projectFieldErrors, setProjectFieldErrors] = useState({});
  const [projectFormError, setProjectFormError] = useState('');
  const [bidFieldErrors, setBidFieldErrors] = useState({});
  const [bidFormError, setBidFormError] = useState('');
  const [loadingProjectBids, setLoadingProjectBids] = useState(false);
  const visibleProjectBidsLoading = useMinimumLoadingState(loadingProjectBids, 500);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectActionId, setProjectActionId] = useState(null);
  const [bidActionId, setBidActionId] = useState(null);
  const [marketplaceSearchTerm, setMarketplaceSearchTerm] = useState('');
  const [marketplaceStatus, setMarketplaceStatus] = useState('open');
  const [marketplaceSkills, setMarketplaceSkills] = useState([]);
  
  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [projectToReport, setProjectToReport] = useState(null);

  const isCustomer = user?.role === 'customer';

  const loadSkillCatalog = useCallback(async () => {
    setLoadingSkillCatalog(true);
    try {
      const response = await marketplaceApi.getSkillCatalog();
      const nextCatalog = (response.data || []).map((skill) => skill.name).filter(Boolean);
      setSkillCatalog([...new Set(nextCatalog)]);
    } catch {
      setSkillCatalog([]);
    } finally {
      setLoadingSkillCatalog(false);
    }
  }, []);

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
        const shouldUseSearchEndpoint = marketplaceStatus !== 'open' || marketplaceSkills.length > 0;
        const [projectsResponse, bidsResponse] = await Promise.all([
          shouldUseSearchEndpoint
            ? marketplaceApi.searchProjects({
              status: marketplaceStatus,
              skills: marketplaceSkills,
            })
            : marketplaceApi.getAllProjects(),
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
  }, [addToast, isCustomer, marketplaceSkills, marketplaceStatus, t, user?.id]);

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

  useEffect(() => {
    loadSkillCatalog();
  }, [loadSkillCatalog]);

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

  const marketplaceStatusOptions = useMemo(() => ([
    { value: 'open', label: t('status.project.open', {}, locale) },
    { value: 'in_progress', label: t('status.project.in_progress', {}, locale) },
    { value: 'completed', label: t('status.project.completed', {}, locale) },
    { value: 'cancelled', label: t('status.project.cancelled', {}, locale) },
  ]), [locale, t]);

  const filteredMarketplaceProjects = useMemo(
    () => projects.filter((project) => matchesProjectKeyword(project, marketplaceSearchTerm)),
    [marketplaceSearchTerm, projects],
  );

  const projectSkillSuggestions = useMemo(
    () => skillCatalog.filter((skill) => !normalizeSkillNames(projectForm.skills).includes(skill)).slice(0, 10),
    [projectForm.skills, skillCatalog],
  );

  const marketplaceSkillSuggestions = useMemo(
    () => skillCatalog.filter((skill) => !marketplaceSkills.includes(skill)).slice(0, 10),
    [marketplaceSkills, skillCatalog],
  );
  const projectAttachmentSlots = Math.max(0, 5 - normalizeAttachments(projectForm.existingAttachments).length);

  const handleProjectFieldChange = (field) => (event) => {
    setProjectForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
    setProjectFieldErrors((previous) => ({ ...previous, [field]: '' }));
    setProjectFormError('');
  };

  const handleBidFieldChange = (field) => (event) => {
    setBidForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
    setBidFieldErrors((previous) => ({ ...previous, [field]: '' }));
    setBidFormError('');
  };

  const uploadSelectedFiles = useCallback(async (context, files, params = {}) => {
    if (!files?.length) {
      return [];
    }

    const response = await marketplaceApi.uploadFiles(context, files, params);
    return normalizeAttachments(response.data || []);
  }, []);

  const resetProjectComposer = () => {
    setProjectForm(initialProjectForm);
    setEditingProjectId(null);
    setProjectFieldErrors({});
    setProjectFormError('');
  };

  const startEditingProject = (project) => {
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title || '',
      description: project.description || '',
      budgetMin: project.budgetMin ?? '',
      budgetMax: project.budgetMax ?? '',
      deadline: formatDateForInput(project.deadline),
      skills: normalizeSkillNames(project.skills),
      attachments: [],
      existingAttachments: normalizeAttachments(project.attachments),
    });
    setProjectFieldErrors({});
    setProjectFormError('');
  };

  const handleSubmitProject = async (event) => {
    event.preventDefault();
    setSubmittingProject(true);
    setProjectFieldErrors({});
    setProjectFormError('');

    try {
      const uploadedAttachments = await uploadSelectedFiles(
        'projects',
        projectForm.attachments,
        editingProjectId ? { projectId: editingProjectId } : {},
      );
      const payload = {
        title: projectForm.title,
        description: projectForm.description,
        budgetMin: Number(projectForm.budgetMin),
        budgetMax: Number(projectForm.budgetMax),
        deadline: toIsoDateOrNull(projectForm.deadline),
        skills: normalizeSkillNames(projectForm.skills),
        attachments: [
          ...normalizeAttachments(projectForm.existingAttachments),
          ...uploadedAttachments,
        ],
      };

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
      const { fieldErrors, formError } = splitApiFormError(error, t('toasts.projects.saveError'));
      setProjectFieldErrors(fieldErrors);
      setProjectFormError(formError);
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
    setBidFieldErrors({});
    setBidFormError('');
    try {
      const uploadedAttachments = await uploadSelectedFiles(
        'bids',
        bidForm.attachments,
        { projectId: selectedProject.id },
      );
      await marketplaceApi.createBid({
        projectId: selectedProject.id,
        price: Number(bidForm.price),
        estimatedTime: bidForm.estimatedTime,
        message: bidForm.message,
        attachments: uploadedAttachments,
      });
      addToast(t('toasts.projects.submitSuccess'), 'success');
      setBidForm(initialBidForm);
      setBidFieldErrors({});
      setBidFormError('');
      await loadPageData();
    } catch (error) {
      const { fieldErrors, formError } = splitApiFormError(error, t('toasts.projects.submitError'));
      setBidFieldErrors(fieldErrors);
      setBidFormError(formError);
    } finally {
      setSubmittingBid(false);
    }
  };

  const addProjectSkill = (skillName) => {
    setProjectForm((previous) => ({
      ...previous,
      skills: normalizeSkillNames([...(previous.skills || []), skillName]),
    }));
  };

  const addMarketplaceSkill = (skillName) => {
    setMarketplaceSkills((previous) => normalizeSkillNames([...previous, skillName]));
  };

  const handleInvalidSkill = () => {
    addToast(extraCopy.invalidSkillMessage, 'warning');
  };

  const resetMarketplaceFilters = () => {
    setMarketplaceSearchTerm('');
    setMarketplaceStatus('open');
    setMarketplaceSkills([]);
  };

  return (
    <div className="flex flex-col gap-6">
      <section>
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
      </section>

      {isCustomer ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <StatMetricCard label={copy.stats.total} value={customerProjectSummary.total} isLoading={visibleLoading} />
            <StatMetricCard label={copy.stats.open} value={customerProjectSummary.open} isLoading={visibleLoading} />
            <StatMetricCard label={copy.stats.cancelled} value={customerProjectSummary.cancelled} isLoading={visibleLoading} />
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
                {projectFormError && (
                  <InlineErrorBlock title={copy.customerComposer.errorTitle}>
                    {projectFormError}
                  </InlineErrorBlock>
                )}
                <Input label={copy.customerComposer.titleLabel} placeholder={copy.customerComposer.titlePlaceholder} value={projectForm.title} onChange={handleProjectFieldChange('title')} error={projectFieldErrors.title} />
                <Textarea label={copy.customerComposer.descriptionLabel} placeholder={copy.customerComposer.descriptionPlaceholder} value={projectForm.description} onChange={handleProjectFieldChange('description')} error={projectFieldErrors.description} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label={copy.customerComposer.budgetMinLabel} type="number" min="0" value={projectForm.budgetMin} onChange={handleProjectFieldChange('budgetMin')} error={projectFieldErrors.budgetMin} />
                  <Input label={copy.customerComposer.budgetMaxLabel} type="number" min="0" value={projectForm.budgetMax} onChange={handleProjectFieldChange('budgetMax')} error={projectFieldErrors.budgetMax} />
                </div>
                <Input label={copy.customerComposer.deadlineLabel} type="date" value={projectForm.deadline} onChange={handleProjectFieldChange('deadline')} error={projectFieldErrors.deadline} />
                <TagInput
                  label={extraCopy.projectSkillsLabel}
                  placeholder={extraCopy.projectSkillsPlaceholder}
                  helperText={extraCopy.projectSkillsHint}
                  initialTags={projectForm.skills}
                  allowedTags={skillCatalog}
                  disabled={loadingSkillCatalog || submittingProject}
                  onInvalidTag={handleInvalidSkill}
                  onChange={(skills) => {
                    setProjectForm((previous) => ({ ...previous, skills }));
                    setProjectFieldErrors((previous) => ({ ...previous, skills: '' }));
                    setProjectFormError('');
                  }}
                  error={projectFieldErrors.skills}
                />
                {loadingSkillCatalog && (
                  <Text className="text-sm text-slate-500">{extraCopy.skillCatalogLoading}</Text>
                )}
                {projectSkillSuggestions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      {extraCopy.projectSkillsSuggestions}
                    </Caption>
                    <div className="flex flex-wrap gap-2">
                      {projectSkillSuggestions.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          disabled={loadingSkillCatalog || submittingProject}
                          onClick={() => addProjectSkill(skill)}
                          className="border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-secondary-900 transition-colors hover:border-primary-500 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {editingProjectId && (
                  <AttachmentLinks
                    attachments={projectForm.existingAttachments}
                    caption={extraCopy.attachmentsCaption}
                  />
                )}
                <FileUpload
                  label={extraCopy.projectAttachmentsLabel}
                  value={projectForm.attachments}
                  onChange={(attachments) => {
                    setProjectForm((previous) => ({ ...previous, attachments }));
                    setProjectFieldErrors((previous) => ({ ...previous, attachments: '' }));
                    setProjectFormError('');
                  }}
                  maxFiles={projectAttachmentSlots}
                  disabled={submittingProject || projectAttachmentSlots === 0}
                  error={projectFieldErrors.attachments}
                />
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
                {visibleLoading && (
                  <div className="flex items-center justify-center border border-dashed border-slate-200 bg-slate-50 p-5">
                    <Spinner size="sm" label={extraCopy.marketplaceLoading} />
                  </div>
                )}

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
                      {normalizeSkillNames(project.skills).length > 0 && (
                        <div className="mt-4 flex flex-col gap-2">
                          <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            {extraCopy.skillsCaption}
                          </Caption>
                          <div className="flex flex-wrap gap-2">
                            {normalizeSkillNames(project.skills).map((skill) => (
                              <Badge key={`${project.id}-${skill}`} color="info">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <AttachmentLinks
                        attachments={project.attachments}
                        caption={extraCopy.attachmentsCaption}
                      />
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
                        {!isCustomer && (
                          <Button 
                            variant="ghost" 
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => {
                              setProjectToReport(project);
                              setIsReportModalOpen(true);
                            }}
                          >
                            <WarningTriangle className="w-4 h-4 mr-2" />
                            {t('reportModal.submitBtn')}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!visibleLoading && projects.length === 0 && (
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
              <AttachmentLinks
                attachments={selectedProject.attachments}
                caption={extraCopy.attachmentsCaption}
              />
              <div className="mt-5 flex flex-col gap-3">
                {visibleProjectBidsLoading && (
                  <Text className="text-sm text-slate-500">
                    {copy.projectBids.loading}
                  </Text>
                )}

                {!visibleProjectBidsLoading && selectedProjectBids.map((bid) => {
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
                      <AttachmentLinks
                        attachments={bid.attachments}
                        caption={extraCopy.attachmentsCaption}
                      />
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

                {!visibleProjectBidsLoading && selectedProjectBids.length === 0 && (
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
              <InfoPanel className="mt-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                      {extraCopy.marketplaceFiltersTitle}
                    </Caption>
                    <Text className="mt-2 text-sm text-slate-600">
                      {extraCopy.marketplaceFiltersDescription}
                    </Text>
                  </div>
                  <Button type="button" variant="ghost" onClick={resetMarketplaceFilters}>
                    {extraCopy.marketplaceResetFilters}
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <SearchInput
                    value={marketplaceSearchTerm}
                    onChange={(event) => setMarketplaceSearchTerm(event.target.value)}
                    placeholder={extraCopy.marketplaceSearchPlaceholder}
                  />
                  <Select
                    label={extraCopy.marketplaceStatusLabel}
                    value={marketplaceStatus}
                    options={marketplaceStatusOptions}
                    disabled={visibleLoading}
                    onChange={(event) => setMarketplaceStatus(event.target.value)}
                  />
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <TagInput
                    label={extraCopy.marketplaceSkillsLabel}
                    placeholder={extraCopy.marketplaceSkillsPlaceholder}
                    helperText={extraCopy.marketplaceSkillsHint}
                    initialTags={marketplaceSkills}
                    allowedTags={skillCatalog}
                    disabled={loadingSkillCatalog || visibleLoading}
                    onInvalidTag={handleInvalidSkill}
                    onChange={setMarketplaceSkills}
                  />
                  {loadingSkillCatalog && (
                    <Text className="text-sm text-slate-500">{extraCopy.skillCatalogLoading}</Text>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {marketplaceSkillSuggestions.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        disabled={loadingSkillCatalog || visibleLoading}
                        onClick={() => addMarketplaceSkill(skill)}
                        className="border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-secondary-900 transition-colors hover:border-primary-500 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {skill}
                      </button>
                    ))}
                    {skillCatalog.length > 0 && marketplaceSkillSuggestions.length === 0 && (
                      <Text className="text-sm text-slate-500">
                        {extraCopy.marketplaceNoSkillMatches}
                      </Text>
                    )}
                  </div>
                </div>
              </InfoPanel>
              <div className="mt-5 flex flex-col gap-3">
                {visibleLoading && (
                  <div className="flex items-center justify-center border border-dashed border-slate-200 bg-slate-50 p-5">
                    <Spinner size="sm" label={extraCopy.marketplaceLoading} />
                  </div>
                )}

                {filteredMarketplaceProjects.map((project) => {
                  const statusMeta = getProjectStatusMeta(project.status, locale);
                  return (
                    <InfoPanel key={project.id}>
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
                      {normalizeSkillNames(project.skills).length > 0 && (
                        <div className="mt-4 flex flex-col gap-2">
                          <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            {extraCopy.skillsCaption}
                          </Caption>
                          <div className="flex flex-wrap gap-2">
                            {normalizeSkillNames(project.skills).map((skill) => (
                              <Badge key={`${project.id}-${skill}`} color="info">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <AttachmentLinks
                        attachments={project.attachments}
                        caption={extraCopy.attachmentsCaption}
                      />
                      <div className="mt-4">
                        <Button variant="outline" onClick={() => setSelectedProject(project)}>
                          {copy.marketplace.select}
                        </Button>
                      </div>
                    </InfoPanel>
                  );
                })}

              {!visibleLoading && projects.length === 0 && (
                <Callout type="info" title={copy.marketplace.emptyTitle}>
                  {copy.marketplace.emptyDescription}
                </Callout>
              )}
              {!visibleLoading && projects.length > 0 && filteredMarketplaceProjects.length === 0 && (
                <Callout type="info" title={extraCopy.marketplaceFiltersEmptyTitle}>
                  {extraCopy.marketplaceFiltersEmptyDescription}
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
                  {bidFormError && (
                    <InlineErrorBlock title={copy.bidComposer.errorTitle}>
                      {bidFormError}
                    </InlineErrorBlock>
                  )}
                  <Input label={copy.bidComposer.priceLabel} type="number" min="0" value={bidForm.price} onChange={handleBidFieldChange('price')} error={bidFieldErrors.price} />
                  <Input label={copy.bidComposer.estimatedLabel} placeholder={copy.bidComposer.estimatedPlaceholder} value={bidForm.estimatedTime} onChange={handleBidFieldChange('estimatedTime')} error={bidFieldErrors.estimatedTime} />
                  <Textarea label={copy.bidComposer.messageLabel} placeholder={copy.bidComposer.messagePlaceholder} value={bidForm.message} onChange={handleBidFieldChange('message')} error={bidFieldErrors.message} />
                  <FileUpload
                    label={extraCopy.bidAttachmentsLabel}
                    value={bidForm.attachments}
                    onChange={(attachments) => {
                      setBidForm((previous) => ({ ...previous, attachments }));
                      setBidFieldErrors((previous) => ({ ...previous, attachments: '' }));
                      setBidFormError('');
                    }}
                    maxFiles={5}
                    disabled={submittingBid}
                    error={bidFieldErrors.attachments}
                  />
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
                    <InfoPanel key={bid.id}>
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
                      <AttachmentLinks
                        attachments={bid.attachments}
                        caption={extraCopy.attachmentsCaption}
                      />
                      {bid.status === 'pending' && (
                        <div className="mt-4">
                          <Button disabled={isHandlingBid} variant="danger" onClick={() => handleWithdrawBid(bid.id)}>
                            {isHandlingBid ? copy.myBids.processing : copy.myBids.withdraw}
                          </Button>
                        </div>
                      )}
                    </InfoPanel>
                  );
                })}

                {!visibleLoading && myBids.length === 0 && (
                  <Callout type="info" title={copy.myBids.emptyTitle}>
                    {copy.myBids.emptyDescription}
                  </Callout>
                )}
              </div>
            </Card>
          </div>
        </section>
      )}
      {/* Report Modal */}
      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="PROJECT"
        targetId={projectToReport?.id}
        targetName={projectToReport?.title}
      />
    </div>
  );
};

export default ProjectsPage;
