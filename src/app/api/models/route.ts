import { NextResponse } from 'next/server';
import { SUPPORTED_MODELS } from '@/lib/groq';

export async function GET() {
  return NextResponse.json({
    models: SUPPORTED_MODELS,
    hasApiKey: !!process.env.GROQ_API_KEY,
  });
}
