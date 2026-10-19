import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/services/financial-service';
import { z } from 'zod';

const createTransactionSchema = z.object({
  type: z.enum(['receita', 'despesa']),
  category: z.string().min(2, 'Categoria é obrigatória'),
  description: z.string().min(3, 'Descrição é obrigatória'),
  grossAmount: z.number().positive('Valor deve ser positivo'),
  feeAmount: z.number().nonnegative().default(0),
  paymentMethod: z.string().default('pix'),
  dueDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const summary = await FinancialService.getSummary();
    const transactions = await FinancialService.getTransactions(50);
    return NextResponse.json({
      success: true,
      data: {
        summary,
        transactions,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createTransactionSchema.parse(body);
    const transaction = await FinancialService.createTransaction(validated);
    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', issues: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
