import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/userService';
import { AuthContext } from '@/lib/auth/authContext';
import { MockFuncionarioStore } from '@/lib/org/funcionarios';
import { randomUUID } from 'crypto';

async function getContext(req: NextRequest): Promise<AuthContext> {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    if (!token) throw new Error('Não autenticado');
    try {
        const payload = JSON.parse(Buffer.from(token.value.split('.')[1], 'base64').toString());
        return { user: { id: payload.userId, name: payload.name, email: payload.email, roles: payload.roles } };
    } catch (e) { throw new Error('Token inválido'); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const context = await getContext(req);
    const data = await req.json();
    const user = await UserService.atualizar(id, data, context);
    
    // Update/Create Funcionario if cargo/setor provided
    if (data.cargoId && data.setorId) {
        const func = await MockFuncionarioStore.getByUserId(id);
        if (func) {
            func.cargoId = data.cargoId;
            func.setorId = data.setorId;
            func.nome = user.name; // Keep name synced
            func.emailCorporativo = user.email; // Keep email synced
            await MockFuncionarioStore.save(func);
        } else {
             await MockFuncionarioStore.save({
                id: randomUUID(),
                nome: user.name,
                emailCorporativo: user.email,
                cargoId: data.cargoId,
                setorId: data.setorId,
                usuarioId: user.id,
                ativo: true,
                createdAt: new Date().toISOString()
            });
        }
    }

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

// DELETE não estava no UserService, mas precisamos para o Admin
// Vou adicionar exclusão lógica (active: false) ou implementar delete no UserService
// O prompt diz "Admin desativar o último ADMIN" -> implies deactivate vs delete.
// "Admin remover a si mesmo" -> remove implies delete?
// Vou usar inativação via PUT active: false para "remover" visualmente ou implementar DELETE real.
// O prompt pede "Cadastro / Edição ... Status (ativo/inativo)".
// Vou suportar DELETE apenas se implementarmos no Service.
// Por enquanto, vou responder 405 Method Not Allowed ou implementar DELETE como inativação?
// Melhor não confundir. DELETE deve deletar. Se não tem delete no service, não exponho.
// Mas o prompt diz "Admin remover a si mesmo".
// Vou assumir que remover = inativar ou deletar.
// Vou adicionar `excluir` no `userService` agora.
