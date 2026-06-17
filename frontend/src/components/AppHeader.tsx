import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Box, Users, Calculator } from "lucide-react";

import { clearAuth, getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const navigate = useNavigate();
  const user = getUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = () => {
    clearAuth();
    navigate({ to: "/login", replace: true });
  };

  const navItems = [
    ...(user?.role === "master"
      ? [{ to: "/app/usuarios", label: "Usuários", icon: Users }]
      : []),
    { to: "/app/calculadora", label: "Calculadora", icon: Calculator },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/app" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
            <Box className="h-5 w-5" />
          </div>
          <span className="hidden text-lg font-bold text-gradient sm:inline">
            Precificação 3D
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-sm text-muted-foreground">{user.username}</span>
              <Badge
                className={cn(
                  "border-transparent",
                  user.role === "master"
                    ? "bg-primary text-primary-foreground"
                    : "bg-success text-success-foreground",
                )}
              >
                {user.role === "master" ? "Master" : "Comum"}
              </Badge>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
