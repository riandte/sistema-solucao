import { NextRequest, NextResponse } from 'next/server';
import { MockFuncionarioStore } from '@/lib/org/funcionarios';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function getContext() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    let user = { id: 'anon', name: 'Anon', email: '', roles: [] as string[] };
    if (token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY || 'default-secret-key-change-me-in-prod');
            const { payload } = await jwtVerify(token, secret);
            user = { 
                id: (payload.sub as string) || (payload.id as string) || 'anon',
                name: (payload.name as string) || '',
                email: (payload.email as string) || '',
                roles: (payload.roles as string[]) || []
            };
        } catch {}
    }
    return { user };
}

export async function GET() {
    const context = await getContext();
    if (!context.user.roles.includes('ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const data = await MockFuncionarioStore.getAll();
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const context = await getContext();
    if (!context.user.roles.includes('ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    try {
        const body = await req.json();
        
        // Validate if user already has an employee record
        if (body.usuarioId) {
            const existing = await MockFuncionarioStore.getByUserId(body.usuarioId);
            if (existing) {
                return NextResponse.json({ error: 'Este usuário já possui um funcionário vinculado.' }, { status: 400 });
            }
        }

        const newItem = await MockFuncionarioStore.save({
            ...body,
            id: body.id || `func-${Date.now()}`,
            createdAt: new Date().toISOString(),
            ativo: body.ativo ?? true
        });
        return NextResponse.json(newItem);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
