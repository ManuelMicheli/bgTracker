import { NextRequest, NextResponse } from 'next/server';
import { webhookCallback } from 'grammy';
import { getBot } from '@/bot';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const bot = getBot();
    const handleUpdate = webhookCallback(bot, 'std/http');
    return await handleUpdate(request);
  } catch (error) {
    logger.error('Telegram webhook error', { error: String(error) });
    return NextResponse.json({ ok: true });
  }
}
