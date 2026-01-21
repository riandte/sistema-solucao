import { NextResponse } from 'next/server'
import { PendenciaService } from '@/lib/services/pendenciaService'
import { PrioridadePendencia } from '@/lib/types'
import { AuthContext } from '@/lib/auth/authContext'
import { getSession } from '@/lib/auth/session'
import { ForbiddenError } from '@/lib/auth/permissions'

const store: any[] = []
let nextId = 1

function getSystemSession(req: Request): AuthContext | null {
  const expected = process.env.API_SECRET_KEY;
  // Se não houver chave configurada, não permite acesso de sistema por segurança
  if (!expected) return null; 
  
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  
  if (token === expected) {
      return {
          user: {
              id: 'system-integration',
              name: 'Sistema Integrado',
              email: 'system@locapp.com',
              roles: ['SISTEMA']
          }
      };
  }
  return null;
}

export async function GET(req: Request) {
  let session = await getSession(req);
  if (!session) {
    session = getSystemSession(req);
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(store);
}

export async function POST(req: Request) {
  // 1. Resolve Autenticação (Usuário ou Sistema)
  let session = await getSession(req);
  if (!session) {
    session = getSystemSession(req);
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json()
    
    // NOTE: Proxy logic disabled to support local OS management and custom numbering
    // const base = process.env.LOCAPP_BASE_URL
    // ...

    let id = String(nextId++)
    if (body.Contrato) {
        const contractOrders = store.filter(o => o.Contrato === body.Contrato)
        let maxSeq = 0
        for (const o of contractOrders) {
            const parts = String(o.id).split('-')
            if (parts.length === 2 && parts[0] === String(body.Contrato)) {
                const seq = parseInt(parts[1], 10)
                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
            }
        }
        id = `${body.Contrato}-${maxSeq + 1}`
    }

    const order = { id, ...body, createdAt: new Date().toISOString() }
    store.push(order)

    // -------------------------------------------------------------------------
    // NOVA LÓGICA: Criar Pendência automaticamente vinculada à OS
    // -------------------------------------------------------------------------
    
    // Normalizar prioridade
    let prio: PrioridadePendencia = 'MEDIA'
    if (body.prioridade === 'alta') prio = 'ALTA'
    if (body.prioridade === 'baixa') prio = 'BAIXA'

    // O Service agora valida se o usuário (ou sistema) tem permissão de CRIAR pendência
    await PendenciaService.criar({
        titulo: `OS #${id} - ${body.Nome || 'Cliente'}`,
        descricao: body.Descricao || body.Observacoes || 'Gerado automaticamente via OS',
        tipo: 'OS',
        status: 'PENDENTE',
        prioridade: prio,
        origemId: id,
        origemTipo: 'OS',
        criadoPor: session.user.id,
        dataPrevisao: body.dataPrevista || undefined,
        tags: [body.Nome, body.Contrato ? `Contrato: ${body.Contrato}` : ''].filter(Boolean) as string[]
    }, session)

    return NextResponse.json(order, { status: 201 })
  } catch (err: any) {
    console.error('Erro ao criar OS:', err)
    
    if (err instanceof ForbiddenError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const status = err?.response?.status || 500
    const data = err?.response?.data || { error: 'Erro ao criar OS' }
    return NextResponse.json(data, { status })
  }
}
