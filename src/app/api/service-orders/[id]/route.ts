import { NextResponse } from 'next/server';
import { ServiceOrderService } from '@/backend/services/serviceOrderService';
import { PendenciaService } from '@/backend/services/pendenciaService';
import { getSession } from '@/backend/auth/session';
import { ForbiddenError } from '@/backend/auth/permissions';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const order = await ServiceOrderService.getById(id, session);
    
    if (!order) {
      return NextResponse.json({ error: 'Ordem de Serviço não encontrada' }, { status: 404 });
    }

    // Fetch linked pendencies
    const pendencies = await PendenciaService.listar(session, { origemId: id });

    return NextResponse.json({ ...order, pendencies });
  } catch (error: any) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Erro ao buscar OS:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
