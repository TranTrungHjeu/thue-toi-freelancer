"use client";

import React, { useId, useMemo, useState } from 'react';
import { Upload, Xmark, Notes } from 'iconoir-react';
import { Text, Caption } from '../common/Typography';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';

const DEFAULT_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.pptx,.txt';

const FileUpload = ({
  label = "Đính kèm tài liệu",
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  maxFiles = 5,
  disabled = false,
  error = '',
  helperText = '',
  className = "",
}) => {
  const inputId = useId();
  const [internalFiles, setInternalFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { addToast } = useToast();
  const { t } = useI18n();
  const files = useMemo(() => (Array.isArray(value) ? value : internalFiles), [internalFiles, value]);

  const commitFiles = (nextFiles) => {
    if (onChange) {
      onChange(nextFiles);
      return;
    }
    setInternalFiles(nextFiles);
  };

  const appendFiles = (selectedFiles) => {
    if (disabled || selectedFiles.length === 0) {
      return;
    }

    if (files.length + selectedFiles.length > maxFiles) {
      addToast(t('common.fileUploadMaxFiles', { maxFiles }), "warning");
      return;
    }

    commitFiles([...files, ...selectedFiles]);
  };

  const handleFileChange = (event) => {
    appendFiles(Array.from(event.target.files || []));
    event.target.value = '';
  };

  const removeFile = (index) => {
    if (disabled) {
      return;
    }
    commitFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <label className="text-sm font-bold text-secondary-900 uppercase tracking-tighter">
        {label} <span className="text-slate-400 font-normal">({files.length}/{maxFiles})</span>
      </label>

      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setIsDragOver(false);
          appendFiles(Array.from(e.dataTransfer.files || []));
        }}
        className={`
          flex flex-col items-center justify-center border-2 border-dashed p-8 transition-all cursor-pointer relative
          ${disabled ? 'cursor-not-allowed bg-slate-50 opacity-70' : ''}
          ${error ? 'border-red-300 bg-red-50/40' : (isDragOver && !disabled ? 'border-primary-500 bg-primary-50/50' : 'border-slate-200 hover:border-slate-300')}
        `}
        style={{ borderRadius: '0px' }}
      >
        <Upload className={`w-8 h-8 mb-3 ${isDragOver ? 'text-primary-500' : 'text-slate-400'}`} />
        <Text className="text-center font-medium">{t('common.fileUploadPrompt')}</Text>
        <Caption className="mt-1">{helperText || t('common.fileUploadHint')}</Caption>
        <input 
          type="file" 
          multiple 
          accept={accept}
          disabled={disabled}
          onChange={handleFileChange}
          className="hidden" 
          id={inputId}
        />
        <label htmlFor={inputId} className={`absolute inset-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} />
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      {files.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {files.map((file, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between p-3 border border-slate-200 bg-white group animate-in slide-in-from-left-2 duration-300"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Notes className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold truncate text-secondary-900">{file.name}</span>
                  <Caption>{(file.size / 1024 / 1024).toFixed(2)} MB</Caption>
                </div>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeFile(idx)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                title="Gỡ bỏ tệp"
              >
                <Xmark className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
