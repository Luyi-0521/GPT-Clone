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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const models = [
    { id: 'grok-4-fast', name: 'Grok-4-fast' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'supermind-agent-v1', name: 'Supermind Agent' },
    { id: 'kimi-k2.5', name: 'Kimi K2.5' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 自动调整文本框高度
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
      createdAt: new Date().toISOString(),
    };

    const userOnlySession = {
      ...session,
      messages: [...session.messages, userMessage],
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
        createdAt: new Date().toISOString(),
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
            messages: allMessages,
          };
          onUpdateSession(finalSession);
        }).catch(error => {
          console.error('Failed to generate smart title:', error);
          const finalSession = {
            ...session,
            messages: allMessages,
          };
          onUpdateSession(finalSession);
        });
      } else {
        const finalSession = {
          ...session,
          messages: allMessages,
        };
        onUpdateSession(finalSession);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: '抱歉，无法连接到AI服务，请稍后重试。',
        role: 'assistant',
        createdAt: new Date().toISOString(),
      };

      const errorSession = {
        ...session,
        messages: [...session.messages, userMessage, errorMessage],
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
        [message.id]: (existingHistory.length)
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

    const currentHistory = editHistory[editingMessageId] || [];
    if (currentHistory.length > 0) {
      setEditContent(currentHistory[0]);
    }

    setEditingMessageId(null);
    setEditContent('');
  };

  const canUndo = editingMessageId ? (historyIndex[editingMessageId] || 0) > 0 : false;
  const canRedo = editingMessageId ? (historyIndex[editingMessageId] || 0) < (editHistory[editingMessageId] || []).length - 1 : false;

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <h2 className="text-2xl font-medium text-gray-900">你好，需要我为你做些什么？</h2>
            <p className="mt-2 text-gray-500">请创建新会话或选择一个会话开始聊天</p>
          </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <h2 className="text-lg font-medium text-gray-900">{session.title}</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 px-4 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {session.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div
              className={`max-w-[80%] relative ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white text-gray-900 rounded-tl-none border border-gray-200'
              } rounded-lg shadow-sm`}
            >
              {editingMessageId === message.id ? (
                <div className="p-4 space-y-3">
                  <textarea
                    ref={editTextareaRef}
                    value={editContent}
                    onChange={handleEditChange}
                    onKeyDown={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        if (e.key === 'z' && !e.shiftKey) {
                          e.preventDefault();
                          handleUndo();
                        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
                          e.preventDefault();
                          handleRedo();
                        }
                      }
                      if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="w-full p-3 rounded-xl resize-none border-2 focus:outline-none transition-all duration-200 text-gray-900 bg-white/60 backdrop-blur-xl border-white/40 shadow-inner focus:border-blue-400/60 focus:bg-white/80"
                    rows={Math.max(3, Math.ceil(editContent.length / 40))}
                    autoFocus
                    style={{ minHeight: '80px', maxHeight: '200px' }}
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                    <div className="flex gap-2">
                      <button
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className="px-3 py-1.5 text-xs font-medium bg-white/60 backdrop-blur-md text-gray-700 rounded-lg hover:bg-white/80 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200/40 shadow-sm"
                        title="撤销 (Ctrl+Z)"
                      >
                        ↩ 撤销
                      </button>
                      <button
                        onClick={handleRedo}
                        disabled={!canRedo}
                        className="px-3 py-1.5 text-xs font-medium bg-white/60 backdrop-blur-md text-gray-700 rounded-lg hover:bg-white/80 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200/40 shadow-sm"
                        title="重做 (Ctrl+Y)"
                      >
                        ↪ 重做
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-1.5 text-sm font-medium bg-gray-100/60 backdrop-blur-md text-gray-700 rounded-lg hover:bg-gray-200/60 transition-all duration-200 border border-gray-200/40 shadow-sm"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editContent.trim()}
                        className="px-4 py-1.5 text-sm font-medium bg-blue-600/80 backdrop-blur-md text-white rounded-lg hover:bg-blue-700/80 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed border border-blue-500/40 shadow-lg shadow-blue-500/20"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {message.editedAt && (
                    <div className={`px-4 pb-1 text-xs ${message.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                      已编辑
                    </div>
                  )}
                  <button
                    onClick={() => handleStartEdit(message)}
                    className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                      message.role === 'user'
                        ? 'hover:bg-blue-500 text-blue-200'
                        : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    title="编辑消息"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-4 rounded-lg shadow-sm bg-white text-gray-900 rounded-tl-none border border-gray-200">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 flex items-end px-6 py-4">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyPress}
            placeholder="输入消息... (Shift+Enter 换行，Enter 发送)"
            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-y-auto"
            rows={textareaHeight}
            style={{ minHeight: '48px', maxHeight: '200px' }}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="ml-4 bg-blue-600 text-white rounded-md py-2 px-6 hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 self-end"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          发送
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
