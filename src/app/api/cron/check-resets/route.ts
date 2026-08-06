import { NextRequest, NextResponse } from 'next/server';
import { processPendingResetEmails } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { processedCount } = await processPendingResetEmails();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processedCount,
      message: `Processed ${processedCount} pending 1-hour rate limit reset emails.`,
    });
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: errorDetails || 'Error executing cron reset email check' },
      { status: 500 }
    );
  }
}
