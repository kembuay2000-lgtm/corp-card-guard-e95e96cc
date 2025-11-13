import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const TransactionImport = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    inserted: number;
    errors: number;
    total: number;
    skipped?: number;
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

      if (error) throw error;

      setUploadResult(data);
      
      if (data.success) {
        toast({
          title: "Importação concluída!",
          description: `${data.inserted.toLocaleString('pt-BR')} transações importadas.`,
        });

        setIsAnalyzing(true);
        try {
          await supabase.functions.invoke('detect-anomalies');
          toast({
            title: "Análise concluída",
            description: "Detecção de anomalias executada com sucesso.",
          });
        } catch (error) {
          console.error('Error in anomaly detection:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (error: any) {
      console.error('Error importing transactions:', error);
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleManualAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-anomalies');
      if (error) throw error;
      toast({
        title: "Análise concluída",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Transações CPGF
        </CardTitle>
        <CardDescription>
          Faça upload do arquivo CSV com as transações do CPGF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button disabled={isUploading || isAnalyzing} asChild>
              <span className="cursor-pointer">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar CSV
                  </>
                )}
              </span>
            </Button>
          </label>
          <Button onClick={handleManualAnalysis} disabled={isAnalyzing || isUploading} variant="outline">
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Detectar Anomalias
              </>
            )}
          </Button>
        </div>

        {uploadResult && (
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-start gap-3">
              {uploadResult.errors === 0 ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <h4 className="font-semibold mb-2">Resultado</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>Processados: {uploadResult.total.toLocaleString('pt-BR')}</li>
                  <li className="text-success">Importados: {uploadResult.inserted.toLocaleString('pt-BR')}</li>
                  {uploadResult.errors > 0 && <li className="text-destructive">Erros: {uploadResult.errors}</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
