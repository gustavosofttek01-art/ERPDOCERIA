import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product-service';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  sku: z.string().min(2, 'SKU é obrigatório'),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  unit: z.enum(['un', 'kg', 'g', 'cento', 'fatia', 'caixa']).default('un'),
  salePrice: z.number().positive('Preço de venda deve ser maior que zero'),
  costPrice: z.number().nonnegative('Preço de custo não pode ser negativo'),
  minStock: z.number().nonnegative().default(5),
  initialStock: z.number().nonnegative().default(0),
  allowNegativeStock: z.boolean().default(false),
  isProduced: z.boolean().default(true),
  shelfLifeDays: z.number().int().positive().default(5),
  imageUrl: z.string().optional(),
  channelPrices: z.record(z.number()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const products = await ProductService.getProducts({ search, categoryId, activeOnly });
    return NextResponse.json({ success: true, count: products.length, data: products });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createProductSchema.parse(body);
    const product = await ProductService.createProduct(validated);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', issues: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
