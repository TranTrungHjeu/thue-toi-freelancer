"use client";

import React, { useState } from 'react';
import { Xmark, Plus } from 'iconoir-react';
import { Caption } from './Typography';
import Tag from './Tag';

/**
 * Advanced Tag Input for skills or categories.
 * Strictly sharp, supports adding via Enter and removal.
 */
const TagInput = ({ 
  label, 
  placeholder = "Nhập và nhấn Enter...", 
  initialTags = [],
  onChange,
  className = "" 
}) => {
  const [tags, setTags] = useState(initialTags);
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        const newTags = [...tags, inputValue.trim()];
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
    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    if (onChange) onChange(newTags);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <Caption className="font-bold text-secondary-900 uppercase tracking-tighter">{label}</Caption>}
      <div className="flex flex-wrap gap-2 p-2 border-2 border-slate-950 bg-white min-h-[48px] focus-within:border-primary-500 transition-colors">
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
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] outline-none text-sm font-medium py-1"
        />
      </div>
      <Caption className="text-[10px] text-slate-400">Gợi ý: Nhấn Enter để thêm nhãn mới.</Caption>
    </div>
  );
};

export default TagInput;
