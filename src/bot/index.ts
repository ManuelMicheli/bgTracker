import { Bot, InlineKeyboard } from 'grammy';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { parseMessage } from './parser';
import * as transactionService from '@/lib/services/transaction.service';
import * as categoryService from '@/lib/services/category.service';

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

  // Callback: confirm suggested category (save immediately)
  bot.callbackQuery(/^save:(.+):(.+):(.+)$/, async (ctx) => {
    try {
      const [, amountStr, categoryId, type] = ctx.match;
      const amount = parseFloat(amountStr);

      const originalText = ctx.callbackQuery.message?.text ?? '';
      const descMatch = originalText.match(/📝 (.+)\n/);
      const description = descMatch?.[1] ?? 'Transazione';

      const transaction = await transactionService.createTransaction({
        amount,
        description,
        type: type as 'expense' | 'income',
        source: 'telegram',
        categoryId,
      });

      const sign = type === 'income' ? '+' : '-';
      await ctx.editMessageText(
        `✅ Salvato!\n\n` +
          `${transaction.category.icon} ${sign}${formatCurrency(amount)} ${description}`,
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

      // If we have a suggested category, offer quick confirm
      const suggestedCat = parsed.suggestedCategory
        ? categories.find((c) => c.name === parsed.suggestedCategory)
        : null;

      const keyboard = new InlineKeyboard();

      if (suggestedCat) {
        // First row: confirm suggested category (big green button feel)
        keyboard
          .text(
            `✅ ${suggestedCat.icon} ${suggestedCat.name}`,
            `save:${parsed.amount}:${suggestedCat.id}:${parsed.type}`,
          )
          .text('📂 Altra', `other:${parsed.amount}:${parsed.type}`);
      } else {
        // No suggestion: show all categories
        categories.forEach((cat, i) => {
          keyboard.text(
            `${cat.icon} ${cat.name}`,
            `save:${parsed.amount}:${cat.id}:${parsed.type}`,
          );
          if ((i + 1) % 3 === 0) keyboard.row();
        });
      }

      const suggestionHint = suggestedCat
        ? `\n💡 Ho capito: *${suggestedCat.name}*. Giusto?`
        : '\n\nScegli la categoria:';

      await ctx.reply(
        `${sign}${formatCurrency(parsed.amount)}\n📝 ${parsed.description}${suggestionHint}`,
        { reply_markup: keyboard, parse_mode: 'Markdown' },
      );
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
