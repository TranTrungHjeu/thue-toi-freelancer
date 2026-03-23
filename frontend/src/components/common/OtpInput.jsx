import React, { useRef } from 'react';
import { PasteClipboard } from 'iconoir-react';

/**
 * 6-box OTP input với auto-advance, backspace navigation và nút dán nhanh.
 * value: string (tối đa 6 ký tự số)
 * onChange: (newValue: string) => void
 */
const OtpInput = ({ value = '', onChange, length = 6 }) => {
  const inputRefs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const notify = (newDigits) => onChange(newDigits.join(''));

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return;
    const char = raw.slice(-1);
    const next = [...digits];
    next[index] = char;
    notify(next);
    if (index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = '';
        notify(next);
      } else if (index > 0) {
        next[index - 1] = '';
        notify(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const applyPastedText = (text) => {
    const clean = text.replace(/\D/g, '').slice(0, length);
    const next = Array.from({ length }, (_, i) => clean[i] || '');
    notify(next);
    const focusIdx = Math.min(clean.length, length - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handlePasteOnInput = (e) => {
    e.preventDefault();
    applyPastedText(e.clipboardData.getData('text'));
  };

  const handlePasteButton = async () => {
    try {
      const text = await navigator.clipboard.readText();
      applyPastedText(text);
    } catch {
      // Trình duyệt không cho phép đọc clipboard — bỏ qua
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-secondary-900 font-sans">
          Mã OTP
        </label>
        <button
          type="button"
          onClick={handlePasteButton}
          className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors"
        >
          <PasteClipboard className="h-3.5 w-3.5" />
          Dán nhanh
        </button>
      </div>

      {/* 6 ô nhập */}
      <div className="flex gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePasteOnInput}
            onClick={(e) => e.target.select()}
            className={`
              h-12 w-full border-2 bg-white text-center text-xl font-bold
              text-secondary-900 font-sans outline-none transition-colors
              focus:border-primary-500
              ${digit ? 'border-primary-400' : 'border-slate-300'}
            `}
          />
        ))}
      </div>
    </div>
  );
};

export default OtpInput;
