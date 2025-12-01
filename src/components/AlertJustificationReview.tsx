import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Download, FileText } from "lucide-react";

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
}

interface Justification {
  id: string;
  justification_text: string;
  submitted_at: string;
  approval_status: string;
  reviewer_comments: string | null;
  reviewed_at: string | null;
  attachments?: Attachment[];
}

interface AlertJustificationReviewProps {
  alertId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AlertJustificationReview = ({
  alertId,
  open,
  onOpenChange,
  onSuccess,
}: AlertJustificationReviewProps) => {
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [selectedJustification, setSelectedJustification] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchJustifications();
    }
  }, [open, alertId]);

  const fetchJustifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("alert_justifications")
        .select(`
          *,
          attachments:alert_attachments(*)
        `)
        .eq("alert_id", alertId)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setJustifications(data || []);
    } catch (error: any) {
      console.error("Error fetching justifications:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar justificativas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (justificationId: string, status: "approved" | "rejected") => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("alert_justifications")
        .update({
          approval_status: status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_comments: reviewComments || null,
        })
        .eq("id", justificationId);

      if (error) throw error;

      // Se aprovado, atualizar status do alerta
      if (status === "approved") {
        await supabase
          .from("alerts")
          .update({ status: "resolved" })
          .eq("id", alertId);
      }

      toast({
        title: "Sucesso",
        description: `Justificativa ${status === "approved" ? "aprovada" : "rejeitada"} com sucesso.`,
      });

      setReviewComments("");
      setSelectedJustification(null);
      fetchJustifications();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error reviewing justification:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao revisar justificativa.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Justificativas do Alerta</DialogTitle>
          <DialogDescription>
            Revise as justificativas enviadas e aprove ou rejeite cada uma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : justifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma justificativa enviada ainda.
            </p>
          ) : (
            justifications.map((justification) => (
              <Card key={justification.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Enviado em {new Date(justification.submitted_at).toLocaleString("pt-BR")}
                        </p>
                        <Badge
                          variant={
                            justification.approval_status === "approved"
                              ? "default"
                              : justification.approval_status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {justification.approval_status === "approved"
                            ? "Aprovada"
                            : justification.approval_status === "rejected"
                            ? "Rejeitada"
                            : "Pendente"}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label>Justificativa:</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">
                        {justification.justification_text}
                      </p>
                    </div>

                    {justification.attachments && justification.attachments.length > 0 && (
                      <div>
                        <Label>Anexos:</Label>
                        <div className="space-y-2 mt-2">
                          {justification.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm flex-1 truncate">{attachment.file_name}</span>
                              {attachment.file_size && (
                                <Badge variant="secondary" className="text-xs">
                                  {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(attachment.file_url, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {justification.reviewer_comments && (
                      <div>
                        <Label>Comentários do Revisor:</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {justification.reviewer_comments}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Revisado em {new Date(justification.reviewed_at!).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    )}

                    {justification.approval_status === "pending" && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="space-y-2">
                          <Label htmlFor={`comments-${justification.id}`}>
                            Comentários da Revisão (opcional)
                          </Label>
                          <Textarea
                            id={`comments-${justification.id}`}
                            value={
                              selectedJustification === justification.id ? reviewComments : ""
                            }
                            onChange={(e) => {
                              setSelectedJustification(justification.id);
                              setReviewComments(e.target.value);
                            }}
                            placeholder="Adicione comentários sobre sua decisão..."
                            className="min-h-[80px]"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReview(justification.id, "approved")}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            {isSubmitting && selectedJustification === justification.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReview(justification.id, "rejected")}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            {isSubmitting && selectedJustification === justification.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
