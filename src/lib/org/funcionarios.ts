import fs from 'fs/promises';
import path from 'path';
import { Funcionario } from '@/lib/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'funcionarios.json');

// IDs from users.json (mock)
// Admin: admin-id-123
// Operador: op-id-456
// Usuario: user-id-789
// Rian: 3a5dbc1d-5027-4842-bc5f-3722e729630d
// Sannderson: d1cacaea-badf-4eda-8474-062caa953c43

const INITIAL_EMPLOYEES: Funcionario[] = [
  {
    id: 'func-admin',
    nome: 'Admin System',
    emailCorporativo: 'admin@solucao.com.br',
    setorId: 'setor-ti',
    cargoId: 'cargo-gerente-ti',
    usuarioId: 'admin-id-123',
    ativo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'func-rian',
    nome: 'Rian Duarte',
    emailCorporativo: 'ti@solucaoloc.com.br',
    setorId: 'setor-ti',
    cargoId: 'cargo-gerente-ti',
    usuarioId: '3a5dbc1d-5027-4842-bc5f-3722e729630d',
    ativo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'func-wellinton',
    nome: 'Wellinton Sales',
    emailCorporativo: 'financeiro@solucaoloc.com.br',
    setorId: 'setor-financeiro',
    cargoId: 'cargo-analista-financeiro',
    usuarioId: 'op-id-456',
    ativo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'func-sannderson',
    nome: 'Sannderson',
    emailCorporativo: 'administrativo@solucaoloc.com.br',
    setorId: 'setor-operacional', // Exemplo
    cargoId: 'cargo-analista-suporte', // Exemplo
    usuarioId: 'd1cacaea-badf-4eda-8474-062caa953c43',
    ativo: true,
    createdAt: new Date().toISOString()
  }
];

let cache: Funcionario[] | null = null;

export const MockFuncionarioStore = {
  async getAll(): Promise<Funcionario[]> {
    if (cache) return cache;
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      cache = JSON.parse(data);
      return cache!;
    } catch (error) {
      cache = INITIAL_EMPLOYEES;
      await this.persist(INITIAL_EMPLOYEES);
      return INITIAL_EMPLOYEES;
    }
  },

  async getById(id: string): Promise<Funcionario | null> {
    const items = await this.getAll();
    return items.find(i => i.id === id) || null;
  },

  async getByUserId(userId: string): Promise<Funcionario | null> {
    const items = await this.getAll();
    return items.find(i => i.usuarioId === userId) || null;
  },

  async save(item: Funcionario): Promise<Funcionario> {
    const items = await this.getAll();
    const index = items.findIndex(i => i.id === item.id);
    
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    
    await this.persist(items);
    return item;
  },

  async persist(items: Funcionario[]): Promise<void> {
    const dir = path.dirname(DATA_FILE);
    try { await fs.access(dir); } catch { await fs.mkdir(dir, { recursive: true }); }
    await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
    cache = items;
  },

  async delete(id: string): Promise<void> {
      const items = await this.getAll();
      const filtered = items.filter(i => i.id !== id);
      await this.persist(filtered);
  }
};
