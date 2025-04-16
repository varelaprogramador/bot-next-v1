"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/app/components/ui/form";
import { MoveRight, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createUser } from "@/app/actions/user-actions";

// Definindo o esquema de validação com Zod
const createUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "Primeiro nome é obrigatório")
    .max(50, "Primeiro nome muito longo"),
  lastName: z
    .string()
    .min(1, "Último nome é obrigatório")
    .max(50, "Último nome muito longo"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(20, "A senha deve ter no máximo 20 caracteres")
    .refine((value) => /[A-Z]/.test(value), {
      message: "A senha deve conter pelo menos uma letra maiúscula",
    })
    .refine((value) => /[!@#$%^&*(),.?":{}|<>]/.test(value), {
      message: "A senha deve conter pelo menos um caractere especial",
    }),
  status: z.string().min(1, "Status é obrigatório"),
  level: z.string().min(1, "Nível é obrigatório"),
});

export const CreateUserDialog = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Usando o react-hook-form
  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      status: "Ativo", // Status padrão
      level: "member", // Nível padrão
    },
  });

  const onSubmit = async (data: z.infer<typeof createUserSchema>) => {
    try {
      await createUser(data);

      toast({
        title: "Usuário criado",
        description: `${data.firstName} ${data.lastName} foi criado com sucesso.`,
      });
      form.reset(); // Limpa o formulário após a criação
      setOpen(false); // Fecha o diálogo

      // Recarregar a lista de usuários
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível criar o usuário",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Usuário</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogTitle>Adicionar Novo Usuário [Dashboard]</DialogTitle>
        <Form {...form}>
          <form
            className="grid grid-cols-2 gap-4 mt-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {/* Primeiro Nome */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primeiro Nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Jhon" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Último Nome */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Último Nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="exemplo@gmail.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Senha */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="************"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o status da conta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nível */}
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um Nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Membro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <Button
              type="submit"
              className="col-span-2 flex justify-center items-center gap-2"
            >
              Criar Usuário <MoveRight className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
