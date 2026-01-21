import fs from 'fs/promises';
import path from 'path';
import { Cargo } from '@/lib/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'cargos.json');

const INITIAL_CARGOS: Cargo[] = [
  {
    id: 'cargo-gerente-ti',
    nome: 'Gerente de TI',
    descricao: 'Gestão da área de tecnologia',
    setoresPermitidos: ['setor-ti'],
    escopo: 'SETORIAL',
    ativo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cargo-analista-suporte',
    nome: 'Analista de Suporte',
    descricao: 'Atendimento N1/N2',
    setoresPermitidos: ['setor-ti'],
    escopo: 'INDIVIDUAL',
    ativo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cargo-analista-financeiro',
    nome: 'Analista Financeiro',
    descricao: 'Rotinas financeiras',
    setoresPermitidos: ['setor-financeiro'],
    escopo: 'INDIVIDUAL',
    ativo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cargo-gerente-geral',
    nome: 'Gerente Geral',
    descricao: 'Visão global',
    setoresPermitidos: ['setor-ti', 'setor-financeiro', 'setor-operacional', 'setor-comercial'],
    escopo: 'SETORIAL',
    ativo: true,
    createdAt: new Date().toISOString()
  }
];

let cache: Cargo[] | null = null;

export const MockCargoStore = {
  async getAll(): Promise<Cargo[]> {
    if (cache) return cache;
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      cache = JSON.parse(data);
      return cache!;
    } catch (error) {
      cache = INITIAL_CARGOS;
      await this.persist(INITIAL_CARGOS);
      return INITIAL_CARGOS;
    }
  },

  async getById(id: string): Promise<Cargo | null> {
    const items = await this.getAll();
    return items.find(i => i.id === id) || null;
  },

  async save(item: Cargo): Promise<Cargo> {
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

  async persist(items: Cargo[]): Promise<void> {
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
