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
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        const isValidType = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ].includes(file.type);
        const isValidSize = file.size <= 10485760; // 10MB

        if (!isValidType) {
          toast({
            title: "Tipo de arquivo inválido",
            description: `${file.name} não é um tipo de arquivo permitido.`,
            variant: "destructive",
          });
        }
        if (!isValidSize) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede o limite de 10MB.`,
            variant: "destructive",
          });
        }
        return isValidType && isValidSize;
      });
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

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

      const { data: justificationData, error } = await supabase
        .from("alert_justifications")
        .insert({
          alert_id: alertId,
          submitted_by: user.id,
          justification_text: justification,
          approval_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Upload files if any
      if (selectedFiles.length > 0 && justificationData) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('alert-attachments')
            .upload(fileName, file);

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            continue;
          }

          // Save attachment record
          const { data: urlData } = supabase.storage
            .from('alert-attachments')
            .getPublicUrl(fileName);

          await supabase.from("alert_attachments").insert({
            justification_id: justificationData.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
          });
        }
      }

      toast({
        title: "Sucesso",
        description: "Justificativa enviada para análise.",
      });

      setJustification("");
      setSelectedFiles([]);
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

          <div className="space-y-2">
            <Label htmlFor="attachments">Anexos (opcional)</Label>
            <div className="space-y-2">
              <Input
                id="attachments"
                type="file"
                onChange={handleFileSelect}
                disabled={isSubmitting}
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB por arquivo)
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
