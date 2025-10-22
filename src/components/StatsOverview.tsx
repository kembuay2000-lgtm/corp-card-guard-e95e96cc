import { AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatsOverview() {
  const stats = [
    {
      title: "Transações Analisadas",
      value: "12,847",
      change: "+2,341 este mês",
      icon: DollarSign,
      variant: "default" as const,
    },
    {
      title: "Alertas Críticos",
      value: "23",
      change: "Requerem ação",
      icon: AlertTriangle,
      variant: "destructive" as const,
    },
    {
      title: "Conformes",
      value: "12,689",
      change: "98.8% conformidade",
      icon: CheckCircle,
      variant: "success" as const,
    },
    {
      title: "Em Análise",
      value: "135",
      change: "Aguardando RH",
      icon: Clock,
      variant: "warning" as const,
    },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Visão Geral da Auditoria</h2>
          <p className="text-muted-foreground">
            Monitoramento consolidado das transações de janeiro a outubro 2025
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
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
