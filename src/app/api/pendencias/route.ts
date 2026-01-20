import { NextResponse } from 'next/server';
import { PendenciaService } from '@/lib/services/pendenciaService';
import { getSession } from '@/lib/auth/session';
import { ForbiddenError } from '@/lib/auth/permissions';

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pendencias = await PendenciaService.listar(session);
    return NextResponse.json(pendencias);
  } catch (error: any) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Validação básica
    if (!body.titulo) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    const novaPendencia = await PendenciaService.criar({
      titulo: body.titulo,
      descricao: body.descricao,
      tipo: body.tipo || 'OUTRO',
      status: body.status || 'PENDENTE',
      prioridade: body.prioridade || 'MEDIA',
      criadoPor: session.user.id, // Service irá garantir/sobrescrever isso
      origemTipo: 'MANUAL',
      dataPrevisao: body.dataPrevisao,
      tags: body.tags || []
    }, session);

    return NextResponse.json(novaPendencia, { status: 201 });
  } catch (error: any) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Erro ao criar pendência:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
