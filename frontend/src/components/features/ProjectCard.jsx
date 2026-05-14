"use client";

import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Tag from '../common/Tag';
import { H2, Text, Caption } from '../common/Typography';
import { Calendar, User, Wallet, ArrowRight } from 'iconoir-react';
import { getProjectCoverImage } from '../../utils/projectImages';

/**
 * Thẻ dự án dùng cho danh sách công việc dịch vụ.
 */
const ProjectCard = ({ 
  title, 
  client, 
  budget, 
  tags = [], 
  postedAt, 
  className = "" 
}) => {
  const coverImage = getProjectCoverImage(tags);

  return (
    <Card className={`group relative bg-white border border-slate-200 rounded-[24px] p-2 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:border-primary-200 cursor-pointer flex flex-col h-full ${className}`}>
      {/* Top Image Section (Inset) */}
      <div className="relative h-[160px] w-full rounded-[18px] overflow-hidden bg-slate-100">
        <img 
          src={coverImage} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Floating Tags over Image */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 shadow-sm">
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white shadow-sm">
              +{tags.length - 2}
            </span>
          )}
        </div>
        {/* Subtle gradient overlay to make tags pop if the image is bright */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-50" />
      </div>

      {/* Content Section */}
      <div className="px-4 py-5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-3 mb-4">
          <H2 className="text-lg group-hover:text-primary-600 transition-colors line-clamp-2 !mb-0 leading-snug">{title}</H2>
        </div>

        <div className="flex flex-col gap-2 mb-6 mt-auto">
          <div className="flex items-center gap-2 text-slate-500">
            <User className="w-4 h-4 text-slate-400" />
            <Caption className="font-semibold text-slate-700 line-clamp-1">{client}</Caption>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <Caption>{postedAt}</Caption>
          </div>
        </div>

        {/* Footer Area */}
        <div className="pt-4 border-t border-slate-100/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Ngân sách</span>
            <span className="text-sm font-extrabold text-primary-600">{budget}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="w-9 h-9 p-0 rounded-full border-slate-200 text-slate-500 group-hover:border-primary-200 group-hover:text-primary-600 group-hover:bg-primary-50 transition-all">
              <Wallet className="w-4 h-4" />
            </Button>
            <Button className="w-9 h-9 p-0 rounded-full shadow-md hover:shadow-lg transition-all group-hover:scale-105">
              <span className="sr-only">Nhận dự án</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;
