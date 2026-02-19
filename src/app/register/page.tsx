'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ApiError {
  error: string;
  details?: string;
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const supabase = createClient();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'L\'email è obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Inserisci un\'email valida';
    }

    if (!password) {
      newErrors.password = 'La password è obbligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'La password deve essere di almeno 6 caratteri';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Le password non coincidono';
    }

    if (!name.trim()) {
      newErrors.name = 'Il nome è obbligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || 'Utente',
          },
        },
      });

      if (authError) {
        // Specific Supabase auth errors
        let errorMessage = authError.message;
        
        if (authError.message.includes('already registered')) {
          errorMessage = 'Questa email è già registrata. Prova ad accedere.';
        } else if (authError.message.includes('valid email')) {
          errorMessage = 'Inserisci un\'email valida.';
        } else if (authError.message.includes('password')) {
          errorMessage = 'La password non soddisfa i requisiti di sicurezza.';
        } else if (authError.message.includes('rate limit') || authError.message.includes('Email rate limit')) {
          errorMessage = 'Troppi tentativi di registrazione. Riprova tra un\'ora o contattaci se il problema persiste.';
        } else if (authError.message.includes('For security purposes')) {
          errorMessage = 'Troppi tentativi. Attendi qualche minuto prima di riprovare.';
        }
        
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error('Errore durante la creazione dell\'account: nessun utente creato');
        setLoading(false);
        return;
      }

      // Step 2: Create user record in our database
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supabaseUid: authData.user.id,
            email,
            name: name || 'Utente',
          }),
        });

        if (!response.ok) {
          const errorData: ApiError = await response.json().catch(() => ({ error: 'Errore sconosciuto' }));
          
          let errorMessage = errorData.error;
          
          // Handle specific HTTP errors
          if (response.status === 409) {
            errorMessage = 'Questa email è già associata a un account esistente.';
          } else if (response.status === 400) {
            errorMessage = `Dati non validi: ${errorData.details || errorData.error}`;
          } else if (response.status === 500) {
            errorMessage = 'Errore del server durante la creazione del profilo.';
            console.error('Server error:', errorData);
          }
          
          toast.error(errorMessage);
          
          // Rollback: try to delete the Supabase user since DB creation failed
          await supabase.auth.signOut();
          
          setLoading(false);
          return;
        }
      } catch (fetchError) {
        toast.error('Errore di connessione durante la creazione del profilo. Riprova.');
        console.error('Fetch error:', fetchError);
        
        // Rollback
        await supabase.auth.signOut();
        
        setLoading(false);
        return;
      }

      toast.success('Registrazione completata! Controlla la tua email per confermare l\'account.');
      router.push('/login');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto';
      toast.error(`Errore durante la registrazione: ${errorMsg}`);
      console.error('Registration error:', error);
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
          <CardTitle className="text-2xl">Crea Account</CardTitle>
          <CardDescription>Inizia a gestire le tue finanze con BgTracking</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome *
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Mario Rossi"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={hasFieldError('name') ? 'border-red-500' : ''}
              />
              {hasFieldError('name') && (
                <p className="text-xs text-red-500">{getFieldError('name')}</p>
              )}
            </div>
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
              <p className="text-xs text-muted-foreground">
                Minimo 6 caratteri
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Conferma Password *
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                className={hasFieldError('confirmPassword') ? 'border-red-500' : ''}
              />
              {hasFieldError('confirmPassword') && (
                <p className="text-xs text-red-500">{getFieldError('confirmPassword')}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Hai già un account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Accedi
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
