import { CheckCircle2, AlertTriangle, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TestsProgram() {
  const tests2025 = [
    {
      id: 1,
      name: "Saques de Alto Valor",
      description: "Detecta saques acima de R$ 2.000 que podem indicar uso inadequado",
      status: "active",
    },
    {
      id: 2,
      name: "Múltiplas Transações Diárias",
      description: "Identifica mais de 5 transações no mesmo dia pelo mesmo portador",
      status: "active",
    },
    {
      id: 3,
      name: "Transações em Finais de Semana",
      description: "Alerta sobre transações acima de R$ 500 realizadas em sábados e domingos",
      status: "active",
    },
    {
      id: 4,
      name: "Fracionamento Suspeito",
      description: "Detecta 3 ou mais transações de valores similares no mesmo dia (possível tentativa de evasão de limite)",
      status: "active",
    },
    {
      id: 5,
      name: "Concentração de Fornecedor",
      description: "Identifica quando mais de 70% dos gastos estão concentrados em um único fornecedor (5+ transações)",
      status: "active",
    },
    {
      id: 6,
      name: "Portadores Inativos",
      description: "Detecta portadores sem histórico nos últimos 60 dias que realizaram transação recente",
      status: "active",
    },
    {
      id: 7,
      name: "Lei de Benford",
      description: "Analisa distribuição dos primeiros dígitos das transações para detectar possível manipulação de valores",
      status: "active",
    },
  ];

  const tests2026 = [
    {
      id: 8,
      name: "Anomalia Geográfica",
      description: "Detecta transações em localizações muito distantes em curto período (< 4 horas entre transações em locais diferentes)",
      status: "active",
    },
    {
      id: 9,
      name: "Frequência em Estabelecimentos",
      description: "Identifica padrões suspeitos de uso repetido (> 10 transações no mesmo estabelecimento com alta frequência)",
      status: "active",
    },
    {
      id: 10,
      name: "Auditoria de Acesso aos Dados",
      description: "Registra todos os acessos aos dados sensíveis (SELECT, UPDATE) com IP, user agent e timestamp para trilha de auditoria",
      status: "active",
    },
    {
      id: 11,
      name: "Análise de Padrões Históricos",
      description: "Compara gastos mensais com média dos últimos 6 meses usando ML",
      status: "planned",
    },
    {
      id: 12,
      name: "Detecção de Anomalias por ML",
      description: "Utiliza machine learning para identificar padrões anômalos complexos de gasto",
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
                <Calendar className="w-5 h-5 text-success" />
                <h3 className="text-2xl font-semibold">Escopo 2026 - Auditoria Contínua Implementada</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                10 testes implementados e em execução, com 2 testes adicionais planejados
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tests2026.map((test) => (
                  <Card key={test.id} className={`hover:shadow-md transition-shadow ${test.status === 'active' ? '' : 'border-accent/30'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{test.name}</CardTitle>
                        {test.status === 'active' ? (
                          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0" />
                        )}
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
                Controles de Segurança e Workflow Implementados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Acesso restrito por autenticação e autorização de usuários com roles (admin, auditor, rh)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Sistema de workflow para justificativas de alertas com aprovação/rejeição</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Portadores podem enviar justificativas com documentação anexa (PDF, imagens, Word até 10MB)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Storage seguro de anexos com políticas de acesso controlado por RLS</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Gestores e auditores podem aprovar/rejeitar justificativas com comentários e visualização de anexos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Logs de auditoria automáticos registrando ação, usuário, tabela, IP e user agent para todas as consultas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Row Level Security (RLS) implementado em todas as tabelas do banco de dados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Registro completo de todas as revisões de alertas com timestamp e identificação do revisor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Edge Functions para processamento seguro de importação, detecção de anomalias e logs de auditoria</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
