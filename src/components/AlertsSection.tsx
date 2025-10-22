import { AlertCircle, Calendar, CreditCard, DollarSign, MapPin, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Alert {
  id: string;
  type: "high" | "medium" | "low";
  title: string;
  description: string;
  amount: string;
  date: string;
  location: string;
  cardHolder: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "high",
    title: "Transação acima do limite diário",
    description: "Três transações consecutivas totalizando R$ 18.500 em 24 horas",
    amount: "R$ 18.500,00",
    date: "15/10/2025",
    location: "São Paulo - SP",
    cardHolder: "Executivo A",
  },
  {
    id: "2",
    type: "high",
    title: "Compra em final de semana",
    description: "Transação realizada no sábado fora do horário comercial",
    amount: "R$ 3.200,00",
    date: "19/10/2025",
    location: "Rio de Janeiro - RJ",
    cardHolder: "Executivo B",
  },
  {
    id: "3",
    type: "medium",
    title: "Categoria atípica para o portador",
    description: "Primeira transação em categoria 'Entretenimento' nos últimos 6 meses",
    amount: "R$ 1.450,00",
    date: "20/10/2025",
    location: "Brasília - DF",
    cardHolder: "Executivo C",
  },
  {
    id: "4",
    type: "medium",
    title: "Múltiplas transações mesmo estabelecimento",
    description: "5 transações no mesmo dia no mesmo local",
    amount: "R$ 2.890,00",
    date: "21/10/2025",
    location: "Curitiba - PR",
    cardHolder: "Executivo D",
  },
];

export function AlertsSection() {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Alertas e Irregularidades</h2>
              <p className="text-muted-foreground">
                Transações que requerem análise da equipe de auditoria
              </p>
            </div>
            <Button variant="outline">Ver Todos</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockAlerts.map((alert) => (
            <Card key={alert.id} className="hover:shadow-lg transition-shadow border-l-4" 
                  style={{ 
                    borderLeftColor: 
                      alert.type === "high" ? "hsl(var(--destructive))" : 
                      alert.type === "medium" ? "hsl(var(--accent))" : 
                      "hsl(var(--muted))" 
                  }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className={`w-5 h-5 ${
                        alert.type === "high" ? "text-destructive" : 
                        alert.type === "medium" ? "text-accent" : 
                        "text-muted-foreground"
                      }`} />
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                  <Badge variant={alert.type === "high" ? "destructive" : "warning"}>
                    {alert.type === "high" ? "Crítico" : alert.type === "medium" ? "Médio" : "Baixo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{alert.amount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{alert.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{alert.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{alert.cardHolder}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">Investigar</Button>
                  <Button size="sm" variant="outline" className="flex-1">Marcar como Revisado</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
