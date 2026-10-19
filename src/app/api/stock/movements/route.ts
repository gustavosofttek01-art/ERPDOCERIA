import { NextRequest, NextResponse } from 'next/server';
import { StockService } from '@/lib/services/stock-service';
import { z } from 'zod';

const moveStockSchema = z.object({
  productId: z.string().optional(),
  ingredientId: z.string().optional(),
  movementType: z.enum(['entrada', 'saida', 'reserva', 'venda', 'perda', 'ajuste', 'devolucao', 'inventario']),
  quantity: z.number().positive('Quantidade deve ser maior que zero'),
  reason: z.string().min(3, 'Informe o motivo da movimentação'),
  referenceId: z.string().optional(),
  allowNegativeOverride: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || 50);
    const movements = await StockService.getMovements(limit);
    return NextResponse.json({ success: true, count: movements.length, data: movements });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = moveStockSchema.parse(body);

    const result = await StockService.moveStock({
      productId: validated.productId,
      ingredientId: validated.ingredientId,
      movementType: validated.movementType,
      quantity: validated.quantity,
      reason: validated.reason,
      referenceId: validated.referenceId,
      allowNegativeOverride: validated.allowNegativeOverride,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', issues: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
