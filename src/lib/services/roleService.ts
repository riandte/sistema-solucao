import { Role } from '@/lib/types';
import { AuthContext } from '@/lib/auth/authContext';
import { MockRoleStore } from '@/lib/auth/mockRoles';
import { MockUserStore } from '@/lib/auth/mockUsers';
import { ForbiddenError } from '@/lib/auth/permissions';

export const RoleService = {
  async listar(context: AuthContext): Promise<Role[]> {
    if (!context.user.roles.includes('ADMIN')) {
       throw new ForbiddenError('Apenas administradores podem visualizar papéis.');
    }
    
    const roles = await MockRoleStore.getAll();
    const users = await MockUserStore.getAll();

    // Calcula contagem de usuários
    return roles.map(role => ({
      ...role,
      userCount: users.filter(u => u.roles.includes(role.name)).length
    }));
  },

  async criar(role: Role, context: AuthContext): Promise<Role> {
    if (!context.user.roles.includes('ADMIN')) {
       throw new ForbiddenError('Apenas administradores podem criar papéis.');
    }
    
    if (!role.name) throw new Error('Nome do papel é obrigatório.');

    const existing = await MockRoleStore.getByName(role.name);
    if (existing) {
      throw new Error('Papel já existe.');
    }

    const newRole: Role = {
        ...role,
        isSystem: false,
        permissions: role.permissions || []
    };

    return MockRoleStore.save(newRole);
  },

  async atualizar(name: string, dados: Partial<Role>, context: AuthContext): Promise<Role> {
    if (!context.user.roles.includes('ADMIN')) {
       throw new ForbiddenError('Apenas administradores podem gerenciar papéis.');
    }

    const role = await MockRoleStore.getByName(name);
    if (!role) throw new Error('Papel não encontrado.');

    if (role.isSystem) {
       if (dados.name && dados.name !== role.name) {
         throw new Error('Não é possível alterar o nome de papéis do sistema.');
       }
    }
    
    // Se for ADMIN, não pode remover certas permissões críticas?
    // Por enquanto confiamos no bom senso do Admin, mas poderíamos validar aqui.
    
    const updated = { ...role, ...dados };
    return MockRoleStore.save(updated);
  },

  async excluir(name: string, context: AuthContext): Promise<void> {
    if (!context.user.roles.includes('ADMIN')) {
       throw new ForbiddenError('Apenas administradores podem excluir papéis.');
    }

    const role = await MockRoleStore.getByName(name);
    if (!role) throw new Error('Papel não encontrado.');

    if (role.isSystem) {
      throw new Error('Papéis do sistema não podem ser excluídos.');
    }
    
    const users = await MockUserStore.getAll();
    const inUse = users.some(u => u.roles.includes(name));
    
    if (inUse) {
        throw new Error('Este papel está atribuído a um ou mais usuários e não pode ser excluído.');
    }
    
    await MockRoleStore.delete(name);
  }
};
