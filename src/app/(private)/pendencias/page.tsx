
"use client"

import { useEffect, useState } from 'react'
import { Pendencia, StatusPendencia } from '@/lib/types'
import { Kanban, RefreshCw, Plus, AlertCircle, Clock, CheckCircle, Search } from 'lucide-react'
import Link from 'next/link'

export default function PendenciasPage() {
  const [pendencias, setPendencias] = useState<Pendencia[]>([])
  const [loading, setLoading] = useState(true)

  async function loadPendencias() {
    setLoading(true)
    try {
      const res = await fetch('/api/pendencias')
      const data = await res.json()
      if (Array.isArray(data)) {
        setPendencias(data)
      }
    } catch (err) {
      console.error('Erro ao carregar pendências', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPendencias()
  }, [])

  const columns: { id: StatusPendencia; label: string; icon: any; color: string }[] = [
    { id: 'PENDENTE', label: 'A Fazer', icon: AlertCircle, color: 'text-yellow-400' },
    { id: 'EM_ANDAMENTO', label: 'Em Andamento', icon: Clock, color: 'text-blue-400' },
    { id: 'CONCLUIDO', label: 'Concluído', icon: CheckCircle, color: 'text-green-400' },
  ]

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Kanban className="text-blue-500" />
                Gestão de Pendências
            </h1>
            <p className="text-gray-400 mt-1">Visualize e gerencie todas as tarefas do sistema</p>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={loadPendencias}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
                title="Atualizar"
            >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link 
                href="/pendencias/nova"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
                <Plus size={18} />
                Nova Pendência
            </Link>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {columns.map(col => {
            const items = pendencias.filter(p => p.status === col.id)
            
            return (
                <div key={col.id} className="flex flex-col bg-gray-900/50 border border-white/5 rounded-xl h-full">
                    {/* Column Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5 rounded-t-xl">
                        <div className="flex items-center gap-2 font-semibold text-gray-200">
                            <col.icon size={18} className={col.color} />
                            {col.label}
                        </div>
                        <span className="bg-gray-800 text-xs px-2 py-1 rounded-full text-gray-400 border border-white/5">
                            {items.length}
                        </span>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {items.length === 0 ? (
                            <div className="text-center py-10 text-gray-600 border-2 border-dashed border-white/5 rounded-lg">
                                <span className="text-sm">Nenhuma pendência</span>
                            </div>
                        ) : (
                            items.map(p => (
                                <PendenciaCard key={p.id} pendencia={p} />
                            ))
                        )}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  )
}

function PendenciaCard({ pendencia }: { pendencia: Pendencia }) {
    const priorityColors = {
        'BAIXA': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        'MEDIA': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'ALTA': 'bg-red-500/20 text-red-400 border-red-500/30'
    }

    return (
        <div className="bg-gray-800/40 hover:bg-gray-800 border border-white/5 hover:border-white/20 p-4 rounded-lg cursor-pointer transition-all group shadow-sm hover:shadow-md">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityColors[pendencia.prioridade] || priorityColors.MEDIA}`}>
                    {pendencia.prioridade}
                </span>
                {pendencia.origemTipo === 'OS' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        OS #{pendencia.origemId}
                    </span>
                )}
            </div>

            <h4 className="font-medium text-gray-200 mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                {pendencia.titulo}
            </h4>
            
            <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                {pendencia.descricao}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-white/5 pt-3 mt-auto">
                <span className="flex items-center gap-1">
                    {new Date(pendencia.dataCriacao).toLocaleDateString('pt-BR')}
                </span>
                {pendencia.dataPrevisao && (
                    <span className="flex items-center gap-1 text-orange-400/80">
                        Prev: {new Date(pendencia.dataPrevisao).toLocaleDateString('pt-BR')}
                    </span>
                )}
            </div>
        </div>
    )
}
