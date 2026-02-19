import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/utils';
import * as insightService from '@/lib/services/insight.service';

export async function GET() {
  try {
    const user = await requireAuth();
    const insights = await insightService.getInsights(user.id);
    return NextResponse.json({ data: insights });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    return handleApiError(error);
  }
}
