import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils';
import { createCategorySchema } from '@/lib/validators/category';
import * as categoryService from '@/lib/services/category.service';

export async function GET() {
  try {
    const categories = await categoryService.getAllCategories();
    return NextResponse.json({ data: categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createCategorySchema.parse(body);
    const category = await categoryService.createCategory(validated);

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
