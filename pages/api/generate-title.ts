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

    const recentMessages = messages.slice(-6);
    const recentSummary = recentMessages
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
              content: '你是一个专业的标题生成助手。根据对话内容生成标题。要求：1. 标题长度严格控制在10-20个汉字之间 2. 准确反映对话的核心主题和最新内容 3. 当对话涉及多个主题时，选择最重要或最新的主题 4. 使用自然、通顺的中文 5. 不要使用引号、冒号或其他特殊符号 6. 只返回标题本身文字，不要有其他解释 7. 标题应该简洁但有描述性'
            },
            {
              role: 'user',
              content: `请为以下对话生成一个标题（10-20字）：\n\n${recentSummary}`
            }
          ],
          temperature: 0.5,
          max_tokens: 30,
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
