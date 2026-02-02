import { Server, Database, Wifi, ShieldCheck } from 'lucide-react'

export function SystemStatus() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <ShieldCheck size={20} className="text-emerald-500" />
        Status do Sistema
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Database size={18} className="text-emerald-500" />
            </div>
            <span className="text-sm font-medium text-gray-300">Banco de Dados</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Conectado</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Server size={18} className="text-blue-500" />
            </div>
            <span className="text-sm font-medium text-gray-300">API Gateway</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-blue-400 font-medium">Online</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Wifi size={18} className="text-purple-500" />
            </div>
            <span className="text-sm font-medium text-gray-300">Latência</span>
          </div>
          <span className="text-xs text-gray-400 font-mono bg-white/10 px-2 py-1 rounded">24ms</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-gray-500">Última verificação: Agora mesmo</p>
      </div>
    </div>
  )
}
