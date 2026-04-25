import React, { useState, useRef, useEffect } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    const updatedSession = {
      ...session,
      messages: [...session.messages, userMessage],
    };

    onUpdateSession(updatedSession);
    setInputValue('');
    setIsLoading(true);

    // 重置文本框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      setTextareaHeight(3);
    }

    // 异步生成智能标题（不阻塞消息发送）
    if (session.title === '新会话') {
      generateSmartTitle(updatedSession.messages).then(smartTitle => {
        if (smartTitle && smartTitle !== '新会话') {
          const titledSession = { ...updatedSession, title: smartTitle };
          onUpdateSession(titledSession);
        }
      }).catch(error => {
        console.error('Failed to generate smart title:', error);
      });
    }

    try {
      const aiResponse = await chatWithAI(updatedSession.messages, selectedModel);
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: aiResponse,
        role: 'assistant',
        createdAt: new Date().toISOString(),
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
      };

      onUpdateSession(finalSession);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: '抱歉，无法连接到AI服务，请稍后重试。',
        role: 'assistant',
        createdAt: new Date().toISOString(),
      };

      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
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
    setEditContent(message.content);
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
    setEditingMessageId(null);
    setEditContent('');
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-medium text-gray-900">欢迎使用 ChatGPT Clone</h2>
          <p className="mt-2 text-gray-500">请创建或选择一个会话开始聊天</p>
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
                <div className="p-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={Math.max(3, Math.ceil(editContent.length / 40))}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-3 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim()}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap p-4">{message.content}</p>
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
