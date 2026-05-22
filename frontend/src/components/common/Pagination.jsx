import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'iconoir-react';
import { Text } from './Typography';
import { useI18n } from '../../hooks/useI18n';

/**
 * Thanh phân trang dùng chung cho mọi danh sách phân trang offset
 * (sync với backend `PagedResponse`).
 *
 * Props:
 * - page (number, 1-indexed)
 * - totalPages (number)
 * - totalItems (number)
 * - pageSize (number)
 * - onChange (fn(nextPage))
 * - showSummary (bool, mặc định true)
 * - className (string)
 * - idPrefix (string, dùng cho data-id / aria)
 */
const Pagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onChange,
  showSummary = true,
  className = '',
  idPrefix = 'pagination',
}) => {
  const { locale } = useI18n();
  const safePage = Math.max(1, Math.min(page || 1, totalPages || 1));
  const safeTotalPages = Math.max(1, totalPages || 1);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    let startPage = Math.max(1, safePage - Math.floor(maxButtons / 2));
    const endPage = Math.min(safeTotalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    const result = [];
    for (let i = startPage; i <= endPage; i += 1) {
      result.push(i);
    }
    return result;
  }, [safePage, safeTotalPages]);

  if (!totalItems || totalItems <= (pageSize || 0)) {
    return null;
  }

  const startIndex = (safePage - 1) * (pageSize || 0) + 1;
  const endIndex = Math.min(safePage * (pageSize || 0), totalItems);
  const isVietnamese = locale === 'vi';
  const summaryText = isVietnamese
    ? `Hiển thị ${startIndex}-${endIndex} / ${totalItems} mục`
    : `Showing ${startIndex}-${endIndex} of ${totalItems} items`;

  const handleChange = (nextPage) => {
    const clamped = Math.max(1, Math.min(safeTotalPages, nextPage));
    if (clamped !== safePage && typeof onChange === 'function') {
      onChange(clamped);
    }
  };

  const firstPageVisible = pageNumbers[0] > 1;
  const lastPageVisible = pageNumbers[pageNumbers.length - 1] < safeTotalPages;

  return (
    <div className={`flex flex-col items-center gap-2 sm:flex-row sm:justify-between ${className}`}>
      {showSummary && (
        <Text className="text-xs text-slate-500">{summaryText}</Text>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleChange(safePage - 1)}
          disabled={safePage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-primary-300 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
          aria-label={isVietnamese ? 'Trang trước' : 'Previous page'}
          data-id={`${idPrefix}-prev`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>

        {firstPageVisible && (
          <>
            <button
              type="button"
              onClick={() => handleChange(1)}
              className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-600 transition-colors hover:border-primary-300 hover:text-primary-600"
            >
              1
            </button>
            {pageNumbers[0] > 2 && <span className="px-1 text-xs text-slate-400">…</span>}
          </>
        )}

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => handleChange(pageNumber)}
            className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors ${
              pageNumber === safePage
                ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                : 'border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'
            }`}
            aria-current={pageNumber === safePage ? 'page' : undefined}
            data-id={`${idPrefix}-page-${pageNumber}`}
          >
            {pageNumber}
          </button>
        ))}

        {lastPageVisible && (
          <>
            {pageNumbers[pageNumbers.length - 1] < safeTotalPages - 1 && (
              <span className="px-1 text-xs text-slate-400">…</span>
            )}
            <button
              type="button"
              onClick={() => handleChange(safeTotalPages)}
              className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-600 transition-colors hover:border-primary-300 hover:text-primary-600"
            >
              {safeTotalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => handleChange(safePage + 1)}
          disabled={safePage === safeTotalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-primary-300 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
          aria-label={isVietnamese ? 'Trang sau' : 'Next page'}
          data-id={`${idPrefix}-next`}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
