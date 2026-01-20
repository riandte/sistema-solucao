import { Permission } from '@/lib/types';
import { AuthContext } from '@/lib/auth/authContext';
import { MockRoleStore } from '@/lib/auth/mockRoles';

export class ForbiddenError extends Error {
  constructor(message: string = 'Acesso negado') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export async function hasPermission(context: AuthContext, requiredPermission: Permission): Promise<boolean> {
  if (!context || !context.user || !context.user.roles) return false;
  
  const roles = await MockRoleStore.getAll();
  const roleMap = new Map(roles.map(r => [r.name, r.permissions]));
  
  const userPermissions = new Set(
    context.user.roles.flatMap(roleName => roleMap.get(roleName) || [])
  );
  
  return userPermissions.has(requiredPermission);
}

export async function assertPermission(context: AuthContext, requiredPermission: Permission): Promise<void> {
  if (!(await hasPermission(context, requiredPermission))) {
    throw new ForbiddenError(`Usuário não possui permissão: ${requiredPermission}`);
  }
}
