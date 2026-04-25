import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import TagInput from '../components/common/TagInput';
import InlineErrorBlock from '../components/common/InlineErrorBlock';
import InfoPanel from '../components/common/InfoPanel';
import Avatar from '../components/common/Avatar';
import Skeleton from '../components/common/Skeleton';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import authApi from '../api/authApi';
import marketplaceApi from '../api/marketplaceApi';
import { formatCurrency, formatDateTime, formatRole } from '../utils/formatters';
import { splitApiFormError } from '../utils/formError';

const MAX_SKILLS = 15;

const initialProfileForm = {
  fullName: '',
  profileDescription: '',
  skills: [],
};

const initialPasswordForm = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  otp: '',
};

const initialEmailForm = {
  oldPassword: '',
  newEmail: '',
  otp: '',
};

const getProfilePageCopy = (locale) => {
  if (locale === 'en') {
    return {
      heroCaption: 'Workspace Profile',
      heroTitle: 'Manage Your Account',
      heroDescription: 'Keep your public profile up-to-date and manage your security settings.',
      refresh: 'Reload profile',
      refreshing: 'Reloading profile...',
      tabPublic: 'Public Profile',
      tabSecurity: 'Security & Identity',
      tabWallet: 'Wallet & Escrow',
      editorCaption: 'Editable profile',
      editorTitle: 'Public Information',
      editorErrorTitle: 'Could not save profile details',
      nameLabel: 'Full name',
      summaryLabel: 'Profile description',
      skillsLabel: 'Skills',
      skillsPlaceholder: 'Type a skill and press Enter',
      skillsHint: `Add up to ${MAX_SKILLS} skills you want the marketplace to surface.`,
      loadingSkills: 'Loading skill catalog...',
      invalidSkillMessage: 'This skill is not in the shared catalog yet.',
      maxSkillsMessage: `You can only add up to ${MAX_SKILLS} skills.`,
      save: 'Save profile',
      saving: 'Saving...',
      identityCaption: 'Identity',
      identityTitle: 'Account basics',
      emailLabel: 'Email',
      roleLabel: 'Role',
      verified: 'Email verified',
      unverified: 'Email not verified',
      active: 'Active',
      locked: 'Locked',
      createdAt: 'Created at',
      updatedAt: 'Last updated',
      saveSuccess: 'Profile updated successfully.',
      saveError: 'Could not save the profile form.',
      changeAvatar: 'Select new avatar',
      passwordTitle: 'Change Password',
      oldPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      otpLabel: 'OTP Code',
      requestOtpBtn: 'Get OTP',
      sendingOtp: 'Sending...',
      changePassword: 'Change Password',
      passwordMismatch: 'New passwords do not match.',
      passwordSuccess: 'Password changed successfully.',
      passwordError: 'Could not change password.',
      changePasswordCaption: 'Security',
      otpSentSuccess: 'OTP has been sent to your email.',
      otpSentError: 'Could not send OTP.',
      changeEmailCaption: 'Change Email',
      changeEmailTitle: 'Update Email Address',
      newEmailLabel: 'New Email Address',
      emailOtpHint: 'Enter your password and new email, then click "Get OTP" to receive a verification code at your new email.',
      requestEmailOtpBtn: 'Get OTP',
      sendingEmailOtp: 'Sending...',
      emailOtpSentSuccess: 'OTP has been sent to your new email address.',
      emailOtpSentError: 'Could not send OTP to the new email.',
      changeEmailBtn: 'Update Email',
      changeEmailSuccess: 'Email updated successfully. Please log in again.',
      changeEmailError: 'Could not update email.',
    };
  }

  return {
    heroCaption: 'Hồ sơ cá nhân',
    heroTitle: 'Quản lý Tài khoản',
    heroDescription: 'Cập nhật thông tin hiển thị công khai và quản lý cài đặt bảo mật của bạn.',
    refresh: 'Tải lại',
    refreshing: 'Đang tải lại...',
    tabPublic: 'Hồ sơ công khai',
    tabSecurity: 'Tài khoản & Bảo mật',
    tabWallet: 'Ví & Escrow',
    editorCaption: 'Hồ sơ có thể chỉnh sửa',
    editorTitle: 'Thông tin công khai',
    editorErrorTitle: 'Không thể lưu biểu mẫu',
    nameLabel: 'Họ tên',
    summaryLabel: 'Mô tả hồ sơ',
    skillsLabel: 'Kỹ năng',
    skillsPlaceholder: 'Nhập từ khóa kỹ năng...',
    skillsHint: `Thêm tối đa ${MAX_SKILLS} kỹ năng để khách hàng tìm kiếm.`,
    loadingSkills: 'Đang tải danh mục kỹ năng...',
    invalidSkillMessage: 'Kỹ năng này chưa có trong danh mục hệ thống.',
    maxSkillsMessage: `Bạn chỉ có thể thêm tối đa ${MAX_SKILLS} kỹ năng.`,
    save: 'Lưu thay đổi',
    saving: 'Đang lưu...',
    identityCaption: 'Danh tính',
    identityTitle: 'Thông tin cơ bản',
    emailLabel: 'Email',
    roleLabel: 'Vai trò',
    verified: 'Đã xác thực',
    unverified: 'Chưa xác thực',
    active: 'Đang hoạt động',
    locked: 'Đã khóa',
    createdAt: 'Tạo lúc',
    updatedAt: 'Cập nhật',
    saveSuccess: 'Đã cập nhật hồ sơ thành công.',
    saveError: 'Không thể lưu hồ sơ.',
    changeAvatar: 'Chọn ảnh khác',
    passwordTitle: 'Đổi mật khẩu',
    oldPassword: 'Mật khẩu hiện tại',
    newPassword: 'Mật khẩu mới',
    confirmPassword: 'Xác nhận mật khẩu mới',
    otpLabel: 'Mã xác thực (OTP)',
    requestOtpBtn: 'Gửi mã',
    sendingOtp: 'Đang gửi...',
    changePassword: 'Cập nhật mật khẩu',
    passwordMismatch: 'Mật khẩu xác nhận không khớp.',
    passwordSuccess: 'Đổi mật khẩu thành công.',
    passwordError: 'Không thể đổi mật khẩu.',
    changePasswordCaption: 'Bảo mật kép',
    otpSentSuccess: 'Mã OTP đã được gửi vào email của bạn.',
    otpSentError: 'Không thể gửi mã OTP, vui lòng thử lại.',
    changeEmailCaption: 'Đổi địa chỉ Email',
    changeEmailTitle: 'Cập nhật Email mới',
    newEmailLabel: 'Email mới',
    emailOtpHint: 'Nhập mật khẩu hiện tại và địa chỉ email mới, sau đó nhấn "Gửi mã" để nhận OTP tại hộp thư email mới.',
    requestEmailOtpBtn: 'Gửi mã',
    sendingEmailOtp: 'Đang gửi...',
    emailOtpSentSuccess: 'Mã OTP đã được gửi tới email mới của bạn.',
    emailOtpSentError: 'Không thể gửi mã OTP tới email mới, vui lòng thử lại.',
    changeEmailBtn: 'Cập nhật Email',
    changeEmailSuccess: 'Đổi email thành công! Vui lòng đăng nhập lại.',
    changeEmailError: 'Không thể đổi email.',
  };
};

