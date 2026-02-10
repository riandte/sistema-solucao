import { ClipboardList, AlertTriangle, CheckCircle2, Users } from 'lucide-react'
import { KPICard } from '@/frontend/components/dashboard/KPICard'
import { ActivityFeed, ActivityItem } from '@/frontend/components/dashboard/ActivityFeed'
import { SystemStatus } from '@/frontend/components/dashboard/SystemStatus'
import { QuickActions } from '@/frontend/components/dashboard/QuickActions'
import { prisma } from '@/backend/db'
import { startOfMonth, subMonths, startOfDay } from 'date-fns'

// Force dynamic rendering to ensure real-time data
export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const startTime = performance.now();
  const now = new Date();
  
  // Date ranges for KPI trends
  const currentMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const todayStart = startOfDay(now);
  
  // 1. Fetch KPI Counts in parallel
  const [
    pendingCount,
    inProgressCount,
    completedMonthCount,
    completedLastMonthCount,
    createdTodayCount,
    activeUsersCount,
    usersCreatedMonthCount,
    recentActivities
  ] = await Promise.all([
    prisma.pendency.count({ where: { status: 'PENDENTE' } }),
    prisma.pendency.count({ where: { status: 'EM_ANDAMENTO' } }),
    prisma.pendency.count({ 
      where: { 
        status: 'CONCLUIDO',
        updatedAt: { gte: currentMonthStart }
      } 
    }),
    prisma.pendency.count({ 
      where: { 
        status: 'CONCLUIDO',
        updatedAt: { gte: lastMonthStart, lt: currentMonthStart }
      } 
    }),
    prisma.pendency.count({
      where: {
        createdAt: { gte: todayStart }
      }
    }),
    prisma.user.count({ where: { active: true } }),
    prisma.user.count({
      where: {
        active: true,
        createdAt: { gte: currentMonthStart }
      }
    }),
    
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

  const endTime = performance.now();
  const dbLatency = Math.round(endTime - startTime);

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

  // Calculate trends
  const completedDiff = completedMonthCount - completedLastMonthCount;
  const completedTrend = {
    value: `${completedDiff >= 0 ? '+' : ''}${completedDiff} vs mês anterior`,
    isPositive: completedDiff >= 0
  };

  const usersTrend = {
    value: `+${usersCreatedMonthCount} este mês`,
    isPositive: true
  };

  const pendingTrend = {
    value: `+${createdTodayCount} hoje`,
    isPositive: false, // More pending is neutral/negative context dependent, but let's keep it informative
    isUpwards: true
  };

  return {
    kpis: {
      pending: pendingCount,
      pendingTrend,
      inProgress: inProgressCount,
      completedMonth: completedMonthCount,
      completedTrend,
      activeUsers: activeUsersCount,
      usersTrend
    },
    activities,
    system: {
      dbLatency,
      dbStatus: 'connected' as const
    }
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
          trend={data.kpis.pendingTrend}
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
          trend={data.kpis.completedTrend}
        />
        <KPICard 
          title="Usuários Ativos" 
          value={data.kpis.activeUsers} 
          icon={Users} 
          color="purple"
          trend={data.kpis.usersTrend}
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
          <SystemStatus 
            dbLatency={data.system.dbLatency}
            dbStatus={data.system.dbStatus}
          />
          
          {/* Optional: Add another widget here like "Pending Approvals" or "My Tasks" */}
        </div>
      </div>
    </div>
  )
}
