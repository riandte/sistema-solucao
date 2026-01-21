import fs from 'fs/promises';
import path from 'path';
import { Setor } from '@/lib/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'setores.json');

const INITIAL_SECTORS: Setor[] = [
  {
    id: 'setor-ti',
    nome: 'Tecnologia da Informação',
    descricao: 'Suporte, Infraestrutura e Desenvolvimento',
    ativo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'setor-financeiro',
    nome: 'Financeiro',
    descricao: 'Contas a Pagar/Receber e Tesouraria',
    ativo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'setor-operacional',
    nome: 'Operacional',
    descricao: 'Logística e Execução de Serviços',
    ativo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'setor-comercial',
    nome: 'Comercial',
    descricao: 'Vendas e Relacionamento',
    ativo: true,
    createdAt: new Date().toISOString()
  }
];

let cache: Setor[] | null = null;

export const MockSetorStore = {
  async getAll(): Promise<Setor[]> {
    if (cache) return cache;
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      cache = JSON.parse(data);
      return cache!;
    } catch (error) {
      cache = INITIAL_SECTORS;
      await this.persist(INITIAL_SECTORS);
      return INITIAL_SECTORS;
    }
  },

  async getById(id: string): Promise<Setor | null> {
    const items = await this.getAll();
    return items.find(i => i.id === id) || null;
  },

  async save(item: Setor): Promise<Setor> {
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

  async persist(items: Setor[]): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(DATA_FILE);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
    cache = items;
  },
  
  async delete(id: string): Promise<void> {
      const items = await this.getAll();
      const filtered = items.filter(i => i.id !== id);
      await this.persist(filtered);
  }
};
