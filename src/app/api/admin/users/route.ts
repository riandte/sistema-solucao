import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/userService';
import { AuthContext } from '@/lib/auth/authContext';
import { MockFuncionarioStore } from '@/lib/org/funcionarios';
import { randomUUID } from 'crypto';

// Helper simples para obter contexto (MOCK)
// Em produção, isso viria do JWT/Session middleware
async function getContext(req: NextRequest): Promise<AuthContext> {
    // Para simplificar o mock, vamos assumir que o middleware já validou
    // e injetou o user no header ou similar.
    // MAS como estamos no Next.js App Router e o middleware não injeta diretamente no req objects de forma tipada fácil,
    // vamos RE-VALIDAR o token ou pegar do header simulado.
    
    // Na fase anterior, implementamos login que retorna token.
    // Aqui vamos pegar o header 'x-user-data' que o middleware poderia ter colocado,
    // ou decodificar o token novamente.
    
    // Para este MVP/Mock, vamos confiar que quem chama a API é o Admin logado no frontend
    // que manda o cookie. O `userService` vai validar permissões.
    // Precisamos reconstruir o contexto do cookie.
    
    // WORKAROUND: Ler cookie 'auth_token' (simulado)
    // Como não temos validação JWT real aqui neste snippet, 
    // vamos assumir que a chamada interna é segura ou usar um mock context se for server action.
    
    // Melhor: Vamos ler o cookie usando `cookies()` do next/headers
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    if (!token) {
        throw new Error('Não autenticado');
    }

    // Decodifica JWT (Mock simples: base64 do payload se não tiver assinatura real, ou usar jose)
    // Assumindo que o token é JWT válido gerado na rota login.
    // Vamos usar uma função helper se existisse.
    
    // SIMPLIFICAÇÃO: O token contem { id, name, email, roles ... }
    // Vamos decodificar o payload (parte do meio)
    try {
        const payload = JSON.parse(Buffer.from(token.value.split('.')[1], 'base64').toString());
        return {
            user: {
                id: payload.userId,
                name: payload.name, // Pode não ter name no payload original, verificar login route
                email: payload.email, // Pode não ter
                roles: payload.roles
            }
        };
    } catch (e) {
        throw new Error('Token inválido');
    }
}

export async function GET(req: NextRequest) {
  try {
    const context = await getContext(req);
    const users = await UserService.listar(context);
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getContext(req);
    const data = await req.json();
    const user = await UserService.criar(data, context);
    
    // Auto-create Funcionario if cargo/setor provided
    if (data.cargoId && data.setorId) {
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

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
