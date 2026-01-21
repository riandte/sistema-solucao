import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { MockUserStore } from '@/lib/auth/mockUsers';

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Retorna lista simplificada para comboboxes/selects
    // Qualquer usuário autenticado pode ver a lista de usuários para atribuir tarefas
    const users = await MockUserStore.getAll();
    const simpleUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email, // Útil para distinguir homônimos se houver
      roles: u.roles
    }));
    
    return NextResponse.json(simpleUsers);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
