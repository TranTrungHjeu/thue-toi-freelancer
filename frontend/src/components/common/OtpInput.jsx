import React, { useRef } from 'react';
import { PasteClipboard } from 'iconoir-react';
import { useI18n } from '../../hooks/useI18n';

/**
 * Cụm nhập mã xác thực 6 ô, tự chuyển ô và hỗ trợ dán nhanh.
 * value: string (tối đa 6 ký tự số)
 * onChange: (newValue: string) => void
 */
const OtpInput = ({ value = '', onChange, length = 6, label, pasteLabel }) => {
  const inputRefs = useRef([]);
  const { locale } = useI18n();
  const digits = Array.from({ length }, (_, i) => value[i] || '');
  const resolvedLabel = label || (locale === 'vi' ? 'Mã xác thực' : 'Verification code');
  const resolvedPasteLabel = pasteLabel || (locale === 'vi' ? 'Dán nhanh' : 'Quick paste');

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
      <div className="auth-otp-header">
        <label className="ui-label">
          {resolvedLabel}
        </label>
        <button
          type="button"
          onClick={handlePasteButton}
          className="auth-otp-copy"
        >
          <PasteClipboard className="h-3.5 w-3.5" />
          {resolvedPasteLabel}
        </button>
      </div>

      <div className="auth-otp-grid">
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
            className={`ui-field auth-otp-cell ${digit ? 'auth-otp-cell-filled' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default OtpInput;
