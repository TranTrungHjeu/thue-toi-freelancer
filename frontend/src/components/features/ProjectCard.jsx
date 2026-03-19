"use client";

import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Tag from '../common/Tag';
import { H2, Text, Caption } from '../common/Typography';
import { Calendar, User, Wallet } from 'iconoir-react';

/**
 * Business job/project card for service listings.
 */
const ProjectCard = ({ 
  title, 
  client, 
  budget, 
  tags = [], 
  postedAt, 
  className = "" 
}) => {
  return (
    <Card className={`group hover:border-secondary-900 transition-all duration-300 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <H2 className="text-xl group-hover:text-primary-600 transition-colors line-clamp-1 !mb-0">{title}</H2>
        <Badge color="info" className="whitespace-nowrap">{budget}</Badge>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
          <User className="w-4 h-4 text-slate-400" />
          <Caption className="font-bold text-slate-600">{client}</Caption>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          <Caption>{postedAt}</Caption>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {tags.map((tag, idx) => (
          <Tag key={idx} color={idx === 0 ? 'primary' : 'slate'}>{tag}</Tag>
        ))}
      </div>

      <div className="pt-6 border-t border-slate-100 flex gap-3">
        <Button className="flex-1">Gửi Báo Giá</Button>
        <Button variant="outline" className="px-3">
          <Wallet className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
};

export default ProjectCard;
