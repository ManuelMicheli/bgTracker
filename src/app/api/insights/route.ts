import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/utils';
import * as insightService from '@/lib/services/insight.service';

export async function GET() {
  try {
    const user = await requireApiAuth();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const insights = await insightService.getInsights(user.id);
    return NextResponse.json({ data: insights });
  } catch (error) {
    return handleApiError(error);
  }
}
