import fs from 'fs/promises';
import path from 'path';
import { Role, Permission } from '@/lib/types';

const ROLES_FILE = path.join(process.cwd(), 'data', 'roles.json');

const INITIAL_ROLES: Role[] = [
  {
    name: 'ADMIN',
    description: 'Administrador do Sistema (Acesso Total)',
    isSystem: true,
    permissions: [
      'PENDENCIA:LER_TODAS',
      'PENDENCIA:CRIAR',
      'PENDENCIA:EDITAR',
      'PENDENCIA:MOVER',
      'PENDENCIA:CONCLUIR',
      'PENDENCIA:CANCELAR',
      'PENDENCIA:ATRIBUIR_RESPONSAVEL',
      'USUARIO:GERENCIAR',
      'OS:CRIAR'
    ]
  },
  {
    name: 'OPERADOR',
    description: 'Operador Padrão',
    isSystem: true,
    permissions: [
      'PENDENCIA:LER_TODAS',
      'PENDENCIA:CRIAR',
      'PENDENCIA:EDITAR',
      'PENDENCIA:MOVER',
      'PENDENCIA:CONCLUIR',
      'PENDENCIA:ATRIBUIR_RESPONSAVEL',
      'OS:CRIAR'
    ]
  },
  {
    name: 'USUARIO',
    description: 'Usuário Básico',
    isSystem: true,
    permissions: [
      'PENDENCIA:CRIAR',
      'PENDENCIA:CANCELAR'
    ]
  },
  {
    name: 'SISTEMA',
    description: 'Processos Internos',
    isSystem: true,
    permissions: [
      'PENDENCIA:LER_TODAS',
      'PENDENCIA:CRIAR'
    ]
  }
];

// Cache em memória para acesso síncrono nas verificações de permissão
let rolesCache: Role[] | null = null;

export const MockRoleStore = {
  async getAll(): Promise<Role[]> {
    if (rolesCache) return rolesCache;

    try {
      const data = await fs.readFile(ROLES_FILE, 'utf-8');
      rolesCache = JSON.parse(data);
      return rolesCache!;
    } catch (error) {
      rolesCache = INITIAL_ROLES;
      await this.persist(INITIAL_ROLES);
      return INITIAL_ROLES;
    }
  },

  async getByName(name: string): Promise<Role | null> {
    const roles = await this.getAll();
    return roles.find(r => r.name === name) || null;
  },

  async save(role: Role): Promise<Role> {
    const roles = await this.getAll();
    const index = roles.findIndex(r => r.name === role.name);
    
    if (index >= 0) {
      roles[index] = role;
    } else {
      roles.push(role);
    }
    
    await this.persist(roles);
    return role;
  },

  async delete(name: string): Promise<void> {
    const roles = await this.getAll();
    const filtered = roles.filter(r => r.name !== name);
    await this.persist(filtered);
  },

  async persist(roles: Role[]): Promise<void> {
    rolesCache = roles;
    // Garante que o diretório data existe
    const dir = path.dirname(ROLES_FILE);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(ROLES_FILE, JSON.stringify(roles, null, 2), 'utf-8');
  }
};
