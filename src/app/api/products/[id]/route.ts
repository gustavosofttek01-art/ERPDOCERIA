import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product-service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await ProductService.getProductById(params.id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Produto não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await ProductService.updateProduct(params.id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (typeof body.active !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Campo "active" deve ser booleano' }, { status: 400 });
    }
    const result = await ProductService.toggleProductStatus(params.id, body.active);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
