import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Home, FileText, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";

export function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const canGoBack = window.history.length > 1;

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-lg">Sistema de Auditoria</span>
            </div>
            
            <div className="flex items-center gap-2">
              {canGoBack && location.pathname !== "/" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              )}
              <Button
                variant={location.pathname === "/" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Início
              </Button>
              <Button
                variant={location.pathname === "/transactions" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/transactions")}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Transações
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {userRole && (
              <Badge variant={
                userRole === 'admin' ? 'default' : 
                userRole === 'auditor' ? 'success' : 
                'secondary'
              }>
                {userRole === 'admin' ? 'Administrador' : 
                 userRole === 'auditor' ? 'Auditor' : 
                 'RH'}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
