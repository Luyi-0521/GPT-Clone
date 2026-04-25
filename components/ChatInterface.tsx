import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Session, Message } from '../lib/types';
import { chatWithAI, generateSmartTitle } from '../lib/api';

interface ChatInterfaceProps {
  session: Session | undefined;
  onUpdateSession: (session: Session) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, onUpdateSession }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('grok-4-fast');
  const [textareaHeight, setTextareaHeight] = useState(3);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editHistory, setEditHistory] = useState<{[key: string]: string[]}>({});
  const [historyIndex, setHistoryIndex] = useState<{[key: string]: number}>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const models = [
    { id: 'grok-4-fast', name: 'Grok-4-fast' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'supermind-agent-v1', name: 'Supermind Agent' },
    { id: 'kimi-k2.5', name: 'Kimi K2.5' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 200);
      textarea.style.height = `${newHeight}px`;
      setTextareaHeight(Math.ceil(newHeight / 16));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustTextareaHeight();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !session || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue.trim(),
      role: 'user',
      createdAt: new Date().toISOString()
    };

    const userOnlySession = {
      ...session,
      messages: [...session.messages, userMessage]
    };

    onUpdateSession(userOnlySession);
    setInputValue('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      setTextareaHeight(3);
    }

    try {
      const allMessagesWithUser = [...session.messages, userMessage];
      const aiResponse = await chatWithAI(allMessagesWithUser, selectedModel);
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: aiResponse,
        role: 'assistant',
        createdAt: new Date().toISOString()
      };

      const allMessages = [...allMessagesWithUser, aiMessage];
      const shouldGenerateTitle = session.isTitleManuallyEdited !== true;
      
      if (shouldGenerateTitle) {
        generateSmartTitle(allMessages).then(smartTitle => {
          if (smartTitle && smartTitle !== '新会话' && smartTitle.length >= 2) {
            const titledSession = { 
              ...session, 
              messages: allMessages,
              title: smartTitle 
            };
            onUpdateSession(titledSession);
            return;
          }
          
          const finalSession = {
            ...session,
            messages: allMessages
          };
          onUpdateSession(finalSession);
        }).catch(error => {
          console.error('Failed to generate smart title:', error);
          const finalSession = {
            ...session,
            messages: allMessages
          };
          onUpdateSession(finalSession);
        });
      } else {
        const finalSession = {
          ...session,
          messages: allMessages
        };
        onUpdateSession(finalSession);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: '抱歉，无法连接到AI服务，请稍后重试。',
        role: 'assistant',
        createdAt: new Date().toISOString()
      };

      const errorSession = {
        ...session,
        messages: [...session.messages, userMessage, errorMessage]
      };

      onUpdateSession(errorSession);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    const originalContent = message.content;
    setEditContent(originalContent);

    const existingHistory = editHistory[message.id] || [];
    if (existingHistory.length === 0 || existingHistory[existingHistory.length - 1] !== originalContent) {
      setEditHistory(prev => ({
        ...prev,
        [message.id]: [...existingHistory, originalContent]
      }));
      setHistoryIndex(prev => ({
        ...prev,
        [message.id]: existingHistory.length
      }));
    }

    setTimeout(() => {
      if (editTextareaRef.current) {
        editTextareaRef.current.focus();
        editTextareaRef.current.setSelectionRange(
          editTextareaRef.current.value.length,
          editTextareaRef.current.value.length
        );
      }
    }, 0);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditContent(newContent);

    if (editingMessageId) {
      const currentHistory = editHistory[editingMessageId] || [];
      const currentIndex = historyIndex[editingMessageId] || 0;

      const updatedHistory = [...currentHistory.slice(0, currentIndex + 1), newContent];
      setEditHistory(prev => ({
        ...prev,
        [editingMessageId]: updatedHistory
      }));
      setHistoryIndex(prev => ({
        ...prev,
        [editingMessageId]: updatedHistory.length - 1
      }));
    }
  };

  const handleUndo = () => {
    if (!editingMessageId) return;

    const currentHistory = editHistory[editingMessageId] || [];
    const currentIndex = historyIndex[editingMessageId] || 0;

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setEditContent(currentHistory[newIndex]);
      setHistoryIndex(prev => ({
        ...prev,
        [editingMessageId]: newIndex
      }));
    }
  };

  const handleRedo = () => {
    if (!editingMessageId) return;

    const currentHistory = editHistory[editingMessageId] || [];
    const currentIndex = historyIndex[editingMessageId] || 0;

    if (currentIndex < currentHistory.length - 1) {
      const newIndex = currentIndex + 1;
      setEditContent(currentHistory[newIndex]);
      setHistoryIndex(prev => ({
        ...prev,
        [editingMessageId]: newIndex
      }));
    }
  };

  const handleSaveEdit = () => {
    if (!session || !editingMessageId || !editContent.trim()) return;

    const updatedMessages = session.messages.map(msg =>
      msg.id === editingMessageId
        ? { ...msg, content: editContent.trim(), editedAt: new Date().toISOString() }
        : msg
    );

    onUpdateSession({ ...session, messages: updatedMessages });
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    if (!editingMessageId) return;
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleCopyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const canUndo = editingMessageId ? (historyIndex[editingMessageId] || 0) > 0 : false;
  const canRedo = editingMessageId ? (historyIndex[editingMessageId] || 0) < (editHistory[editingMessageId] || []).length - 1 : false;

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center glass-light rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl font-light text-gray-800 mb-3">你好，需要我为你做些什么？</h2>
          <p className="text-gray-600 text-lg">请创建新会话或选择一个会话开始聊天</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-16 glass-light flex items-center justify-between px-8 border-b border-white/30">
        <h2 className="text-xl font-medium text-gray-800">{session.title}</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none glass px-5 py-2.5 pr-10 text-sm text-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8fa3b8]/50 cursor-pointer"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {session.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div
              className={`max-w-[80%] relative ${
                message.role === 'user' ? 'user-message' : 'ai-message'} rounded-2xl shadow-xl`}
            >
              {editingMessageId === message.id ? (
                <div className="p-5 space-y-3">
                  <textarea
                    ref={editTextareaRef}
                    value={editContent}
                    onChange={handleEditChange}
                    onKeyDown={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        if (e.key === 'z' && !e.shiftKey) {
                          e.preventDefault();
                          handleUndo();
                        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                          e.preventDefault();
                          handleRedo();
                        }
                      }
                      if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="w-full p-4 rounded-2xl resize-none text-gray-800 glass-light border-2 border-white/40 focus:outline-none focus:border-[#8fa3b8]/50 shadow-inner"
                    rows={Math.max(3, Math.ceil(editContent.length / 40))}
                    autoFocus
                    style={{ minHeight: '80px', maxHeight: '200px' }}
                  />
                  <div className="flex items-center justify-between pt-3 border-t border-white/30">
                    <div className="flex gap-2">
                      <button
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className="px-4 py-2 text-sm font-medium glass text-gray-700 rounded-xl hover:bg-white/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="撤销 (Ctrl+Z)"
                      >
                        ↩ 撤销
                      </button>
                      <button
                        onClick={handleRedo}
                        disabled={!canRedo}
                        className="px-4 py-2 text-sm font-medium glass text-gray-700 rounded-xl hover:bg-white/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="重做 (Ctrl+Y)"
                      >
                        ↪ 重做
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-5 py-2 text-sm font-medium glass text-gray-700 rounded-xl hover:bg-white/50 transition-all duration-200"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editContent.trim()}
                        className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-[#8fa3b8] to-[#7a90a5] text-white rounded-xl hover:from-[#7a90a5] hover:to-[#6b8093] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#8fa3b8]/30"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-5 markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {message.editedAt && (
                    <div className={`px-5 pb-2 text-xs ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                    已编辑
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {message.role === 'user' && (
                      <button
                        onClick={() => handleStartEdit(message)}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white/80 hover:text-white transition-all duration-200"
                        title="编辑消息"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleCopyMessage(message)}
                      className={`copy-btn p-2 rounded-xl transition-all duration-200 ${
                        copiedMessageId === message.id
                          ? 'bg-green-500/30 text-green-600'
                          : message.role === 'user'
                          ? 'bg-white/20 hover:bg-white/40 text-white/80 hover:text-white'
                          : 'bg-white/40 hover:bg-white/60 text-gray-500 hover:text-gray-700'
                      }`}
                      title={copiedMessageId === message.id ? '已复制!' : '复制内容'}
                    >
                      {copiedMessageId === message.id ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012-2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-5 rounded-2xl shadow-xl ai-message">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-[#8fa3b8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-[#a8c0a4] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-[#d4b8c8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="glass-light border-t border-white/30 flex items-end px-8 py-6">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyPress}
            placeholder="输入消息... (Shift+Enter 换行，Enter 发送)"
            className="w-full p-5 glass border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8fa3b8]/40 text-gray-800 resize-none overflow-y-auto placeholder-gray-500"
            rows={textareaHeight}
            style={{ minHeight: '56px', maxHeight: '200px' }}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="ml-4 bg-gradient-to-r from-[#8fa3b8] to-[#7a90a5] text-white rounded-2xl py-3 px-8 hover:from-[#7a90a5] hover:to-[#6b8093] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 self-end shadow-lg shadow-[#8fa3b8]/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          发送
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
