import { Message } from './types';

const API_BASE_URL = 'https://space.ai-builders.com/backend';
const API_KEY = process.env.AI_BUILDER_TOKEN || process.env.NEXT_PUBLIC_AI_BUILDER_TOKEN || '';

// 测试API连接的辅助函数
export const testApiConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing API connection...');
    console.log('API Key configured:', !!API_KEY);
    console.log('API Key length:', API_KEY.length);
    console.log('API URL:', `${API_BASE_URL}/v1/models`);

    const response = await fetch(`${API_BASE_URL}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    console.log('Connection test response status:', response.status);
    console.log('Connection test response status text:', response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('Available models:', data);
      return true;
    } else {
      console.error('Connection test failed:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Connection test error:', error);
    return false;
  }
};

export const chatWithAI = async (
  messages: Message[],
  model: string = 'grok-4-fast'
): Promise<string> => {
  try {
    console.log('Starting chatWithAI function...');
    console.log('Using API proxy route: /api/chat');
    console.log('Model:', model);
    console.log('Messages:', messages);

    const filteredMessages = messages.filter(msg => 
      msg && typeof msg.content === 'string' && msg.content.trim() !== ''
    );

    console.log('Filtered messages:', filteredMessages);
    console.log('Number of filtered messages:', filteredMessages.length);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'grok-4-fast',
        messages: filteredMessages,
      }),
    });

    console.log('API proxy response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API proxy error:', errorData);
      const errorMessage = errorData.detail || errorData.error?.message || errorData.error || 'Unknown error';
      throw new Error(`API error: ${response.statusText} - ${errorMessage}`);
    }

    const data = await response.json();
    console.log('API proxy response data:', data);
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling AI API:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error('Failed to connect to AI service. Please check your network connection and try again.');
  }
};

export const getAvailableModels = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models;
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
};

export const generateSmartTitle = async (messages: Message[]): Promise<string> => {
  console.log('[TitleGen] Starting title generation for', messages.length, 'messages');
  if (messages.length === 0) return '新会话';

  const userMessages = messages.filter(msg => msg.role === 'user');
  console.log('[TitleGen] User messages count:', userMessages.length);
  if (userMessages.length === 0) return '新会话';

  try {
    console.log('[TitleGen] Calling /api/generate-title...');
    const response = await fetch('/api/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    console.log('[TitleGen] API response status:', response.status);

    if (!response.ok) {
      console.error('Title generation failed, falling back to simple method');
      return generateSimpleTitle(messages);
    }

    const data = await response.json();
    console.log('[TitleGen] API response data:', data);
    
    const aiTitle = data.title?.trim() || '';
    console.log('[TitleGen] AI title:', aiTitle);

    if (aiTitle && aiTitle !== '新会话') {
      const cleanedTitle = aiTitle.replace(/^["'「『【《""]/g, '').replace(/["'」』】》""]$/g, '').trim();
      console.log('[TitleGen] Cleaned title:', cleanedTitle);
      if (cleanedTitle.length >= 2) return cleanedTitle;
    }

    console.log('[TitleGen] Falling back to simple title generation');
    return generateSimpleTitle(messages);
  } catch (error) {
    console.error('[TitleGen] Error generating smart title:', error);
    return generateSimpleTitle(messages);
  }
};

const extractKeywords = (content: string): string[] => {
  const stopwords = new Set([
    '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
    '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
    '自己', '这', '那', '什么', '这个', '那个', '怎么', '为什么', '啊', '呢', '吧',
    '吗', '哦', '嗯', '对', '能', '还', '但', '而', '与', '及', '或', '如', '如果',
    '请', '帮', '可以', '让', '给', '想', '做', '工作', '进行', '时候', '可能', '应该'
  ]);

  const words = content.split(/[\s，。！？、；：,.!?;:()（）{}""''""''\n\r]+/);
  const keywords: string[] = [];

  for (const word of words) {
    const trimmed = word.trim();
    if (trimmed.length >= 2 && !stopwords.has(trimmed) && !keywords.includes(trimmed)) {
      keywords.push(trimmed);
      if (keywords.length >= 5) break;
    }
  }

  return keywords;
};

const generateSimpleTitle = (messages: Message[]): string => {
  const userMessages = messages.filter(msg => msg.role === 'user');
  if (userMessages.length === 0) return '新会话';

  const allUserContent = userMessages.map(msg => msg.content.trim()).join(' ');
  const keywords = extractKeywords(allUserContent);

  if (keywords.length > 0) {
    let title = keywords.slice(0, 4).join(' ');
    if (title.length > 20) {
      title = title.substring(0, 18) + '...';
    }
    if (title.length >= 2) return title;
  }

  const lastUserMessage = userMessages[userMessages.length - 1].content.trim();
  if (lastUserMessage.length <= 20) return lastUserMessage;

  return lastUserMessage.substring(0, 18) + '...';
};