import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, ArrowRight, ShieldCheck, User as UserIcon } from "lucide-react";

import { api } from "@/lib/api";
import { getUser, type User } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Precificação 3D" }] }),
  component: UsuariosPage,
});

const schema = z.object({
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().min(4, "Senha de no mínimo 4 caracteres"),
  role: z.enum(["comum", "master"]),
});
type FormValues = z.infer<typeof schema>;

function UsuariosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // role guard: usuários comuns são redirecionados
  useEffect(() => {
    const u = getUser();
    if (u && u.role !== "master") {
      navigate({ to: "/app/calculadora", replace: true });
    }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", role: "comum" },
  });
  const roleValue = watch("role");

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users"),
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.post<User>("/users", values),
    onSuccess: () => {
      toast.success("Usuário cadastrado com sucesso!");
      reset({ username: "", password: "", role: "comum" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao cadastrar usuário."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => api.delete<void>(`/users/${id}`),
    onSuccess: () => {
      toast.success("Usuário excluído.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao excluir usuário."),
  });



  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Painel Gerencial</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre e gerencie os usuários do sistema.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/app/calculadora" })}>
          Ir para a Calculadora <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4" /> Cadastrar usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((v) => createMutation.mutate(v))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="new-username">Usuário</Label>
                <Input id="new-username" placeholder="nome.usuario" {...register("username")} />
                {errors.username && (
                  <p className="text-xs text-destructive">{errors.username.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nível</Label>
                <Select
                  value={roleValue}
                  onValueChange={(v) => setValue("role", v as FormValues["role"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comum">Usuário Comum</SelectItem>
                    <SelectItem value="master">Administrador Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Cadastrar usuário
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Usuários cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : usersQuery.isError ? (
              <p className="text-sm text-destructive">
                {(usersQuery.error as Error).message || "Erro ao carregar usuários."}
              </p>
            ) : !usersQuery.data?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum usuário cadastrado ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.data.map((u) => {
                    const protectedUser = u.username === "admin";
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-transparent",
                              u.role === "master"
                                ? "bg-primary text-primary-foreground"
                                : "bg-success text-success-foreground",
                            )}
                          >
                            {u.role === "master" ? (
                              <ShieldCheck className="mr-1 h-3 w-3" />
                            ) : (
                              <UserIcon className="mr-1 h-3 w-3" />
                            )}
                            {u.role === "master" ? "Master" : "Comum"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {protectedUser ? (
                            <span className="text-xs text-muted-foreground">Protegido</span>
                          ) : (
                            <DeleteUserButton
                              username={u.username}
                              onConfirm={() => deleteMutation.mutate(u.id)}
                              pending={deleteMutation.isPending}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DeleteUserButton({
  username,
  onConfirm,
  pending,
}: {
  username: string;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
          <AlertDialogDescription>
            O usuário <strong>{username}</strong> será removido permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
