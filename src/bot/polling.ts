/**
 * Script per avviare il bot Telegram in modalità polling.
 * Utile per lo sviluppo locale senza webhook.
 *
 * Uso: npx tsx src/bot/polling.ts
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { createBot } from './index';

// Setup prisma globally for the bot process
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
(globalThis as unknown as { prisma: PrismaClient }).prisma = prisma;

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN non configurato nel file .env');
  process.exit(1);
}

const bot = createBot(token);

console.log('🤖 Bot Telegram avviato in modalità polling...');
console.log('📝 Scrivi un messaggio al bot per testarlo.');
console.log('🛑 Premi Ctrl+C per fermare.\n');

bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Bot @${botInfo.username} connesso!`);
  },
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
