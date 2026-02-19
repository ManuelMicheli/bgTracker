import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import * as telegramLinkService from '@/lib/services/telegram-link.service';
import { z } from 'zod';

const verifyCodeSchema = z.object({
  code: z.string().length(6),
});

// POST /api/telegram-link - Verify code and link Telegram
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiAuth();

    const body = await request.json();
    const { code } = verifyCodeSchema.parse(body);

    const result = await telegramLinkService.verifyCode(code, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Codice non valido', details: error.issues }, { status: 400 });
    }
    console.error('Error verifying code:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// GET /api/telegram-link - Get current Telegram link status
export async function GET() {
  try {
    const user = await requireApiAuth();

    const linkInfo = await telegramLinkService.getTelegramLinkInfo(user.id);

    return NextResponse.json({ data: linkInfo });
  } catch (error) {
    console.error('Error getting link info:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// DELETE /api/telegram-link - Unlink Telegram
export async function DELETE() {
  try {
    const user = await requireApiAuth();

    await telegramLinkService.unlinkTelegram(user.id);

    return NextResponse.json({ message: 'Account Telegram scollegato con successo' });
  } catch (error) {
    console.error('Error unlinking telegram:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
