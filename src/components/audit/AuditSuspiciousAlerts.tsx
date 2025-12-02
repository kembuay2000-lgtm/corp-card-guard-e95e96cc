import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Clock, Globe, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SuspiciousActivity {
  id: string;
  type: "unusual_hour" | "multiple_ips" | "high_frequency";
  description: string;
  user_id: string;
  timestamp: string;
  severity: "high" | "medium" | "low";
}

export function AuditSuspiciousAlerts() {
  const [alerts, setAlerts] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectSuspiciousActivity();
  }, []);

  const detectSuspiciousActivity = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const suspiciousActivities: SuspiciousActivity[] = [];

      if (logs && logs.length > 0) {
        // Detect unusual hours (before 6am or after 10pm)
        logs.forEach((log) => {
          const hour = new Date(log.created_at).getHours();
          if (hour < 6 || hour >= 22) {
            suspiciousActivities.push({
              id: `unusual_${log.id}`,
              type: "unusual_hour",
              description: `Acesso em horário incomum (${hour}:00)`,
              user_id: log.user_id.slice(0, 8),
              timestamp: log.created_at,
              severity: hour < 4 || hour >= 23 ? "high" : "medium",
            });
          }
        });

        // Detect multiple IPs for same user
        const userIps: Record<string, Set<string>> = {};
        logs.forEach((log) => {
          if (log.ip_address && log.ip_address !== "Unknown") {
            if (!userIps[log.user_id]) {
              userIps[log.user_id] = new Set();
            }
            userIps[log.user_id].add(log.ip_address);
          }
        });

        Object.entries(userIps).forEach(([userId, ips]) => {
          if (ips.size >= 3) {
            suspiciousActivities.push({
              id: `multi_ip_${userId}`,
              type: "multiple_ips",
              description: `Usuário com ${ips.size} IPs diferentes`,
              user_id: userId.slice(0, 8),
              timestamp: new Date().toISOString(),
              severity: ips.size >= 5 ? "high" : "medium",
            });
          }
        });

        // Detect high frequency access (>20 actions in 1 hour)
        const userHourlyActivity: Record<string, Record<string, number>> = {};
        logs.forEach((log) => {
          const hourKey = new Date(log.created_at).toISOString().slice(0, 13);
          if (!userHourlyActivity[log.user_id]) {
            userHourlyActivity[log.user_id] = {};
          }
          userHourlyActivity[log.user_id][hourKey] =
            (userHourlyActivity[log.user_id][hourKey] || 0) + 1;
        });

        Object.entries(userHourlyActivity).forEach(([userId, hours]) => {
          Object.entries(hours).forEach(([hourKey, count]) => {
            if (count >= 20) {
              suspiciousActivities.push({
                id: `high_freq_${userId}_${hourKey}`,
                type: "high_frequency",
                description: `${count} acessos em 1 hora`,
                user_id: userId.slice(0, 8),
                timestamp: `${hourKey}:00:00.000Z`,
                severity: count >= 50 ? "high" : "medium",
              });
            }
          });
        });

        // Sort by timestamp and limit
        suspiciousActivities.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }

      setAlerts(suspiciousActivities.slice(0, 10));
    } catch (error) {
      console.error("Error detecting suspicious activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: SuspiciousActivity["type"]) => {
    switch (type) {
      case "unusual_hour":
        return <Clock className="h-4 w-4" />;
      case "multiple_ips":
        return <Globe className="h-4 w-4" />;
      case "high_frequency":
        return <User className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: SuspiciousActivity["severity"]) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Alertas de Atividade Suspeita
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px]">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma atividade suspeita detectada
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="p-2 rounded-full bg-muted">
                    {getIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {alert.description}
                      </span>
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity === "high"
                          ? "Alto"
                          : alert.severity === "medium"
                          ? "Médio"
                          : "Baixo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Usuário: ...{alert.user_id} •{" "}
                      {new Date(alert.timestamp).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
