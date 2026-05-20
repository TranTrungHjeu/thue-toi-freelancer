import React, { useEffect, useRef } from 'react';
import { Phone, Xmark, VideoCamera } from 'iconoir-react';
import Button from './Button';
import { Text, Caption } from './Typography';

const IncomingCallModal = ({ isOpen, callerName, callType, onAccept, onDecline }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Play ringing sound
      audioRef.current = new Audio('/sounds/ringtone.mp3');
      audioRef.current.loop = true;
      audioRef.current.play().catch(err => console.log('Audio play blocked'));
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[2000] animate-in slide-in-from-bottom-10 duration-500">
      <div className="w-80 bg-slate-900 text-white shadow-2xl border border-slate-700 p-5 rounded-none relative overflow-hidden">
        {/* Animated Background Pulse */}
        <div className="absolute inset-0 bg-primary-600/10 animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-none flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-bounce">
            {callType === 'Video' ? <VideoCamera className="w-8 h-8 text-white" /> : <Phone className="w-8 h-8 text-white" />}
          </div>

          <Caption className="text-[10px] text-primary-400 font-bold uppercase tracking-[0.2em] mb-1">
            Cuộc gọi đang đến...
          </Caption>
          <Text className="text-lg font-black mb-1 text-white tracking-tight">
            {callerName}
          </Text>
          <Text className="text-xs text-slate-400 mb-6 italic">
            Đang mời bạn tham gia cuộc gọi {callType.toLowerCase()}
          </Text>

          <div className="flex gap-3 w-full">
            <button
              onClick={onDecline}
              className="flex-1 h-11 bg-slate-800 hover:bg-red-500 text-white transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded-none border border-slate-700"
            >
              <Xmark className="w-4 h-4" /> Từ chối
            </button>
            <button
              onClick={onAccept}
              className="flex-1 h-11 bg-primary-600 hover:bg-primary-700 text-white transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded-none shadow-lg shadow-primary-900/20"
            >
              <Phone className="w-4 h-4" /> Nghe máy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
