"use client";

import React from 'react';
import { H2, Text, Caption } from '../common/Typography';
import { Page, Download, EditPencil } from 'iconoir-react';
import Button from '../common/Button';

/**
 * Thành phần xem nhanh hợp đồng.
 * Thiết kế góc cạnh, mô phỏng bố cục văn bản giấy.
 */
const ContractPreview = ({ 
  title = "HỢP ĐỒNG CUNG CẤP DỊCH VỤ PHẦN MỀM",
  id = "CNTR-2024-001",
  clientName = "Công ty TNHH Phúc Long",
  freelancerName = "Trần Trung Hiếu",
  amount = "$2,500.00",
  date = "20 tháng 03, 2024",
  className = "" 
}) => {
  return (
    <div className={`bg-slate-50 p-8 border border-slate-200 flex flex-col items-center ${className}`}>
      <div className="flex w-full justify-between items-center mb-10">
        <div className="flex items-center gap-2 text-slate-400">
          <Page className="w-5 h-5" />
          <Caption className="font-bold">{id}</Caption>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="p-2 min-w-0" title="Sửa nội dung"><EditPencil className="w-4 h-4" /></Button>
          <Button variant="outline" className="p-2 min-w-0" title="Tải xuống PDF"><Download className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="w-full max-w-[600px] bg-white shadow-xl p-12 flex flex-col gap-8 border border-slate-100">
        <div className="text-center border-b-2 border-secondary-900 pb-6">
          <H2 className="text-xl mb-1">{title}</H2>
          <Caption className="font-bold text-slate-500 uppercase tracking-widest">Giai đoạn: Hoàn thiện Backend</Caption>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Bên A (Khách hàng)</span>
            <span className="text-xs font-bold text-secondary-900">{clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Bên B (Người tìm việc)</span>
            <span className="text-xs font-bold text-secondary-900">{freelancerName}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-4">
            <span className="text-xs font-bold uppercase text-slate-400">Tổng giá trị hợp đồng</span>
            <span className="text-sm font-bold text-primary-600">{amount}</span>
          </div>
        </div>

        <div className="py-6 flex flex-col gap-4">
          <Text className="text-xs italic text-slate-500 leading-relaxed">
            Hợp đồng này quy định các điều khoản và điều kiện về việc thực hiện dự án. Bên B cam kết bàn giao sản phẩm đúng thời hạn và đảm bảo chất lượng theo yêu cầu. Bên A cam kết thanh toán đúng hạn cho các giai đoạn đã hoàn thành...
          </Text>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-12">
          <div className="flex flex-col items-center gap-2">
            <Caption className="uppercase font-bold text-slate-400">Đại diện bên A</Caption>
            <div className="w-full h-16 border-b border-dashed border-slate-300 flex items-center justify-center">
              <EditPencil className="w-8 h-8 text-primary-500/50" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Caption className="uppercase font-bold text-slate-400">Đại diện bên B</Caption>
            <div className="w-full h-16 border-b border-dashed border-slate-300 flex items-center justify-center font-serif text-slate-400">
              Trần Trung Hiếu
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Caption className="text-[10px] text-slate-300">Hợp đồng điện tử ký ngày {date}. Có giá trị pháp lý tương đương văn bản giấy.</Caption>
        </div>
      </div>
    </div>
  );
};

export default ContractPreview;
