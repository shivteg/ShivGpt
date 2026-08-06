import { NextRequest, NextResponse } from 'next/server';
import { checkUserRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const emailParam = url.searchParams.get('email');
  const userEmail = (
    req.headers.get('x-user-email') ||
    emailParam ||
    'anonymous@shivgpt.com'
  ).trim();

  const status = checkUserRateLimit(userEmail);

  return NextResponse.json({
    email: userEmail,
    ...status,
    targetUrl: 'https://shiv-gpt-two.vercel.app',
  });
}
