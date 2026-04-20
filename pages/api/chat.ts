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
          messages: filteredMessages,
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