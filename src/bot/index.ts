import { Bot, InlineKeyboard } from 'grammy';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import * as transactionService from '@/lib/services/transaction.service';
import * as categoryService from '@/lib/services/category.service';

function createBot(token: string) {
  const bot = new Bot(token);

  // /start
  bot.command('start', async (ctx) => {
    await ctx.reply(
      '👋 Ciao! Sono il tuo assistente per le finanze.\n\n' +
        '📝 *Come inserire una spesa:*\n' +
        'Scrivi semplicemente importo e descrizione:\n' +
        '`25 Pizza con amici`\n' +
        '`85.50 Spesa settimanale`\n\n' +
        '📝 *Come inserire un\'entrata:*\n' +
        '`+ 1800 Stipendio`\n\n' +
        '📊 *Comandi disponibili:*\n' +
        '/saldo - Riepilogo mese corrente\n' +
        '/ultimi - Ultime 5 transazioni\n' +
        '/categorie - Lista categorie\n' +
        '/help - Mostra questo messaggio',
      { parse_mode: 'Markdown' },
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      '📝 *Inserimento rapido:*\n' +
        '`25 Pizza` → Spesa di €25\n' +
        '`+ 1800 Stipendio` → Entrata di €1.800\n\n' +
        '📊 *Comandi:*\n' +
        '/saldo - Riepilogo mensile\n' +
        '/ultimi - Ultime transazioni\n' +
        '/categorie - Lista categorie\n' +
        '/annulla - Annulla ultima transazione',
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
      const diffText = previousMonth.expenses > 0
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

  // /annulla - delete last transaction
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
        .text('❌ Annulla', 'cancel');

      await ctx.reply(
        `🗑️ Vuoi eliminare l'ultima transazione?\n\n` +
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
      await ctx.answerCallbackQuery({ text: '❌ Errore nell\'eliminazione' });
    }
  });

  // Callback: cancel
  bot.callbackQuery('cancel', async (ctx) => {
    await ctx.editMessageText('🔄 Operazione annullata.');
    await ctx.answerCallbackQuery();
  });

  // Callback: category selection for pending transaction
  bot.callbackQuery(/^cat:(.+):(.+):(.+)$/, async (ctx) => {
    try {
      const [, amountStr, categoryId, type] = ctx.match;
      const amount = parseFloat(amountStr);

      // Get description from the original message
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
        `✅ Registrato!\n\n` +
          `${transaction.category.icon} ${sign}${formatCurrency(amount)} ${description}`,
      );
      await ctx.answerCallbackQuery();
    } catch (error) {
      logger.error('Bot category callback error', { error: String(error) });
      await ctx.answerCallbackQuery({ text: '❌ Errore nel salvataggio' });
    }
  });

  // Text messages: quick expense/income entry
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();

    // Skip commands
    if (text.startsWith('/')) return;

    // Parse: "+ 1800 Stipendio" for income, "25 Pizza" for expense
    const incomeMatch = text.match(/^\+\s*(\d+(?:[.,]\d{1,2})?)\s+(.+)$/);
    const expenseMatch = text.match(/^(\d+(?:[.,]\d{1,2})?)\s+(.+)$/);

    const match = incomeMatch ?? expenseMatch;
    if (!match) {
      await ctx.reply(
        '❓ Formato non riconosciuto.\n\nUsa: `25 Pizza` per una spesa o `+ 1800 Stipendio` per un\'entrata.',
        { parse_mode: 'Markdown' },
      );
      return;
    }

    const isIncome = !!incomeMatch;
    const amount = parseFloat(match[1].replace(',', '.'));
    const description = match[2].trim();
    const type = isIncome ? 'income' : 'expense';

    try {
      // Get categories for inline keyboard
      const categories = isIncome
        ? await categoryService.getIncomeCategories()
        : await categoryService.getExpenseCategories();

      const keyboard = new InlineKeyboard();
      categories.forEach((cat, i) => {
        keyboard.text(`${cat.icon} ${cat.name}`, `cat:${amount}:${cat.id}:${type}`);
        if ((i + 1) % 3 === 0) keyboard.row();
      });

      const sign = isIncome ? '+' : '-';
      await ctx.reply(
        `${sign}${formatCurrency(amount)}\n📝 ${description}\n\nScegli la categoria:`,
        { reply_markup: keyboard },
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
