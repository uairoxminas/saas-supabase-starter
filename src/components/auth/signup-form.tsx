"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FaSpinner } from "react-icons/fa";
import { toast } from "sonner";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth.schema";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);

    try {
      const { data: result, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message || "Falha ao criar conta");
        return;
      }

      // Quando a confirmação de email está ligada, o Supabase devolve um
      // usuário sem sessão (`session` nulo) e identities vazio. Nesse caso
      // pedimos para o usuário confirmar o email. Se a confirmação estiver
      // desligada, já existe sessão e mandamos direto para o app.
      if (result.session) {
        router.push("/app");
        router.refresh();
        return;
      }

      toast.success("Conta criada! Verifique seu email para confirmar o cadastro.");
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            placeholder="João Silva"
            type="text"
            autoComplete="name"
            disabled={isLoading}
            {...register("name")}
            className="w-full py-6"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

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
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            placeholder="Crie uma senha"
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

        <Button type="submit" disabled={isLoading} className="w-full py-6">
          {isLoading && <FaSpinner className="mr-2 h-4 w-4 animate-spin" />}
          Criar conta
        </Button>
      </form>
    </div>
  );
}
