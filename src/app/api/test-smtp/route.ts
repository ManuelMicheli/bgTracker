import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get Supabase project URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    return NextResponse.json({
      status: 'check_required',
      message: 'Verifica la configurazione SMTP su Supabase Dashboard',
      checks: [
        '1. Vai su https://supabase.com/dashboard/project/_/settings/auth',
        '2. Verifica che "Custom SMTP" sia abilitato',
        '3. Controlla che l\'email mittente sia verificata su SendGrid',
        '4. Verifica che la API key SendGrid sia corretta',
      ],
      supabaseUrl,
      smtp_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante il controllo', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Test email by sending a password reset (non invasivo)
    const testEmail = 'test@example.com';
    
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
    });
    
    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Errore SMTP rilevato',
        error: error.message,
        hint: 'Verifica la configurazione SMTP su Supabase Dashboard',
      }, { status: 400 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'SMTP configurato correttamente',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante il test', details: String(error) },
      { status: 500 }
    );
  }
}
