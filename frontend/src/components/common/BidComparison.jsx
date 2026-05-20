import React, { useMemo } from 'react';
import { CheckCircle, CheckCircleSolid } from 'iconoir-react';
import Button from './Button';
import { Text, Caption } from './Typography';
import { formatCurrency, formatDate } from '../../utils/formatters';

const BidComparison = ({ bids, selectedBidId, onSelectBid, onConfirmBid, isLoading }) => {
  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) => a.price - b.price);
  }, [bids]);

  const lowestPrice = useMemo(() => {
    return Math.min(...bids.map(b => b.price));
  }, [bids]);

  const highestPrice = useMemo(() => {
    return Math.max(...bids.map(b => b.price));
  }, [bids]);

  return (
    <div className="space-y-3.5">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-none p-2.5">
          <Text className="text-[11px] text-slate-500 mb-0.5 font-medium uppercase tracking-wider">Tổng số báo giá</Text>
          <Text className="text-base font-extrabold text-slate-900">{bids.length}</Text>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-none p-2.5">
          <Text className="text-[11px] text-emerald-600 mb-0.5 font-medium uppercase tracking-wider">Giá thấp nhất</Text>
          <Text className="text-base font-extrabold text-emerald-700">
            {formatCurrency(lowestPrice)}
          </Text>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 rounded-none p-2.5">
          <Text className="text-[11px] text-amber-600 mb-0.5 font-medium uppercase tracking-wider">Giá cao nhất</Text>
          <Text className="text-base font-extrabold text-amber-700">
            {formatCurrency(highestPrice)}
          </Text>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-none">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-2 px-3">Freelancer</th>
              <th className="py-2 px-3 text-right">Mức giá đề xuất</th>
              <th className="py-2 px-3 text-center">Thời gian</th>
              <th className="py-2 px-3 text-center">Ngày gửi</th>
              <th className="py-2 px-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sortedBids.map((bid) => {
              const isSelected = bid.id === selectedBidId;
              const isLowest = bid.price === lowestPrice;

              return (
                <tr
                  key={bid.id}
                  className={`border-b border-slate-200 hover:bg-slate-50/50 transition-colors ${
                    isSelected ? 'bg-primary-50/70' : isLowest ? 'bg-emerald-50/70 border-l-2 border-l-emerald-500' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 relative overflow-hidden">
                    {isLowest && (
                      <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none overflow-hidden z-10">
                        <div className="absolute top-[6px] right-[-16px] w-[56px] bg-emerald-600 text-white text-[7px] font-extrabold uppercase tracking-wider text-center rotate-45 py-0.5 shadow-sm">
                          RẺ NHẤT
                        </div>
                      </div>
                    )}
                    <div className="min-w-0 pr-6">
                      <Text className="flex items-center gap-1 font-bold text-slate-900 text-xs truncate">
                        {bid.freelancer?.fullName}
                        {bid.freelancer?.kycApproved && (
                          <CheckCircleSolid className="h-3 w-3 text-emerald-500 shrink-0" title="Đã xác minh" />
                        )}
                      </Text>
                      <Text className="text-[10px] text-slate-400 truncate">
                        {bid.freelancer?.email}
                      </Text>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Text className={`font-extrabold text-xs ${isLowest ? 'text-emerald-700' : 'text-primary-700'}`}>
                        {formatCurrency(bid.price)}
                      </Text>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Text className="text-slate-800 font-medium">{bid.estimatedTime}</Text>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Text className="text-slate-500">
                      {formatDate(bid.createdAt)}
                    </Text>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {isSelected ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-primary-600 shrink-0" />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onConfirmBid?.(bid)}
                          disabled={isLoading}
                          isLoading={isLoading}
                          className="min-h-7 py-0.5 px-2 text-xs"
                        >
                          Xác nhận
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectBid?.(bid)}
                        disabled={isLoading}
                        className="min-h-7 py-0.5 px-2 text-xs border border-slate-200"
                      >
                        Chọn
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Bid Details */}
      {selectedBidId && (
        <div className="bg-primary-50/50 border border-primary-200 rounded-none p-3 text-xs">
          <Caption className="text-[10px] text-primary-700 font-bold uppercase tracking-wider mb-1 block">Lời nhắn từ Freelancer được chọn</Caption>
          <Text className="text-primary-900 leading-relaxed italic">
            "{sortedBids.find(b => b.id === selectedBidId)?.message}"
          </Text>
        </div>
      )}
    </div>
  );
};

export default BidComparison;
