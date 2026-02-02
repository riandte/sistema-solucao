import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Activity, CheckCircle2, AlertCircle, FileText, User } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'os_created' | 'os_completed' | 'alert' | 'user_action'
  title: string
  description: string
  timestamp: Date
  user?: string
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'os_created',
    title: 'Nova Ordem de Serviço',
    description: 'Manutenção de Ar Condicionado - Setor Financeiro',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
    user: 'Ana Silva'
  },
  {
    id: '2',
    type: 'alert',
    title: 'Alerta de Pendência',
    description: 'OS #1234 atrasada há 2 dias',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '3',
    type: 'os_completed',
    title: 'Serviço Concluído',
    description: 'Troca de Toner Impressora RH',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    user: 'Carlos Souza'
  },
  {
    id: '4',
    type: 'user_action',
    title: 'Novo Usuário',
    description: 'Roberto Lima adicionado ao grupo Técnica',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  }
]

export function ActivityFeed() {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'os_created': return <FileText size={18} className="text-blue-400" />
      case 'os_completed': return <CheckCircle2 size={18} className="text-emerald-400" />
      case 'alert': return <AlertCircle size={18} className="text-amber-400" />
      case 'user_action': return <User size={18} className="text-purple-400" />
      default: return <Activity size={18} className="text-gray-400" />
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity size={20} className="text-blue-500" />
          Atividade Recente
        </h3>
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Hoje</span>
      </div>

      <div className="space-y-6">
        {mockActivities.map((item, index) => (
          <div key={item.id} className="relative flex gap-4">
            {/* Timeline line connecting items */}
            {index !== mockActivities.length - 1 && (
              <div className="absolute left-[19px] top-8 bottom-[-24px] w-px bg-white/10" />
            )}
            
            <div className="relative z-10 w-10 h-10 rounded-full bg-gray-800/50 border border-white/10 flex items-center justify-center shrink-0">
              {getIcon(item.type)}
            </div>
            
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex justify-between items-start gap-4">
                <p className="text-sm font-medium text-white truncate">{item.title}</p>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(item.timestamp, { locale: ptBR, addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5 truncate">{item.description}</p>
              {item.user && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  {item.user}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
