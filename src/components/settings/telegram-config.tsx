'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TelegramConfigProps {
  isConfigured: boolean;
  botUsername: string | null;
  webhookUrl: string | null;
}

export function TelegramConfig({ isConfigured, botUsername, webhookUrl }: TelegramConfigProps) {
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  async function handleSetWebhook() {
    const url = prompt('Inserisci l\'URL pubblico del webhook (es. https://tuodominio.com/api/telegram):');
    if (!url) return;

    setSettingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await fetch(`/api/telegram/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) {
        setWebhookResult('Webhook impostato con successo!');
      } else {
        setWebhookResult(data.error || 'Errore nell\'impostazione del webhook');
      }
    } catch {
      setWebhookResult('Errore di connessione');
    } finally {
      setSettingWebhook(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="font-medium">Telegram Bot</p>
            <p className="text-sm text-muted-foreground">
              {botUsername ? `@${botUsername}` : 'Inserimento spese via chat'}
            </p>
          </div>
        </div>
        <Badge variant={isConfigured ? 'success' : 'danger'}>
          {isConfigured ? 'Connesso' : 'Non configurato'}
        </Badge>
      </div>

      {isConfigured && (
        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Modalità</span>
            <span className="font-medium">
              {webhookUrl ? 'Webhook' : 'Polling'}
            </span>
          </div>
          {webhookUrl && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Webhook URL</span>
              <span className="max-w-[200px] truncate font-mono text-xs">{webhookUrl}</span>
            </div>
          )}
          <div className="text-sm">
            <p className="text-muted-foreground">
              Scrivi al bot in modo naturale per registrare le spese. Esempi:
            </p>
            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
              <li>• &quot;Ho speso 25 euro al supermercato&quot;</li>
              <li>• &quot;Benzina 45&quot;</li>
              <li>• &quot;Stipendio 1800 euro&quot;</li>
            </ul>
          </div>
        </div>
      )}

      {!isConfigured && (
        <div className="rounded-lg bg-warning/10 p-4 text-sm text-warning">
          Imposta la variabile <code className="rounded bg-muted px-1">TELEGRAM_BOT_TOKEN</code> nel
          file <code className="rounded bg-muted px-1">.env</code> per abilitare il bot.
        </div>
      )}

      {isConfigured && (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleSetWebhook} disabled={settingWebhook}>
            {settingWebhook ? 'Impostazione...' : 'Imposta Webhook'}
          </Button>
        </div>
      )}

      {webhookResult && (
        <p className="text-sm text-muted-foreground">{webhookResult}</p>
      )}
    </div>
  );
}
