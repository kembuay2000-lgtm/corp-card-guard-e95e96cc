import { CheckCircle2, AlertTriangle, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TestsProgram() {
  const tests2025 = [
    {
      id: 1,
      name: "Limite de Valor Diário",
      description: "Identifica transações acima de R$ 5.000 em um único dia",
      status: "active",
    },
    {
      id: 2,
      name: "Transações Consecutivas",
      description: "Detecta 3 ou mais transações em dias consecutivos que somem R$ 10.000",
      status: "active",
    },
    {
      id: 3,
      name: "Compras em Finais de Semana",
      description: "Alerta sobre transações realizadas em sábados e domingos",
      status: "active",
    },
    {
      id: 4,
      name: "Horário Fora do Expediente",
      description: "Verifica transações fora do horário comercial (antes das 7h ou após 19h)",
      status: "active",
    },
    {
      id: 5,
      name: "Categorias Atípicas",
      description: "Identifica compras em categorias incomuns para o perfil do usuário",
      status: "active",
    },
    {
      id: 6,
      name: "Múltiplas Transações Mesmo Local",
      description: "Detecta mais de 4 transações no mesmo estabelecimento em 24h",
      status: "active",
    },
  ];

  const tests2026 = [
    {
      id: 7,
      name: "Análise de Padrões Históricos",
      description: "Compara gastos mensais com média dos últimos 6 meses",
      status: "planned",
    },
    {
      id: 8,
      name: "Detecção de Anomalias por ML",
      description: "Utiliza machine learning para identificar padrões anômalos de gasto",
      status: "planned",
    },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Programa de Testes de Auditoria</h2>
            <p className="text-muted-foreground">
              Regras automatizadas para detecção de irregularidades
            </p>
          </div>
          
          <div className="space-y-8">
            {/* Tests 2025 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-2xl font-semibold">Escopo 2025 - Análise Completa</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tests2025.map((test) => (
                  <Card key={test.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{test.name}</CardTitle>
                        <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{test.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Tests 2026 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-accent" />
                <h3 className="text-2xl font-semibold">Escopo 2026 - Auditoria Contínua</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Novos testes baseados nos resultados da análise de 2025, executados mensalmente
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tests2026.map((test) => (
                  <Card key={test.id} className="hover:shadow-md transition-shadow border-accent/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{test.name}</CardTitle>
                        <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{test.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Data Access Control */}
          <Card className="mt-8 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Controles de Segurança Implementados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Acesso restrito por autenticação e autorização de usuários</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Logs de auditoria para todas as consultas aos dados sensíveis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Dados pessoais (CPF) mascarados na interface para usuários do RH</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Cópia mensal dos arquivos realizada por funcionário autorizado com registro completo</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
