import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model } = req.body;
    const API_KEY = process.env.NEXT_PUBLIC_AI_BUILDER_TOKEN;

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Proxying request to AI Builders API');
    console.log('Model:', model || 'grok-4-fast');
    console.log('Number of messages:', messages?.length || 0);

    // 过滤掉空消息
    const filteredMessages = messages.filter(msg => 
      msg && typeof msg.content === 'string' && msg.content.trim() !== ''
    );

    console.log('Filtered messages:', filteredMessages);
    console.log('Number of filtered messages:', filteredMessages.length);

    const response = await fetch('https://space.ai-builders.com/backend/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: model || 'grok-4-fast',
        messages: filteredMessages,
        temperature: 0.7,
      }),
    });

    console.log('AI Builders API response status:', response.status);

    const data = await response.json();
    
    if (!response.ok) {
      console.error('AI Builders API error:', data);
      return res.status(response.status).json(data);
    }

    console.log('AI Builders API response received successfully');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in API proxy:', error);
    return res.status(500).json({ error: 'Failed to connect to AI service' });
  }
}
