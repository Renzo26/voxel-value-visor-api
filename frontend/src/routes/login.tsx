import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Box, AlertCircle } from "lucide-react";

import { api } from "@/lib/api";
import { setAuth, isAuthenticated, type Session } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Entrar — Calculadora de Precificação 3D" }],
  }),
  component: LoginPage,
});

const schema = z.object({
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().min(1, "Informe a senha"),
});
type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.post<Session>("/auth/login", values),
    onSuccess: (session) => {
      setAuth(session);
      if (session.user.role === "master") {
        navigate({ to: "/app/usuarios", replace: true });
      } else {
        navigate({ to: "/app/calculadora", replace: true });
      }
    },
    onError: () => {
      setError("Usuário ou senha incorretos!");
    },
  });

  if (isAuthenticated()) {
    return <Navigate to="/app" replace />;
  }

  const onSubmit = (values: FormValues) => {
    setError(null);
    mutation.mutate(values);
  };

  const enterAsDev = () => {
    setAuth({
      access_token: "dev-token",
      refresh_token: "dev-refresh",
      user: { id: "dev", username: "dev", role: "master" },
    });
    navigate({ to: "/app/usuarios", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 shadow-soft">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground">
            <Box className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">Precificação 3D</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse para calcular o preço de venda ideal das suas peças.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              autoComplete="username"
              placeholder="seu.usuario"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative mb-4 flex items-center">
            <div className="flex-grow border-t border-border" />
            <span className="mx-3 text-xs text-muted-foreground">ou</span>
            <div className="flex-grow border-t border-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={enterAsDev}
          >
            Entrar como Dev (master)
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Acesso local sem backend, apenas para visualizar a interface.
          </p>
        </div>
      </Card>
    </div>
  );
}
