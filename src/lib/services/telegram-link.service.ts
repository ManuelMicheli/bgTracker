import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { addMinutes } from 'date-fns';

const CODE_EXPIRY_MINUTES = 10;
const CODE_LENGTH = 6;

/**
 * Generate a unique verification code for Telegram linking
 */
export async function generateVerificationCode(telegramId: string, telegramUsername?: string): Promise<string> {
  // Generate a random 6-digit code
  const code = randomBytes(3).readUIntBE(0, 3).toString().padStart(CODE_LENGTH, '0').slice(0, CODE_LENGTH);
  
  const expiresAt = addMinutes(new Date(), CODE_EXPIRY_MINUTES);

  // Invalidate any existing pending codes for this telegram user
  await prisma.telegramUserLink.updateMany({
    where: { 
      telegramId,
      status: 'pending'
    },
    data: { status: 'expired' }
  });

  // Create new verification code
  await prisma.telegramUserLink.create({
    data: {
      code,
      telegramId,
      telegramUsername: telegramUsername || null,
      status: 'pending',
      expiresAt,
    },
  });

  return code;
}

/**
 * Verify a code and link Telegram to user account
 */
export async function verifyCode(code: string, userId: string): Promise<{ success: boolean; message: string }> {
  const linkRecord = await prisma.telegramUserLink.findUnique({
    where: { code },
  });

  if (!linkRecord) {
    return { success: false, message: 'Codice non valido' };
  }

  if (linkRecord.status !== 'pending') {
    return { success: false, message: 'Codice già utilizzato o scaduto' };
  }

  if (new Date() > linkRecord.expiresAt) {
    await prisma.telegramUserLink.update({
      where: { id: linkRecord.id },
      data: { status: 'expired' },
    });
    return { success: false, message: 'Codice scaduto' };
  }

  // Check if this telegram account is already linked to another user
  const existingLink = await prisma.user.findFirst({
    where: { 
      telegramId: linkRecord.telegramId,
      NOT: { id: userId }
    },
  });

  if (existingLink) {
    return { success: false, message: 'Questo account Telegram è già collegato a un altro utente' };
  }

  // Update the link record
  await prisma.telegramUserLink.update({
    where: { id: linkRecord.id },
    data: {
      userId,
      status: 'verified',
      verifiedAt: new Date(),
    },
  });

  // Update user with telegram info
  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramId: linkRecord.telegramId,
    },
  });

  return { success: true, message: 'Account Telegram collegato con successo!' };
}

/**
 * Get pending code for a telegram user
 */
export async function getPendingCode(telegramId: string): Promise<string | null> {
  const link = await prisma.telegramUserLink.findFirst({
    where: {
      telegramId,
      status: 'pending',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  return link?.code || null;
}

/**
 * Unlink Telegram from user account
 */
export async function unlinkTelegram(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { telegramId: null },
  });

  // Also mark any verified links as expired
  await prisma.telegramUserLink.updateMany({
    where: { 
      userId,
      status: 'verified'
    },
    data: { status: 'expired' }
  });
}

/**
 * Get user's linked Telegram info
 */
export async function getTelegramLinkInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramId: true },
  });

  if (!user?.telegramId) {
    return null;
  }

  const link = await prisma.telegramUserLink.findFirst({
    where: {
      telegramId: user.telegramId,
      status: 'verified',
    },
    orderBy: { verifiedAt: 'desc' },
  });

  return {
    telegramId: user.telegramId,
    telegramUsername: link?.telegramUsername,
    linkedAt: link?.verifiedAt,
  };
}
