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
import {
  resetPasswordConfirmSchema,
  type ResetPasswordConfirmInput,
} from "@/lib/validations/auth.schema";
import { appConfig } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordConfirmPage() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [checkingSession, setCheckingSession] = React.useState<boolean>(true);
  const [sessionError, setSessionError] = React.useState<string | null>(null);
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  // O link de recuperação chega com um `code` (fluxo PKCE) ou um `token_hash`.
  // Trocamos por uma sessão para que o usuário já esteja autenticado e possa
  // atualizar a senha via updateUser.
  React.useEffect(() => {
    const establishSession = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setSessionError(
              "Link inválido ou expirado. Solicite um novo link de recuperação.",
            );
            return;
          }
          // Limpa o code da URL.
          window.history.replaceState({}, "", url.pathname);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setSessionError(
            "Link inválido ou expirado. Solicite um novo link de recuperação.",
          );
        }
      } catch (error) {
        console.error("Recovery session error:", error);
        setSessionError(
          "Link inválido ou expirado. Solicite um novo link de recuperação.",
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
  } = useForm<ResetPasswordConfirmInput>({
    resolver: zodResolver(resetPasswordConfirmSchema),
  });

  const onSubmit = async (data: ResetPasswordConfirmInput) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message || "Falha ao redefinir a senha");
        return;
      }

      toast.success("Senha redefinida com sucesso!");
      router.push("/app");
      router.refresh();
    } catch (error) {
      console.error("Reset password error:", error);
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
        <Button onClick={() => router.push("/reset-password")} className="w-full py-6">
          Solicitar novo link
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Redefina sua senha
        </h1>
        <p className="text-sm text-muted-foreground">
          Digite a nova senha da sua conta {appConfig.projectName}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            placeholder="Digite sua nova senha"
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
          <Label htmlFor="confirmPassword">Confirme a nova senha</Label>
          <Input
            id="confirmPassword"
            placeholder="Confirme sua nova senha"
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
          Redefinir senha
        </Button>
      </form>
    </>
  );
}
