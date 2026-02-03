import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  const { text, stats } = await request.json();

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  if (text.length > 10000) {
    return NextResponse.json({ error: 'Text too long' }, { status: 400 });
  }

  const apiKey = process.env.PAYPERQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.ppq.ai',
    });

    const statsInfo = stats
      ? `【統計】${stats.totalChars}文字 / 平均${stats.avgCPM}CPM / ${Math.floor(stats.totalTime / 60)}分${stats.totalTime % 60}秒 / 復帰${stats.fadeRecoveries}回 / ${stats.endReason === 'fadeDeath' ? 'フェードアウト終了' : '手動終了'}\n`
      : '';

    const prompt = `${statsInfo}---
${text}
---

JSON形式で回答:
{
  "summary": ["本人目線の事実要約を2-3個"],
  "emotions": ["感情キーワードを2-3個"],
  "feedback": "1-3文。具体的な行動提案より気づきを優先。本人の言葉を拾い、まだ言語化されていない気持ちや視点を一つ添える。自然なら最後に軽い問いかけを一つ。問いが浮かばなければ温かい一言で締める。短い文章には短く返す。"
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content:
            'ジャーナリングの振り返りAI。書き手の言語化を助け、本人がまだ気づいていない視点を添える。文体のトーンに合わせて返す。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from API');
    }

    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch {
    // Note: エラー詳細はログしない（ユーザーコンテンツ漏洩防止）
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
