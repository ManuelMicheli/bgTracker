import { Header } from '@/components/layout/header';
import { Card, CardTitle } from '@/components/ui/card';
import { CategoryList } from '@/components/settings/category-list';
import { AddCategoryForm } from '@/components/settings/add-category-form';
import { TelegramConfig } from '@/components/settings/telegram-config';
import { ResetData } from '@/components/settings/reset-data';
import * as categoryService from '@/lib/services/category.service';

export const dynamic = 'force-dynamic';

async function getTelegramInfo() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return { configured: false, username: null, webhookUrl: null };

    const [infoRes, webhookRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${token}/getMe`),
      fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`),
    ]);

    const info = await infoRes.json();
    const webhook = await webhookRes.json();

    return {
      configured: info.ok,
      username: info.ok ? info.result.username : null,
      webhookUrl: webhook.ok && webhook.result.url ? webhook.result.url : null,
    };
  } catch {
    return { configured: false, username: null, webhookUrl: null };
  }
}

export default async function SettingsPage() {
  const [categories, telegramInfo] = await Promise.all([
    categoryService.getAllCategories(),
    getTelegramInfo(),
  ]);

  return (
    <>
      <Header title="Impostazioni" />
      <div className="space-y-6 p-6">
        {/* Telegram */}
        <Card>
          <CardTitle>Telegram Bot</CardTitle>
          <div className="mt-4">
            <TelegramConfig
              isConfigured={telegramInfo.configured}
              botUsername={telegramInfo.username}
              webhookUrl={telegramInfo.webhookUrl}
            />
          </div>
        </Card>

        {/* Categorie */}
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Categorie</CardTitle>
          </div>
          <div className="mt-4 space-y-4">
            <CategoryList categories={categories as Parameters<typeof CategoryList>[0]['categories']} />
            <AddCategoryForm />
          </div>
        </Card>
        {/* Dati */}
        <Card>
          <CardTitle>Dati</CardTitle>
          <div className="mt-4">
            <ResetData />
          </div>
        </Card>
      </div>
    </>
  );
}
