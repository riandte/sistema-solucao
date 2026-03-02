"use client"

import { useState, useEffect } from 'react'
import { X, Hash, User, Calendar, FileText, CheckCircle, AlertCircle, Clock, FileWarning } from 'lucide-react'
import { ServiceOrder, Pendencia } from '@/shared/types'
import { Formatters } from '@/shared/formatters'

interface ModalOSDetalheProps {
  osId: string
  onClose: () => void
}

interface OSDetail extends ServiceOrder {
  pendencies: Pendencia[]
}

export function ModalOSDetalhe({ osId, onClose }: ModalOSDetalheProps) {
  const [data, setData] = useState<OSDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/service-orders/${osId}`)
        if (!res.ok) throw new Error('Falha ao carregar OS')
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [osId])

  if (!osId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
            <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Hash size={18} className="text-blue-500" />
                    Ordem de Serviço #{data?.displayId || data?.id?.slice(0, 8) || 'Carregando...'}
                </h2>
                <p className="text-sm text-gray-400">Detalhes e Acompanhamento</p>
            </div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            ) : error ? (
                <div className="text-center py-10 text-red-400">
                    <AlertCircle className="mx-auto mb-2" size={32} />
                    {error}
                </div>
            ) : data ? (
                <div className="space-y-8">
                    {/* Info Principal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Cliente</label>
                                <div className="text-white font-medium text-lg">{data.clientData?.nome || 'Não informado'}</div>
                                <div className="text-gray-400 text-sm">{data.clientData?.documento}</div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Contrato</label>
                                <div className="text-white">{data.contractNumber || '-'}</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Status Global</label>
                                <div className="mt-1">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${
                                        data.status === 'CONCLUIDA' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        data.status === 'CANCELADA' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                        {data.status === 'CONCLUIDA' && <CheckCircle size={14} />}
                                        {data.status === 'CANCELADA' && <AlertCircle size={14} />}
                                        {data.status === 'ABERTA' && <Clock size={14} />}
                                        {Formatters.status(data.status || 'ABERTA')}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Prioridade</label>
                                <div className={`text-sm font-bold mt-1 ${
                                    data.priority === 'ALTA' ? 'text-red-400' :
                                    data.priority === 'MEDIA' ? 'text-blue-400' : 'text-gray-400'
                                }`}>
                                    {data.priority}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-white/5">
                        <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <FileText size={16} className="text-blue-500" />
                            Descrição da Solicitação
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {data.description || 'Sem descrição.'}
                        </p>
                    </div>

                    {/* Pendências Vinculadas */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                            <FileWarning size={16} className="text-orange-500" />
                            Pendências Vinculadas (Progresso Real)
                        </h3>
                        
                        {data.pendencies && data.pendencies.length > 0 ? (
                            <div className="space-y-3">
                                {data.pendencies.map(p => (
                                    <div key={p.id} className="bg-gray-800/50 hover:bg-gray-800 transition-colors border border-white/5 rounded-lg p-4 flex items-center justify-between group">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    p.status === 'CONCLUIDO' ? 'bg-green-500' :
                                                    p.status === 'CANCELADO' ? 'bg-red-500' :
                                                    p.status === 'EM_ANDAMENTO' ? 'bg-blue-500' : 'bg-gray-500'
                                                }`} />
                                                <h4 className="text-sm font-medium text-white truncate">{p.titulo}</h4>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{p.descricao || 'Sem descrição'}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className={`text-xs px-2 py-0.5 rounded border ${
                                                    p.status === 'CONCLUIDO' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    'bg-gray-700 text-gray-300 border-gray-600'
                                                }`}>
                                                    {Formatters.status(p.status)}
                                                </span>
                                                <div className="text-[10px] text-gray-500 mt-1">
                                                    {p.responsavel?.name || 'Sem responsável'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500 bg-gray-800/20 rounded-lg border border-white/5 border-dashed">
                                Nenhuma pendência vinculada encontrada.
                            </div>
                        )}
                    </div>
                    
                    {/* Datas */}
                    <div className="flex items-center gap-6 text-xs text-gray-500 border-t border-white/5 pt-4">
                        <span className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            Criado em: {Formatters.date(data.createdAt)}
                        </span>
                        {data.scheduledDate && (
                            <span className="flex items-center gap-1.5 text-orange-400/70">
                                <Calendar size={12} />
                                Agendado para: {Formatters.shortDate(data.scheduledDate)}
                            </span>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-900 border-t border-white/10 flex justify-end">
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  )
}
