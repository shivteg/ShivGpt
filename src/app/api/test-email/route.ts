import { NextRequest, NextResponse } from 'next/server';
import { triggerTestEmailFlow } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email') || 'testuser@domain.com';
  const type = (url.searchParams.get('type') || 'both') as 'exceeded' | 'reset' | 'both';

  try {
    const result = await triggerTestEmailFlow(email, type);
    return NextResponse.json({
      success: true,
      email,
      type,
      result,
      messagesSent: {
        exceededWarning: result.exceededSent ? '⚠️ Rate limit exceeded! You must try again after 1 hour.' : 'Not sent',
        resetComplete: result.resetSent ? '🚀 Finally wait is over now use SAI link- shiv-gpt-two.vercel.app' : 'Not sent',
      },
    });
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: errorDetails || 'Failed to dispatch test emails' },
      { status: 500 }
    );
  }
}
