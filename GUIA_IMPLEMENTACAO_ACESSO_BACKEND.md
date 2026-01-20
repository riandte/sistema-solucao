# Guia de Implementação Backend: Controle de Acesso

Este guia traduz o modelo RBAC para a arquitetura técnica do backend (Next.js API Routes + Services).

## 1. Estrutura de Tipos (`src/lib/types.ts`)

Adicionar as definições de segurança ao arquivo de tipos central.

```typescript
// Roles disponíveis
export type RoleName = 'ADMIN' | 'OPERADOR' | 'USUARIO' | 'SISTEMA';

// Permissões granulares (Mapeadas estaticamente)
export type Permission = 
  | 'PENDENCIA:LER_TODAS'
  | 'PENDENCIA:CRIAR'
  | 'PENDENCIA:EDITAR_STATUS'
  | 'USUARIO:GERENCIAR';

// Extensão da interface de Usuário (vindo do JWT/DB)
export interface UserSession {
  id: string;
  email: string;
  roles: RoleName[];
}
```

## 2. Mapa Estático de Permissões (`src/lib/auth/permissions.ts`)

Centralizar a definição de "Quem pode o quê". Isso evita espalhar lógica de `if (role == 'ADMIN')` pelo código.

```typescript
const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  ADMIN: ['PENDENCIA:LER_TODAS', 'PENDENCIA:CRIAR', 'PENDENCIA:EDITAR_STATUS', 'USUARIO:GERENCIAR'],
  OPERADOR: ['PENDENCIA:LER_TODAS', 'PENDENCIA:CRIAR', 'PENDENCIA:EDITAR_STATUS'],
  USUARIO: ['PENDENCIA:CRIAR'],
  SISTEMA: ['PENDENCIA:LER_TODAS', 'PENDENCIA:CRIAR']
};

export function hasPermission(userRoles: RoleName[], requiredPermission: Permission): boolean {
  // Une todas as permissões dos roles do usuário
  const userPermissions = new Set(
    userRoles.flatMap(role => ROLE_PERMISSIONS[role] || [])
  );
  return userPermissions.has(requiredPermission);
}
```

## 3. Service Layer (`src/lib/services/pendenciaService.ts`)

A autorização DEVE ocorrer dentro do Service, antes de qualquer regra de negócio.

```typescript
import { hasPermission } from '@/lib/auth/permissions';

export const PendenciaService = {
  async atualizarStatus(id: string, novoStatus: StatusPendencia, usuario: UserSession) {
    // 1. Verificar Permissão Global (RBAC)
    if (!hasPermission(usuario.roles, 'PENDENCIA:EDITAR_STATUS')) {
      throw new ForbiddenError('Usuário sem permissão para alterar status.');
    }

    // 2. Buscar Entidade
    const pendencia = await this.buscarPorId(id);
    if (!pendencia) throw new NotFoundError();

    // 3. Regras de Negócio Específicas (ABAC - Attribute Based)
    // Ex: Usuário comum só cancela se for o dono
    if (novoStatus === 'CANCELADO' && !usuario.roles.includes('ADMIN')) {
      if (pendencia.criadoPor !== usuario.id) {
         throw new ForbiddenError('Apenas o criador pode cancelar esta pendência.');
      }
    }

    // 4. Executar Ação
    // ... logica de update ...
  }
}
```

## 4. API Routes e Middleware

A API Route é responsável apenas por extrair o usuário da sessão e tratar os erros.

```typescript
// src/app/api/pendencias/[id]/route.ts
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req); // Obtém UserSession
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    
    await PendenciaService.atualizarStatus(params.id, body.status, session);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    // ... outros erros
  }
}
```

## 5. Logs de Auditoria

Sempre que uma ação sensível for executada com sucesso no Service:

```typescript
await AuditoriaService.registrar({
  acao: 'PENDENCIA_STATUS_ALTERADO',
  usuarioId: usuario.id,
  alvoId: id,
  detalhes: { de: statusAntigo, para: novoStatus }
});
```
