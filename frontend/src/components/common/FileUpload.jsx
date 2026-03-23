"use client";

import React, { useState } from 'react';
import { Upload, Xmark, Notes } from 'iconoir-react';
import { Text, Caption } from '../common/Typography';
import { useToast } from '../../hooks/useToast';

/**
 * Professional File Upload area with drag & drop support.
 * Strictly sharp with dashed border.
 */
const FileUpload = ({ 
  label = "Đính kèm tài liệu",
  maxFiles = 5,
  className = "" 
}) => {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { addToast } = useToast();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > maxFiles) {
      addToast(`Chỉ được tải lên tối đa ${maxFiles} tệp`, "warning");
      return;
    }
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
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
          const droppedFiles = Array.from(e.dataTransfer.files);
          if (files.length + droppedFiles.length > maxFiles) {
            addToast(`Vượt quá số lượng tệp cho phép`, "warning");
            return;
          }
          setFiles([...files, ...droppedFiles]);
        }}
        className={`
          flex flex-col items-center justify-center border-2 border-dashed p-8 transition-all cursor-pointer relative
          ${isDragOver ? 'border-primary-500 bg-primary-50/50' : 'border-slate-200 hover:border-slate-300'}
        `}
        style={{ borderRadius: '0px' }}
      >
        <Upload className={`w-8 h-8 mb-3 ${isDragOver ? 'text-primary-500' : 'text-slate-400'}`} />
        <Text className="text-center font-medium">Nhấn để tải lên hoặc kéo thả tệp</Text>
        <Caption className="mt-1">PDF, DOCX, PNG (Max 10MB)</Caption>
        <input 
          type="file" 
          multiple 
          onChange={handleFileChange}
          className="hidden" 
          id="file-upload-input"
        />
        <label htmlFor="file-upload-input" className="absolute inset-0 cursor-pointer" />
      </div>

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
                onClick={() => removeFile(idx)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
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
