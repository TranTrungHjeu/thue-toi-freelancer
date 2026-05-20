import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Xmark } from 'iconoir-react';

const VideoCallModal = ({ isOpen, onClose, roomName, displayName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-none bg-slate-900 shadow-2xl ring-1 ring-white/10">
        {/* Header bar for the modal */}
        <div className="flex items-center justify-between bg-slate-800/50 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-3 w-3 animate-pulse rounded-none bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <h3 className="text-lg font-bold tracking-tight text-white">
              Cuộc gọi trực tuyến: <span className="text-emerald-400">#{roomName.split('-')[2]}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="group flex items-center justify-center rounded-none bg-white/5 p-2 text-white/70 transition-all hover:bg-red-500 hover:text-white"
          >
            <Xmark className="h-6 w-6 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        {/* Jitsi Meeting Container */}
        <div className="flex-1 bg-slate-950">
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomName}
            configOverwrite={{
              startWithAudioMuted: false,
              disableModeratorIndicator: true,
              startScreenSharing: false,
              enableEmailInStats: false,
              prejoinPageEnabled: false, // Bỏ qua trang chờ để vào thẳng cuộc gọi
              enableWelcomePage: false,
              defaultLanguage: 'vi',
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
              SHOW_JITSI_WATERMARK: false,
              HIDE_DEEP_LINKING_LOGO: true,
            }}
            userInfo={{
              displayName: displayName || 'Người dùng Thuê Tôi',
            }}
            onApiReady={(externalApi) => {
              // Có thể điều khiển Jitsi qua API này nếu cần
              externalApi.addEventListener('videoConferenceLeft', () => {
                onClose();
              });
            }}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
