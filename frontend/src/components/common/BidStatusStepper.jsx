import React from 'react';

/**
 * A premium, ultra-minimalist SaaS-style status display for bid proposals.
 * Clean, elegant text pill with contextual micro-copy (no dot indicators).
 * Designed to look hand-crafted, following Linear/Stripe design standards.
 */
const BidStatusStepper = ({ status, locale = 'vi' }) => {
  let statusText = '';
  let subText = '';
  let pillClass = '';

  if (status === 'pending') {
    statusText = locale === 'en' ? 'Awaiting Review' : 'Chờ phản hồi';
    subText = locale === 'en' ? 'Client is reviewing' : 'Khách hàng đang xem xét';
    pillClass = 'bg-amber-50/75 text-amber-800 border-amber-200/50 hover:bg-amber-100/40';
  } else if (status === 'accepted') {
    statusText = locale === 'en' ? 'Accepted' : 'Được chấp nhận';
    subText = locale === 'en' ? 'Contract active' : 'Hợp đồng đã kích hoạt';
    pillClass = 'bg-emerald-50/75 text-emerald-800 border-emerald-200/50 hover:bg-emerald-100/40';
  } else if (status === 'rejected') {
    statusText = locale === 'en' ? 'Archived' : 'Đã từ chối';
    subText = locale === 'en' ? 'Declined by client' : 'Hồ sơ đã được lưu trữ';
    pillClass = 'bg-slate-100/70 text-slate-600 border-slate-200/60 hover:bg-slate-150/50';
  } else if (status === 'withdrawn') {
    statusText = locale === 'en' ? 'Withdrawn' : 'Đã rút đề xuất';
    subText = locale === 'en' ? 'Cancelled by you' : 'Freelancer đã hủy';
    pillClass = 'bg-slate-50 text-slate-450 border-slate-200/40';
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0 select-none text-right font-sans">
      {/* Ultra-minimalist Pill Indicator */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold tracking-wide shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-300 ${pillClass}`}>
        <span>{statusText}</span>
      </div>

      {/* Helpful SaaS Micro-copy */}
      <span className="text-[10px] text-slate-450 font-normal tracking-normal max-w-[140px] truncate block opacity-95">
        {subText}
      </span>
    </div>
  );
};

export default BidStatusStepper;
