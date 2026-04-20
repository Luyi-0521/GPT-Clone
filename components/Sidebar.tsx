import React from 'react';
import { Session } from '../lib/types';

interface SidebarProps {
  sessions: Session[];
  activeSession: string | null;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onSelectSession: (sessionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSession,
  onCreateSession,
  onDeleteSession,
  onSelectSession,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onCreateSession}
          className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新会话
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              activeSession === session.id ? 'bg-gray-100' : ''
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-900 truncate max-w-[160px]">
                {session.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {formatDate(session.createdAt)}
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            <p>暂无会话记录</p>
            <p className="text-xs mt-1">点击上方按钮创建新会话</p>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
        <p>ChatGPT Clone</p>
        <p className="mt-1">使用 AI Builders API</p>
      </div>
    </div>
  );
};

export default Sidebar;