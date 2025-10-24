import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const TransactionImport = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    inserted: number;
    errors: number;
    total: number;
  } | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const csvContent = await file.text();

      const { data, error } = await supabase.functions.invoke('import-transactions', {
        body: { csvContent }
      });

      if (error) {
        throw error;
      }

      setUploadResult(data);
      
      if (data.success) {
        toast({
          title: "Importação concluída!",
          description: `${data.inserted} transações importadas com sucesso${data.errors > 0 ? ` (${data.errors} erros)` : ''}.`,
        });
      }
    } catch (error: any) {
      console.error('Error importing transactions:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Não foi possível importar as transações.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Transações CPGF</CardTitle>
        <CardDescription>
          Faça upload do arquivo CSV com as transações do Cartão de Pagamento do Governo Federal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button
              disabled={isUploading}
              asChild
            >
              <span className="cursor-pointer">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar arquivo CSV
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>

        {uploadResult && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              {uploadResult.errors === 0 ? (
                <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Resultado da Importação</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>Total de registros processados: {uploadResult.total}</li>
                  <li>Importados com sucesso: {uploadResult.inserted}</li>
                  {uploadResult.errors > 0 && (
                    <li className="text-destructive">Erros: {uploadResult.errors}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Formato esperado do arquivo:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Arquivo CSV com separador de ponto e vírgula (;)</li>
            <li>Primeira linha com cabeçalhos</li>
            <li>Formato de data: DD/MM/YYYY</li>
            <li>Formato de valor: com vírgula como separador decimal</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
