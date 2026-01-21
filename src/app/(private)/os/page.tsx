
"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, FileText, AlertCircle } from 'lucide-react'

interface ServiceOrder {
  id: string
  Nome: string
  Contrato?: string
  prioridade: string
  status?: string
  createdAt: string
  Descricao?: string
}

export default function OSListPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('/api/service-orders')
        if (res.ok) {
          const data = await res.json()
          setOrders(data)
        }
      } catch (error) {
        console.error('Failed to load orders', error)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  const filteredOrders = orders.filter(order => 
    order.Nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const priorityColors: Record<string, string> = {
    'baixa': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'media': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'alta': 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  return (
    <div className="max-w-7xl mx-auto">
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                  type="text" 
                  placeholder="Buscar por cliente, OS ou status..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
              />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-gray-300 font-medium">
              <Filter size={18} />
              Filtros
          </button>
          <Link href="/os/nova" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap">
              <Plus size={18} />
              Nova OS
          </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Carregando ordens de serviço...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center shadow-xl">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10">
                <Search size={40} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-200 mb-3">Nenhuma OS encontrada</h3>
            <p className="text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
                {searchTerm ? 'Nenhum resultado corresponde à sua busca.' : 'Você ainda não possui ordens de serviço cadastradas.'}
            </p>
            {!searchTerm && (
                <Link href="/os/nova" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-600/20">
                    <Plus size={20} />
                    Criar primeira OS
                </Link>
            )}
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-gray-200 font-medium uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">OS</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Contrato</th>
                            <th className="px-6 py-4">Prioridade</th>
                            <th className="px-6 py-4">Data Criação</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredOrders.map((os) => (
                            <tr key={os.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">#{os.id}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-200">{os.Nome}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{os.Descricao}</div>
                                </td>
                                <td className="px-6 py-4">{os.Contrato || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${priorityColors[os.prioridade?.toLowerCase()] || priorityColors['media']}`}>
                                        {os.prioridade?.toUpperCase() || 'NORMAL'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs">
                                        <AlertCircle size={12} />
                                        {os.status || 'ABERTA'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-blue-400 hover:text-blue-300 transition-colors font-medium text-xs">
                                        Ver Detalhes
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

    </div>
  )
}
