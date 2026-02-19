import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils';
import { updateCategorySchema } from '@/lib/validators/category';
import * as categoryService from '@/lib/services/category.service';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateCategorySchema.parse(body);
    const category = await categoryService.updateCategory(id, validated);
    return NextResponse.json({ data: category });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const count = await categoryService.getCategoryTransactionCount(id);
    if (count > 0) {
      return NextResponse.json(
        { error: `Impossibile eliminare: ${count} transazioni usano questa categoria` },
        { status: 400 },
      );
    }

    await categoryService.deleteCategory(id);
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
