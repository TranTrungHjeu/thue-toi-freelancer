"use client";

import React from 'react';
import { Caption, Text } from '../common/Typography';

/**
 * Bong bóng trò chuyện cho khu vực trao đổi trong hợp đồng.
 * Thiết kế góc cạnh, hỗ trợ phân biệt người gửi và người nhận.
 */
const ChatBubble = ({ 
  message, 
  time, 
  isSender = false,
  status = "read", // read, sent, delivering
  className = "" 
}) => {
  return (
    <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} ${className}`}>
      <div className={`
        max-w-[80%] px-4 py-3 border transition-all
        ${isSender 
          ? 'bg-secondary-900 text-white border-secondary-950' 
          : 'bg-white text-secondary-900 border-slate-200'}
        rounded-none shadow-sm
      `}>
        <Text className="text-sm leading-relaxed">{message}</Text>
      </div>
      <div className="mt-1 flex items-center gap-2 px-1">
        <Caption className="text-[10px] uppercase font-bold text-slate-400">{time}</Caption>
        {isSender && (
          <span className="text-[10px] uppercase font-bold text-primary-600">{status}</span>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
