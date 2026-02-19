'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Link2, Unlink, MessageCircle } from 'lucide-react';

interface TelegramConfigProps {
  isConfigured: boolean;
  botUsername: string | null;
  webhookUrl: string | null;
}

interface TelegramLinkInfo {
  telegramId: string;
  telegramUsername: string | null;
  linkedAt: string;
}

export function TelegramConfig({ isConfigured, botUsername, webhookUrl }: TelegramConfigProps) {
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [linkInfo, setLinkInfo] = useState<TelegramLinkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Load link status on mount
  useEffect(() => {
    loadLinkStatus();
  }, []);

  async function loadLinkStatus() {
    try {
      const res = await fetch('/api/telegram-link');
      if (res.ok) {
        const { data } = await res.json();
        setLinkInfo(data);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }

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

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.error('Inserisci un codice di 6 cifre');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/telegram-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setVerificationCode('');
        loadLinkStatus();
      } else {
        toast.error(data.error || 'Errore nella verifica');
      }
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleUnlink() {
    if (!confirm('Sei sicuro di voler scollegare il tuo account Telegram?')) {
      return;
    }

    setIsUnlinking(true);
    try {
      const res = await fetch('/api/telegram-link', {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Account Telegram scollegato');
        setLinkInfo(null);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Errore nello scollegamento');
      }
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setIsUnlinking(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Bot Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-medium">Telegram Bot</p>
              <p className="text-sm text-muted-foreground">
                {botUsername ? `@${botUsername}` : 'Inserimento spese via chat'}
              </p>
            </div>
          </div>
          <Badge variant={isConfigured ? 'success' : 'warning'}>
            {isConfigured ? 'Connesso' : 'Non configurato'}
          </Badge>
        </div>

        {isConfigured && botUsername && (
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
          >
            <span className="text-2xl">💬</span>
            <div className="flex-1">
              <p className="text-sm font-medium">Apri il Bot su Telegram</p>
              <p className="text-xs text-muted-foreground">t.me/{botUsername}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        )}

        {isConfigured && (
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Modalità</span>
              <span className="font-medium">
                {webhookUrl ? 'Webhook' : 'Polling'}
              </span>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">
                Scrivi al bot in modo naturale per registrare le spese:
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
          <div className="rounded-lg bg-amber-500/10 p-4 text-sm text-amber-600">
            Imposta la variabile <code className="rounded bg-muted px-1">TELEGRAM_BOT_TOKEN</code> nel
            file <code className="rounded bg-muted px-1">.env</code> per abilitare il bot.
          </div>
        )}

        {isConfigured && (
          <Button variant="secondary" size="sm" onClick={handleSetWebhook} disabled={settingWebhook}>
            {settingWebhook ? 'Impostazione...' : 'Imposta Webhook'}
          </Button>
        )}

        {webhookResult && (
          <p className="text-sm text-muted-foreground">{webhookResult}</p>
        )}
      </div>

      {/* Account Linking */}
      {isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Collega Account
            </CardTitle>
            <CardDescription>
              Collega il tuo account Telegram per sincronizzare le transazioni con il tuo profilo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : linkInfo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-600">Account collegato</p>
                    <p className="text-sm text-muted-foreground">
                      {linkInfo.telegramUsername 
                        ? `@${linkInfo.telegramUsername}` 
                        : `ID: ${linkInfo.telegramId}`}
                    </p>
                    {linkInfo.linkedAt && (
                      <p className="text-xs text-muted-foreground">
                        Collegato il {new Date(linkInfo.linkedAt).toLocaleDateString('it-IT')}
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={handleUnlink}
                  disabled={isUnlinking}
                >
                  {isUnlinking ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="mr-2 h-4 w-4" />
                  )}
                  Scollega Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-500/10 p-4">
                  <p className="text-sm text-blue-600">
                    <strong>Come collegare:</strong>
                  </p>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                    <li>Apri il bot su Telegram</li>
                    <li>Invia il comando <code>/collega</code></li>
                    <li>Inserisci il codice di 6 cifre qui sotto</li>
                  </ol>
                </div>
                <form onSubmit={handleVerifyCode} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Codice a 6 cifre"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="max-w-[150px] text-center font-mono text-lg tracking-widest"
                  />
                  <Button type="submit" disabled={isVerifying || verificationCode.length !== 6}>
                    {isVerifying ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="mr-2 h-4 w-4" />
                    )}
                    Collega
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
