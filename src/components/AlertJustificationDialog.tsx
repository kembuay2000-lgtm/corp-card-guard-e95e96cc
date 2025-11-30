import { useState } from "react";
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
import { Loader2 } from "lucide-react";

interface AlertJustificationDialogProps {
  alertId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AlertJustificationDialog = ({
  alertId,
  open,
  onOpenChange,
  onSuccess,
}: AlertJustificationDialogProps) => {
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!justification.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, forneça uma justificativa.",
        variant: "destructive",
      });
      return;
    }

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
        .insert({
          alert_id: alertId,
          submitted_by: user.id,
          justification_text: justification,
          approval_status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Justificativa enviada para análise.",
      });

      setJustification("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting justification:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar justificativa.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enviar Justificativa</DialogTitle>
          <DialogDescription>
            Forneça uma justificativa detalhada para este alerta. A equipe de auditoria irá revisar sua justificativa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="justification">Justificativa *</Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Descreva em detalhes a justificativa para esta transação ou situação..."
              className="min-h-[150px]"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Justificativa"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
