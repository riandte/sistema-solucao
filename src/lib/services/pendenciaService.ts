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

export interface PendenciaFilters {
  status?: string;
  tipo?: string;
  responsavelId?: string;
  setorResponsavel?: string;
  criadoPor?: string;
  dataInicio?: string;
  dataFim?: string;
  termo?: string; // Busca em título/descrição/origemId
}

export const PendenciaService = {
  async listar(context: AuthContext, filters?: PendenciaFilters): Promise<Pendencia[]> {
    let pendencias = await readData();

    // 1. Admin/Operador/Sistema veem tudo
    // Se NÃO tiver permissão global, filtra por propriedade
    if (!hasPermission(context, 'PENDENCIA:LER_TODAS')) {
       // 2. Usuário comum vê apenas o que criou ou é responsável
       if (context.user) {
         pendencias = pendencias.filter(p => 
           p.criadoPor === context.user.id || 
           p.responsavelId === context.user.id ||
           (p.setorResponsavel && context.user.roles.includes(p.setorResponsavel as any)) // Assume roles map to sectors roughly or explicit check
           // Simplificação: Usuário vê se for criador ou responsável direto.
           // Se quiser ver por setor, precisaria saber o setor do usuário.
           // Por enquanto, mantemos regra simples: ID direto ou Criador.
         );
       } else {
         return [];
       }
    }

    // 3. Aplicar Filtros Avançados
    if (filters) {
        if (filters.status) {
            pendencias = pendencias.filter(p => p.status === filters.status);
        }
        if (filters.tipo) {
            pendencias = pendencias.filter(p => p.tipo === filters.tipo);
        }
        if (filters.responsavelId) {
            pendencias = pendencias.filter(p => p.responsavelId === filters.responsavelId);
        }
        if (filters.setorResponsavel) {
            pendencias = pendencias.filter(p => p.setorResponsavel === filters.setorResponsavel);
        }
        if (filters.criadoPor) {
            pendencias = pendencias.filter(p => p.criadoPor === filters.criadoPor);
        }
        if (filters.dataInicio) {
            const dInicio = new Date(filters.dataInicio);
            if (!isNaN(dInicio.getTime())) {
                pendencias = pendencias.filter(p => new Date(p.dataCriacao) >= dInicio);
            }
        }
        if (filters.dataFim) {
            const dFim = new Date(filters.dataFim);
            if (!isNaN(dFim.getTime())) {
                // Ajuste para final do dia se for apenas data, ou comparação direta
                // Assumindo comparação simples de timestamp por enquanto
                pendencias = pendencias.filter(p => new Date(p.dataCriacao) <= dFim);
            }
        }
        if (filters.termo) {
            const t = filters.termo.toLowerCase();
            pendencias = pendencias.filter(p => 
                p.titulo.toLowerCase().includes(t) ||
                (p.descricao && p.descricao.toLowerCase().includes(t)) ||
                (p.origemId && p.origemId.toLowerCase().includes(t))
            );
        }
    }

    return pendencias;
  },

  async criar(dados: Omit<Pendencia, 'id' | 'dataCriacao'>, context: AuthContext): Promise<Pendencia> {
    try {
      await assertPermission(context, 'PENDENCIA:CRIAR');

      // 1. Regra de Atribuição Automática para OS
      if (dados.origemTipo === 'OS') {
          dados.responsavelId = context.user.id;
          dados.setorResponsavel = undefined; // OS é sempre atribuída a pessoa
      } else {
          // 2. Regra para Manual: Deve ter Pessoa OU Setor
          if (!dados.responsavelId && !dados.setorResponsavel) {
              throw new Error('É obrigatório atribuir a pendência a uma Pessoa ou Setor.');
          }
      }

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
        if (dados.status === 'CONCLUIDO' || dados.status === 'ENCERRADA_SEM_CONCLUSAO') {
          await assertPermission(context, 'PENDENCIA:CONCLUIR');
          
          // --- REGRA DE ENCERRAMENTO ---
          
          // Se for OS, não exige conclusão
          // Se for Manual, exige conclusão
          if (original.origemTipo === 'MANUAL') {
              if (!dados.conclusao) {
                  throw new Error('Para encerrar uma pendência manual, é obrigatório informar a conclusão.');
              }
              // Define tipo de encerramento baseado no status
              dados.tipoEncerramento = dados.status === 'CONCLUIDO' ? 'CONCLUIDO' : 'SEM_CONCLUSAO';
          } else if (original.origemTipo === 'OS') {
              // OS sempre é sucesso se chegar aqui, mas poderia ter cancelamento.
              // Assumindo fluxo feliz para CONCLUIDO
              dados.tipoEncerramento = 'CONCLUIDO';
          }
          
          dados.dataConclusao = new Date().toISOString();

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
      if ((dados.responsavelId !== undefined && dados.responsavelId !== original.responsavelId) ||
          (dados.setorResponsavel !== undefined && dados.setorResponsavel !== original.setorResponsavel)) {
        await assertPermission(context, 'PENDENCIA:ATRIBUIR_RESPONSAVEL');
      }
      
      // Impede edição de conclusão após encerrado
      if (dados.conclusao && (original.status === 'CONCLUIDO' || original.status === 'ENCERRADA_SEM_CONCLUSAO')) {
          // Permitir apenas se estiver reabrindo (status != concluido), mas aqui estamos no bloco de update.
          // Se o status novo não for de reabertura, bloqueia.
          const isReopening = dados.status && dados.status !== 'CONCLUIDO' && dados.status !== 'ENCERRADA_SEM_CONCLUSAO';
          if (!isReopening) {
              throw new ForbiddenError('Não é possível editar a conclusão de uma pendência encerrada.');
          }
      }

      const atualizada = { ...original, ...dados, dataAtualizacao: new Date().toISOString() };
      pendencias[index] = atualizada;

      // 4. Automação: Criar Pendência Financeira ao Concluir OS
      if (original.tipo === 'OS' && dados.status === 'CONCLUIDO' && original.status !== 'CONCLUIDO') {
        const novaPendenciaFinanceira: Pendencia = {
          id: randomUUID(),
          titulo: `Faturamento OS #${original.origemId || original.titulo}`,
          descricao: `Gerado automaticamente após conclusão da OS #${original.origemId || original.titulo}. Referência: ${original.titulo}`,
          tipo: 'FINANCEIRO',
          status: 'PENDENTE',
          prioridade: 'MEDIA',
          origemId: original.origemId, // Mantém o ID da OS original como origem
          origemTipo: 'OS',
          criadoPor: 'system-automation',
          dataCriacao: new Date().toISOString(),
          tags: ['AUTOMACAO', 'FINANCEIRO', original.origemId ? `OS-${original.origemId}` : 'OS-SEM-ID']
        };
        pendencias.push(novaPendenciaFinanceira);
        logAudit('PENDENCIA_FINANCEIRA_CRIADA_POR_OS', context.user.id, novaPendenciaFinanceira.id, { 
           osId: original.id,
           osRef: original.origemId 
        });
      }
      
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
