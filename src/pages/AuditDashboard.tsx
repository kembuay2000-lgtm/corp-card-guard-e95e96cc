import { Navbar } from "@/components/Navbar";
import { AuditStats } from "@/components/audit/AuditStats";
import { AuditActivityChart } from "@/components/audit/AuditActivityChart";
import { AuditSuspiciousAlerts } from "@/components/audit/AuditSuspiciousAlerts";
import { AuditReportExport } from "@/components/audit/AuditReportExport";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useEffect } from "react";

const AuditDashboard = () => {
  const { logAction } = useAuditLog();

  useEffect(() => {
    logAction('VIEW', 'audit_logs');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Auditoria</h1>
          <p className="text-muted-foreground mt-2">
            Análise detalhada de logs de acesso e estatísticas de segurança
          </p>
        </div>

        <div className="grid gap-6">
          <AuditStats />
          
          <div className="grid lg:grid-cols-2 gap-6">
            <AuditActivityChart />
            <AuditSuspiciousAlerts />
          </div>

          <AuditReportExport />
        </div>
      </div>
    </div>
  );
};

export default AuditDashboard;
