import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model } = req.body;
    const API_KEY = process.env.AI_BUILDER_TOKEN || process.env.NEXT_PUBLIC_AI_BUILDER_TOKEN;

    console.log('API Key configured:', !!API_KEY);
    console.log('Using model:', model);

    if (!API_KEY) {
      console.error('API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // 过滤掉空消息
    const filteredMessages = messages.filter(
      (msg: { content: string }) =>
        msg && typeof msg.content === 'string' && msg.content.trim() !== ''
    );

    const currentDate = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const systemMessage = {
      role: 'system',
      content: `你是一个有帮助的AI助手。今天是${currentDate}。请根据当前日期回答用户的问题。`
    };

    const messagesWithSystem = [systemMessage, ...filteredMessages];

    const response = await fetch(
      'https://space.ai-builders.com/backend/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: model || 'grok-4-fast',
          messages: messagesWithSystem,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in API proxy:', error);
    return res.status(500).json({ error: 'Failed to connect to AI service' });
  }
}