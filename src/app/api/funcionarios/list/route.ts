import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { MockFuncionarioStore } from '@/lib/org/funcionarios';
import { MockCargoStore } from '@/lib/org/cargos';

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [funcionarios, cargos] = await Promise.all([
      MockFuncionarioStore.getAll(),
      MockCargoStore.getAll()
    ]);

    const activeFuncionarios = funcionarios.filter(f => f.ativo);

    const simpleList = activeFuncionarios.map(f => {
      const cargo = cargos.find(c => c.id === f.cargoId);
      return {
        id: f.id,
        nome: f.nome,
        usuarioId: f.usuarioId,
        setorId: f.setorId,
        cargoNome: cargo?.nome || 'Sem Cargo'
      };
    });
    
    return NextResponse.json(simpleList);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
