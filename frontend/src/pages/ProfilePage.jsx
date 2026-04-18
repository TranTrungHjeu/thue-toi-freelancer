import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import TagInput from '../components/common/TagInput';
import InfoPanel from '../components/common/InfoPanel';
import { H1, H2, Text, Caption } from '../components/common/Typography';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import authApi from '../api/authApi';
import marketplaceApi from '../api/marketplaceApi';
import { formatDateTime, formatRole } from '../utils/formatters';

const initialProfileForm = {
  fullName: '',
  profileDescription: '',
  avatarUrl: '',
  skills: [],
};

const getProfilePageCopy = (locale) => {
  if (locale === 'en') {
    return {
      heroCaption: 'Profile',
      heroTitle: 'Manage the account profile synchronized from the system.',
      heroDescription: 'These details are loaded from the signed-in account and used across the workspace to keep role, ownership, and capability information consistent.',
      refresh: 'Reload profile',
      refreshing: 'Reloading profile...',
      editorCaption: 'Editable profile',
      editorTitle: 'Update public-facing information',
      nameLabel: 'Full name',
      avatarLabel: 'Avatar URL',
      summaryLabel: 'Profile description',
      skillsLabel: 'Skills',
      skillsPlaceholder: 'Type a skill and press Enter',
      skillsHint: 'Add the skills or focus areas you want the marketplace to surface.',
      skillsSuggestions: 'Suggestions from the shared catalog',
      loadingSkills: 'Loading skill catalog...',
      invalidSkillMessage: 'This skill is not in the shared catalog yet.',
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
      saveError: 'Could not update the profile.',
    };
  }

  return {
    heroCaption: 'Hồ sơ',
    heroTitle: 'Quản lý hồ sơ tài khoản được đồng bộ trực tiếp từ hệ thống.',
    heroDescription: 'Các thông tin này được lấy từ tài khoản đang đăng nhập và dùng xuyên suốt khu làm việc để giữ thống nhất vai trò, ownership và năng lực chuyên môn.',
    refresh: 'Tải lại hồ sơ',
    refreshing: 'Đang tải lại hồ sơ...',
    editorCaption: 'Hồ sơ có thể chỉnh sửa',
    editorTitle: 'Cập nhật thông tin hiển thị công khai',
    nameLabel: 'Họ tên',
    avatarLabel: 'Đường dẫn ảnh đại diện',
    summaryLabel: 'Mô tả hồ sơ',
    skillsLabel: 'Kỹ năng',
    skillsPlaceholder: 'Nhập kỹ năng rồi nhấn Enter',
    skillsHint: 'Thêm kỹ năng hoặc nhóm năng lực mà bạn muốn marketplace phản ánh.',
    skillsSuggestions: 'Gợi ý từ danh mục dùng chung',
    loadingSkills: 'Đang tải danh mục kỹ năng...',
    invalidSkillMessage: 'Kỹ năng này chưa có trong danh mục dùng chung.',
    save: 'Lưu hồ sơ',
    saving: 'Đang lưu...',
    identityCaption: 'Danh tính',
    identityTitle: 'Thông tin cơ bản',
    emailLabel: 'Email',
    roleLabel: 'Vai trò',
    verified: 'Email đã xác thực',
    unverified: 'Chưa xác thực email',
    active: 'Đang hoạt động',
    locked: 'Đã khóa',
    createdAt: 'Tạo lúc',
    updatedAt: 'Cập nhật gần nhất',
    saveSuccess: 'Đã cập nhật hồ sơ thành công.',
    saveError: 'Không thể cập nhật hồ sơ.',
  };
};

const normalizeSkillNames = (skills) =>
  Array.isArray(skills)
    ? [...new Set(skills.map((skill) => `${skill || ''}`.trim()).filter(Boolean))]
    : [];

