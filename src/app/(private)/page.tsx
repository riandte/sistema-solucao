import { ClipboardList, AlertTriangle, CheckCircle2, Users } from 'lucide-react'
import { KPICard } from '@/frontend/components/dashboard/KPICard'
import { ActivityFeed } from '@/frontend/components/dashboard/ActivityFeed'
import { SystemStatus } from '@/frontend/components/dashboard/SystemStatus'
import { QuickActions } from '@/frontend/components/dashboard/QuickActions'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Visão Geral</h1>
        <p className="text-gray-400">Acompanhe os principais indicadores do sistema</p>
      </div>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Pendentes" 
          value="12" 
          icon={AlertTriangle} 
          color="amber"
          trend={{ value: '+2 hoje', isPositive: false }}
        />
        <KPICard 
          title="Em Andamento" 
          value="5" 
          icon={ClipboardList} 
          color="blue"
        />
        <KPICard 
          title="Concluídos (Mês)" 
          value="148" 
          icon={CheckCircle2} 
          color="emerald"
          trend={{ value: '+15% vs mês ant.', isPositive: true }}
        />
        <KPICard 
          title="Usuários Ativos" 
          value="24" 
          icon={Users} 
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>

        {/* System Status - Takes up 1 column */}
        <div className="space-y-6">
          <SystemStatus />
          
          {/* Optional: Add another widget here like "Pending Approvals" or "My Tasks" */}
        </div>
      </div>
    </div>
  )
}
