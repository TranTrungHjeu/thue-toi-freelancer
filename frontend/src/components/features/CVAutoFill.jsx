import React from 'react';
import { Upload, Xmark, Check } from 'iconoir-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Table from '../common/Table';
import Spinner from '../common/Spinner';
import { H2, Text, Caption } from '../common/Typography';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import profileApi from '../../api/profileApi';
import { CV_FIELD_KEYS } from '../../types/cv';

/** Đồng bộ với `app.profile.cv.max-file-size` (1000KB) trên backend */
const MAX_CV_PDF_BYTES = 1000 * 1024;

const FIELD_CONFIG = {
  fullName: { labelKey: 'fullNameLabel' },
  email: { labelKey: 'emailLabel' },
  phone: { labelKey: 'phoneLabel' },
  location: { labelKey: 'locationLabel' },
  bio: { labelKey: 'bioLabel' },
  skills: { labelKey: 'skillsLabel' },
  experienceYears: { labelKey: 'experienceYearsLabel' },
  education: { labelKey: 'educationLabel' },
};

const hasValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== null && value !== undefined && `${value}`.trim() !== '';
};

const formatValue = (key, value) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—';
  }

  if (key === 'experienceYears') {
    return `${value} năm`;
  }

  return `${value}`;
};

const CVAutoFill = () => {
  const { user, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const { t } = useI18n();
  const copy = t('profilePage');
  const cvCopy = copy?.cvAutoFill || {};
  const selectedCountLabel = cvCopy.selectedCount || '{count} field selected';

  const [selectedFile, setSelectedFile] = React.useState(null);
  const [extractedData, setExtractedData] = React.useState(null);
  const [selectedFields, setSelectedFields] = React.useState([]);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const currentValueMap = React.useMemo(() => ({
    fullName: user?.fullName,
    email: user?.email,
    phone: user?.phone,
    location: user?.location,
    bio: user?.profileDescription,
    skills: Array.isArray(user?.skills) ? user.skills : [],
    experienceYears: user?.experienceYears,
    education: user?.education,
  }), [user]);

  const fieldRows = React.useMemo(() => CV_FIELD_KEYS.map((key) => ({
    key,
    label: cvCopy.fields?.[FIELD_CONFIG[key]?.labelKey] || key,
    currentValue: currentValueMap[key],
    newValue: extractedData?.[key],
    isSelected: selectedFields.includes(key),
    isAvailable: hasValue(extractedData?.[key]),
  })), [currentValueMap, cvCopy.fields, extractedData, selectedFields]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      addToast(cvCopy.invalidFile || 'Vui lòng chọn file PDF.', 'warning');
      return;
    }

    if (file.size > MAX_CV_PDF_BYTES) {
      addToast(t('toasts.profile.cvFileTooLarge'), 'warning');
      return;
    }

    setSelectedFile(file);
    setIsExtracting(true);
    try {
      const response = await profileApi.extractCv(file);
      const data = response?.data || null;
      setExtractedData(data);
      setSelectedFields(CV_FIELD_KEYS.filter((key) => hasValue(data?.[key])));
      addToast(t('toasts.profile.cvExtractSuccess'), 'success');
    } catch (error) {
      setExtractedData(null);
      setSelectedFields([]);
      setSelectedFile(null);
      addToast(error?.message || t('toasts.profile.cvExtractError'), 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleField = (key) => {
    setSelectedFields((current) => (
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    ));
  };

  const handleSelectAll = () => {
    const availableFields = CV_FIELD_KEYS.filter((key) => hasValue(extractedData?.[key]));
    setSelectedFields(availableFields);
  };

  const handleClear = () => {
    setExtractedData(null);
    setSelectedFields([]);
    setSelectedFile(null);
  };

  const handleConfirmUpdate = async () => {
    if (!extractedData) {
      return;
    }

    const payload = CV_FIELD_KEYS.reduce((accumulator, key) => {
      accumulator[key] = selectedFields.includes(key) ? extractedData[key] : null;
      return accumulator;
    }, {});

    setIsUpdating(true);
    try {
      await profileApi.updateFromCv(payload);
      await refreshProfile();
      addToast(t('toasts.profile.cvUpdateSuccess'), 'success');
      handleClear();
    } catch (error) {
      addToast(error?.message || t('toasts.profile.cvUpdateError'), 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedCount = selectedFields.length;

  return (
    <Card className="border-2 border-slate-200 bg-white p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Caption className="text-[11px] uppercase tracking-[0.18em] text-primary-700">
            {cvCopy.caption}
          </Caption>
          <H2 className="mt-2 text-2xl">
            {cvCopy.title}
          </H2>
          <Text className="mt-3 max-w-3xl text-sm text-slate-600">
            {cvCopy.description}
          </Text>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSelectAll} disabled={!extractedData || isExtracting || isUpdating}>
            {cvCopy.selectAll}
          </Button>
          <Button variant="ghost" onClick={handleClear} disabled={!extractedData || isExtracting || isUpdating}>
            {cvCopy.clear}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-2 border-dashed border-slate-200 bg-slate-50 p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center border-2 border-secondary-900 bg-white text-secondary-900">
              <Upload className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold text-secondary-900">{cvCopy.uploadTitle}</span>
            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{cvCopy.uploadHint}</span>
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFileChange} />
          </label>

          <div className="mt-4 flex items-center justify-between border border-slate-200 bg-white px-4 py-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{cvCopy.selectedFileLabel}</div>
              <div className="truncate text-sm font-semibold text-secondary-900">
                {selectedFile ? selectedFile.name : cvCopy.noFile}
              </div>
            </div>
            {isExtracting ? (
              <Spinner size="sm" inline label={cvCopy.extracting} />
            ) : (
              <Badge color={extractedData ? 'success' : 'info'}>
                {extractedData ? cvCopy.ready : cvCopy.waiting}
              </Badge>
            )}
          </div>

          <div className="mt-4 text-sm text-slate-600">
            {cvCopy.tip}
          </div>
        </div>

        <div className="border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-primary-700">{cvCopy.previewCaption}</div>
              <div className="mt-1 text-base font-semibold text-secondary-900">{cvCopy.previewTitle}</div>
            </div>
            <Badge color={selectedCount > 0 ? 'success' : 'warning'}>
              {selectedCountLabel.replace('{count}', String(selectedCount))}
            </Badge>
          </div>

          {!extractedData ? (
            <div className="mt-6 border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              {cvCopy.emptyPreview}
            </div>
          ) : (
            <div className="mt-4 overflow-hidden border border-slate-200">
              <Table
                headers={[
                  cvCopy.table?.apply || 'Apply',
                  cvCopy.table?.field || 'Field',
                  cvCopy.table?.current || 'Current',
                  cvCopy.table?.newValue || 'From CV',
                ]}
                data={fieldRows}
                renderRow={(row) => (
                  <>
                    <td className="px-4 py-4 align-top">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary-700"
                        checked={row.isSelected}
                        disabled={!row.isAvailable || isExtracting || isUpdating}
                        onChange={() => toggleField(row.key)}
                      />
                    </td>
                    <td className="px-4 py-4 align-top text-sm font-semibold text-secondary-900">{row.label}</td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">{formatValue(row.key, row.currentValue)}</td>
                    <td className="px-4 py-4 align-top text-sm text-slate-900">
                      {row.key === 'skills'
                        ? formatValue(row.key, row.newValue)
                        : formatValue(row.key, row.newValue)}
                    </td>
                  </>
                )}
              />
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={handleConfirmUpdate}
              disabled={!extractedData || selectedCount === 0 || isExtracting || isUpdating}
            >
              {isUpdating ? <Spinner size="sm" inline tone="current" label={cvCopy.updating} /> : <Check className="h-4 w-4" />}
              {cvCopy.confirm}
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={isExtracting || isUpdating}>
              <Xmark className="h-4 w-4" />
              {cvCopy.cancel}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{cvCopy.mappingCaption}</div>
          <div className="mt-2">{cvCopy.mappingDescription}</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{cvCopy.privacyCaption}</div>
          <div className="mt-2">{cvCopy.privacyDescription}</div>
        </div>
      </div>
    </Card>
  );
};

export default CVAutoFill;