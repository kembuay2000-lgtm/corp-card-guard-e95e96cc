import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export function StatsOverview() {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    criticalAlerts: 0,
    compliant: 0,
    inReview: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Buscar total de transações
      const { count: totalTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      // Buscar alertas críticos (pendentes)
      const { count: criticalAlerts } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'high')
        .eq('status', 'pending');

      // Buscar alertas em análise
      const { count: inReview } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Calcular conformes (transações sem alertas críticos)
      const compliant = (totalTransactions || 0) - (inReview || 0);

      setStats({
        totalTransactions: totalTransactions || 0,
        criticalAlerts: criticalAlerts || 0,
        compliant: compliant > 0 ? compliant : 0,
        inReview: inReview || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayStats = [
    {
      title: "Transações Analisadas",
      value: loading ? "..." : stats.totalTransactions.toLocaleString('pt-BR'),
      change: "Total importado",
      icon: DollarSign,
      variant: "default" as const,
    },
    {
      title: "Alertas Críticos",
      value: loading ? "..." : stats.criticalAlerts.toString(),
      change: "Requerem ação",
      icon: AlertTriangle,
      variant: "destructive" as const,
    },
    {
      title: "Conformes",
      value: loading ? "..." : stats.compliant.toLocaleString('pt-BR'),
      change: stats.totalTransactions > 0 
        ? `${((stats.compliant / stats.totalTransactions) * 100).toFixed(1)}% conformidade`
        : "0% conformidade",
      icon: CheckCircle,
      variant: "success" as const,
    },
    {
      title: "Em Análise",
      value: loading ? "..." : stats.inReview.toString(),
      change: "Aguardando revisão",
      icon: Clock,
      variant: "warning" as const,
    },
  ];

  return (
    <section className="py-12 bg-background stats-section">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Visão Geral da Auditoria</h2>
          <p className="text-muted-foreground">
            Monitoramento consolidado das transações de janeiro a outubro 2025
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat, index) => {
            const Icon = stat.icon;
            const bgColorClass = 
              stat.variant === "destructive" ? "bg-destructive/10" :
              stat.variant === "success" ? "bg-success/10" :
              stat.variant === "warning" ? "bg-accent/10" :
              "bg-primary/10";
            
            const iconColorClass = 
              stat.variant === "destructive" ? "text-destructive" :
              stat.variant === "success" ? "text-success" :
              stat.variant === "warning" ? "text-accent" :
              "text-primary";
            
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${bgColorClass}`}>
                    <Icon className={`w-4 h-4 ${iconColorClass}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