const normalizeSkillNames = (skills) =>
  Array.isArray(skills)
    ? [...new Set(skills.map((skill) => String(skill || '').trim()).filter(Boolean))]
    : [];

const ProfilePage = () => {
  const { user, refreshProfile, logout } = useAuth();
  const { addToast } = useToast();
  const { locale } = useI18n();
  const copy = useMemo(() => getProfilePageCopy(locale), [locale]);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('PUBLIC');
  const fileInputRef = useRef(null);
  const tabContentRef = useRef(null);

  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [emailForm, setEmailForm] = useState(initialEmailForm);
  
  const [skillCatalog, setSkillCatalog] = useState([]);
  const [loadingSkillCatalog, setLoadingSkillCatalog] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [requestingKyc, setRequestingKyc] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [passwordFormError, setPasswordFormError] = useState('');

  const [emailFieldErrors, setEmailFieldErrors] = useState({});
  const [emailFormError, setEmailFormError] = useState('');

  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLedger, setWalletLedger] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');

  const fetchKycStatus = useCallback(async () => {
    try {
      const res = await marketplaceApi.getKycStatus();
      if (res.success) {
        setKycStatus(res.data);
      }
    } catch (err) {
      console.error("Could not fetch KYC status", err);
    }
  }, []);

  useEffect(() => {
    setProfileForm({
      fullName: user?.fullName || '',
      profileDescription: user?.profileDescription || '',
      skills: normalizeSkillNames(user?.skills),
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    fetchKycStatus();
  }, [user, fetchKycStatus]);

  useEffect(() => {
    if (tabContentRef.current && tabContentRef.current.children.length > 0) {
      gsap.fromTo(
        tabContentRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  const loadSkillCatalog = useCallback(async () => {
    setLoadingSkillCatalog(true);
    try {
      const response = await marketplaceApi.getSkillCatalog();
      const nextSkills = (response.data || []).map((skill) => skill.name).filter(Boolean);
      setSkillCatalog([...new Set(nextSkills)]);
    } catch {
      setSkillCatalog([]);
    } finally {
      setLoadingSkillCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadSkillCatalog();
  }, [loadSkillCatalog]);

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError('');
    try {
      const [me, ledger] = await Promise.all([
        marketplaceApi.getWalletMe(),
        marketplaceApi.getWalletLedger(),
      ]);
      setWalletBalance(me?.data?.balance ?? 0);
      setWalletLedger(Array.isArray(ledger?.data) ? ledger.data : []);
    } catch (error) {
      setWalletError(error?.response?.data?.message || 'Không thể tải ví.');
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'WALLET') {
      loadWallet();
    }
  }, [activeTab, loadWallet]);

  const handleRequestKyc = async () => {
    setRequestingKyc(true);
    try {
      await marketplaceApi.requestKyc();
      addToast('Yêu cầu xác thực đã được gửi.', 'success');
      fetchKycStatus();
    } catch (error) {
      addToast(error?.response?.data?.message || "Không thể gửi yêu cầu", 'error');
    } finally {
      setRequestingKyc(false);
    }
  };

  const handleFieldChange = (field) => (event) => {
    setProfileForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
    setFieldErrors((previous) => ({ ...previous, [field]: '' }));
    setFormError('');
  };

  const handlePasswordFieldChange = (field) => (event) => {
    setPasswordForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
    setPasswordFieldErrors((previous) => ({ ...previous, [field]: '' }));
    setPasswordFormError('');
  };

  const handleInvalidSkill = () => {
    addToast(copy.invalidSkillMessage, 'warning');
  };

  const handleChangeSkills = (skills) => {
    if (skills.length > MAX_SKILLS) {
      addToast(copy.maxSkillsMessage, 'warning');
      return;
    }
    setProfileForm((previous) => ({ ...previous, skills }));
    setFieldErrors((previous) => ({ ...previous, skills: '' }));
    setFormError('');
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmitProfile = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError('');
    try {
      let finalAvatarUrl = user?.avatarUrl;
      
      if (avatarFile) {
        const uploadRes = await authApi.uploadAvatar(avatarFile);
        finalAvatarUrl = uploadRes.data || uploadRes.data?.data || uploadRes.avatarUrl; 
      }

      await authApi.updateMyProfile({
        fullName: profileForm.fullName,
        profileDescription: profileForm.profileDescription,
        avatarUrl: finalAvatarUrl, 
        skills: normalizeSkillNames(profileForm.skills),
      });
      await refreshProfile();
      setAvatarFile(null);
      setAvatarPreview(null);
      addToast(copy.saveSuccess, 'success');
    } catch (error) {
      const { fieldErrors: nextFieldErrors, formError: nextFormError } = splitApiFormError(error, copy.saveError);
      setFieldErrors(nextFieldErrors);
      setFormError(nextFormError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestOtp = async () => {
    setSendingOtp(true);
    try {
      await authApi.requestPasswordChangeOtp();
      addToast(copy.otpSentSuccess, 'success');
    } catch (error) {
      addToast(error?.response?.data?.message || copy.otpSentError, 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmitPassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFormError(copy.passwordMismatch);
      return;
    }
    setSubmitting(true);
    setPasswordFieldErrors({});
    setPasswordFormError('');
    try {
      await authApi.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        otp: passwordForm.otp,
      });
      addToast(copy.passwordSuccess, 'success');
      setPasswordForm(initialPasswordForm);
    } catch (error) {
      const { fieldErrors: nextFieldErrors, formError: nextFormError } = splitApiFormError(error, copy.passwordError);
      setPasswordFieldErrors(nextFieldErrors);
      setPasswordFormError(nextFormError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailFieldChange = (field) => (event) => {
    setEmailForm((prev) => ({ ...prev, [field]: event.target.value }));
    setEmailFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setEmailFormError('');
  };

  const handleRequestEmailOtp = async () => {
    if (!emailForm.oldPassword.trim()) {
      setEmailFieldErrors((prev) => ({ ...prev, oldPassword: 'Vui lòng nhập mật khẩu hiện tại' }));
      return;
    }
    if (!emailForm.newEmail.trim()) {
      setEmailFieldErrors((prev) => ({ ...prev, newEmail: 'Vui lòng nhập email mới' }));
      return;
    }
    setSendingEmailOtp(true);
    try {
      await authApi.requestEmailChangeOtp({
        oldPassword: emailForm.oldPassword,
        newEmail: emailForm.newEmail,
      });
      setEmailOtpSent(true);
      addToast(copy.emailOtpSentSuccess, 'success');
    } catch (error) {
      addToast(error?.response?.data?.message || copy.emailOtpSentError, 'error');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleSubmitEmail = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setEmailFieldErrors({});
    setEmailFormError('');
    try {
      await authApi.changeEmail({
        oldPassword: emailForm.oldPassword,
        newEmail: emailForm.newEmail,
        otp: emailForm.otp,
      });
      addToast(copy.changeEmailSuccess, 'success');
      setEmailForm(initialEmailForm);
      setEmailOtpSent(false);
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 1500);
    } catch (error) {
      const { fieldErrors: nextFieldErrors, formError: nextFormError } = splitApiFormError(error, copy.changeEmailError);
      setEmailFieldErrors(nextFieldErrors);
      setEmailFormError(nextFormError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
  const getFullAvatarUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    return `${backendUrl}${path}`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <section>
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {copy.heroCaption}
              </Caption>
              <H1 className="mt-3 text-4xl">
                {copy.heroTitle}
              </H1>
              <Text className="mt-4 text-slate-600">
                {copy.heroDescription}
              </Text>
            </div>
          </div>
          
          <div className="mt-8 flex gap-2 border-b-2 border-slate-100">
            <button
              onClick={() => setActiveTab('PUBLIC')}
              className={`px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'PUBLIC'
                  ? 'border-primary-600 text-primary-700 bg-primary-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {copy.tabPublic}
            </button>
            <button
              onClick={() => setActiveTab('SECURITY')}
              className={`px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'SECURITY'
                  ? 'border-primary-600 text-primary-700 bg-primary-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {copy.tabSecurity}
            </button>
            <button
              onClick={() => setActiveTab('WALLET')}
              className={`px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'WALLET'
                  ? 'border-primary-600 text-primary-700 bg-primary-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {copy.tabWallet}
            </button>
          </div>
        </Card>
      </section>

      <div ref={tabContentRef}>
        {activeTab === 'PUBLIC' && (
          <section className="grid gap-6 lg:grid-cols-[1fr]">
            <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {copy.editorCaption}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {copy.editorTitle}
              </H2>
              
              <div className="mt-6 flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4 w-full md:w-auto flex-shrink-0">
                  <Avatar 
                    src={getFullAvatarUrl(avatarPreview || user?.avatarUrl)} 
                    alt={user?.fullName} 
                    size="xl" 
                    className="rounded-none shadow-sm"
                  />
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleAvatarFileChange}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full text-xs" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                  >
                    {copy.changeAvatar}
                  </Button>
                </div>

                <div className="w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-slate-400 text-xs uppercase tracking-widest">{formatRole(user.role, locale)}</div>
                      {user.verified && (
                        <Badge color="info" className="scale-75 origin-left">Verified Account</Badge>
                      )}
                    </div>
                    <H1 className="mt-1 text-4xl">{user.fullName}</H1>
                    <div className="mt-2 text-slate-500 font-medium">{user.email}</div>
                    
                    <div className="mt-6 flex flex-wrap gap-4 items-center">
                      {!user.verified && (!kycStatus || kycStatus.status === 'REJECTED') && (
                        <Button size="sm" variant="outline" onClick={handleRequestKyc} disabled={requestingKyc}>
                          {requestingKyc ? "Đang gửi..." : "Yêu cầu xác thực tài khoản"}
                        </Button>
                      )}
                      {kycStatus?.status === 'PENDING' && (
                        <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-wider bg-primary-50 px-3 py-1.5">
                           Đang chờ xác thực...
                        </div>
                      )}
                      {kycStatus?.status === 'REJECTED' && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
                             Xác thực bị từ chối
                          </div>
                          <div className="text-[10px] text-red-400 italic">Lý do: {kycStatus.note}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <form className="flex flex-col gap-5 mt-8" onSubmit={handleSubmitProfile}>
                    {formError && (
                      <InlineErrorBlock title={copy.editorErrorTitle}>
                        {formError}
                      </InlineErrorBlock>
                    )}
                    <Input
                      label={copy.nameLabel}
                      value={profileForm.fullName}
                      onChange={handleFieldChange('fullName')}
                      error={fieldErrors.fullName}
                    />
                    <Textarea
                      label={copy.summaryLabel}
                      value={profileForm.profileDescription}
                      onChange={handleFieldChange('profileDescription')}
                      error={fieldErrors.profileDescription}
                      rows={5}
                    />
                    <div className="flex flex-col gap-1.5 relative">
                      <TagInput
                        label={copy.skillsLabel}
                        placeholder={copy.skillsPlaceholder}
                        helperText={copy.skillsHint}
                        initialTags={profileForm.skills}
                        allowedTags={skillCatalog}
                        disabled={loadingSkillCatalog || submitting}
                        onInvalidTag={handleInvalidSkill}
                        onChange={handleChangeSkills}
                        error={fieldErrors.skills}
                      />
                      <div className="flex items-center justify-between mt-1 absolute bottom-[3px] right-0 pointer-events-none">
                        <div className="text-xs text-slate-500 font-medium ml-auto">
                          {normalizeSkillNames(profileForm.skills).length} / {MAX_SKILLS}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex justify-end">
                      <Button type="submit" disabled={submitting}>
                        {submitting ? copy.saving : copy.save}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </Card>
          </section>
        )}

        {activeTab === 'SECURITY' && (
          <div className="flex flex-col gap-6">
            <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {copy.identityCaption}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {copy.identityTitle}
              </H2>
              <div className="mt-5 flex flex-col gap-5">
                <div>
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.emailLabel}</Caption>
                  <div className="mt-1 text-base font-semibold text-secondary-900 bg-slate-50 p-2 border border-slate-200 inline-block w-full">{user?.email}</div>
                </div>
                <div>
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.roleLabel}</Caption>
                  <div className="mt-1 text-base font-semibold text-secondary-900">{formatRole(user?.role, locale)}</div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge color={user?.verified ? 'success' : 'warning'}>
                  {user?.verified ? copy.verified : copy.unverified}
                </Badge>
                <Badge color={user?.isActive ? 'success' : 'error'}>
                  {user?.isActive ? copy.active : copy.locked}
                </Badge>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoPanel>
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    {copy.createdAt}
                  </Caption>
                  <div className="mt-2 text-sm font-semibold text-secondary-900 truncate">
                    {formatDateTime(user?.createdAt, locale)}
                  </div>
                </InfoPanel>
                <InfoPanel>
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    {copy.updatedAt}
                  </Caption>
                  <div className="mt-2 text-sm font-semibold text-secondary-900 truncate">
                    {formatDateTime(user?.updatedAt, locale)}
                  </div>
                </InfoPanel>
              </div>
            </Card>

            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-red-600">
                {copy.changePasswordCaption}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {copy.passwordTitle}
              </H2>

              <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmitPassword}>
                {passwordFormError && (
                  <InlineErrorBlock title={copy.passwordError}>
                    {passwordFormError}
                  </InlineErrorBlock>
                )}
                <Input
                  type="password"
                  label={copy.oldPassword}
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordFieldChange('oldPassword')}
                  error={passwordFieldErrors.oldPassword}
                  required
                />
                
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      label={copy.otpLabel}
                      value={passwordForm.otp}
                      onChange={handlePasswordFieldChange('otp')}
                      error={passwordFieldErrors.otp}
                      required
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="mb-0 h-[48px]"
                    onClick={handleRequestOtp} 
                    disabled={sendingOtp || submitting}
                  >
                    {sendingOtp ? copy.sendingOtp : copy.requestOtpBtn}
                  </Button>
                </div>

                <Input
                  type="password"
                  label={copy.newPassword}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordFieldChange('newPassword')}
                  error={passwordFieldErrors.newPassword}
                  required
                />
                <Input
                  type="password"
                  label={copy.confirmPassword}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordFieldChange('confirmPassword')}
                  error={passwordFieldErrors.confirmPassword}
                  required
                />
                <div className="pt-2">
                  <Button type="submit" variant="danger" disabled={submitting}>
                    {submitting ? copy.saving : copy.changePassword}
                  </Button>
                </div>
              </form>
            </Card>
          </section>

          <section>
            <Card className="border-2 border-slate-200 bg-white p-6">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-amber-600">
                {copy.changeEmailCaption}
              </Caption>
              <H2 className="mt-2 text-2xl">
                {copy.changeEmailTitle}
              </H2>
              <p className="mt-2 text-sm text-slate-500">{copy.emailOtpHint}</p>

              <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmitEmail}>
                {emailFormError && (
                  <InlineErrorBlock title={copy.changeEmailError}>
                    {emailFormError}
                  </InlineErrorBlock>
                )}

                <Input
                  type="password"
                  label={copy.oldPassword}
                  value={emailForm.oldPassword}
                  onChange={handleEmailFieldChange('oldPassword')}
                  error={emailFieldErrors.oldPassword}
                  required
                />

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      label={copy.newEmailLabel}
                      value={emailForm.newEmail}
                      onChange={handleEmailFieldChange('newEmail')}
                      error={emailFieldErrors.newEmail}
                      placeholder="email-moi@example.com"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-[48px] shrink-0"
                    onClick={handleRequestEmailOtp}
                    disabled={sendingEmailOtp || submitting}
                  >
                    {sendingEmailOtp ? copy.sendingEmailOtp : copy.requestEmailOtpBtn}
                  </Button>
                </div>

                {emailOtpSent && (
                  <Input
                    type="text"
                    label={copy.otpLabel}
                    value={emailForm.otp}
                    onChange={handleEmailFieldChange('otp')}
                    error={emailFieldErrors.otp}
                    placeholder="Nhập mã 6 chữ số"
                    required
                  />
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting || !emailOtpSent}
                  >
                    {submitting ? copy.saving : copy.changeEmailBtn}
                  </Button>
                </div>
              </form>
            </Card>
          </section>
        </div>
        )}

        {activeTab === 'WALLET' && (
          <section className="flex flex-col gap-6">
            <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                    {locale === 'en' ? 'SePay-funded balance' : 'Số dư từ SePay'}
                  </Caption>
                  <H2 className="mt-2 text-2xl">{copy.tabWallet}</H2>
                  <Text className="mt-2 text-sm text-slate-500">
                    {locale === 'en'
                      ? 'Funds released to you from completed milestones, after platform fees.'
                      : 'Số tiền được giải ngân cho bạn từ các milestone đã hoàn thành, sau khi trừ phí sàn.'}
                  </Text>
                </div>
                <Button type="button" variant="outline" onClick={loadWallet} disabled={walletLoading}>
                  {walletLoading ? copy.refreshing : copy.refresh}
                </Button>
              </div>

              {walletError && (
                <InlineErrorBlock title={locale === 'en' ? 'Wallet error' : 'Lỗi ví'}>
                  {walletError}
                </InlineErrorBlock>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoPanel className="border-2 border-primary-200 bg-primary-50/50">
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                    {locale === 'en' ? 'Available balance' : 'Số dư khả dụng'}
                  </Caption>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-secondary-900">
                    {walletLoading && walletBalance == null ? '...' : formatCurrency(walletBalance ?? 0, locale)}
                  </div>
                  <Text className="mt-2 text-xs text-slate-500">
                    {locale === 'en'
                      ? 'Withdrawal requests are processed by the admin team.'
                      : 'Yêu cầu rút tiền được xử lý bởi đội ngũ quản trị.'}
                  </Text>
                </InfoPanel>
                <InfoPanel>
                  <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    {locale === 'en' ? 'Ledger entries' : 'Số mục sổ cái'}
                  </Caption>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-secondary-900">
                    {walletLedger.length}
                  </div>
                  <Text className="mt-2 text-xs text-slate-500">
                    {locale === 'en'
                      ? 'Immutable accounting log of every escrow movement.'
                      : 'Nhật ký kế toán bất biến cho mọi giao dịch escrow.'}
                  </Text>
                </InfoPanel>
              </div>
            </Card>

            <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
              <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
                {locale === 'en' ? 'Ledger' : 'Sổ cái'}
              </Caption>
              <H2 className="mt-2 text-xl">
                {locale === 'en' ? 'Wallet ledger entries' : 'Lịch sử biến động ví'}
              </H2>
              <div className="mt-5 flex flex-col gap-3">
                {walletLoading && walletLedger.length === 0 && (
                  <Text className="text-sm text-slate-500">
                    {locale === 'en' ? 'Loading wallet activity...' : 'Đang tải lịch sử ví...'}
                  </Text>
                )}
                {!walletLoading && walletLedger.length === 0 && !walletError && (
                  <InfoPanel>
                    <Text className="text-sm text-slate-500">
                      {locale === 'en'
                        ? 'No ledger entries yet. Once a milestone is released, entries will appear here.'
                        : 'Chưa có biến động. Khi milestone được giải ngân, các mục sẽ hiển thị tại đây.'}
                    </Text>
                  </InfoPanel>
                )}
                {walletLedger.map((entry, index) => {
                  const type = (entry.entryType || '').toLowerCase();
                  const badgeColor =
                    type === 'release_milestone' ? 'success'
                      : type === 'platform_fee' ? 'warning'
                      : type === 'escrow_in' ? 'info'
                      : 'info';
                  return (
                    <InfoPanel key={`${entry.contractId || 'x'}-${entry.createdAt}-${index}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge color={badgeColor}>{entry.entryType}</Badge>
                          <Text className="mt-2 text-sm text-slate-700">{entry.description}</Text>
                          <Caption className="mt-2 text-xs text-slate-500">
                            {entry.contractId
                              ? `${locale === 'en' ? 'Contract' : 'Hợp đồng'} #${entry.contractId} · `
                              : ''}
                            {formatDateTime(entry.createdAt, locale)}
                          </Caption>
                        </div>
                        <div className="text-right text-sm font-bold text-secondary-900">
                          {formatCurrency(entry.amount, locale)}
                        </div>
                      </div>
                    </InfoPanel>
                  );
                })}
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
