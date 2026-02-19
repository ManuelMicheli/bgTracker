import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import * as userService from '@/lib/services/user.service';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
});

// PUT /api/users/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await requireApiAuth();

    const body = await request.json();
    const { name } = updateProfileSchema.parse(body);

    const updatedUser = await userService.updateUser(user.id, { name });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.issues }, { status: 400 });
    }
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// GET /api/users/profile - Get current user profile
export async function GET() {
  try {
    const user = await requireApiAuth();

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('Error getting profile:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
