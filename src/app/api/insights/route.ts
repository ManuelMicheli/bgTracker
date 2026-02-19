import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/utils';
import * as insightService from '@/lib/services/insight.service';

export async function GET() {
  try {
    const user = await requireApiAuth();

    const insights = await insightService.getInsights(user.id);
    return NextResponse.json({ data: insights });
  } catch (error) {
    return handleApiError(error);
  }
}