const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const { locale, t } = useI18n();
  const copy = useMemo(() => getProfilePageCopy(locale), [locale]);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [skillCatalog, setSkillCatalog] = useState([]);
  const [loadingSkillCatalog, setLoadingSkillCatalog] = useState(false);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setProfileForm({
      fullName: user?.fullName || '',
      profileDescription: user?.profileDescription || '',
      avatarUrl: user?.avatarUrl || '',
      skills: normalizeSkillNames(user?.skills),
    });
  }, [user]);

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

  const skillSuggestions = useMemo(
    () => skillCatalog.filter((skill) => !normalizeSkillNames(profileForm.skills).includes(skill)).slice(0, 10),
    [profileForm.skills, skillCatalog],
  );

  const handleRefreshProfile = async () => {
    setRefreshingProfile(true);
    try {
      await refreshProfile();
      addToast(t('toasts.profile.refreshSuccess'), 'success');
    } catch (error) {
      addToast(error?.message || t('toasts.profile.refreshError'), 'error');
    } finally {
      setRefreshingProfile(false);
    }
  };

  const handleFieldChange = (field) => (event) => {
    setProfileForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const addSuggestedSkill = (skillName) => {
    setProfileForm((previous) => ({
      ...previous,
      skills: normalizeSkillNames([...(previous.skills || []), skillName]),
    }));
  };

  const handleInvalidSkill = () => {
    addToast(copy.invalidSkillMessage, 'warning');
  };

  const handleSubmitProfile = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await authApi.updateMyProfile({
        fullName: profileForm.fullName,
        profileDescription: profileForm.profileDescription,
        avatarUrl: profileForm.avatarUrl,
        skills: normalizeSkillNames(profileForm.skills),
      });
      await refreshProfile();
      addToast(copy.saveSuccess, 'success');
    } catch (error) {
      addToast(error?.message || copy.saveError, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            {copy.heroCaption}
          </Caption>
          <H1 className="mt-3 text-4xl">
            {copy.heroTitle}
          </H1>
          <Text className="mt-4 text-slate-600">
            {copy.heroDescription}
          </Text>
          <div className="mt-6">
            <Button variant="outline" disabled={refreshingProfile} onClick={handleRefreshProfile}>
              {refreshingProfile ? copy.refreshing : copy.refresh}
            </Button>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-2 border-slate-200 bg-white p-6">
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            {copy.editorCaption}
          </Caption>
          <H2 className="mt-2 text-2xl">
            {copy.editorTitle}
          </H2>
          <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmitProfile}>
            <Input
              label={copy.nameLabel}
              value={profileForm.fullName}
              onChange={handleFieldChange('fullName')}
            />
            <Input
              label={copy.avatarLabel}
              value={profileForm.avatarUrl}
              onChange={handleFieldChange('avatarUrl')}
            />
            <Textarea
              label={copy.summaryLabel}
              value={profileForm.profileDescription}
              onChange={handleFieldChange('profileDescription')}
            />
            <TagInput
              label={copy.skillsLabel}
              placeholder={copy.skillsPlaceholder}
              helperText={copy.skillsHint}
              initialTags={profileForm.skills}
              allowedTags={skillCatalog}
              disabled={loadingSkillCatalog || submitting}
              onInvalidTag={handleInvalidSkill}
              onChange={(skills) => setProfileForm((previous) => ({ ...previous, skills }))}
            />
            {loadingSkillCatalog && (
              <Text className="text-sm text-slate-500">{copy.loadingSkills}</Text>
            )}
            {skillSuggestions.length > 0 && (
              <div className="flex flex-col gap-2">
                <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {copy.skillsSuggestions}
                </Caption>
                <div className="flex flex-wrap gap-2">
                  {skillSuggestions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      disabled={loadingSkillCatalog || submitting}
                      onClick={() => addSuggestedSkill(skill)}
                      className="border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-secondary-900 transition-colors hover:border-primary-500 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? copy.saving : copy.save}
            </Button>
          </form>
        </Card>

        <div>
          <Card className="border-2 border-slate-200 bg-white p-6">
            <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
              {copy.identityCaption}
            </Caption>
            <H2 className="mt-2 text-2xl">
              {copy.identityTitle}
            </H2>
            <div className="mt-5 flex flex-col gap-4">
              <div>
                <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.nameLabel}</Caption>
                <div className="mt-1 text-base font-semibold text-secondary-900">{user?.fullName}</div>
              </div>
              <div>
                <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.emailLabel}</Caption>
                <div className="mt-1 text-base font-semibold text-secondary-900">{user?.email}</div>
              </div>
              <div>
                <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{copy.roleLabel}</Caption>
                <div className="mt-1 text-base font-semibold text-secondary-900">{formatRole(user?.role, locale)}</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge color={user?.verified ? 'success' : 'warning'}>
                {user?.verified ? copy.verified : copy.unverified}
              </Badge>
              <Badge color={user?.isActive ? 'success' : 'error'}>
                {user?.isActive ? copy.active : copy.locked}
              </Badge>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {normalizeSkillNames(user?.skills).map((skill) => (
                <Badge key={skill} color="info">
                  {skill}
                </Badge>
              ))}
              {normalizeSkillNames(user?.skills).length === 0 && (
                <Badge color="warning">{copy.skillsLabel}</Badge>
              )}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <InfoPanel>
                <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {copy.createdAt}
                </Caption>
                <div className="mt-2 text-sm font-semibold text-secondary-900">
                  {formatDateTime(user?.createdAt, locale)}
                </div>
              </InfoPanel>
              <InfoPanel>
                <Caption className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {copy.updatedAt}
                </Caption>
                <div className="mt-2 text-sm font-semibold text-secondary-900">
                  {formatDateTime(user?.updatedAt, locale)}
                </div>
              </InfoPanel>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
