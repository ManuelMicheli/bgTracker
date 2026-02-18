import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/utils';
import { createCategorySchema } from '@/lib/validators/category';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createCategorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        icon: validated.icon ?? '📦',
        color: validated.color ?? '#6b7280',
        type: validated.type ?? 'expense',
      },
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
