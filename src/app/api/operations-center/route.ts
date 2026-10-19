import { NextResponse } from 'next/server';
import { OperationsService } from '@/lib/services/operations-service';

export async function GET() {
  try {
    const data = await OperationsService.getOperationsCenter();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error in /api/operations-center:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao carregar Central de Operações' },
      { status: 500 }
    );
  }
}
