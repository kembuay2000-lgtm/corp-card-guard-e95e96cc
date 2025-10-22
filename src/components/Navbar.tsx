import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { user, userRole, signOut } = useAuth();

  if (!user) return null;

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-lg">Sistema de Auditoria</span>
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
