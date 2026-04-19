import React from 'react';

/**
 * Thành phần loading dùng chung cho toàn dự án.
 * SVG multi-ring loader theo thiết kế yêu cầu.
 */
const SIZE_MAP = {
  xs: 0.22,
  sm: 0.6,
  md: 0.8,
  lg: 1,
};

const INLINE_SIZE_MAP = {
  xs: '0.95rem',
  sm: '1.1rem',
  md: '1.25rem',
  lg: '1.45rem',
};

const Spinner = ({ size = 'md', label = '', className = '', inline = false, tone = 'brand' }) => {
  const spinnerScale = SIZE_MAP[size] || SIZE_MAP.md;
  const inlineSize = INLINE_SIZE_MAP[size] || INLINE_SIZE_MAP.sm;
  const containerClassName = inline
    ? `inline-flex items-center gap-2 ${className}`
    : `inline-flex flex-col items-center gap-3 ${className}`;
  const ringStroke = (colorToken) => (tone === 'current' ? 'currentColor' : colorToken);

  return (
    <div className={containerClassName} role="status" aria-live="polite">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 128 128"
        height="128px"
        width="128px"
        className="pl"
        style={inline
          ? { width: inlineSize, height: inlineSize, '--loader-scale': 1 }
          : { '--loader-scale': spinnerScale }}
        aria-hidden="true"
      >
        <circle strokeDashoffset="-376.4" strokeDasharray="377 377" strokeLinecap="round" transform="rotate(-90,64,64)" strokeWidth={8} stroke={ringStroke('var(--color-primary-700)')} fill="none" r={60} cy={64} cx={64} className="pl__ring1" />
        <circle strokeDashoffset="-329.3" strokeDasharray="329.9 329.9" strokeLinecap="round" transform="rotate(-90,64,64)" strokeWidth={7} stroke={ringStroke('var(--color-primary-600)')} fill="none" r="52.5" cy={64} cx={64} className="pl__ring2" />
        <circle strokeDashoffset="-288.6" strokeDasharray="289 289" strokeLinecap="round" transform="rotate(-90,64,64)" strokeWidth={6} stroke={ringStroke('var(--color-primary-500)')} fill="none" r={46} cy={64} cx={64} className="pl__ring3" />
        <circle strokeDashoffset={-254} strokeDasharray="254.5 254.5" strokeLinecap="round" transform="rotate(-90,64,64)" strokeWidth={5} stroke={ringStroke('var(--color-accent-500)')} fill="none" r="40.5" cy={64} cx={64} className="pl__ring4" />
        <circle strokeDashoffset="-225.8" strokeDasharray="226.2 226.2" strokeLinecap="round" transform="rotate(-90,64,64)" strokeWidth={4} stroke={ringStroke('var(--color-success)')} fill="none" r={36} cy={64} cx={64} className="pl__ring5" />
        <circle strokeDashoffset="-203.9" strokeDasharray="204.2 204.2" strokeLinecap="round" transform="rotate(-90,64,64)" strokeWidth={3} stroke={ringStroke('var(--color-info)')} fill="none" r="32.5" cy={64} cx={64} className="pl__ring6" />
      </svg>
      {label ? (
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-700">{label}</p>
      ) : null}
    </div>
  );
};

export default Spinner;
