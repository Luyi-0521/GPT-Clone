import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[TitleAPI] Request received');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    console.log('[TitleAPI] Messages count:', messages?.length);
    
    const API_KEY = process.env.AI_BUILDER_TOKEN || process.env.NEXT_PUBLIC_AI_BUILDER_TOKEN;
    console.log('[TitleAPI] API Key configured:', !!API_KEY);

    if (!API_KEY) {
      console.error('[TitleAPI] API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    if (!messages || messages.length === 0) {
      console.error('[TitleAPI] No messages provided');
      return res.status(400).json({ error: 'No messages provided' });
    }

    const recentMessages = messages.slice(-6);
    const recentSummary = recentMessages
      .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
      .join('\n');

    console.log('[TitleAPI] Calling AI Builders API...');
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

    console.log('[TitleAPI] AI API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[TitleAPI] AI API error:', errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    console.log('[TitleAPI] AI response data:', JSON.stringify(data).substring(0, 200));
    
    const title = data.choices[0].message.content.trim();
    console.log('[TitleAPI] Generated title:', title);

    return res.status(200).json({ title });
  } catch (error) {
    console.error('[TitleAPI] Error in title generation:', error);
    return res.status(500).json({ error: 'Failed to generate title' });
  }
}
