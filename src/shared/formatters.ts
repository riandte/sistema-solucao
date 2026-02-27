
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

  origin: (type: string, id?: string | null, displayId?: string | null): string => {
    if (type === 'OS') {
        if (displayId) return `Ordem de Serviço #${displayId}`
        // Fallback para ID curto se não tiver displayId
        if (id && id.length > 8) return `Ordem de Serviço #${id.slice(0, 8)}`
        if (id) return `Ordem de Serviço #${id}`
        return 'Ordem de Serviço'
    }
    if (type === 'MANUAL') return 'Manual'
    return type
  }
}
