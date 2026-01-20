import fs from 'fs/promises';
import path from 'path';
import { User } from '@/lib/auth/authContext';
import { DEFAULT_SYSTEM_CONFIG } from '@/lib/config/systemConfig';
import { DEFAULT_USER_PARAMETERS } from '@/lib/config/systemParameters';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// Usuário Admin padrão obrigatório
const INITIAL_ADMIN: User = {
  id: 'admin-id-123',
  name: 'Admin',
  email: 'admin@solucao.com.br',
  password: '123', // Senha simples para ambiente de dev/mock
  roles: ['ADMIN'],
  active: true,
  configuracoes: DEFAULT_SYSTEM_CONFIG,
  parametros: DEFAULT_USER_PARAMETERS,
  createdAt: new Date().toISOString()
};

// Usuários iniciais para facilitar testes (Operador e Usuário Comum)
const INITIAL_USERS: User[] = [
  INITIAL_ADMIN,
  {
    id: 'op-id-456',
    name: 'Operador',
    email: 'op@solucao.com.br',
    password: '123',
    roles: ['OPERADOR'],
    active: true,
    configuracoes: DEFAULT_SYSTEM_CONFIG,
    parametros: DEFAULT_USER_PARAMETERS,
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-id-789',
    name: 'Usuario',
    email: 'user@solucao.com.br',
    password: '123',
    roles: ['USUARIO'],
    active: true,
    configuracoes: DEFAULT_SYSTEM_CONFIG,
    parametros: DEFAULT_USER_PARAMETERS,
    createdAt: new Date().toISOString()
  }
];

export const MockUserStore = {
  async getAll(): Promise<User[]> {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Se arquivo não existir, inicializa com usuários padrão e salva
      await this.persist(INITIAL_USERS);
      return INITIAL_USERS;
    }
  },

  async getById(id: string): Promise<User | null> {
    const users = await this.getAll();
    return users.find(u => u.id === id) || null;
  },

  async getByEmail(email: string): Promise<User | null> {
    const users = await this.getAll();
    return users.find(u => u.email === email) || null;
  },

  async save(user: User): Promise<User> {
    const users = await this.getAll();
    const index = users.findIndex(u => u.id === user.id);
    
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    
    await this.persist(users);
    return user;
  },

  async persist(users: User[]): Promise<void> {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  },

  async delete(id: string): Promise<void> {
    const users = await this.getAll();
    const filtered = users.filter(u => u.id !== id);
    await this.persist(filtered);
  }
};
