import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils';
import * as insightService from '@/lib/services/insight.service';

export async function GET() {
  try {
    const insights = await insightService.getInsights();
    return NextResponse.json({ data: insights });
  } catch (error) {
    return handleApiError(error);
  }
}
