import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Clock, Database, AlertTriangle } from "lucide-react";

interface StatsData {
  totalLogs: number;
  uniqueUsers: number;
  peakHour: string;
  mostAccessedTable: string;
}

export function AuditStats() {
  const [stats, setStats] = useState<StatsData>({
    totalLogs: 0,
    uniqueUsers: 0,
    peakHour: "-",
    mostAccessedTable: "-",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("*");

      if (error) throw error;

      if (logs && logs.length > 0) {
        // Calculate unique users
        const uniqueUserIds = new Set(logs.map((log) => log.user_id));

        // Calculate peak hour
        const hourCounts: Record<number, number> = {};
        logs.forEach((log) => {
          const hour = new Date(log.created_at).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const peakHour = Object.entries(hourCounts).sort(
          ([, a], [, b]) => b - a
        )[0];

        // Calculate most accessed table
        const tableCounts: Record<string, number> = {};
        logs.forEach((log) => {
          tableCounts[log.table_name] = (tableCounts[log.table_name] || 0) + 1;
        });
        const mostAccessed = Object.entries(tableCounts).sort(
          ([, a], [, b]) => b - a
        )[0];

        setStats({
          totalLogs: logs.length,
          uniqueUsers: uniqueUserIds.size,
          peakHour: peakHour ? `${peakHour[0]}:00` : "-",
          mostAccessedTable: mostAccessed ? mostAccessed[0] : "-",
        });
      }
    } catch (error) {
      console.error("Error fetching audit stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total de Logs",
      value: stats.totalLogs.toLocaleString("pt-BR"),
      icon: Database,
      description: "Registros de auditoria",
    },
    {
      title: "Usuários Únicos",
      value: stats.uniqueUsers.toString(),
      icon: Users,
      description: "Usuários que acessaram",
    },
    {
      title: "Horário de Pico",
      value: stats.peakHour,
      icon: Clock,
      description: "Maior atividade",
    },
    {
      title: "Tabela Mais Acessada",
      value: stats.mostAccessedTable,
      icon: AlertTriangle,
      description: "Dados mais consultados",
    },
  ];

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
