"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FaGoogle, FaSpinner } from "react-icons/fa";
import { toast } from "sonner";
import { appConfig } from "@/lib/config";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string;
}

export function AuthForm({ className, callbackUrl, ...props }: AuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  const showPasswordAuth = appConfig.auth?.enablePasswordAuth;
  const showGoogleAuth = appConfig.auth?.enableGoogleAuth;

  const redirectTo = React.useCallback(() => {
    return callbackUrl || searchParams?.get("callbackUrl") || "/app";
  }, [callbackUrl, searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirectTo(),
          )}`,
        },
      });

      if (error) {
        toast.error(error.message || "Falha ao continuar com Google");
        setIsLoading(false);
      }
      // Em caso de sucesso, o browser é redirecionado para o Google.
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Algo deu errado");
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async (data: LoginInput) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error("Email ou senha inválidos");
        return;
      }

      router.push(redirectTo());
      router.refresh();
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirectTo(),
          )}`,
        },
      });

      if (error) {
        toast.error(error.message || "Falha ao enviar o link de login");
        return;
      }

      toast.success("Verifique seu email para o link de login");
      setEmail("");
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {showGoogleAuth && (
        <>
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-6"
          >
            {isLoading ? (
              <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaGoogle className="mr-2 h-4 w-4" />
            )}
            Continuar com Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com {showPasswordAuth ? "senha" : "email"}
              </span>
            </div>
          </div>
        </>
      )}

      {showPasswordAuth ? (
        <form onSubmit={handleSubmit(handlePasswordSignIn)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="nome@exemplo.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register("email")}
              className="w-full py-6"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/reset-password"
                className="text-xs text-primary hover:text-primary/90 underline underline-offset-4"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              placeholder="Digite sua senha"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              {...register("password")}
              className="w-full py-6"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full py-6">
            {isLoading && <FaSpinner className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      ) : (
        <form onSubmit={handleMagicLinkSignIn} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="nome@exemplo.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full py-6"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full py-6">
            {isLoading && <FaSpinner className="mr-2 h-4 w-4 animate-spin" />}
            Continuar com Email
          </Button>
        </form>
      )}
    </div>
  );
}
