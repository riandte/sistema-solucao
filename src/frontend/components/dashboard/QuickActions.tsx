import Link from 'next/link'
import { Plus, FileText, AlertTriangle, Users } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      label: 'Nova Ordem de Serviço',
      href: '/os/nova',
      icon: FileText,
      color: 'blue'
    },
    {
      label: 'Reportar Pendência',
      href: '/pendencias/nova',
      icon: AlertTriangle,
      color: 'amber'
    },
    {
      label: 'Cadastrar Usuário',
      href: '/configuracoes/usuarios', // Assumindo rota de gestão
      icon: Users,
      color: 'purple'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {actions.map((action) => (
        <Link 
          key={action.label}
          href={action.href}
          className="group flex items-center gap-4 p-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/20"
        >
          <div className={`p-3 rounded-lg bg-${action.color}-500/10 text-${action.color}-500 group-hover:scale-110 transition-transform`}>
            <action.icon size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
              {action.label}
            </span>
            <span className="text-xs text-gray-500">Criar novo registro</span>
          </div>
          <Plus size={16} className="ml-auto text-gray-600 group-hover:text-white transition-colors" />
        </Link>
      ))}
    </div>
  )
}
