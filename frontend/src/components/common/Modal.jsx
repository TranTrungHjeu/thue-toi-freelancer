import React from 'react';
import { createPortal } from 'react-dom';
import { Xmark } from 'iconoir-react';
import Button from './Button';
import { H2 } from './Typography';

/**
 * Thành phần hộp thoại dùng chung theo phong cách giao diện góc cạnh.
 * @param {boolean} isOpen - Điều khiển trạng thái hiển thị
 * @param {function} onClose - Hàm đóng hộp thoại
 * @param {string} title - Tiêu đề hộp thoại
 */
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-lg border border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <H2 className="!mb-0 text-xl">{title}</H2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-secondary-900 transition-colors"
          >
            <Xmark className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
