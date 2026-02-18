import { clsx, type ClassValue } from 'clsx';
import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { logger } from './logger';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, locale = 'it-IT', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function handleApiError(error: unknown): NextResponse {
  logger.error('API Error', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: {
          message: 'Errore di validazione',
          code: 'VALIDATION_ERROR',
          details: z.prettifyError(error),
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.message.includes('Unique constraint')) {
    return NextResponse.json(
      { error: { message: 'Elemento già esistente', code: 'DUPLICATE' } },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { error: { message: 'Errore interno del server', code: 'INTERNAL_ERROR' } },
    { status: 500 },
  );
}
