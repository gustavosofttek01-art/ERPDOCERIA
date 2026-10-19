import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/order-service';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['recebido', 'confirmado', 'em_preparo', 'pronto', 'enviado', 'concluido', 'cancelado']),
  reason: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validated = updateStatusSchema.parse(body);

    const updated = await OrderService.updateStatus(
      params.id,
      validated.status,
      validated.reason
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', issues: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
