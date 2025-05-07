"use client";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { GalleryVerticalEnd } from "lucide-react";
import { useForm } from "react-hook-form"; // Usar Controller aqui
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

// Esquema de validação com Zod
const formSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{5}-\d{4}$/, "Telefone inválido. Ex: (00) 00000-0000"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z
    .string()
    .min(6, "A confirmação da senha deve ter pelo menos 6 caracteres")

});

export default function Page() {
  const supabase = createClientSupabaseClient()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      senha: "",
      confirmarSenha: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {

    if (values.senha !== values.confirmarSenha) {
      form.setError("confirmarSenha", {
        type: "manual",
        message: "As senhas não coincidem",
      });
      return;
    }

    const data = {
      nome: values.nome,
      telefone: values.telefone,
      senha: values.senha,
    }

    const { error } = await supabase.from("users-loja").insert([data]);
    if (error) {
      console.error("Erro ao criar usuario:", error);
    } else {
      console.log("Usuario criado com sucesso");
    }

    console.log(values);
    form.reset();
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Acme Inc.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Form {...form}>
            <form
              className="p-6 md:p-8 w-full max-w-md"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Criar conta</h1>
                  <p className="text-balance text-muted-foreground">Crie sua conta na nextrecargas</p>
                </div>

                {/* Campo de Nome */}
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="nome">Nome</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="input"
                            placeholder="Digite seu nome"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Campo de Telefone */}
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="telefone">Telefone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="input"
                            placeholder="(00) 00000-0000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Campo de Senha */}
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="senha">Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            placeholder="Sua senha"
                            className="input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Campo de Confirmar Senha */}
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="confirmarSenha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="confirmarSenha">Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            placeholder="Confirme sua senha"
                            className="input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Botão de Enviar */}
                <Button type="submit" className="w-full">
                  Criar Conta
                </Button>

                <div className="text-center text-sm">
                  Já tem uma conta? <Link href="/" className="text-blue-500">Entrar</Link>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        <Image
          width={80}
          height={80}
          src="/placeholder.svg"
          alt="Imagem de fundo"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
