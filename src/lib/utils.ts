import { clsx, type ClassValue } from 'clsx';
import { NextResponse } from 'next/server';
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

  if (error instanceof Error && error.name === 'ZodError') {
    return NextResponse.json(
      { error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 },
  );
}
