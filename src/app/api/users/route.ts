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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { supabaseUid: validated.supabaseUid },
    });

    if (existingUser) {
      return NextResponse.json({ data: existingUser }, { status: 200 });
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
      return NextResponse.json({ error: 'Dati non validi', details: error.issues }, { status: 400 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
