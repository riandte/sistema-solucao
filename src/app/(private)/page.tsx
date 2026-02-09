import { ClipboardList, AlertTriangle, CheckCircle2, Users } from 'lucide-react'
import { KPICard } from '@/frontend/components/dashboard/KPICard'
import { ActivityFeed, ActivityItem } from '@/frontend/components/dashboard/ActivityFeed'
import { SystemStatus } from '@/frontend/components/dashboard/SystemStatus'
import { QuickActions } from '@/frontend/components/dashboard/QuickActions'
import { prisma } from '@/backend/db'

// Force dynamic rendering to ensure real-time data
export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // 1. Fetch KPI Counts in parallel
  const [
    pendingCount,
    inProgressCount,
    completedMonthCount,
    activeUsersCount,
    recentActivities
  ] = await Promise.all([
    prisma.pendency.count({ where: { status: 'PENDENTE' } }),
    prisma.pendency.count({ where: { status: 'EM_ANDAMENTO' } }),
    prisma.pendency.count({ 
      where: { 
        status: 'CONCLUIDO',
        updatedAt: { gte: startOfMonth }
      } 
    }),
    prisma.user.count({ where: { active: true } }),
    
    // 2. Fetch Recent Audit Logs for Activity Feed
    prisma.auditEvent.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        event: true,
        details: true,
        timestamp: true,
        actorId: true
      }
    })
  ]);

  // Transform AuditEvents to ActivityItems
  const activities: ActivityItem[] = await Promise.all(recentActivities.map(async (log) => {
    // Fetch actor name if possible (or keep it efficient and just use actorId if we don't want N+1)
    // For better UX, let's fetch the user name. Since it's only 5 items, it's cheap.
    let actorName = 'Sistema';
    if (log.actorId && log.actorId !== 'system' && log.actorId !== 'anonymous') {
       const user = await prisma.user.findUnique({ 
         where: { id: log.actorId },
         select: { name: true }
       }).catch(() => null);
       if (user) actorName = user.name;
    }

    // Helper to format title/desc based on event type
    let title = log.event;
    let description = 'Ação registrada no sistema';
    const details = log.details as any || {};

    switch(log.event) {
      case 'LOGIN_SUCCESS':
        title = 'Login Realizado';
        description = 'Acesso ao sistema efetuado com sucesso';
        break;
      case 'PENDENCIA_CRIADA':
        title = 'Nova Pendência';
        description = details.title || 'Pendência registrada';
        break;
      case 'PENDENCIA_CONCLUIDA':
        title = 'Pendência Concluída';
        description = details.title || 'Tarefa finalizada';
        break;
      case 'USER_CREATED':
        title = 'Novo Usuário';
        description = `Usuário ${details.email || ''} cadastrado`;
        break;
      // Add more cases as needed
    }

    return {
      id: log.id,
      type: log.event,
      title,
      description,
      timestamp: log.timestamp,
      user: actorName
    };
  }));

  return {
    kpis: {
      pending: pendingCount,
      inProgress: inProgressCount,
      completedMonth: completedMonthCount,
      activeUsers: activeUsersCount
    },
    activities
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

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
          value={data.kpis.pending} 
          icon={AlertTriangle} 
          color="amber"
          // Trend could be calculated by comparing with yesterday if we had historical snapshots
          // For now, we'll omit trend or keep it static until we implement history stats
        />
        <KPICard 
          title="Em Andamento" 
          value={data.kpis.inProgress} 
          icon={ClipboardList} 
          color="blue"
        />
        <KPICard 
          title="Concluídos (Mês)" 
          value={data.kpis.completedMonth} 
          icon={CheckCircle2} 
          color="emerald"
          trend={{ value: 'Este mês', isPositive: true }}
        />
        <KPICard 
          title="Usuários Ativos" 
          value={data.kpis.activeUsers} 
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
          <ActivityFeed activities={data.activities} />
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
