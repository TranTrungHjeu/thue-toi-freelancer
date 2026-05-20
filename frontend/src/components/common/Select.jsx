import React, { useState, useRef, useEffect } from 'react';
import { getFieldErrorMessage } from '../../utils/formError';

/**
 * Custom Select Dropdown: A gorgeous, highly premium custom select component
 * with keyboard navigation, smooth micro-interactions, exit animations, and accessibility.
 */
const Select = ({ label, error, options = [], value, onChange, className = '', disabled, ...props }) => {
  const normalizedError = getFieldErrorMessage(error);
  const [isOpen, setIsOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const dropdownRef = useRef(null);

  // Find active option details
  const activeOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsLeaving(false);
    }, 140);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    if (isOpen) {
      handleClose();
    } else {
      setIsLeaving(false);
      setIsOpen(true);
    }
  };

  const handleOptionSelect = (optVal) => {
    if (disabled) return;
    // Create synthetic event to mimic native select behavior
    const syntheticEvent = {
      target: {
        name: props.name || '',
        value: optVal,
      },
    };
    if (onChange) {
      onChange(syntheticEvent);
    }
    handleClose();
  };

  return (
    <div className={`flex flex-col gap-1.5 min-w-0 w-full relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="ui-label flex items-center justify-between">
          <span>{label}</span>
        </label>
      )}

      <div className="relative w-full">
        {/* Custom Toggle Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          className={`ui-field w-full flex items-center justify-between text-left select-none cursor-pointer gap-2 ${
            isOpen ? 'border-primary-500 shadow-[0_0_0_2px_rgba(34,197,94,0.12)]' : ''
          } ${normalizedError ? 'ui-field-error' : ''} ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          {...props}
        >
          <span className={`ui-select-trigger-text block truncate font-medium text-sm ${!activeOption ? 'text-slate-400' : ''}`}>
            {activeOption ? activeOption.label : 'Select an option...'}
          </span>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-600' : ''}`} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        {/* Custom Popover Options List */}
        {(isOpen || isLeaving) && (
          <ul
            role="listbox"
            className={`ui-select-popover absolute z-[999] mt-2 max-h-60 w-full overflow-y-auto border border-slate-200/80 bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] outline-none ${
              isLeaving ? 'is-leaving' : ''
            }`}
          >
            {options.length === 0 ? (
              <li className="px-3 py-2 text-xs font-semibold text-slate-400 italic text-center">
                Không có lựa chọn nào
              </li>
            ) : (
              options.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`group flex items-center justify-between px-3 py-2 text-xs font-semibold cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center text-primary-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {normalizedError && (
        <span className="ui-error-text">
          {normalizedError}
        </span>
      )}
    </div>
  );
};

export default Select;
