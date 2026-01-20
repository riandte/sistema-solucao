import { randomUUID } from 'crypto';
import { User, AuthContext } from '@/lib/auth/authContext';
import { MockUserStore } from '@/lib/auth/mockUsers';
import { assertPermission, ForbiddenError } from '@/lib/auth/permissions';
import { DEFAULT_SYSTEM_CONFIG } from '@/lib/config/systemConfig';
import { DEFAULT_USER_PARAMETERS } from '@/lib/config/systemParameters';

export const UserService = {
  async listar(context: AuthContext): Promise<User[]> {
    // Apenas quem pode gerenciar usuários vê a lista completa
    await assertPermission(context, 'USUARIO:GERENCIAR');
    return MockUserStore.getAll();
  },

  async buscarPorId(id: string, context: AuthContext): Promise<User | null> {
    const user = await MockUserStore.getById(id);
    if (!user) return null;

    // Permite ver a si mesmo OU se tiver permissão de gerenciar
    const isSelf = context.user.id === id;
    const canManage = context.user.roles.includes('ADMIN'); // Simplificação ou usar hasPermission

    if (!isSelf && !canManage) {
       throw new ForbiddenError('Acesso negado aos dados deste usuário.');
    }
    
    return user;
  },

  async criar(dados: Pick<User, 'name' | 'email' | 'password' | 'roles'>, context: AuthContext): Promise<User> {
    await assertPermission(context, 'USUARIO:GERENCIAR');
    
    // Regra Crítica: Apenas ADMIN pode criar outro ADMIN
    if (dados.roles.includes('ADMIN')) {
        const requestorIsAdmin = context.user.roles.includes('ADMIN');
        if (!requestorIsAdmin) {
             throw new ForbiddenError('Apenas administradores podem criar novos administradores.');
        }
    }

    // Validar email único
    const existing = await MockUserStore.getByEmail(dados.email);
    if (existing) {
        throw new Error('Email já cadastrado.');
    }

    const newUser: User = {
        id: randomUUID(),
        name: dados.name,
        email: dados.email,
        password: dados.password || '123', // Senha padrão se não informada
        roles: dados.roles,
        active: true,
        // Inicializa com padrões
        configuracoes: DEFAULT_SYSTEM_CONFIG, 
        parametros: DEFAULT_USER_PARAMETERS,
        createdAt: new Date().toISOString()
    };
    
    return MockUserStore.save(newUser);
  },

  async atualizar(id: string, dados: Partial<User>, context: AuthContext): Promise<User> {
      const user = await MockUserStore.getById(id);
      if (!user) throw new Error('Usuário não encontrado.');

      const isSelf = context.user.id === id;
      const isAdmin = context.user.roles.includes('ADMIN');

      // Regras de Alteração
      if (!isSelf && !isAdmin) {
          throw new ForbiddenError('Você não tem permissão para alterar este usuário.');
      }

      // Se for o próprio usuário (não admin), só pode alterar parâmetros pessoais
      if (isSelf && !isAdmin) {
          // Bloqueia alteração de campos sensíveis
          if (dados.roles || dados.active !== undefined || dados.configuracoes || dados.email) {
              throw new ForbiddenError('Você não pode alterar suas permissões, status ou configurações globais.');
          }
      }

      // Regra Crítica: Apenas ADMIN promove/rebaixa ADMIN
      if (dados.roles) {
          const targetIsAdmin = user.roles.includes('ADMIN');
          const newRolesIsAdmin = dados.roles.includes('ADMIN');

          // Se está tentando dar Admin ou tirar Admin
          if ((!targetIsAdmin && newRolesIsAdmin) || (targetIsAdmin && !newRolesIsAdmin)) {
              if (!isAdmin) {
                  throw new ForbiddenError('Apenas administradores podem gerenciar o papel de ADMIN.');
              }
          }
      }

      // Regra: Admin desativar o último ADMIN
      if (dados.active === false) {
          const user = await MockUserStore.getById(id);
          if (user?.roles.includes('ADMIN')) {
               const allUsers = await MockUserStore.getAll();
               const activeAdmins = allUsers.filter(u => u.active && u.roles.includes('ADMIN') && u.id !== id);
               if (activeAdmins.length === 0) {
                   throw new Error('Não é possível desativar o último administrador do sistema.');
               }
          }
          // Admin remover a si mesmo (inativar a si mesmo)
          if (context.user.id === id) {
               throw new ForbiddenError('Você não pode desativar sua própria conta.');
          }
      }

      // Regra: Configurações Globais apenas ADMIN
      if (dados.configuracoes && !isAdmin) {
          throw new ForbiddenError('Apenas administradores podem alterar configurações globais.');
      }
      
      const updated = { ...user, ...dados };
      return MockUserStore.save(updated);
  },

  async excluir(id: string, context: AuthContext): Promise<void> {
      await assertPermission(context, 'USUARIO:GERENCIAR');
      
      const user = await MockUserStore.getById(id);
      if (!user) throw new Error('Usuário não encontrado.');
      
      if (context.user.id === id) {
           throw new ForbiddenError('Você não pode excluir sua própria conta.');
      }
      
      if (user.roles.includes('ADMIN')) {
           const allUsers = await MockUserStore.getAll();
           const activeAdmins = allUsers.filter(u => u.active && u.roles.includes('ADMIN') && u.id !== id);
           if (activeAdmins.length === 0) {
               throw new Error('Não é possível excluir o último administrador do sistema.');
           }
      }
      
      await MockUserStore.delete(id);
  }
};
