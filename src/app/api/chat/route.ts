import { NextRequest, NextResponse } from 'next/server';
import { checkUserRateLimit, consumeUserTokens } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, temperature, maxTokens, systemPrompt, userEmail: bodyEmail } = body;

    // Identify user by email from headers or body
    const userEmail = (
      req.headers.get('x-user-email') ||
      bodyEmail ||
      'anonymous@shivgpt.com'
    ).trim();

    // Enforce 432 tokens / 1 hour rate limit per user
    const limitStatus = checkUserRateLimit(userEmail);

    if (!limitStatus.allowed) {
      return NextResponse.json(
        {
          error: `⚠️ Rate limit exceeded! You have reached your limit of 432 tokens / 1 hour. An email notification has been sent to your registered email (${userEmail}). You must try again after 1 hour. Direct link: shiv-gpt-two.vercel.app`,
          rateLimitExceeded: true,
          usedTokens: limitStatus.usedTokens,
          limit: limitStatus.limit,
          remainingTokens: limitStatus.remainingTokens,
          resetInMinutes: limitStatus.resetInMinutes,
          targetUrl: 'https://shiv-gpt-two.vercel.app',
        },
        { status: 429 }
      );
    }

    // Check for API key from server environment variables or client header override
    const apiKey =
      process.env.GROQ_API_KEY ||
      process.env.NEXT_PUBLIC_GROQ_API_KEY ||
      req.headers.get('x-groq-api-key');

    if (!apiKey || !apiKey.trim()) {
      // Fallback notice when API key is unconfigured
      return NextResponse.json({
        role: 'assistant',
        content: `⚠️ **ShivGpt (SAI) API Key Required**\n\nTo start chatting with SAI (Shiv AI), please enter your API key in **⚙️ Settings** (bottom-left sidebar).`,
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
      const errorMessage = errorData.error?.message || response.statusText || 'SAI API request failed';
      return NextResponse.json(
        { error: `SAI API Error (${response.status}): ${errorMessage}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const endTime = Date.now();
    const latencyMs = endTime - startTime;

    const assistantContent = data.choices?.[0]?.message?.content || 'No response received from SAI (Shiv AI).';
    const usage = data.usage || {};
    const totalTokens = usage.total_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const tokensPerSecond = completionTokens > 0 ? Math.round((completionTokens / (latencyMs / 1000))) : 0;

    const resendApiKeyOverride = req.headers.get('x-resend-api-key') || undefined;

    // Record consumption and trigger email alerts if limit (432 tokens/1 hr) is breached
    const updatedQuota = await consumeUserTokens(userEmail, totalTokens, resendApiKeyOverride);

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
        userQuota: {
          usedInWindow: updatedQuota.usedTokens,
          remaining: updatedQuota.remainingTokens,
          limit: updatedQuota.limit,
          isExceeded: updatedQuota.isExceeded,
        },
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
