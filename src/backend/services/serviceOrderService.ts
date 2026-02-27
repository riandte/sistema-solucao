import { prisma } from '@/backend/db';
import { AuthContext } from '@/backend/auth/authContext';
import { assertPermission } from '@/backend/auth/permissions';
import { ServiceOrder, OrdemServicoInput } from '@/shared/types';
import { PendenciaService } from './pendenciaService';
import { Priority } from '@prisma/client';

function mapPrismaToApp(os: any): ServiceOrder {
  // O displayId agora vem diretamente do banco (numero_os)
  const displayId = os.displayId || os.numero_os || os.id;

  return {
    id: os.id,
    contractId: os.contractId,
    contractNumber: os.contract?.contractNumber, // Se incluiu relation
    sequence: os.sequence,
    displayId,
    clientData: os.clientData,
    status: os.status,
    priority: os.priority,
    description: os.description,
    scheduledDate: os.scheduledDate.toISOString(),
    createdAt: os.createdAt.toISOString(),
    updatedAt: os.updatedAt.toISOString()
  };
}

export const ServiceOrderService = {
  async list(context: AuthContext): Promise<ServiceOrder[]> {
    // 1. Verificação de Permissão / Visibilidade
    const isAdmin = context.user.roles.includes('ADMIN');
    const isSystem = context.user.roles.includes('SISTEMA');

    if (!isAdmin && !isSystem) {
        if (!context.user.funcionario) {
             throw new Error('Acesso negado. É necessário estar vinculado a um Cargo e Setor para visualizar demandas.');
        }
    }

    // 2. Busca no Banco
    const orders = await prisma.serviceOrder.findMany({
        orderBy: { createdAt: 'desc' },
        include: { contract: true }
    });

    return orders.map(mapPrismaToApp);
  },

  async getById(id: string, context: AuthContext): Promise<ServiceOrder | null> {
      // Reutiliza lógica de visibilidade do list? 
      // Por enquanto, permite se tiver acesso ao módulo
      const isAdmin = context.user.roles.includes('ADMIN');
      const isSystem = context.user.roles.includes('SISTEMA');
      
      if (!isAdmin && !isSystem && !context.user.funcionario) {
          throw new Error('Acesso negado.');
      }

      const os = await prisma.serviceOrder.findUnique({ 
        where: { id },
        include: { contract: true }
      });
      return os ? mapPrismaToApp(os) : null;
  },

  async create(data: OrdemServicoInput, context: AuthContext): Promise<ServiceOrder> {
    await assertPermission(context, 'OS:CRIAR');

    if (!data.contrato) {
       throw new Error('É obrigatório informar o número do Contrato para criar uma OS.');
    }

    const contractNumber = String(data.contrato);

    // 2. Transação: Gerenciar Contrato -> Chamar RPC -> Atualizar Dados -> Criar Pendência
    return prisma.$transaction(async (tx) => {
        // A. Busca ou Cria Contrato
        let contract = await tx.contract.findUnique({
            where: { contractNumber }
        });

        if (!contract) {
            contract = await tx.contract.create({
                data: {
                    contractNumber,
                    status: 'ATIVO'
                }
            });
        } else {
            if (contract.status !== 'ATIVO') {
                throw new Error(`O contrato ${contractNumber} está ${contract.status} e não permite novas OS.`);
            }
        }

        // B. Chama RPC para criar a OS de forma atômica (passando todos os dados)
        let result: any[];
        try {
            const clientData = {
                nome: data.cliente.nome,
                codigo: data.cliente.codigo,
                documento: data.cliente.documento,
                endereco: data.endereco,
                contato: data.contato,
                contrato: data.contrato
            };

            const scheduledDate = new Date(data.dataPrevista);

            // Usa SELECT * FROM para expandir o retorno do tipo composto (service_orders)
            result = await tx.$queryRaw<any[]>`
                SELECT * FROM criar_ordem_servico(
                    ${contract.id}, 
                    ${data.descricao}, 
                    ${data.prioridade}::"Priority", 
                    ${scheduledDate}::timestamp, 
                    ${clientData}::jsonb
                )
            `;
        } catch (error: any) {
            // Tenta extrair mensagem de erro do banco
            const message = error?.message || 'Erro desconhecido na RPC';
            throw new Error(`Falha ao gerar OS via RPC: ${message}`);
        }

        // Verifica retorno
        if (!result || result.length === 0 || !result[0].id) {
             throw new Error('Falha ao gerar Ordem de Serviço via RPC (retorno inválido ou vazio).');
        }

        const newOsId = result[0].id;

        // C. Busca a OS completa recém-criada (sem necessidade de UPDATE posterior)
        const os = await tx.serviceOrder.findUnique({
            where: { id: newOsId },
            include: { contract: true }
        });

        if (!os) {
            throw new Error('OS criada não encontrada no banco de dados.');
        }

        const displayId = os.displayId; // Já vem do banco (numero_os)

        // D. Criação da Pendência Vinculada
        await PendenciaService.criar({
            titulo: `OS #${displayId} - ${data.cliente.nome}`,
            descricao: data.descricao || data.observacoes || 'Gerado automaticamente via OS',
            tipo: 'OS',
            status: 'PENDENTE',
            prioridade: data.prioridade,
            origemId: os.id, // Link físico via UUID
            origemTipo: 'OS',
            criadoPor: context.user.id,
            responsavelId: context.user.id, 
            dataPrevisao: data.dataPrevista,
            tags: [data.cliente.nome, `Contrato: ${contractNumber}`]
        }, context, tx);

        return mapPrismaToApp(os);
    });
  }
};
