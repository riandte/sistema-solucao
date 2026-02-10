import { Server, Database, Wifi, ShieldCheck } from 'lucide-react'

interface SystemStatusProps {
  dbLatency?: number;
  dbStatus?: 'connected' | 'error';
  locAppStatus?: 'connected' | 'error' | 'auth_error' | 'timeout';
  locAppLatency?: number;
  locAppMessage?: string;
}

export function SystemStatus({ 
  dbLatency = 0, 
  dbStatus = 'connected',
  locAppStatus = 'connected',
  locAppLatency = 0,
  locAppMessage = 'Online'
}: SystemStatusProps) {
  
  const getLocAppColor = () => {
    switch (locAppStatus) {
      case 'connected': return 'text-emerald-500';
      case 'auth_error': return 'text-amber-500'; // Amarelo para autenticação (conectou mas negou)
      default: return 'text-red-500'; // Vermelho para offline/erro grave
    }
  }

  const getLocAppBg = () => {
    switch (locAppStatus) {
      case 'connected': return 'bg-emerald-500/10';
      case 'auth_error': return 'bg-amber-500/10';
      default: return 'bg-red-500/10';
    }
  }
  
  const getLocAppDot = () => {
    switch (locAppStatus) {
      case 'connected': return 'bg-emerald-500';
      case 'auth_error': return 'bg-amber-500';
      default: return 'bg-red-500';
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <ShieldCheck size={20} className="text-emerald-500" />
        Status do Sistema
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${dbStatus === 'connected' ? 'bg-emerald-500/10' : 'bg-red-500/10'} rounded-lg`}>
              <Database size={18} className={dbStatus === 'connected' ? 'text-emerald-500' : 'text-red-500'} />
            </div>
            <span className="text-sm font-medium text-gray-300">Banco de Dados</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
            <span className={`text-xs ${dbStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'} font-medium`}>
              {dbStatus === 'connected' ? 'Conectado' : 'Erro'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${getLocAppBg()} rounded-lg`}>
              <Server size={18} className={getLocAppColor()} />
            </div>
            <span className="text-sm font-medium text-gray-300">API LocApp</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getLocAppDot()} animate-pulse`} />
            <span className={`text-xs ${getLocAppColor().replace('text-', 'text-').replace('500', '400')} font-medium`}>
              {locAppMessage}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Wifi size={18} className="text-purple-500" />
            </div>
            <span className="text-sm font-medium text-gray-300">Latência</span>
          </div>
          <div className="flex gap-2">
             <span className="text-xs text-gray-400 font-mono bg-white/10 px-2 py-1 rounded" title="DB">DB: {dbLatency}ms</span>
             <span className="text-xs text-gray-400 font-mono bg-white/10 px-2 py-1 rounded" title="LocApp">API: {locAppLatency}ms</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-gray-500">Última verificação: Agora mesmo</p>
      </div>
    </div>
  )
}
