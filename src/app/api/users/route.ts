import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createUserSchema = z.object({
  supabaseUid: z.string(),
  email: z.string().email(),
  name: z.string().default('Utente'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createUserSchema.parse(body);

    // Check if user already exists by supabaseUid
    const existingUserByUid = await prisma.user.findUnique({
      where: { supabaseUid: validated.supabaseUid },
    });

    if (existingUserByUid) {
      return NextResponse.json({ data: existingUserByUid }, { status: 200 });
    }

    // Check if email is already used by another user
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Questa email è già registrata' },
        { status: 409 }
      );
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        supabaseUid: validated.supabaseUid,
        email: validated.email,
        name: validated.name,
      },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return NextResponse.json(
        { error: 'Dati non validi', details: issues },
        { status: 400 }
      );
    }

    // Prisma errors
    if (error instanceof Error && 'code' in error) {
      const prismaError = error as { code: string; message: string };
      
      // Unique constraint violation
      if (prismaError.code === 'P2002') {
        const field = prismaError.message.includes('email') ? 'email' : 'identificativo';
        return NextResponse.json(
          { error: `Questo ${field} è già in uso` },
          { status: 409 }
        );
      }

      // Foreign key constraint
      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          { error: 'Riferimento non valido' },
          { status: 400 }
        );
      }

      // Record not found
      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          { error: 'Record non trovato' },
          { status: 404 }
        );
      }
    }

    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Errore interno del server', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
