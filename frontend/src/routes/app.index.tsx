import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/app/")({
  component: AppIndex,
});

function AppIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUser();
    if (user?.role === "master") {
      navigate({ to: "/app/usuarios", replace: true });
    } else {
      navigate({ to: "/app/calculadora", replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Redirecionando…
    </div>
  );
}
