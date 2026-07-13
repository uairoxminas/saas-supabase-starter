"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaSpinner } from "react-icons/fa";
import { toast } from "sonner";
import { setPasswordSchema, type SetPasswordInput } from "@/lib/validations/auth.schema";
import { appConfig } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

// Página de definição de senha após o usuário chegar autenticado por um
// magic link / link de convite. A sessão é estabelecida a partir do `code`
// (fluxo PKCE) e a senha é definida via supabase.auth.updateUser.
export default function SetPasswordPage() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [checkingSession, setCheckingSession] = React.useState<boolean>(true);
  const [sessionError, setSessionError] = React.useState<string | null>(null);
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  React.useEffect(() => {
    const establishSession = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setSessionError(
              "Link inválido ou expirado. Solicite um novo link de cadastro.",
            );
            return;
          }
          window.history.replaceState({}, "", url.pathname);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setSessionError(
            "Link inválido ou expirado. Solicite um novo link de cadastro.",
          );
        }
      } catch (error) {
        console.error("Set password session error:", error);
        setSessionError(
          "Link inválido ou expirado. Solicite um novo link de cadastro.",
        );
      } finally {
        setCheckingSession(false);
      }
    };

    establishSession();
  }, [supabase]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
  });

  const onSubmit = async (data: SetPasswordInput) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message || "Falha ao criar a senha");
        return;
      }

      toast.success("Senha definida com sucesso!");
      router.push("/app");
      router.refresh();
    } catch (error) {
      console.error("Set password error:", error);
      toast.error("Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10">
        <FaSpinner className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Validando link...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="flex flex-col gap-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Link inválido
          </h1>
          <p className="text-sm text-muted-foreground">{sessionError}</p>
        </div>
        <Button onClick={() => router.push("/sign-up")} className="w-full py-6">
          Ir para o cadastro
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Defina sua senha
        </h1>
        <p className="text-sm text-muted-foreground">
          Crie uma senha segura para sua conta {appConfig.projectName}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            placeholder="Digite sua senha"
            type="password"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("password")}
            className="w-full py-6"
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirme a senha</Label>
          <Input
            id="confirmPassword"
            placeholder="Confirme sua senha"
            type="password"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("confirmPassword")}
            className="w-full py-6"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full py-6">
          {isLoading && <FaSpinner className="mr-2 h-4 w-4 animate-spin" />}
          Criar conta
        </Button>
      </form>
    </>
  );
}
