import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { messages, model, temperature, maxTokens, systemPrompt } = await req.json();

    // Check for API key from server environment variables or client header override
    const apiKey =
      process.env.GROQ_API_KEY ||
      process.env.NEXT_PUBLIC_GROQ_API_KEY ||
      req.headers.get('x-groq-api-key');

    if (!apiKey || !apiKey.trim()) {
      // Fallback notice when Groq API key is missing
      return NextResponse.json({
        role: 'assistant',
        content: `⚠️ **Groq API Key Not Found**\n\nTo start chatting with Groq AI, please provide your API Key:\n\n### Option 1: Quick Fix (Works Instantly in Browser)\nClick the **⚙️ Settings** icon in the bottom-left sidebar and paste your key starting with \`gsk_...\` under **Groq API Key**.\n\n### Option 2: Permanent Fix on Vercel\n1. Open your **Vercel Dashboard** -> Project Settings -> **Environment Variables**.\n2. Add Key: \`GROQ_API_KEY\`\n3. Value: Your key from [console.groq.com/keys](https://console.groq.com/keys)\n4. **IMPORTANT:** Go to Vercel **Deployments** tab -> click **\`...\`** -> **Redeploy** (Environment variables take effect after redeploying!).`,
        isFallbackNotice: true,
      });
    }

    const formattedMessages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }
    formattedMessages.push(...messages);

    const startTime = Date.now();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: formattedMessages,
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 4096,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText || 'Groq API request failed';
      return NextResponse.json(
        { error: `Groq API Error (${response.status}): ${errorMessage}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const endTime = Date.now();
    const latencyMs = endTime - startTime;

    const assistantContent = data.choices?.[0]?.message?.content || 'No response received from Groq.';
    const usage = data.usage || {};
    const totalTokens = usage.total_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const tokensPerSecond = completionTokens > 0 ? Math.round((completionTokens / (latencyMs / 1000))) : 0;

    return NextResponse.json({
      role: 'assistant',
      content: assistantContent,
      model: data.model || model,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: totalTokens,
        latencyMs: latencyMs,
        tokensPerSecond: tokensPerSecond,
      },
    });

  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error('API Chat Route Error:', errorDetails);
    return NextResponse.json(
      { error: errorDetails || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
