"use client";

import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Tag from '../common/Tag';
import Avatar from '../common/Avatar';
import { H2, Text, Caption } from '../common/Typography';
import { Star, Wallet, CheckCircle } from 'iconoir-react';

/**
 * Thẻ hồ sơ người tìm việc.
 * Thiết kế góc cạnh, hiển thị đánh giá, kỹ năng và mức phí.
 */
const FreelancerCard = ({ 
  name, 
  title, 
  rating, 
  reviews, 
  rate, 
  skills = [], 
  avatar,
  isVerified = false,
  className = "" 
}) => {
  return (
    <Card className={`group hover:border-primary-500 transition-all duration-300 flex flex-col gap-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar size="lg" src={avatar} />
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-white p-0.5 border border-slate-100">
                <CheckCircle className="w-4 h-4 text-primary-500" fill="currentColor" />
              </div>
            )}
          </div>
          <div>
            <H2 className="text-xl !mb-0 group-hover:text-primary-600 transition-colors">{name}</H2>
            <Caption className="font-bold text-slate-500 uppercase tracking-tighter">{title}</Caption>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4" fill="currentColor" />
            <span className="text-sm font-bold text-secondary-900">{rating}</span>
          </div>
          <Caption>({reviews} đánh giá)</Caption>
        </div>
      </div>

      <Text className="text-sm line-clamp-2 text-slate-600">
        Chuyên gia với hơn 5 năm kinh nghiệm trong lĩnh vực này. Đã hoàn thành hơn 50 dự án lớn nhỏ với sự hài lòng tuyệt đối từ khách hàng.
      </Text>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <Tag key={idx} color={idx === 0 ? 'primary' : 'slate'}>{skill}</Tag>
        ))}
      </div>

      <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <Caption className="text-[10px] font-bold text-slate-400 uppercase">Giá dịch vụ</Caption>
          <div className="flex items-center gap-1.5 font-bold text-secondary-900">
            <Wallet className="w-4 h-4 text-slate-400" />
            <span>{rate}</span>
          </div>
        </div>
        <Button variant="outline" className="px-6">Xem hồ sơ</Button>
      </div>
    </Card>
  );
};

export default FreelancerCard;
