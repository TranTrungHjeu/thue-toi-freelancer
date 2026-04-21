"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Caption } from './Typography';
import Tag from './Tag';
import { useI18n } from '../../hooks/useI18n';
import { getFieldErrorMessage } from '../../utils/formError';

/**
 * Advanced Tag Input for skills or categories.
 * Strictly sharp, supports adding via Enter and removal.
 * Now includes a Google-search like autocomplete dropdown.
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
  error,
  className = "" 
}) => {
  const { locale } = useI18n();
  const normalizedError = getFieldErrorMessage(error);
  
  const [tags, setTags] = useState(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const containerRef = useRef(null);
  
  const resolvedPlaceholder = placeholder || (locale === 'vi' ? 'Nhập từ khóa...' : 'Type keyword...');
  const resolvedHelperText = helperText || (locale === 'vi'
    ? 'Gợi ý: Chọn kỹ năng từ danh sách gợi ý.'
    : 'Tip: Select a skill from suggestions.');

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const suggestions = useMemo(() => {
    if (!Array.isArray(allowedTags) || allowedTags.length === 0) return [];
    if (!inputValue.trim()) return [];
    
    const searchLower = inputValue.trim().toLowerCase();
    return allowedTags
      .filter(tag => tag && tag.toLowerCase().includes(searchLower) && !tags.includes(tag))
      .slice(0, 8); // Giới hạn 8 kết quả
  }, [allowedTags, inputValue, tags]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [inputValue]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag) => {
    if (disabled || !tag) return;
    if (!tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      if (onChange) onChange(newTags);
    }
    setInputValue("");
    setIsFocused(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        // Fallback: if hit Enter but no suggestion selected, match exactly or fire invalid
        const searchLower = inputValue.trim().toLowerCase();
        const exactMatch = allowedTags?.find(t => t && t.toLowerCase() === searchLower);
        if (exactMatch) {
          addTag(exactMatch);
        } else {
          if (onInvalidTag) onInvalidTag(inputValue.trim());
        }
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      if (onChange) onChange(newTags);
    }
  };

  const removeTag = (tagToRemove) => {
    if (disabled) return;
    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    if (onChange) onChange(newTags);
  };

  const showDropdown = isFocused && suggestions.length > 0;

  return (
    <div className={`flex flex-col gap-2 ${className}`} ref={containerRef}>
      {label && <Caption className="font-bold text-secondary-900 uppercase tracking-tighter">{label}</Caption>}
      <div className="relative">
        <div className={`flex flex-wrap gap-2 p-2 border-2 min-h-[48px] transition-colors ${normalizedError ? 'border-error' : ''} ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100' : 'border-slate-950 bg-white focus-within:border-primary-500'}`}>
          {tags.map((tag, idx) => (
            <Tag key={idx} onRemove={() => removeTag(tag)}>
              {tag}
            </Tag>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? resolvedPlaceholder : ""}
            disabled={disabled}
            className={`flex-1 min-w-[120px] outline-none text-sm font-medium py-1 placeholder:text-slate-400 ${disabled ? 'cursor-not-allowed bg-transparent text-slate-400' : ''}`}
            autoComplete="off"
          />
        </div>
        
        {showDropdown && (
          <div className="absolute top-[100%] left-0 w-full mt-1 bg-white border-2 border-slate-950 shadow-[4px_4px_0_0_rgba(15,23,42,1)] z-50 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div 
                key={suggestion}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur
                  addTag(suggestion);
                }}
                className={`px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${index === selectedIndex ? 'bg-primary-500 text-white' : 'hover:bg-slate-100 text-secondary-900'}`}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      {normalizedError && <span className="ui-error-text mt-1">{normalizedError}</span>}
      <Caption className="text-[10px] text-slate-400">{resolvedHelperText}</Caption>
    </div>
  );
};

export default TagInput;
