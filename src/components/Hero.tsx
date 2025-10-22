import { Shield, TrendingUp, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Sistema de Auditoria Contínua</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 tracking-tight">
            Auditoria de Cartão Corporativo
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Monitoramento automatizado e contínuo das transações do cartão corporativo, 
            identificando irregularidades e garantindo conformidade em tempo real.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Button size="lg" className="gap-2">
              <FileSearch className="w-5 h-5" />
              Visualizar Alertas
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <TrendingUp className="w-5 h-5" />
              Dashboard
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Conformidade Garantida</h3>
              <p className="text-sm text-muted-foreground">
                Regras de auditoria automáticas para identificar transações suspeitas
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Análise em Tempo Real</h3>
              <p className="text-sm text-muted-foreground">
                Processamento mensal automático com alertas imediatos
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <FileSearch className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Rastreabilidade Total</h3>
              <p className="text-sm text-muted-foreground">
                Histórico completo de todas as transações e investigações
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
