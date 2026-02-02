import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  const { text } = await request.json();

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

    const prompt = `以下のユーザーの文章を読み、内容に最も関連性が高い観点を2〜3個だけ選んで分析してください。

候補観点：
1. 感情の推移や強さ
2. 思考パターン・信念・認知のクセ
3. トリガーと結果のつながり
4. 価値観や動機づけ
5. 取った対処法と効果
6. 気づきや学びの芽
7. 次の一歩や実験アイデア

---
${text}
---

以下のJSON形式で回答してください:
{
  "summary": ["書いた内容のポイント1", "ポイント2", "ポイント3"],
  "emotions": ["感情キーワード1", "感情キーワード2", "感情キーワード3"],
  "feedback": "フィードバック（60-100語、3-4文程度。共感的な一文で感情をなぞり、選んだ観点から具体的な洞察を1-2個示し、自律性を尊重した未来志向の問いや提案で締める。汎用フレーズを避け、文章内の事実や表現に触れる）"
}

summaryは本人目線で事実を整理した箇条書きにしてください。例: 「仕事のストレスについて考えた」「上司との関係に触れた」「週末の予定を立てた」`;

    const response = await client.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content:
            'あなたはジャーナリングコーチAIです。ユーザーの内省をサポートし、内容に基づいた具体的で建設的なフィードバックを提供します。決めつけず選択肢を示し、汎用フレーズやテンプレ褒め言葉を避けてください。',
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
