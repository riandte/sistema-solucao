import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { Pendencia } from '../types';
import { AuthContext } from '../auth/authContext';
import { assertPermission, hasPermission, ForbiddenError } from '../auth/permissions';

const DATA_FILE = path.join(process.cwd(), 'data', 'pendencias.json');

// Helper para ler dados
async function readData(): Promise<Pendencia[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Se arquivo não existir ou erro, retorna vazio
    return [];
  }
}

// Helper para salvar dados
async function saveData(data: Pendencia[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper de Auditoria
function logAudit(action: string, userId: string, targetId: string, details?: any, success: boolean = true) {
  // Em produção, isso iria para um banco de logs ou serviço externo (Datadog/Splunk)
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: success ? 'INFO' : 'ERROR',
    event: 'AUDIT_LOG',
    action,
    actor: userId,
    target: targetId,
    success,
    details
  }));
}

export const PendenciaService = {
  async listar(context: AuthContext): Promise<Pendencia[]> {
    const pendencias = await readData();

    // 1. Admin/Operador/Sistema veem tudo
    if (hasPermission(context, 'PENDENCIA:LER_TODAS')) {
      return pendencias;
    }

    // 2. Usuário comum vê apenas o que criou ou é responsável
    if (context.user) {
      return pendencias.filter(p => 
        p.criadoPor === context.user.id || 
        p.responsavelId === context.user.id
      );
    }

    return [];
  },

  async criar(dados: Omit<Pendencia, 'id' | 'dataCriacao'>, context: AuthContext): Promise<Pendencia> {
    try {
      await assertPermission(context, 'PENDENCIA:CRIAR');

      const pendencias = await readData();
      
      const novaPendencia: Pendencia = {
        ...dados,
        id: randomUUID(),
        dataCriacao: new Date().toISOString(),
        status: dados.status || 'PENDENTE',
        criadoPor: context.user.id // Garante que o criador é quem está autenticado (ou System ID)
      };
      
      pendencias.push(novaPendencia);
      await saveData(pendencias);
      
      logAudit('PENDENCIA_CRIADA', context.user.id, novaPendencia.id, { titulo: novaPendencia.titulo });
      
      return novaPendencia;
    } catch (err: any) {
      logAudit('PENDENCIA_CRIACAO_FALHA', context.user?.id || 'anonymous', 'new', { error: err.message }, false);
      throw err;
    }
  },

  async atualizar(id: string, dados: Partial<Pendencia>, context: AuthContext): Promise<Pendencia | null> {
    try {
      const pendencias = await readData();
      const index = pendencias.findIndex(p => p.id === id);
      
      if (index === -1) return null; // NotFound tratada na rota ou aqui poderia lançar erro
      
      const original = pendencias[index];

      // --- VALIDAÇÕES DE PERMISSÃO ---

      // 1. Mudança de Status
      if (dados.status && dados.status !== original.status) {
        if (dados.status === 'CONCLUIDO') {
          await assertPermission(context, 'PENDENCIA:CONCLUIR');
        } else if (dados.status === 'CANCELADO') {
          await assertPermission(context, 'PENDENCIA:CANCELAR');
          
          // Regra ABAC: Apenas Admin cancela de terceiros irrestritamente
          const isAdmin = context.user.roles.includes('ADMIN');
          const isOwner = original.criadoPor === context.user.id;
          
          if (!isAdmin && !isOwner) {
            throw new ForbiddenError('Você só pode cancelar pendências que você criou.');
          }
          
          // Regra de Negócio: Não cancelar se já estiver concluído (exemplo)
          if (original.status === 'CONCLUIDO' && !isAdmin) {
             throw new ForbiddenError('Não é possível cancelar uma pendência já concluída.');
          }
        } else {
          // Mover (Kanban)
          await assertPermission(context, 'PENDENCIA:MOVER');
        }
      }

      // 2. Edição de Conteúdo (Título, Descrição, Prioridade)
      if (dados.titulo || dados.descricao || dados.prioridade || dados.tipo) {
        await assertPermission(context, 'PENDENCIA:EDITAR');
      }

      // 3. Atribuição de Responsável
      if (dados.responsavelId !== undefined && dados.responsavelId !== original.responsavelId) {
        await assertPermission(context, 'PENDENCIA:ATRIBUIR_RESPONSAVEL');
      }

      const atualizada = { ...original, ...dados, dataAtualizacao: new Date().toISOString() };
      pendencias[index] = atualizada;
      
      await saveData(pendencias);
      logAudit('PENDENCIA_ATUALIZADA', context.user.id, id, { 
        changes: Object.keys(dados),
        from: original.status,
        to: dados.status 
      });
      
      return atualizada;
    } catch (err: any) {
      logAudit('PENDENCIA_ATUALIZACAO_FALHA', context.user?.id || 'anonymous', id, { error: err.message }, false);
      throw err;
    }
  },
  
  async buscarPorId(id: string, context: AuthContext): Promise<Pendencia | null> {
    const pendencias = await readData();
    const p = pendencias.find(p => p.id === id) || null;
    
    if (!p) return null;

    // Validação de Visibilidade
    if (await hasPermission(context, 'PENDENCIA:LER_TODAS')) {
      return p;
    }
    
    // Visibilidade ABAC (Dono ou Responsável)
    if (context.user && (p.criadoPor === context.user.id || p.responsavelId === context.user.id)) {
      return p;
    }

    throw new ForbiddenError('Você não tem permissão para visualizar esta pendência.');
  }
};
