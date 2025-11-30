import { useEffect, useState } from "react";
import { AlertCircle, Calendar, DollarSign, MapPin, User, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertJustificationDialog } from "./AlertJustificationDialog";
import { AlertJustificationReview } from "./AlertJustificationReview";

interface Alert {
  id: string;
  severity: string;
  title: string;
  description: string;
  amount: number;
  alert_date: string;
  location: string | null;
  card_holder: string;
  status: string;
}

export function AlertsSection() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [justificationDialogOpen, setJustificationDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'pending')
        .order('alert_date', { ascending: false })
        .limit(showAll ? 100 : 4);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Erro ao carregar alertas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvestigate = (alertId: string) => {
    toast({
      title: "Investigação iniciada",
      description: "Alerta marcado para investigação detalhada.",
    });
    // Aqui você pode adicionar navegação para uma página de detalhes
  };

  const handleMarkAsReviewed = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('alerts')
        .update({ 
          status: 'reviewed',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alerta revisado",
        description: "O alerta foi marcado como revisado com sucesso.",
      });

      // Recarregar alertas
      fetchAlerts();
    } catch (error: any) {
      console.error('Error updating alert:', error);
      toast({
        title: "Erro ao atualizar alerta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground">Carregando alertas...</p>
        </div>
      </section>
    );
  }

  if (alerts.length === 0) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Alertas e Irregularidades</h2>
            <p className="text-muted-foreground">
              Transações que requerem análise da equipe de auditoria
            </p>
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum alerta pendente no momento. Importe transações para começar a auditoria.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-muted/30 alerts-section">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Alertas e Irregularidades</h2>
              <p className="text-muted-foreground">
                Transações que requerem análise da equipe de auditoria
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAll(!showAll);
                fetchAlerts();
              }}
            >
              {showAll ? "Ver Menos" : "Ver Todos"}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {alerts.map((alert) => (
            <Card 
              key={alert.id} 
              className="hover:shadow-lg transition-shadow border-l-4" 
              style={{ 
                borderLeftColor: 
                  alert.severity === "high" ? "hsl(var(--destructive))" : 
                  alert.severity === "medium" ? "hsl(var(--accent))" : 
                  "hsl(var(--muted))" 
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className={`w-5 h-5 ${
                        alert.severity === "high" ? "text-destructive" : 
                        alert.severity === "medium" ? "text-accent" : 
                        "text-muted-foreground"
                      }`} />
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                  <Badge variant={alert.severity === "high" ? "destructive" : "warning"}>
                    {alert.severity === "high" ? "Crítico" : alert.severity === "medium" ? "Médio" : "Baixo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(alert.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(alert.alert_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                  {alert.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{alert.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{alert.card_holder}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedAlertId(alert.id);
                        setJustificationDialogOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Justificar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedAlertId(alert.id);
                        setReviewDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Revisar
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleInvestigate(alert.id)}
                    >
                      Investigar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleMarkAsReviewed(alert.id)}
                    >
                      Marcar como Revisado
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedAlertId && (
        <>
          <AlertJustificationDialog
            alertId={selectedAlertId}
            open={justificationDialogOpen}
            onOpenChange={setJustificationDialogOpen}
            onSuccess={fetchAlerts}
          />
          <AlertJustificationReview
            alertId={selectedAlertId}
            open={reviewDialogOpen}
            onOpenChange={setReviewDialogOpen}
            onSuccess={fetchAlerts}
          />
        </>
      )}
    </section>
  );
}
