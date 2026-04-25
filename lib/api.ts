import { Message } from './types';

// 使用正确的AI Builders API基础URL
const API_BASE_URL = 'https://space.ai-builders.com/backend';
const API_KEY = process.env.NEXT_PUBLIC_AI_BUILDER_TOKEN || '';

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
  if (messages.length === 0) return '新会话';

  const userMessages = messages.filter(msg => msg.role === 'user');
  if (userMessages.length === 0) return '新会话';

  try {
    const response = await fetch('/api/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      console.error('Title generation failed, falling back to simple method');
      return generateSimpleTitle(messages);
    }

    const data = await response.json();
    return data.title || generateSimpleTitle(messages);
  } catch (error) {
    console.error('Error generating smart title:', error);
    return generateSimpleTitle(messages);
  }
};

const generateSimpleTitle = (messages: Message[]): string => {
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (!firstUserMessage) return '新会话';

  const content = firstUserMessage.content.trim();

  if (content.length <= 20) return content;

  return content.substring(0, 20) + '...';
};