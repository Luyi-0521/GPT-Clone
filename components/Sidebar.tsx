import React, { useState, useRef, useEffect } from 'react';
import { Session } from '../lib/types';

interface SidebarProps {
  sessions: Session[];
  activeSession: string | null;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onSelectSession: (sessionId: string) => void;
  onUpdateSessionTitle: (sessionId: string, title: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSession,
  onCreateSession,
  onDeleteSession,
  onSelectSession,
  onUpdateSessionTitle,
}) => {
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitleId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitleId]);

  const handleStartEditTitle = (session: Session) => {
    setEditingTitleId(session.id);
    setEditingTitleText(session.title);
  };

  const handleSaveTitle = () => {
    if (editingTitleId && editingTitleText.trim()) {
      onUpdateSessionTitle(editingTitleId, editingTitleText.trim());
    }
    setEditingTitleId(null);
    setEditingTitleText('');
  };

  const handleCancelEditTitle = () => {
    setEditingTitleId(null);
    setEditingTitleText('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-72 glass-dark flex flex-col border-r border-white/20">
      <div className="p-6 border-b border-white/20">
        <button
          onClick={onCreateSession}
          className="w-full bg-gradient-to-r from-[#8fa3b8] to-[#7a90a5] text-white rounded-2xl py-3.5 px-5 hover:from-[#7a90a5] hover:to-[#6b8093] transition-all duration-200 flex items-center justify-center gap-3 font-medium shadow-lg shadow-[#8fa3b8]/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建会话
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`mb-2 p-4 rounded-2xl transition-all duration-200 group cursor-pointer ${
              activeSession === session.id
                ? 'glass-light border border-white/40 shadow-lg'
                : 'hover:glass border border-transparent hover:border-white/20'
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <div className="flex justify-between items-start">
              {editingTitleId === session.id ? (
                <div className="flex-1 mr-3">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editingTitleText}
                    onChange={(e) => setEditingTitleText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelEditTitle();
                    }}
                    onBlur={handleSaveTitle}
                    className="w-full text-sm p-2 glass-light rounded-xl border border-[#8fa3b8]/40 focus:outline-none focus:ring-2 focus:ring-[#8fa3b8]/50 bg-white/40 text-gray-800"
                  />
                </div>
              ) : (
                <>
                  <h3
                    className={`font-medium truncate max-w-[180px] cursor-pointer transition-colors ${
                      activeSession === session.id ? 'text-gray-800' : 'text-gray-700'
                    }`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStartEditTitle(session);
                    }}
                    title="双击编辑标题"
                  >
                    {session.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              {formatDate(session.createdAt)}
              {session.isTitleManuallyEdited && (
                <span className="text-[#8fa3b8] text-xs" title="标题已手动编辑">✏️</span>
              )}
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center py-12">
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-gray-600 text-lg mb-2">暂无会话记录</p>
            <p className="text-gray-500 text-sm">点击上方按钮创建新会话</p>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
