import { NextRequest, NextResponse } from 'next/server';
import { RecipeService } from '@/lib/services/recipe-service';
import { z } from 'zod';

const produceSchema = z.object({
  batchCount: z.number().positive('Informe o número de lotes a produzir').default(1),
  producedQuantity: z.number().positive().optional(),
  lossQuantity: z.number().nonnegative().default(0),
  lossReason: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validated = produceSchema.parse(body);

    const result = await RecipeService.produceRecipe({
      recipeId: params.id,
      batchCount: validated.batchCount,
      producedQuantity: validated.producedQuantity,
      lossQuantity: validated.lossQuantity,
      lossReason: validated.lossReason,
      notes: validated.notes,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', issues: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
