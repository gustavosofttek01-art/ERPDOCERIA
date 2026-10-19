import { NextResponse } from 'next/server';
import { RecipeService } from '@/lib/services/recipe-service';

export async function GET() {
  try {
    const recipes = await RecipeService.getRecipes();
    return NextResponse.json({ success: true, count: recipes.length, data: recipes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
