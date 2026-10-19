import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/order-service';
import { z } from 'zod';

const createOrderSchema = z.object({
  channelId: z.string().min(1, 'Canal é obrigatório'),
  externalId: z.string().optional(),
  orderNumber: z.string().optional(),
  customerName: z.string().min(2, 'Nome do cliente é obrigatório'),
  customerPhone: z.string().optional(),
  deliveryType: z.enum(['retirada', 'delivery', 'balcao']).default('balcao'),
  deliveryAddress: z.any().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Produto é obrigatório'),
      quantity: z.number().positive('Quantidade deve ser positiva'),
      unitPrice: z.number().positive().optional(),
      notes: z.string().optional(),
    })
  ).min(1, 'Adicione pelo menos um item ao pedido'),
  deliveryFee: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  paymentMethod: z.enum(['pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'marketplace', 'faturado']).default('dinheiro'),
  paymentStatus: z.enum(['pendente', 'aprovado', 'estornado', 'falhou']).default('pendente'),
  preparationTimeMinutes: z.number().int().positive().default(25),
  idempotencyKey: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const search = searchParams.get('search') || undefined;
    const delayedOnly = searchParams.get('delayedOnly') === 'true';

    const orders = await OrderService.getOrders({ channelId, status, search, delayedOnly });
    return NextResponse.json({ success: true, count: orders.length, data: orders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createOrderSchema.parse(body);
    const order = await OrderService.createOrder(validated);
    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', issues: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
