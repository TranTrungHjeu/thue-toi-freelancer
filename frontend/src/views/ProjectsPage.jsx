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
import BidStatusStepper from '../components/common/BidStatusStepper';
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
import Modal from '../components/common/Modal';
import ReportModal from '../components/common/ReportModal';
import PaymentConfirmationModal from '../components/common/PaymentConfirmationModal';
import BidSelectionModal from '../components/common/BidSelectionModal';
import PaymentReceiptModal from '../components/common/PaymentReceiptModal';
import BidComparison from '../components/common/BidComparison';
import VideoCallModal from '../components/common/VideoCallModal';
import Pagination from '../components/common/Pagination';
import { usePaymentWebSocket } from '../hooks/usePaymentWebSocket';
import {
  WarningTriangle,
  PageSearch,
  Phone,
  VideoCamera,
  StatsUpSquare,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  CheckCircleSolid,
  Clock,
  Attachment,
  User,
  Activity,
  Plus
} from 'iconoir-react';

const PROJECTS_PER_PAGE = 5;

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
    marketplaceFiltersDescription: 'Lọc nhanh theo từ khóa, trạng thái và kỹ năng ngay trên giao diện để thu hẹp danh sách nhanh hơn.',
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

const getCoverImageBySkills = (skills) => {
  const skillNames = normalizeSkillNames(skills).map((s) => s.toLowerCase());

  if (skillNames.some((s) => s.includes('design') || s.includes('ui') || s.includes('ux'))) {
    return '/images/covers/design.webp';
  }
  if (skillNames.some((s) => s.includes('develop') || s.includes('code') || s.includes('program') || s.includes('javascript') || s.includes('react') || s.includes('node'))) {
    return '/images/covers/development.webp';
  }
  if (skillNames.some((s) => s.includes('video') || s.includes('edit') || s.includes('motion'))) {
    return '/images/covers/video.webp';
  }
  if (skillNames.some((s) => s.includes('marketing') || s.includes('seo') || s.includes('social'))) {
    return '/images/covers/marketing.webp';
  }
  if (skillNames.some((s) => s.includes('writing') || s.includes('content') || s.includes('copy'))) {
    return '/images/covers/writing.webp';
  }
  return '/images/covers/default.webp';
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
        <Caption className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
          {caption}
        </Caption>
      )}
      <div className="flex flex-wrap gap-2">
        {normalizedAttachments.map((attachment, index) => (
          <a
            key={`${attachment.url}-${index}`}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 shadow-sm transition-all duration-200 hover:border-primary-500 hover:bg-slate-50 underline-offset-2 hover:underline"
          >
            <Attachment className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[180px]">{attachment.name}</span>
            {formatAttachmentSize(attachment.size) ? (
              <span className="text-[10px] text-slate-400 font-normal">({formatAttachmentSize(attachment.size)})</span>
            ) : null}
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

const GLASS_CARD_CLASS =
  'border border-slate-200/80 bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.08)]';
const SECTION_HEADER_CAPTION_CLASS =
  'text-[10px] uppercase tracking-[0.2em] text-primary-700 font-bold';
const SECTION_HEADER_TITLE_CLASS = 'mt-1 text-2xl font-bold text-slate-900 tracking-tight';

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
  const [activePayment, setActivePayment] = useState(null);
  const [marketplaceSearchTerm, setMarketplaceSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [marketplaceStatus, setMarketplaceStatus] = useState('open');
  const [marketplaceSkills, setMarketplaceSkills] = useState([]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearchTerm(marketplaceSearchTerm);
    }, 300);
    return () => clearTimeout(handle);
  }, [marketplaceSearchTerm]);
  const [customerListPage, setCustomerListPage] = useState(1);
  const [customerListTotal, setCustomerListTotal] = useState(0);
  const [customerListTotalPages, setCustomerListTotalPages] = useState(1);
  const [marketplacePage, setMarketplacePage] = useState(1);
  const [marketplaceTotal, setMarketplaceTotal] = useState(0);
  const [marketplaceTotalPages, setMarketplaceTotalPages] = useState(1);
  const [isBidComposerOpen, setIsBidComposerOpen] = useState(false);
  const [isMyBidsOpen, setIsMyBidsOpen] = useState(false);
  const [isBidComposerLeaving, setIsBidComposerLeaving] = useState(false);
  const [isMyBidsLeaving, setIsMyBidsLeaving] = useState(false);

  // Client Modals
  const [isProjectComposerOpen, setIsProjectComposerOpen] = useState(false);
  const [isProjectComposerLeaving, setIsProjectComposerLeaving] = useState(false);
  const [isBidsViewOpen, setIsBidsViewOpen] = useState(false);
  const [isBidsViewLeaving, setIsBidsViewLeaving] = useState(false);

  const openProjectComposer = () => {
    resetProjectComposer();
    setIsProjectComposerLeaving(false);
    setIsProjectComposerOpen(true);
  };

  const closeProjectComposer = () => {
    setIsProjectComposerLeaving(true);
    setTimeout(() => {
      setIsProjectComposerOpen(false);
      setIsProjectComposerLeaving(false);
    }, 180);
  };

  const openBidsView = async (project) => {
    setSelectedProject(project);
    setIsBidsViewLeaving(false);
    setIsBidsViewOpen(true);
    await loadProjectBids(project);
  };

  const closeBidsView = () => {
    setIsBidsViewLeaving(true);
    setTimeout(() => {
      setIsBidsViewOpen(false);
      setIsBidsViewLeaving(false);
      setSelectedProject(null);
    }, 180);
  };

  const closeBidComposer = () => {
    setIsBidComposerLeaving(true);
    setTimeout(() => {
      setIsBidComposerOpen(false);
      setIsBidComposerLeaving(false);
      setSelectedProject(null);
    }, 180);
  };

  const closeMyBids = () => {
    setIsMyBidsLeaving(true);
    setTimeout(() => {
      setIsMyBidsOpen(false);
      setIsMyBidsLeaving(false);
    }, 180);
  };

  // Client Wizard Form Step (1: Basic, 2: Budget/Date, 3: Skills/Attachments)
  const [formStep, setFormStep] = useState(1);

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [projectToReport, setProjectToReport] = useState(null);

  // Structured Payment Flow States
  const [showBidSelection, setShowBidSelection] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const [showBidComparison, setShowBidComparison] = useState(false);
  const [selectedBidForCheckout, setSelectedBidForCheckout] = useState(null);
  const [paymentResultData, setPaymentResultData] = useState(null);

  // Call Modal State
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callRoomName, setCallRoomName] = useState('');
  const [callDisplayName, setCallDisplayName] = useState('');
  const [createdContractData, setCreatedContractData] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const isCustomer = user?.role === 'customer';

  const paymentStorageKey = useCallback((projectId) => `thuetoi:payment:${projectId}`, []);

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
        const projectsResponse = await marketplaceApi.getMyProjects({
          page: customerListPage,
          limit: PROJECTS_PER_PAGE,
        });
        const payload = projectsResponse.data;
        const items = Array.isArray(payload?.data) ? payload.data : [];
        const meta = payload?.pagination;
        setProjects(items);
        setCustomerListTotal(meta?.total ?? items.length);
        setCustomerListTotalPages(meta?.totalPages ?? 1);
      } else {
        const keyword = debouncedSearchTerm.trim();
        const hasFilters = marketplaceStatus !== 'open'
          || marketplaceSkills.length > 0
          || keyword !== '';
        const baseParams = {
          page: marketplacePage,
          limit: PROJECTS_PER_PAGE,
          q: keyword || undefined,
        };
        const [projectsResponse, bidsResponse] = await Promise.all([
          hasFilters
            ? marketplaceApi.searchProjects({
              ...baseParams,
              status: marketplaceStatus,
              skills: marketplaceSkills,
            })
            : marketplaceApi.getAllProjects(baseParams),
          marketplaceApi.getMyBids(),
        ]);
        const payload = projectsResponse.data;
        const items = Array.isArray(payload?.data) ? payload.data : [];
        const meta = payload?.pagination;
        setProjects(items);
        setMarketplaceTotal(meta?.total ?? items.length);
        setMarketplaceTotalPages(meta?.totalPages ?? 1);
        setMyBids(bidsResponse.data || []);
      }
    } catch (error) {
      addToast(error?.message || t('toasts.projects.loadPageError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [
    addToast,
    customerListPage,
    debouncedSearchTerm,
    isCustomer,
    marketplacePage,
    marketplaceSkills,
    marketplaceStatus,
    t,
    user?.id,
  ]);

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

  useEffect(() => {
    if (!isCustomer || !selectedProject || selectedProject.status !== 'pending_payment') {
      return;
    }
    const code = sessionStorage.getItem(paymentStorageKey(selectedProject.id));
    if (!code) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await marketplaceApi.getPaymentByOrderCode(code);
        const p = r?.data;
        if (cancelled || !p) {
          return;
        }
        if (p.status === 'pending' || p.status === 'paid') {
          setActivePayment({ ...p, projectId: selectedProject.id });
        }
        if (p.status === 'cancelled' || p.status === 'expired' || p.status === 'failed') {
          sessionStorage.removeItem(paymentStorageKey(selectedProject.id));
        }
        if (p.status === 'paid') {
          sessionStorage.removeItem(paymentStorageKey(selectedProject.id));
        }
      } catch {
        sessionStorage.removeItem(paymentStorageKey(selectedProject.id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCustomer, selectedProject?.id, selectedProject?.status, paymentStorageKey]);

  const handleWebSocketStatusChange = useCallback(async (data) => {
    if (data.orderCode === activePayment?.orderCode) {
      setActivePayment((prev) => ({ ...prev, ...data }));

      if (data.status === 'paid') {
        if (activePayment.projectId) {
          sessionStorage.removeItem(paymentStorageKey(activePayment.projectId));
        }
        addToast(copy.projectBids.paymentPaidToast, 'success');
        await loadPageData();
      }
    }
  }, [activePayment?.orderCode, activePayment?.projectId, addToast, copy.projectBids.paymentPaidToast, loadPageData, paymentStorageKey]);

  usePaymentWebSocket(
    activePayment?.status === 'pending' ? activePayment?.orderCode : null,
    handleWebSocketStatusChange
  );

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

  useEffect(() => {
    setMarketplacePage(1);
  }, [debouncedSearchTerm, marketplaceStatus, marketplaceSkills]);

  useEffect(() => {
    if (customerListPage > customerListTotalPages) {
      setCustomerListPage(customerListTotalPages);
    }
  }, [customerListPage, customerListTotalPages]);

  useEffect(() => {
    if (marketplacePage > marketplaceTotalPages) {
      setMarketplacePage(marketplaceTotalPages);
    }
  }, [marketplacePage, marketplaceTotalPages]);

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
    setFormStep(1);
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
    setFormStep(1);
    setIsProjectComposerLeaving(false);
    setIsProjectComposerOpen(true);
  };

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!projectForm.title.trim()) {
        errors.title = copy.customerComposer.titleLabel + ' is required';
      }
      if (!projectForm.description.trim()) {
        errors.description = copy.customerComposer.descriptionLabel + ' is required';
      }
    } else if (step === 2) {
      if (!projectForm.budgetMin) {
        errors.budgetMin = copy.customerComposer.budgetMinLabel + ' is required';
      }
      if (!projectForm.budgetMax) {
        errors.budgetMax = copy.customerComposer.budgetMaxLabel + ' is required';
      }
      if (Number(projectForm.budgetMin) > Number(projectForm.budgetMax)) {
        errors.budgetMax = 'Tối đa phải lớn hơn hoặc bằng Tối thiểu';
      }
    }
    setProjectFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(formStep)) {
      setFormStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setFormStep((prev) => prev - 1);
  };

  const handleSubmitProject = async (event) => {
    if (event) {
      event.preventDefault();
    }
    if (!validateStep(formStep)) {
      return;
    }

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
      closeProjectComposer();
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

  const handleSelectBidForCheckout = (bid) => {
    setSelectedBidForCheckout(bid);
    setShowBidSelection(true);
  };

  const handleConfirmCheckout = async (paymentMethod = 'sepay') => {
    if (!selectedBidForCheckout) return;
    setCheckoutLoading(true);
    try {
      if (paymentMethod === 'wallet') {
        // Direct wallet payment
        await marketplaceApi.payBidWithWallet(selectedBidForCheckout.id);
        setPaymentResultData({
          orderCode: `WALLET-${Date.now()}`,
          amount: selectedBidForCheckout.price,
          method: 'Ví điện tử',
          status: 'paid',
          createdAt: new Date()
        });
        addToast('Thanh toán thành công từ ví! Hợp đồng đã được tạo.', 'success');
        setShowBidSelection(false);
        await handlePaymentSuccess(); // This will show the receipt
      } else {
        // SePay (Bank Transfer) flow
        const response = await marketplaceApi.checkoutBid(selectedBidForCheckout.id);
        const payment = response?.data;
        if (payment?.orderCode && selectedProject?.id) {
          sessionStorage.setItem(paymentStorageKey(selectedProject.id), payment.orderCode);
          setActivePayment({ ...payment, projectId: selectedProject.id });
          setPaymentResultData({ ...payment, projectId: selectedProject.id });
          setShowBidSelection(false);
          setShowPaymentConfirmation(true);
        }
      }

      await loadPageData();
      if (selectedProject) {
        const refreshed = (await marketplaceApi.getMyProjects())?.data || [];
        const next = refreshed.find((p) => p.id === selectedProject.id) || { ...selectedProject, status: 'pending_payment' };
        setSelectedProject(next);
        await loadProjectBids(next);
      }
    } catch (error) {
      addToast(error?.response?.data?.message || error?.message || t('toasts.projects.acceptError'), 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentConfirmation(false);

    // Fetch newly created contract for the project
    try {
      const contractsRes = await marketplaceApi.getMyContracts();
      const contract = (contractsRes.data || []).find(c => c.projectId === selectedProject?.id);
      setCreatedContractData({
        id: contract?.id || 'NEW_CONTRACT',
        projectTitle: selectedProject?.title || 'Dự án',
        freelancerName: selectedBidForCheckout?.freelancer?.fullName || 'Freelancer',
        startDate: new Date()
      });
      setShowPaymentReceipt(true);
    } catch (e) {
      console.error(e);
      // Fallback
      setCreatedContractData({
        id: 'NEW_CONTRACT',
        projectTitle: selectedProject?.title || 'Dự án',
        freelancerName: selectedBidForCheckout?.freelancer?.fullName || 'Freelancer',
        startDate: new Date()
      });
      setShowPaymentReceipt(true);
    }
  };

  const handleStartCall = (isVideo) => {
    if (!selectedProject) return;
    const roomName = `thuetoi-contract-${selectedProject.id}`;
    const displayName = user?.fullName || `Người dùng #${user?.id}`;
    setCallRoomName(roomName);
    setCallDisplayName(displayName);
    setIsCallOpen(true);

    const callType = isVideo ? 'Video' : 'Thoại';
    const messageContent = `[CALL_INVITATION] ${callType}`;

    marketplaceApi.sendMessage({
      contractId: selectedProject.id, // Assuming project workspace maps to a contract
      messageType: 'text',
      content: messageContent,
      attachments: []
    }).then(() => {
      loadProjectBids(selectedProject);
    }).catch((err) => {
      console.error('Error sending call notification message:', err);
    });
  };

  const handlePaymentFailed = () => {
    addToast('Thanh toán thất bại, vui lòng thử lại!', 'error');
  };

  const handleCheckoutBid = async (bidId) => {
    // Legacy support: finding the bid from the project bids list
    const bid = selectedProjectBids.find(b => b.id === bidId);
    if (bid) {
      handleSelectBidForCheckout(bid);
    } else {
      setBidActionId(bidId);
      try {
        const response = await marketplaceApi.checkoutBid(bidId);
        const payment = response?.data;
        if (payment?.orderCode && selectedProject?.id) {
          sessionStorage.setItem(paymentStorageKey(selectedProject.id), payment.orderCode);
          setActivePayment({ ...payment, projectId: selectedProject.id });
          setPaymentResultData({ ...payment, projectId: selectedProject.id });
          setShowPaymentConfirmation(true);
        }
        await loadPageData();
      } catch (error) {
        addToast(error?.message || t('toasts.projects.acceptError'), 'error');
      } finally {
        setBidActionId(null);
      }
    }
  };

  const handleCancelActivePayment = async () => {
    if (!activePayment?.orderCode) {
      return;
    }
    try {
      await marketplaceApi.cancelPaymentByOrderCode(activePayment.orderCode);
      if (activePayment.projectId) {
        sessionStorage.removeItem(paymentStorageKey(activePayment.projectId));
      }
      setActivePayment(null);
      await loadPageData();
      if (selectedProject) {
        const refreshed = (await marketplaceApi.getMyProjects())?.data || [];
        const next = refreshed.find((p) => p.id === selectedProject.id) || selectedProject;
        setSelectedProject(next);
        await loadProjectBids(next);
      }
    } catch (error) {
      addToast(error?.message || t('toasts.projects.cancelError'), 'error');
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

    const fieldErrors = {};
    if (!selectedProject) {
      addToast(t('toasts.projects.selectProjectWarning'), 'warning');
      return false;
    }
    if (!bidForm.price || Number(bidForm.price) <= 0) {
      fieldErrors.price = 'Vui lòng nhập mức giá đề xuất hợp lệ';
    }
    if (!bidForm.estimatedTime.trim()) {
      fieldErrors.estimatedTime = 'Vui lòng nhập thời gian hoàn thành dự kiến';
    }
    if (!bidForm.message.trim()) {
      fieldErrors.message = 'Vui lòng nhập nội dung thư giới thiệu';
    }

    if (Object.keys(fieldErrors).length > 0) {
      setBidFieldErrors(fieldErrors);
      return false;
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
      closeBidComposer();
      return true;
    } catch (error) {
      const { fieldErrors, formError } = splitApiFormError(error, t('toasts.projects.submitError'));
      setBidFieldErrors(fieldErrors);
      setBidFormError(formError);
      return false;
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

  const renderCustomerPagination = (placement) => (
    <Pagination
      page={customerListPage}
      totalPages={customerListTotalPages}
      totalItems={customerListTotal}
      pageSize={PROJECTS_PER_PAGE}
      onChange={setCustomerListPage}
      idPrefix={`customer-projects-${placement}`}
      className={placement === 'top'
        ? 'mb-3 border-b border-slate-100 pb-3'
        : 'mt-4 border-t border-slate-100 pt-3'}
    />
  );

  const renderMarketplacePagination = (placement) => (
    <Pagination
      page={marketplacePage}
      totalPages={marketplaceTotalPages}
      totalItems={marketplaceTotal}
      pageSize={PROJECTS_PER_PAGE}
      onChange={setMarketplacePage}
      idPrefix={`marketplace-projects-${placement}`}
      className={placement === 'top'
        ? 'mb-4 border-b border-slate-100 pb-3'
        : 'mt-4 border-t border-slate-100 pt-3'}
    />
  );

  return (
    <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <div className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-52 bg-gradient-to-r from-primary-100/60 via-sky-50/50 to-indigo-100/40 blur-2xl" />
      {isCustomer ? (
        // CLIENT INTERFACE
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] overflow-hidden rounded-3xl">
            <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-[0.11]" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary-100/40 via-white/60 to-white" />
          </div>

          <section className="grid gap-6 lg:grid-cols-[1fr_1.15fr] items-start">
            {/* Step-by-Step wizard for job creation */}
            <Card id="client-project-composer" className={`${GLASS_CARD_CLASS} p-6`}>
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <Caption className={SECTION_HEADER_CAPTION_CLASS}>
                    {editingProjectId ? copy.customerComposer.captionUpdate : copy.customerComposer.captionCreate}
                  </Caption>
                  <H2 className={SECTION_HEADER_TITLE_CLASS}>
                    {editingProjectId ? copy.customerComposer.titleUpdate : copy.customerComposer.titleCreate}
                  </H2>
                </div>
                {editingProjectId && (
                  <Button variant="ghost" onClick={resetProjectComposer} className="text-xs">
                    {copy.customerComposer.cancelEdit}
                  </Button>
                )}
              </div>

              {/* Wizard Steps Indicator */}
              <div className="mt-6 flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                    formStep === 1
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : formStep > 1
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200'
                  }`}>
                    {formStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                  </span>
                  <span className={formStep === 1 ? 'text-primary-700 font-bold' : ''}>Thông tin</span>
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-primary-100 via-slate-100 to-slate-100 mx-4"></div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                    formStep === 2
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : formStep > 2
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200'
                  }`}>
                    {formStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
                  </span>
                  <span className={formStep === 2 ? 'text-primary-700 font-bold' : ''}>Ngân sách</span>
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-primary-100 via-slate-100 to-slate-100 mx-4"></div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                    formStep === 3
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-slate-200'
                  }`}>
                    3
                  </span>
                  <span className={formStep === 3 ? 'text-primary-700 font-bold' : ''}>Kỹ năng & Tệp</span>
                </div>
              </div>

              {editingProjectId && (
                <Callout className="mt-5" type="info" title={copy.customerComposer.updateModeTitle}>
                  {copy.customerComposer.updateModeDescription}
                </Callout>
              )}

              <form className="mt-6 flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                {projectFormError && (
                  <InlineErrorBlock title={copy.customerComposer.errorTitle}>
                    {projectFormError}
                  </InlineErrorBlock>
                )}

                {/* STEP 1: General Info */}
                {formStep === 1 && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <Input
                      label={copy.customerComposer.titleLabel}
                      placeholder={copy.customerComposer.titlePlaceholder}
                      value={projectForm.title}
                      onChange={handleProjectFieldChange('title')}
                      error={projectFieldErrors.title}
                    />
                    <Textarea
                      label={copy.customerComposer.descriptionLabel}
                      placeholder={copy.customerComposer.descriptionPlaceholder}
                      value={projectForm.description}
                      onChange={handleProjectFieldChange('description')}
                      error={projectFieldErrors.description}
                      rows={6}
                    />
                  </div>
                )}

                {/* STEP 2: Budget & Deadline */}
                {formStep === 2 && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label={copy.customerComposer.budgetMinLabel}
                        type="number"
                        min="0"
                        value={projectForm.budgetMin}
                        onChange={handleProjectFieldChange('budgetMin')}
                        error={projectFieldErrors.budgetMin}
                      />
                      <Input
                        label={copy.customerComposer.budgetMaxLabel}
                        type="number"
                        min="0"
                        value={projectForm.budgetMax}
                        onChange={handleProjectFieldChange('budgetMax')}
                        error={projectFieldErrors.budgetMax}
                      />
                    </div>
                    <Input
                      label={copy.customerComposer.deadlineLabel}
                      type="date"
                      value={projectForm.deadline}
                      onChange={handleProjectFieldChange('deadline')}
                      error={projectFieldErrors.deadline}
                    />
                  </div>
                )}

                {/* STEP 3: Skills & Attachments */}
                {formStep === 3 && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
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
                        <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
                          {extraCopy.projectSkillsSuggestions}
                        </Caption>
                        <div className="flex flex-wrap gap-2">
                          {projectSkillSuggestions.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              disabled={loadingSkillCatalog || submittingProject}
                              onClick={() => addProjectSkill(skill)}
                              className="border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 transition-all hover:border-primary-500 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-6 flex justify-between gap-3 pt-4 border-t border-slate-100">
                  {formStep > 1 ? (
                    <Button type="button" variant="outline" onClick={handlePrevStep} className="flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Quay lại
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  {formStep < 3 ? (
                    <Button type="button" onClick={handleNextStep} className="flex items-center gap-2">
                      Tiếp tục <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={submittingProject}
                      onClick={handleSubmitProject}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold transition-colors"
                    >
                      {submittingProject
                        ? (editingProjectId ? copy.customerComposer.submitUpdating : copy.customerComposer.submitCreating)
                        : (editingProjectId ? copy.customerComposer.submitUpdate : copy.customerComposer.submitCreate)}
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            {/* List of customer's projects */}
            <Card className={`${GLASS_CARD_CLASS} p-6`}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <Caption className={SECTION_HEADER_CAPTION_CLASS}>
                    {copy.customerList.caption}
                  </Caption>
                  <H2 className={SECTION_HEADER_TITLE_CLASS}>
                    {copy.customerList.title}
                  </H2>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    resetProjectComposer();
                    setTimeout(() => {
                      const composer = document.getElementById('client-project-composer');
                      composer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 0);
                  }}
                  className="flex items-center gap-1.5 bg-primary-600 px-3 py-2 text-xs text-white hover:bg-primary-700 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Đăng dự án mới
                </Button>
              </div>

              {/* Compact Inline Stats Row */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Tổng số</span>
                  <span className="text-base font-black text-slate-800 mt-0.5">{customerProjectSummary.total}</span>
                </div>
                <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider block">Đang tuyển</span>
                  <span className="text-base font-black text-emerald-700 mt-0.5">{customerProjectSummary.open}</span>
                </div>
                <div className="rounded-xl bg-rose-50/50 border border-rose-100 p-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-semibold text-rose-600 uppercase tracking-wider block">Đã hủy</span>
                  <span className="text-base font-black text-rose-700 mt-0.5">{customerProjectSummary.cancelled}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {visibleLoading && (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6">
                    <Spinner size="sm" label={extraCopy.marketplaceLoading} />
                  </div>
                )}

                {!visibleLoading && renderCustomerPagination('top')}

                {projects.map((project) => {
                  const statusMeta = getProjectStatusMeta(project.status, locale);
                  const coverImage = getCoverImageBySkills(project.skills);

                  return (
                    <button
                      type="button"
                      key={project.id}
                      onClick={() => openBidsView(project)}
                      className="group relative h-64 w-full overflow-hidden rounded-2xl text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      {/* Background Image with Blur */}
                      <div className="absolute inset-0">
                        <img
                          src={coverImage}
                          alt={project.title}
                          className="h-full w-full object-cover blur-[2px] brightness-90 transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-slate-900/20" />
                      </div>

                      {/* Content Overlay */}
                      <div className="relative z-10 flex h-full flex-col justify-end p-5">
                        <div>
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <h3 className="line-clamp-2 text-base font-bold leading-snug text-white transition-colors group-hover:text-primary-300">
                              {project.title}
                            </h3>
                            <Badge color={statusMeta.color} className="bg-white/95 text-[9px] font-bold shadow-sm backdrop-blur-md shrink-0">
                              {statusMeta.label}
                            </Badge>
                          </div>

                          <div className="space-y-1.5 text-white/90">
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span className="font-medium">{formatDate(project.deadline, locale)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm font-bold text-primary-300">
                              <span className="inline-block h-2 w-2 rounded-full bg-primary-400 shrink-0"></span>
                              <span>{buildBudgetRange(project, locale)}</span>
                            </div>
                          </div>

                          {normalizeSkillNames(project.skills).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {normalizeSkillNames(project.skills).slice(0, 3).map((skill) => (
                                <span key={skill} className="rounded-md border border-white/30 bg-white/20 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                                  {skill}
                                </span>
                              ))}
                              {normalizeSkillNames(project.skills).length > 3 && (
                                <span className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                                  +{normalizeSkillNames(project.skills).length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {!visibleLoading && projects.length === 0 && (
                  <Callout type="info" title={copy.customerList.emptyTitle}>
                    {copy.customerList.emptyDescription}
                  </Callout>
                )}
              </div>

              {!visibleLoading && renderCustomerPagination('bottom')}
            </Card>
          </section>

          {/* Project Bids & Payment panel for Clients (Modal) */}
          {(isBidsViewOpen || isBidsViewLeaving) && selectedProject && (
            <div className={`ui-modal-backdrop fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm ${isBidsViewLeaving ? 'is-leaving' : ''}`}>
              <div className={`ui-modal-panel relative w-full max-w-5xl h-[90vh] bg-white border border-slate-200/80 rounded-none shadow-[0_25px_60px_rgba(15,23,42,0.18)] flex flex-col ${isBidsViewLeaving ? 'is-leaving' : ''}`}>
                <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100 shrink-0 bg-slate-50/50 rounded-none">
                  <div className="min-w-0">
                    <Caption className={SECTION_HEADER_CAPTION_CLASS}>
                      {copy.projectBids.caption}
                    </Caption>
                    <H2 className="mt-1 text-lg font-bold text-slate-900 tracking-tight leading-snug truncate">
                      {t('projectsPage.projectBids.title', { title: selectedProject.title })}
                    </H2>
                  </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={closeBidsView}
                  className="w-9 h-9 rounded-none border border-slate-200 hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors text-sm shadow-sm"
                >
                  ✕
                </button>
              </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                  <Card className={`${GLASS_CARD_CLASS} p-6`}>
                {selectedProjectBids.length >= 2 && (
                  <div className="border-b border-slate-100 pb-4 mb-4 flex justify-end">
                    <Button
                      variant="ghost"
                      className="text-xs font-bold text-primary-600 flex items-center gap-1.5 py-1 px-2"
                      onClick={() => setShowBidComparison(true)}
                    >
                      <PageSearch className="w-4 h-4" /> So sánh các báo giá ({selectedProjectBids.length})
                    </Button>
                  </div>
                )}

              <AttachmentLinks attachments={selectedProject.attachments} />

              <div className="mt-5 flex flex-col gap-4">
                {visibleProjectBidsLoading && (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6">
                    <Spinner size="sm" label={copy.projectBids.loading} />
                  </div>
                )}

                {!visibleProjectBidsLoading && selectedProjectBids.map((bid) => {
                  const statusMeta = getBidStatusMeta(bid.status, locale);
                  const isHandlingBid = bidActionId === bid.id;
                  const canProcessBid =
                    (selectedProject.status === 'open' || selectedProject.status === 'pending_payment') && bid.status === 'pending';

                  return (
                    <div key={bid.id} className="border border-slate-200/70 bg-white p-4 rounded-2xl shadow-[0_8px_22px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(37,99,235,0.12)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm">
                            {bid.freelancer?.fullName?.charAt(0) || 'F'}
                          </span>
                          <div>
                            <div className="flex items-center gap-1 text-sm font-bold text-slate-800">
                              {bid.freelancer?.fullName || t('projectsPage.projectBids.freelancerFallback', { id: bid.freelancer?.id || bid.id })}
                              {bid.freelancer?.kycApproved && (
                                <CheckCircleSolid className="h-4 w-4 text-emerald-500 shadow-sm" title={locale === 'vi' ? 'Tài khoản đã xác minh danh tính' : 'Verified Identity'} />
                              )}
                            </div>
                            <Caption className="text-xs text-slate-400 mt-0.5">
                              {t('projectsPage.projectBids.proposedAt', { value: formatDateTime(bid.createdAt, locale) })}
                            </Caption>
                          </div>
                        </div>
                        <BidStatusStepper status={bid.status} locale={locale} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-xs border-t border-b border-slate-100 py-3 my-3">
                        <div>
                          <p className="text-slate-400 font-medium">Báo giá</p>
                          <p className="text-sm font-bold text-primary-700 mt-0.5">
                            {t('projectsPage.projectBids.price', { value: formatCurrency(bid.price, locale) })}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">Thời gian hoàn thành</p>
                          <p className="text-sm font-bold text-slate-700 mt-0.5">
                            {bid.estimatedTime || copy.projectBids.estimatedFallback}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed">
                        <p className="font-semibold text-slate-500 mb-1">Thư giới thiệu:</p>
                        {bid.message || copy.projectBids.messageFallback}
                      </div>

                      <AttachmentLinks attachments={bid.attachments} />

                      {canProcessBid && (
                        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                          <Button disabled={isHandlingBid} onClick={() => handleCheckoutBid(bid.id)} className="text-xs py-1.5">
                            {isHandlingBid ? copy.projectBids.processing : copy.projectBids.accept}
                          </Button>
                          <Button disabled={isHandlingBid} variant="danger" onClick={() => handleRejectBid(bid.id)} className="text-xs py-1.5">
                            {isHandlingBid ? copy.projectBids.processing : copy.projectBids.reject}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {activePayment
                  && selectedProject
                  && activePayment.projectId === selectedProject.id && (
                    <InfoPanel className="mt-5 border border-amber-200 bg-amber-50/70 p-5 rounded-xl">
                      <div className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                        <Activity className="w-5 h-5 text-amber-600" />
                        {copy.projectBids.paymentBlockTitle}
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3 text-xs text-slate-800 bg-white p-4 rounded-xl border border-amber-100">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{copy.projectBids.paymentStatus}</span>
                          <div className="font-mono text-sm font-bold text-slate-800 mt-0.5">{activePayment.status}</div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Mã đơn hàng</span>
                          <div className="font-mono text-sm font-bold text-slate-800 mt-0.5 break-all">{activePayment.orderCode}</div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{copy.projectBids.paymentAmount}</span>
                          <div className="text-sm font-extrabold text-primary-700 mt-0.5">{formatCurrency(activePayment.amount, locale)}</div>
                        </div>
                        {activePayment.bankName && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{copy.projectBids.paymentBank}</span>
                            <div className="font-bold text-slate-700 mt-0.5">{activePayment.bankName}</div>
                          </div>
                        )}
                        {activePayment.vaNumber && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{copy.projectBids.paymentVa}</span>
                            <div className="font-mono font-bold text-slate-800 mt-0.5">{activePayment.vaNumber}</div>
                          </div>
                        )}
                        {activePayment.vaHolderName && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{copy.projectBids.paymentHolder}</span>
                            <div className="font-bold text-slate-700 mt-0.5">{activePayment.vaHolderName}</div>
                          </div>
                        )}
                      </div>

                      {activePayment.expiredAt && (
                        <div className="mt-3 text-[11px] text-amber-700 flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          Hết hạn thanh toán: {formatDateTime(activePayment.expiredAt, locale)}
                        </div>
                      )}

                      {(activePayment.vietqrUrl || (activePayment.qrCodeData && String(activePayment.qrCodeData).startsWith('data:image'))) && (
                        <div className="mt-4 flex flex-col items-center border border-dashed border-amber-200 bg-white p-4 rounded-xl">
                          <img
                            src={activePayment.vietqrUrl || activePayment.qrCodeData}
                            alt="VietQR"
                            className="max-w-[200px] border border-slate-100 rounded-lg p-1.5 shadow-sm bg-white"
                          />
                          <p className="mt-2 text-[10px] text-slate-400 text-center">
                            Quét mã QR bằng ứng dụng ngân hàng của bạn để thanh toán tự động
                          </p>
                        </div>
                      )}

                      {!activePayment.vietqrUrl && activePayment.qrCodeUrl && (
                        <a
                          href={activePayment.qrCodeUrl}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800 underline underline-offset-2"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Mở liên kết thanh toán <ArrowRight className="w-4 h-4" />
                        </a>
                      )}

                      {activePayment.status === 'pending' && (
                        <div className="mt-4 pt-3 border-t border-amber-200 flex justify-end">
                          <Button type="button" variant="ghost" onClick={handleCancelActivePayment} className="text-xs text-amber-700 hover:bg-amber-100/50">
                            {copy.projectBids.paymentCancel}
                          </Button>
                        </div>
                      )}
                    </InfoPanel>
                )}

                {!visibleProjectBidsLoading && selectedProjectBids.length === 0 && (
                  <Callout type="info" title={copy.projectBids.emptyTitle}>
                    {copy.projectBids.emptyDescription}
                  </Callout>
                )}
              </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        // FREELANCER GRID VIEW FOR MARKETPLACE
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <Caption className={SECTION_HEADER_CAPTION_CLASS}>
                {copy.marketplace.caption}
              </Caption>
              <H2 className={SECTION_HEADER_TITLE_CLASS}>
                {copy.marketplace.title}
              </H2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-xs font-bold flex items-center gap-1.5"
                onClick={() => {
                  setIsMyBidsLeaving(false);
                  setIsMyBidsOpen(true);
                }}
              >
                <StatsUpSquare className="w-4 h-4" /> Báo giá đã gửi ({myBids.length})
              </Button>
            </div>
          </div>

          {/* Smart Filters Panel */}
          <InfoPanel className="w-full border border-slate-100 rounded-xl bg-slate-50/50">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 pb-3 mb-3">
              <div>
                <Caption className="text-[10px] uppercase tracking-[0.15em] text-primary-700 font-bold">
                  {extraCopy.marketplaceFiltersTitle}
                </Caption>
              </div>
              <Button type="button" variant="ghost" onClick={resetMarketplaceFilters} className="text-xs text-slate-500 hover:text-primary-700 py-1 px-2.5">
                {extraCopy.marketplaceResetFilters}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <SearchInput
                value={marketplaceSearchTerm}
                onChange={(event) => setMarketplaceSearchTerm(event.target.value)}
                placeholder={extraCopy.marketplaceSearchPlaceholder}
                className="bg-white"
              />
              <Select
                value={marketplaceStatus}
                options={marketplaceStatusOptions}
                disabled={visibleLoading}
                onChange={(event) => setMarketplaceStatus(event.target.value)}
                className="bg-white"
                aria-label={extraCopy.marketplaceStatusLabel}
              />
            </div>
          </InfoPanel>

          {/* Marketplace Grid List */}
          {visibleLoading && (
            <div className="flex items-center justify-center border border-dashed border-slate-200 bg-slate-50 p-12 rounded-2xl">
              <Spinner size="sm" label={extraCopy.marketplaceLoading} />
            </div>
          )}

          {!visibleLoading && renderMarketplacePagination('top')}

          {!visibleLoading && (
            <div className="grid w-full min-w-0 gap-4">
              {projects.map((project) => {
                const statusMeta = getProjectStatusMeta(project.status, locale);
                const coverImage = getCoverImageBySkills(project.skills);

                return (
                  <div
                    key={project.id}
                    className="group relative flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)] sm:flex-row"
                    onClick={() => {
                      setSelectedProject(project);
                      setIsBidComposerLeaving(false);
                      setIsBidComposerOpen(true);
                    }}
                  >
                    <div className="relative h-32 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48 lg:w-56">
                      <img
                        src={coverImage}
                        alt="Project Cover"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/35 to-transparent sm:bg-gradient-to-r" />
                      <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                        {normalizeSkillNames(project.skills).slice(0, 2).map((skill) => (
                          <span key={skill} className="rounded-md border border-white/20 bg-black/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <span className="inline-block rounded border border-primary-500/30 bg-black/50 px-2 py-0.5 text-[11px] font-extrabold text-primary-300 backdrop-blur-md">
                          {t('projectsPage.marketplace.budget', { value: buildBudgetRange(project, locale) }).replace('Ngân sách: ', '')}
                        </span>
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between p-3.5 sm:p-4">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-primary-600">
                              {project.title}
                            </h3>
                            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                              <User className="h-3 w-3 text-slate-400" />
                              <span className="truncate">{t('projectsPage.marketplace.owner', { name: project.user?.fullName || t('projectsPage.marketplace.ownerFallback', { id: project.user?.id || '---' }) })}</span>
                              {project.user?.kycApproved && (
                                <CheckCircleSolid className="h-3.5 w-3.5 shrink-0 text-emerald-500 shadow-sm" title={locale === 'vi' ? 'Tài khoản đã xác minh danh tính' : 'Verified Identity'} />
                              )}
                            </div>
                          </div>
                          <Badge color={statusMeta.color} className="shrink-0 text-[9px] px-1.5 py-0.5 font-bold">
                            {statusMeta.label}
                          </Badge>
                        </div>

                        <Text className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                          {project.description || copy.marketplace.descriptionFallback}
                        </Text>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(project.deadline, locale)}
                        </div>
                        <Button
                          variant="ghost"
                          className="text-[11px] font-bold text-primary-600 transition-all hover:bg-primary-50 px-2 py-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project);
                            setIsBidComposerLeaving(false);
                            setIsBidComposerOpen(true);
                          }}
                        >
                          Gửi báo giá <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!visibleLoading && renderMarketplacePagination('bottom')}

          {!visibleLoading && marketplaceTotal === 0 && (
            debouncedSearchTerm.trim() || marketplaceSkills.length > 0 || marketplaceStatus !== 'open' ? (
              <Callout type="info" title={extraCopy.marketplaceFiltersEmptyTitle}>
                {extraCopy.marketplaceFiltersEmptyDescription}
              </Callout>
            ) : (
              <Callout type="info" title={copy.marketplace.emptyTitle}>
                {copy.marketplace.emptyDescription}
              </Callout>
            )
          )}
        </div>
      )}

      {/* BID COMPOSER MODAL (FLOATING PREMIUM LAYOUT) */}
      {(isBidComposerOpen || isBidComposerLeaving) && selectedProject && (
        <div className={`ui-modal-backdrop fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm ${isBidComposerLeaving ? 'is-leaving' : ''}`}>
          <div className={`ui-modal-panel relative w-full max-w-2xl bg-white border border-slate-200/80 rounded-2xl shadow-[0_25px_60px_rgba(15,23,42,0.18)] max-h-[90vh] flex flex-col ${isBidComposerLeaving ? 'is-leaving' : ''}`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100 shrink-0">
              <div>
                <Caption className={SECTION_HEADER_CAPTION_CLASS}>
                  {copy.bidComposer.caption}
                </Caption>
                <H2 className="mt-1 text-xl font-bold text-slate-900 tracking-tight leading-snug">
                  {t('projectsPage.bidComposer.titleSelected', { title: selectedProject.title })}
                </H2>
              </div>
              <button
                type="button"
                onClick={closeBidComposer}
                className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {/* Miniature Project Details view for Upwork feel */}
              <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/70 rounded-2xl p-4 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 text-sm">Chi tiết yêu cầu dự án</h4>
                  <Badge color={getProjectStatusMeta(selectedProject.status, locale).color}>
                    {getProjectStatusMeta(selectedProject.status, locale).label}
                  </Badge>
                </div>
                <p className="text-slate-600 mt-2.5 leading-relaxed whitespace-pre-line text-xs font-normal">
                  {selectedProject.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/50 grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-medium">Ngân sách dự kiến</span>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {buildBudgetRange(selectedProject, locale)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Ngày hạn chót</span>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {formatDate(selectedProject.deadline, locale)}
                    </div>
                  </div>
                </div>

                {normalizeSkillNames(selectedProject.skills).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200/50">
                    <span className="text-slate-400 font-medium">Kỹ năng yêu cầu:</span>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {normalizeSkillNames(selectedProject.skills).map((skill) => (
                        <Badge key={`detail-${selectedProject.id}-${skill}`} color="info" className="text-[9px] py-0.5 px-2">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <AttachmentLinks attachments={selectedProject.attachments} />
              </div>

              {/* Proposal Form */}
              <form className="flex flex-col gap-4 border-t border-slate-100 pt-4" onSubmit={handleSubmitBid}>
                <h4 className="font-bold text-slate-800 text-sm">Gửi báo giá của bạn</h4>
                <Input
                  label={copy.bidComposer.priceLabel}
                  type="number"
                  min="0"
                  value={bidForm.price}
                  onChange={handleBidFieldChange('price')}
                  error={bidFieldErrors.price}
                />
                <Input
                  label={copy.bidComposer.estimatedLabel}
                  placeholder={copy.bidComposer.estimatedPlaceholder}
                  value={bidForm.estimatedTime}
                  onChange={handleBidFieldChange('estimatedTime')}
                  error={bidFieldErrors.estimatedTime}
                />
                <Textarea
                  label={copy.bidComposer.messageLabel}
                  placeholder={copy.bidComposer.messagePlaceholder}
                  value={bidForm.message}
                  onChange={handleBidFieldChange('message')}
                  error={bidFieldErrors.message}
                  rows={4}
                />
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
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeBidComposer}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingBid}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold transition-colors"
                  >
                    {submittingBid ? copy.bidComposer.submitting : copy.bidComposer.submit}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MY BIDS MODAL (FLOATING VIEW OF SUBMITTED PROPOSALS) */}
      {(isMyBidsOpen || isMyBidsLeaving) && (
        <div className={`ui-modal-backdrop fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm ${isMyBidsLeaving ? 'is-leaving' : ''}`}>
          <div className={`ui-modal-panel relative w-full max-w-2xl bg-white border border-slate-200/80 rounded-2xl shadow-[0_25px_60px_rgba(15,23,42,0.18)] max-h-[90vh] flex flex-col ${isMyBidsLeaving ? 'is-leaving' : ''}`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <div>
                <Caption className={SECTION_HEADER_CAPTION_CLASS}>
                  {copy.myBids.caption}
                </Caption>
                <H2 className="mt-1 text-xl font-bold text-slate-900 tracking-tight">
                  {copy.myBids.title}
                </H2>
              </div>
              <button
                type="button"
                onClick={closeMyBids}
                className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              {myBids.map((bid) => {
                const statusMeta = getBidStatusMeta(bid.status, locale);
                const isHandlingBid = bidActionId === bid.id;

                return (
                  <div key={bid.id} className="border border-slate-200/70 bg-white hover:border-primary-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.1)] p-4 rounded-2xl transition-all duration-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {bid.project?.title || t('projectsPage.myBids.projectFallback', { id: bid.project?.id || bid.id })}
                        </div>
                        <Caption className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                          Đề xuất lúc: {formatDateTime(bid.createdAt, locale)}
                        </Caption>
                      </div>
                      <BidStatusStepper status={bid.status} locale={locale} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] border-t border-slate-100 pt-2 pb-1 my-2">
                      <div>
                        <span className="text-slate-400 font-medium">Giá đề xuất</span>
                        <div className="font-bold text-primary-700">
                          {t('projectsPage.myBids.price', { value: formatCurrency(bid.price, locale) })}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Thời gian hoàn thành</span>
                        <div className="font-bold text-slate-700">
                          {bid.estimatedTime || copy.myBids.estimatedFallback}
                        </div>
                      </div>
                    </div>

                    <Text className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {bid.message || copy.myBids.messageFallback}
                    </Text>

                    <AttachmentLinks attachments={bid.attachments} />

                    {bid.status === 'pending' && (
                      <div className="mt-3 pt-3 border-t border-slate-100/60">
                        <Button
                          disabled={isHandlingBid}
                          variant="danger"
                          onClick={() => handleWithdrawBid(bid.id)}
                          className="text-[10px] py-1 px-2.5 font-bold"
                        >
                          {isHandlingBid ? copy.myBids.processing : copy.myBids.withdraw}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {!visibleLoading && myBids.length === 0 && (
                <Callout type="info" title={copy.myBids.emptyTitle}>
                  {copy.myBids.emptyDescription}
                </Callout>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Flow Modals */}
      <BidSelectionModal
        isOpen={showBidSelection}
        onClose={() => setShowBidSelection(false)}
        bid={selectedBidForCheckout}
        onConfirm={handleConfirmCheckout}
        isLoading={checkoutLoading}
      />

      <PaymentConfirmationModal
        isOpen={showPaymentConfirmation}
        onClose={() => setShowPaymentConfirmation(false)}
        orderCode={paymentResultData?.orderCode}
        amount={paymentResultData?.amount}
        projectTitle={selectedProject?.title}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailed={handlePaymentFailed}
      />

      <PaymentReceiptModal
        isOpen={showPaymentReceipt}
        onClose={() => setShowPaymentReceipt(false)}
        payment={paymentResultData}
        contract={createdContractData}
      />

      <Modal
        isOpen={showBidComparison}
        onClose={() => setShowBidComparison(false)}
        title="So sánh các báo giá"
        size="xl"
      >
        <BidComparison
          bids={selectedProjectBids}
          onSelectBid={handleSelectBidForCheckout}
        />
      </Modal>

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
