import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN non configurato' }, { status: 400 });
    }

    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL non valido' }, { status: 400 });
    }

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      },
    );

    const result = await telegramRes.json();

    if (!result.ok) {
      logger.error('Telegram setWebhook failed', { result });
      return NextResponse.json({ error: result.description || 'Errore Telegram' }, { status: 400 });
    }

    logger.info('Telegram webhook set', { url });
    return NextResponse.json({ data: { ok: true, url } });
  } catch (error) {
    logger.error('Telegram webhook setup error', { error: String(error) });
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ data: { configured: false } });
    }

    const [infoRes, webhookRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${token}/getMe`),
      fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`),
    ]);

    const info = await infoRes.json();
    const webhook = await webhookRes.json();

    return NextResponse.json({
      data: {
        configured: info.ok,
        username: info.ok ? info.result.username : null,
        webhookUrl: webhook.ok && webhook.result.url ? webhook.result.url : null,
      },
    });
  } catch {
    return NextResponse.json({ data: { configured: false } });
  }
}
