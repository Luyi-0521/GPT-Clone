import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    const API_KEY = process.env.AI_BUILDER_TOKEN || process.env.NEXT_PUBLIC_AI_BUILDER_TOKEN;

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    const conversationSummary = messages
      .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const response = await fetch(
      'https://space.ai-builders.com/backend/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-4-fast',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的标题生成助手。根据用户和AI的对话内容，生成一个简洁、准确、能反映对话主题的中文标题。要求：1. 标题长度在5-15个字之间 2. 准确概括对话的核心主题 3. 使用自然、通顺的语言 4. 不要使用引号或特殊符号 5. 只返回标题，不要其他解释'
            },
            {
              role: 'user',
              content: `请为以下对话生成一个合适的标题：\n\n${conversationSummary}`
            }
          ],
          temperature: 0.7,
          max_tokens: 50,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Title generation API error:', errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    const title = data.choices[0].message.content.trim();

    return res.status(200).json({ title });
  } catch (error) {
    console.error('Error in title generation:', error);
    return res.status(500).json({ error: 'Failed to generate title' });
  }
}
