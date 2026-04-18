"use client";

import React, { useEffect, useState } from 'react';
import { Caption } from './Typography';
import Tag from './Tag';
import { useI18n } from '../../hooks/useI18n';

/**
 * Advanced Tag Input for skills or categories.
 * Strictly sharp, supports adding via Enter and removal.
 */
const TagInput = ({ 
  label, 
  placeholder,
  initialTags = [],
  onChange,
  helperText,
  allowedTags,
  onInvalidTag,
  disabled = false,
  className = "" 
}) => {
  const { locale } = useI18n();
  const [tags, setTags] = useState(initialTags);
  const [inputValue, setInputValue] = useState("");
  const resolvedPlaceholder = placeholder || (locale === 'vi' ? 'Nhập và nhấn Enter...' : 'Type and press Enter...');
  const resolvedHelperText = helperText || (locale === 'vi'
    ? 'Gợi ý: Nhấn Enter để thêm nhãn mới.'
    : 'Tip: press Enter to add a new tag.');

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const resolveAllowedTag = (value) => {
    if (!Array.isArray(allowedTags) || allowedTags.length === 0) {
      return value;
    }

    const normalizedValue = `${value || ''}`.trim().toLowerCase();
    return allowedTags.find((tag) => `${tag || ''}`.trim().toLowerCase() === normalizedValue) || null;
  };

  const handleKeyDown = (e) => {
    if (disabled) {
      return;
    }

    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const resolvedTag = resolveAllowedTag(inputValue.trim());
      if (!resolvedTag) {
        if (onInvalidTag) onInvalidTag(inputValue.trim());
        return;
      }
      if (!tags.includes(resolvedTag)) {
        const newTags = [...tags, resolvedTag];
        setTags(newTags);
        if (onChange) onChange(newTags);
      }
      setInputValue("");
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      if (onChange) onChange(newTags);
    }
  };

  const removeTag = (tagToRemove) => {
    if (disabled) {
      return;
    }

    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    if (onChange) onChange(newTags);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <Caption className="font-bold text-secondary-900 uppercase tracking-tighter">{label}</Caption>}
      <div className={`flex flex-wrap gap-2 p-2 border-2 min-h-[48px] transition-colors ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100' : 'border-slate-950 bg-white focus-within:border-primary-500'}`}>
        {tags.map((tag, idx) => (
          <Tag key={idx} onRemove={() => removeTag(tag)}>
            {tag}
          </Tag>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? resolvedPlaceholder : ""}
          disabled={disabled}
          className={`flex-1 min-w-[120px] outline-none text-sm font-medium py-1 ${disabled ? 'cursor-not-allowed bg-transparent text-slate-400' : ''}`}
        />
      </div>
      <Caption className="text-[10px] text-slate-400">{resolvedHelperText}</Caption>
    </div>
  );
};

export default TagInput;
