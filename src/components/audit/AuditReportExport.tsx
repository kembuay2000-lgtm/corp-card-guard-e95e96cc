import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function AuditReportExport() {
  const [exporting, setExporting] = useState(false);

  const generatePDF = async () => {
    setExporting(true);
    try {
      // Fetch all data
      const [logsResult, justificationsResult, alertsResult] = await Promise.all([
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }),
        supabase.from("alert_justifications").select("*, alerts(title, alert_type, severity)"),
        supabase.from("alerts").select("*").order("created_at", { ascending: false }),
      ]);

      if (logsResult.error) throw logsResult.error;
      if (justificationsResult.error) throw justificationsResult.error;
      if (alertsResult.error) throw alertsResult.error;

      const logs = logsResult.data || [];
      const justifications = justificationsResult.data || [];
      const alerts = alertsResult.data || [];

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Auditoria", pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pageWidth / 2, 28, {
        align: "center",
      });

      let yPos = 40;

      // Summary Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Executivo", 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`• Total de logs de acesso: ${logs.length}`, 14, yPos);
      yPos += 6;
      doc.text(`• Total de alertas: ${alerts.length}`, 14, yPos);
      yPos += 6;
      doc.text(`• Justificativas submetidas: ${justifications.length}`, 14, yPos);
      yPos += 6;

      const approvedCount = justifications.filter((j) => j.approval_status === "approved").length;
      const rejectedCount = justifications.filter((j) => j.approval_status === "rejected").length;
      const pendingCount = justifications.filter((j) => j.approval_status === "pending" || !j.approval_status).length;

      doc.text(`• Justificativas aprovadas: ${approvedCount}`, 14, yPos);
      yPos += 6;
      doc.text(`• Justificativas rejeitadas: ${rejectedCount}`, 14, yPos);
      yPos += 6;
      doc.text(`• Justificativas pendentes: ${pendingCount}`, 14, yPos);
      yPos += 15;

      // Audit Logs Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Logs de Acesso", 14, yPos);
      yPos += 5;

      if (logs.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Data/Hora", "Usuário", "Ação", "Tabela", "IP"]],
          body: logs.slice(0, 50).map((log) => [
            new Date(log.created_at).toLocaleString("pt-BR"),
            log.user_id.slice(0, 8) + "...",
            log.action,
            log.table_name,
            log.ip_address || "N/A",
          ]),
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Alerts Timeline Section
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Timeline de Alertas", 14, yPos);
      yPos += 5;

      if (alerts.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Data", "Título", "Tipo", "Severidade", "Status"]],
          body: alerts.slice(0, 30).map((alert) => [
            new Date(alert.alert_date).toLocaleDateString("pt-BR"),
            alert.title.slice(0, 30),
            alert.alert_type,
            alert.severity,
            alert.status,
          ]),
          theme: "striped",
          headStyles: { fillColor: [239, 68, 68] },
          styles: { fontSize: 8 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Justifications Section
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Justificativas e Decisões", 14, yPos);
      yPos += 5;

      if (justifications.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Data Submissão", "Alerta", "Status", "Comentários"]],
          body: justifications.map((j) => [
            new Date(j.submitted_at).toLocaleDateString("pt-BR"),
            (j.alerts as any)?.title?.slice(0, 25) || "N/A",
            j.approval_status === "approved"
              ? "Aprovada"
              : j.approval_status === "rejected"
              ? "Rejeitada"
              : "Pendente",
            j.reviewer_comments?.slice(0, 40) || "-",
          ]),
          theme: "striped",
          headStyles: { fillColor: [34, 197, 94] },
          styles: { fontSize: 8 },
        });
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Página ${i} de ${pageCount} | Sistema de Auditoria Contínua`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save PDF
      doc.save(`relatorio-auditoria-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Exportar Relatório de Auditoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Gere um relatório completo em PDF contendo todos os logs de acesso,
              justificativas aprovadas/rejeitadas, e timeline completo de cada
              alerta para compliance e documentação oficial.
            </p>
          </div>
          <Button onClick={generatePDF} disabled={exporting} className="gap-2">
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
