import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bank, NavArrowDown, Search, Xmark } from 'iconoir-react';
import { VIETNAMESE_BANKS, findBankByCode } from '../../constants/vietnameseBanks';
import { getFieldErrorMessage } from '../../utils/formError';

/**
 * Dropdown chọn ngân hàng có hỗ trợ tìm kiếm (theo tên ngắn, tên đầy đủ và mã VietQR).
 *
 * Props:
 *  - value: mã ngân hàng (VietQR code) đang được chọn, ví dụ "VCB".
 *  - onChange(bank | null): callback khi user chọn / clear ngân hàng.
 *      `bank` là object { code, shortName, name, bin } từ danh sách tĩnh.
 *  - label, error, placeholder, required, disabled.
 */
const BankSelect = ({
  label,
  value,
  onChange,
  error,
  placeholder = 'Chọn ngân hàng...',
  required = false,
  disabled = false,
  className = '',
}) => {
  const normalizedError = getFieldErrorMessage(error);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selectedBank = useMemo(() => findBankByCode(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return VIETNAMESE_BANKS;
    return VIETNAMESE_BANKS.filter(
      (bank) =>
        bank.code.toLowerCase().includes(q) ||
        bank.shortName.toLowerCase().includes(q) ||
        bank.name.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = (bank) => {
    onChange?.(bank);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = (event) => {
    event.stopPropagation();
    onChange?.(null);
    setQuery('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      scrollIntoView(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      scrollIntoView(activeIndex - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const bank = filtered[activeIndex];
      if (bank) handleSelect(bank);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const scrollIntoView = (index) => {
    const node = listRef.current?.children?.[index];
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 min-w-0 w-full relative ${className}`} ref={containerRef}>
      {label && (
        <label className="ui-label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`ui-field w-full flex items-center justify-between text-left gap-2 cursor-pointer ${
            isOpen ? 'border-primary-500 shadow-[0_0_0_2px_rgba(34,197,94,0.12)]' : ''
          } ${normalizedError ? 'ui-field-error' : ''} ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2 min-w-0 flex-1">
            <Bank className={`w-4 h-4 shrink-0 ${selectedBank ? 'text-emerald-600' : 'text-slate-400'}`} />
            {selectedBank ? (
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-slate-900 text-sm truncate">{selectedBank.shortName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded shrink-0">
                  {selectedBank.code}
                </span>
              </span>
            ) : (
              <span className="text-slate-400 text-sm truncate">{placeholder}</span>
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {selectedBank && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClear(e)}
                className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                title="Bỏ chọn"
              >
                <Xmark className="w-3.5 h-3.5" />
              </span>
            )}
            <NavArrowDown
              className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-primary-600' : ''}`}
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-[999] mt-1 w-full bg-white border border-slate-200 shadow-[0_12px_32px_rgba(15,23,42,0.15)] flex flex-col max-h-[320px] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 shrink-0">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tìm theo tên hoặc mã ngân hàng..."
                className="flex-1 outline-none text-sm bg-transparent placeholder:text-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <Xmark className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <ul
              ref={listRef}
              role="listbox"
              className="flex-1 overflow-y-auto p-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-4 text-xs font-semibold text-slate-400 italic text-center">
                  Không tìm thấy ngân hàng
                </li>
              ) : (
                filtered.map((bank, index) => {
                  const isSelected = selectedBank?.code === bank.code;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={bank.code}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSelect(bank)}
                      className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : isActive
                            ? 'bg-slate-50 text-slate-900'
                            : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Bank className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <div className="font-semibold truncate leading-tight">{bank.shortName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{bank.name}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded shrink-0">
                        {bank.code}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {normalizedError && (
        <span className="ui-error-text">{normalizedError}</span>
      )}
    </div>
  );
};

export default BankSelect;
