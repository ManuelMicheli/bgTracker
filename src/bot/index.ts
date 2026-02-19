import { Bot, InlineKeyboard } from 'grammy';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { parseMessage, suggestCategory } from './parser';
import { extractTransactionsFromPhoto } from './vision';
import { extractTransactionsFromFile, SUPPORTED_EXTENSIONS } from './file-parser';
import * as transactionService from '@/lib/services/transaction.service';
import * as categoryService from '@/lib/services/category.service';

// Store batch IDs in memory (Telegram callback data has 64 byte limit)
const batchStore = new Map<string, string[]>();
let batchCounter = 0;

function createBot(token: string) {
  const bot = new Bot(token);

  // /start
  bot.command('start', async (ctx) => {
    await ctx.reply(
      '👋 Ciao! Sono il tuo assistente per le finanze.\n\n' +
        'Scrivimi come parleresti a un amico:\n\n' +
        '💸 *Spese:*\n' +
        '• "Ho speso 25 euro per la pizza"\n' +
        '• "Pagato 85 di spesa al Lidl"\n' +
        '• "Netflix 12.99"\n' +
        '• "Benzina 45 euro"\n\n' +
        '💰 *Entrate:*\n' +
        '• "Mi sono arrivati 1800 di stipendio"\n' +
        '• "Ricevuto bonifico 500 euro"\n\n' +
        '📊 *Comandi:*\n' +
        '/saldo - Riepilogo mese\n' +
        '/ultimi - Ultime transazioni\n' +
        '/categorie - Lista categorie\n' +
        '/annulla - Elimina ultima',
      { parse_mode: 'Markdown' },
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      '📝 *Scrivimi in modo naturale!*\n\n' +
        'Capisco frasi come:\n' +
        '• "Ho speso 25 euro per la pizza con amici"\n' +
        '• "Pagato bolletta luce 62 euro"\n' +
        '• "Caffè 1.50"\n' +
        '• "Mi è arrivato lo stipendio 1800"\n\n' +
        'Capisco la categoria automaticamente, e se sbaglio puoi correggerla con un tap.\n\n' +
        '📊 *Comandi:*\n' +
        '/saldo - Riepilogo mensile\n' +
        '/ultimi - Ultime transazioni\n' +
        '/categorie - Lista categorie\n' +
        '/annulla - Elimina ultima transazione',
      { parse_mode: 'Markdown' },
    );
  });

  // /saldo
  bot.command('saldo', async (ctx) => {
    try {
      const stats = await transactionService.getMonthlyStats();
      const { currentMonth, previousMonth } = stats;

      const diff = currentMonth.expenses - previousMonth.expenses;
      const diffSign = diff > 0 ? '📈 +' : '📉 ';
      const diffText =
        previousMonth.expenses > 0
          ? `\n${diffSign}${formatCurrency(Math.abs(diff))} vs mese scorso`
          : '';

      await ctx.reply(
        `💰 *Riepilogo ${new Date().toLocaleString('it-IT', { month: 'long', year: 'numeric' })}*\n\n` +
          `Entrate: ${formatCurrency(currentMonth.income)}\n` +
          `Uscite: ${formatCurrency(currentMonth.expenses)}\n` +
          `Bilancio: ${formatCurrency(currentMonth.balance)}` +
          diffText,
        { parse_mode: 'Markdown' },
      );
    } catch (error) {
      logger.error('Bot /saldo error', { error: String(error) });
      await ctx.reply('❌ Errore nel recupero del saldo.');
    }
  });

  // /ultimi
  bot.command('ultimi', async (ctx) => {
    try {
      const transactions = await transactionService.getRecentTransactions(5);

      if (transactions.length === 0) {
        await ctx.reply('📭 Nessuna transazione registrata.');
        return;
      }

      const lines = transactions.map((t) => {
        const sign = t.type === 'income' ? '+' : '-';
        const date = new Date(t.date).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
        });
        return `${t.category.icon} ${date} ${sign}${formatCurrency(t.amount)} ${t.description}`;
      });

      await ctx.reply(`📋 *Ultime transazioni:*\n\n${lines.join('\n')}`, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Bot /ultimi error', { error: String(error) });
      await ctx.reply('❌ Errore nel recupero delle transazioni.');
    }
  });

  // /categorie
  bot.command('categorie', async (ctx) => {
    try {
      const categories = await categoryService.getAllCategories();
      const lines = categories.map((c) => `${c.icon} ${c.name} (${c.type})`);
      await ctx.reply(`📂 *Categorie:*\n\n${lines.join('\n')}`, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Bot /categorie error', { error: String(error) });
      await ctx.reply('❌ Errore nel recupero delle categorie.');
    }
  });

  // /annulla
  bot.command('annulla', async (ctx) => {
    try {
      const recent = await transactionService.getRecentTransactions(1);
      if (recent.length === 0) {
        await ctx.reply('📭 Nessuna transazione da annullare.');
        return;
      }

      const last = recent[0];
      const sign = last.type === 'income' ? '+' : '-';
      const keyboard = new InlineKeyboard()
        .text('✅ Conferma', `delete:${last.id}`)
        .text('❌ No', 'cancel');

      await ctx.reply(
        `🗑️ Elimino l'ultima transazione?\n\n` +
          `${last.category.icon} ${sign}${formatCurrency(last.amount)} ${last.description}`,
        { reply_markup: keyboard },
      );
    } catch (error) {
      logger.error('Bot /annulla error', { error: String(error) });
      await ctx.reply('❌ Errore.');
    }
  });

  // /azzera
  bot.command('azzera', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text('✅ Sì, cancella tutto', 'confirm-reset')
      .text('❌ No', 'cancel');

    await ctx.reply(
      '⚠️ Vuoi davvero eliminare TUTTE le transazioni? Questa azione è irreversibile.',
      { reply_markup: keyboard },
    );
  });

  // Callback: confirm reset
  bot.callbackQuery('confirm-reset', async (ctx) => {
    try {
      const result = await transactionService.deleteAllTransactions();
      await ctx.editMessageText(`🗑️ Fatto. ${result.count} transazioni eliminate.`);
      await ctx.answerCallbackQuery();
    } catch (error) {
      logger.error('Bot reset error', { error: String(error) });
      await ctx.answerCallbackQuery({ text: '❌ Errore' });
    }
  });

  // Callback: delete confirmation
  bot.callbackQuery(/^delete:(.+)$/, async (ctx) => {
    try {
      const id = ctx.match[1];
      await transactionService.deleteTransaction(id);
      await ctx.editMessageText('✅ Transazione eliminata.');
      await ctx.answerCallbackQuery();
    } catch (error) {
      logger.error('Bot delete callback error', { error: String(error) });
      await ctx.answerCallbackQuery({ text: '❌ Errore' });
    }
  });

  // Callback: cancel
  bot.callbackQuery('cancel', async (ctx) => {
    await ctx.editMessageText('🔄 Operazione annullata.');
    await ctx.answerCallbackQuery();
  });

  // Callback: user picks category manually
  bot.callbackQuery(/^save:(.+):(.+):(.+)$/, async (ctx) => {
    try {
      const [, amountStr, categoryId, type] = ctx.match;
      const amount = parseFloat(amountStr);

      // Get category name to use as description
      const category = await categoryService.getCategoryById(categoryId);
      const description = category?.name ?? 'Transazione';

      const transaction = await transactionService.createTransaction({
        amount,
        description,
        type: type as 'expense' | 'income',
        source: 'telegram',
        categoryId,
      });

      const sign = type === 'income' ? '+' : '-';
      await ctx.editMessageText(
        `✅ ${transaction.category.icon} ${sign}${formatCurrency(amount)} — ${description}`,
      );
      await ctx.answerCallbackQuery();
    } catch (error) {
      logger.error('Bot save callback error', { error: String(error) });
      await ctx.answerCallbackQuery({ text: '❌ Errore nel salvataggio' });
    }
  });

  // Callback: show all categories (when suggested was wrong)
  bot.callbackQuery(/^other:(.+):(.+)$/, async (ctx) => {
    try {
      const [, amountStr, type] = ctx.match;
      const amount = parseFloat(amountStr);

      const categories =
        type === 'income'
          ? await categoryService.getIncomeCategories()
          : await categoryService.getExpenseCategories();

      const keyboard = new InlineKeyboard();
      categories.forEach((cat, i) => {
        keyboard.text(
          `${cat.icon} ${cat.name}`,
          `save:${amount}:${cat.id}:${type}`,
        );
        if ((i + 1) % 3 === 0) keyboard.row();
      });

      await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
      await ctx.answerCallbackQuery();
    } catch (error) {
      logger.error('Bot other callback error', { error: String(error) });
      await ctx.answerCallbackQuery({ text: '❌ Errore' });
    }
  });

  // Callback: batch delete (annulla tutte le transazioni da foto)
  bot.callbackQuery(/^batch-del:(.+)$/, async (ctx) => {
    try {
      const batchId = ctx.match[1];
      const ids = batchStore.get(batchId);
      if (!ids || ids.length === 0) {
        await ctx.editMessageText('⚠️ Batch non trovato o già eliminato.');
        await ctx.answerCallbackQuery();
        return;
      }
      for (const id of ids) {
        await transactionService.deleteTransaction(id);
      }
      batchStore.delete(batchId);
      await ctx.editMessageText(`🗑️ ${ids.length} transazioni eliminate.`);
      await ctx.answerCallbackQuery();
    } catch (error) {
      logger.error('Bot batch-delete error', { error: String(error) });
      await ctx.answerCallbackQuery({ text: '❌ Errore' });
    }
  });

  // Photo messages: extract transactions via AI vision
  bot.on('message:photo', async (ctx) => {
    if (!process.env.OPENAI_API_KEY) {
      await ctx.reply('❌ OPENAI_API_KEY non configurata. Aggiungi la chiave nel file .env');
      return;
    }

    const processing = await ctx.reply('🔍 Sto analizzando la foto...');

    try {
      // Get highest resolution photo
      const photos = ctx.message.photo;
      const photo = photos[photos.length - 1];
      const file = await ctx.api.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`;

      // Download and convert to base64
      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const base64 = buffer.toString('base64');

      // Extract transactions via OpenAI Vision
      const extracted = await extractTransactionsFromPhoto(base64);

      if (extracted.length === 0) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          processing.message_id,
          '🤔 Non ho trovato transazioni nella foto. Prova con un\'immagine più chiara.',
        );
        return;
      }

      // Get all categories for matching
      const allCategories = await categoryService.getAllCategories();
      const savedIds: string[] = [];
      const lines: string[] = [];

      for (const item of extracted) {
        const categoryName = suggestCategory(item.description, item.type);
        const matchedCat = categoryName
          ? allCategories.find((c) => c.name === categoryName)
          : allCategories.find((c) => c.name === 'Altro');
        const cat = matchedCat ?? allCategories[0];

        const transaction = await transactionService.createTransaction({
          amount: item.amount,
          description: cat.name,
          type: item.type,
          source: 'telegram',
          categoryId: cat.id,
        });

        savedIds.push(transaction.id);
        const sign = item.type === 'income' ? '+' : '-';
        lines.push(`${cat.icon} ${sign}${formatCurrency(item.amount)} — ${cat.name}`);
      }

      const batchId = String(++batchCounter);
      batchStore.set(batchId, savedIds);

      const keyboard = new InlineKeyboard().text(
        '🗑️ Annulla tutto',
        `batch-del:${batchId}`,
      );

      await ctx.api.editMessageText(
        ctx.chat.id,
        processing.message_id,
        `✅ Ho trovato e salvato ${extracted.length} transazioni:\n\n${lines.join('\n')}`,
        { reply_markup: keyboard },
      );
    } catch (error) {
      logger.error('Bot photo handler error', { error: String(error) });
      await ctx.api.editMessageText(
        ctx.chat.id,
        processing.message_id,
        '❌ Errore nell\'analisi della foto. Riprova.',
      );
    }
  });

  // Document messages: extract transactions from CSV, PDF, Excel
  bot.on('message:document', async (ctx) => {
    const doc = ctx.message.document;
    const fileName = doc.file_name ?? 'file';
    const ext = fileName.toLowerCase().split('.').pop() ?? '';

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      await ctx.reply(
        `📄 Formato non supportato. Invia un file:\n• CSV\n• PDF\n• Excel (.xlsx, .xls)`,
      );
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      await ctx.reply('❌ OPENAI_API_KEY non configurata.');
      return;
    }

    const processing = await ctx.reply(`🔍 Sto analizzando il file ${ext.toUpperCase()}...`);

    try {
      const file = await ctx.api.getFile(doc.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`;

      const response = await fetch(fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      const extracted = await extractTransactionsFromFile(buffer, fileName);

      if (extracted.length === 0) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          processing.message_id,
          '🤔 Non ho trovato transazioni nel file. Verifica che contenga dati validi.',
        );
        return;
      }

      const allCategories = await categoryService.getAllCategories();
      const savedIds: string[] = [];
      const lines: string[] = [];

      for (const item of extracted) {
        const categoryName = suggestCategory(item.description, item.type);
        const matchedCat = categoryName
          ? allCategories.find((c) => c.name === categoryName)
          : allCategories.find((c) => c.name === 'Altro');
        const cat = matchedCat ?? allCategories[0];

        const transaction = await transactionService.createTransaction({
          amount: item.amount,
          description: cat.name,
          type: item.type,
          source: 'telegram',
          categoryId: cat.id,
        });

        savedIds.push(transaction.id);
        const sign = item.type === 'income' ? '+' : '-';
        lines.push(`${cat.icon} ${sign}${formatCurrency(item.amount)} — ${cat.name}`);
      }

      const batchId = String(++batchCounter);
      batchStore.set(batchId, savedIds);

      const keyboard = new InlineKeyboard().text(
        '🗑️ Annulla tutto',
        `batch-del:${batchId}`,
      );

      await ctx.api.editMessageText(
        ctx.chat.id,
        processing.message_id,
        `✅ Ho trovato e salvato ${extracted.length} transazioni da ${ext.toUpperCase()}:\n\n${lines.join('\n')}`,
        { reply_markup: keyboard },
      );
    } catch (error) {
      logger.error('Bot document handler error', { error: String(error) });
      await ctx.api.editMessageText(
        ctx.chat.id,
        processing.message_id,
        '❌ Errore nell\'analisi del file. Riprova.',
      );
    }
  });

  // Natural language text messages
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return;

    const parsed = parseMessage(text);

    if (!parsed) {
      await ctx.reply(
        '🤔 Non ho capito. Prova a scrivere qualcosa come:\n\n' +
          '• "Ho speso 25 euro per la pizza"\n' +
          '• "Benzina 45"\n' +
          '• "Stipendio 1800 euro"',
      );
      return;
    }

    try {
      const categories =
        parsed.type === 'income'
          ? await categoryService.getIncomeCategories()
          : await categoryService.getExpenseCategories();

      const sign = parsed.type === 'income' ? '+' : '-';

      const suggestedCat = parsed.suggestedCategory
        ? categories.find((c) => c.name === parsed.suggestedCategory)
        : null;

      if (suggestedCat) {
        // Auto-save: category detected, use category name as description
        const transaction = await transactionService.createTransaction({
          amount: parsed.amount,
          description: suggestedCat.name,
          type: parsed.type,
          source: 'telegram',
          categoryId: suggestedCat.id,
        });

        const undoKeyboard = new InlineKeyboard()
          .text('📂 Cambia', `other:${parsed.amount}:${parsed.type}`)
          .text('🗑️ Annulla', `delete:${transaction.id}`);

        await ctx.reply(
          `✅ ${suggestedCat.icon} ${sign}${formatCurrency(parsed.amount)} — ${suggestedCat.name}`,
          { reply_markup: undoKeyboard },
        );
      } else {
        // No confident match: ask user to pick category
        const keyboard = new InlineKeyboard();
        categories.forEach((cat, i) => {
          keyboard.text(
            `${cat.icon} ${cat.name}`,
            `save:${parsed.amount}:${cat.id}:${parsed.type}`,
          );
          if ((i + 1) % 3 === 0) keyboard.row();
        });

        await ctx.reply(
          `${sign}${formatCurrency(parsed.amount)}\n\nScegli la categoria:`,
          { reply_markup: keyboard },
        );
      }
    } catch (error) {
      logger.error('Bot text handler error', { error: String(error) });
      await ctx.reply('❌ Errore. Riprova.');
    }
  });

  return bot;
}

let botInstance: Bot | null = null;

export function getBot(): Bot {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN non configurato');
  }

  if (!botInstance) {
    botInstance = createBot(token);
  }

  return botInstance;
}

export { createBot };
