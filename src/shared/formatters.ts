
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const Formatters = {
  date: (date: Date | string | null | undefined): string => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  },

  shortDate: (date: Date | string | null | undefined): string => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, "dd/MM/yyyy", { locale: ptBR })
  },

  status: (status: string): string => {
    const map: Record<string, string> = {
      'ABERTA': 'Aberta',
      'EM_ANDAMENTO': 'Em Andamento',
      'CONCLUIDA': 'Concluída',
      'CANCELADA': 'Cancelada',
      'PENDENTE': 'Pendente',
      'CONCLUIDO': 'Concluído',
      'ENCERRADA_SEM_CONCLUSAO': 'Encerrada s/ Conclusão'
    }
    return map[status] || status
  },

  priority: (priority: string): string => {
    const map: Record<string, string> = {
      'BAIXA': 'Baixa',
      'MEDIA': 'Média',
      'ALTA': 'Alta'
    }
    return map[priority] || priority
  },

  pendencyType: (type: string): string => {
    const map: Record<string, string> = {
      'OS': 'Ordem de Serviço',
      'FINANCEIRO': 'Financeiro',
      'ADMINISTRATIVO': 'Administrativo',
      'TI': 'Tecnologia da Informação',
      'COMERCIAL': 'Comercial',
      'OUTRO': 'Outro'
    }
    return map[type] || type
  },

  origin: (type: string, id?: string | null): string => {
    if (type === 'OS') {
        // Se tivermos o ID, idealmente deveríamos mostrar o número, 
        // mas sem acesso ao banco aqui, melhor mostrar um texto amigável.
        // Se o frontend tiver o objeto da OS populado, deve usar ele.
        // Aqui é o fallback.
        return 'Ordem de Serviço'
    }
    if (type === 'MANUAL') return 'Manual'
    return type
  }
}
