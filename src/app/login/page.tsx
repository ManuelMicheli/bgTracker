'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth_callback_failed') {
      toast.error('Errore di autenticazione. Riprova.');
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'L\'email è obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Inserisci un\'email valida';
    }

    if (!password) {
      newErrors.password = 'La password è obbligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = error.message;
        
        // Translate and improve common Supabase error messages
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o password non corretti. Verifica le tue credenziali.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email non confermata. Controlla la tua casella di posta.';
        } else if (error.message.includes('too many requests')) {
          errorMessage = 'Troppi tentativi. Riprova tra qualche minuto.';
        } else if (error.message.includes('user not found')) {
          errorMessage = 'Nessun account trovato con questa email.';
        }
        
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      if (!data.user) {
        toast.error('Errore durante l\'accesso: nessun utente trovato');
        setLoading(false);
        return;
      }

      toast.success('Login effettuato con successo!');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto';
      toast.error(`Errore durante il login: ${errorMsg}`);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: string) => errors[field];
  const hasFieldError = (field: string) => !!errors[field];

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Benvenuto</CardTitle>
          <CardDescription>Accedi al tuo account BgTracking</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                className={hasFieldError('email') ? 'border-red-500' : ''}
              />
              {hasFieldError('email') && (
                <p className="text-xs text-red-500">{getFieldError('email')}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password *
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                className={hasFieldError('password') ? 'border-red-500' : ''}
              />
              {hasFieldError('password') && (
                <p className="text-xs text-red-500">{getFieldError('password')}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
