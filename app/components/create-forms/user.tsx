"use client";

import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose } from '@/app/components/ui/dialog';
import { Button } from "@/app/components/ui/button";
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { z } from 'zod';
import { useForm } from 'react-hook-form'; // Importando o react-hook-form
import { zodResolver } from '@hookform/resolvers/zod'; // Importando zod resolver
import { Form , FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { MoveRight } from 'lucide-react';

// Definindo o esquema de validação com Zod
const createUserSchema = z.object({
  firstName: z.string().min(1, "Primeiro nome é obrigatório").max(50, "Primeiro nome muito longo"),
  lastName: z.string().min(1, "Último nome é obrigatório").max(50, "Último nome muito longo"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
 password: z.string()
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

  // Usando o react-hook-form
  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      status: 'Ativo', // Status padrão
      level: 'member', // Nível padrão
    },
  });

  const onSubmit = async (data: z.infer<typeof createUserSchema>) => {
    const { firstName, lastName, email, password, status, level } = data;

    try {
      const response = await fetch('/api/users/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Novo usuário criado:', result);
        form.reset(); // Limpa o formulário após a criação
        setOpen(false); // Fecha o diálogo
        window.alert("Usuário criado com sucesso !")
      } 

    } catch (error) {
      console.error('Erro de rede:', error);
      
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar Novo Usuário</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>Adicionar Novo Usuário [Dashboard]</DialogTitle>
        <Form {...form}>
          <form
            className="grid grid-cols-2 gap-4"
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
                  <FormMessage/>
                </FormItem>
              )}
            />

            {/* Último Nome */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem >
                  <FormLabel>Último Nome</FormLabel>
                  <FormControl >
                    <Input {...field} placeholder="Doe" />
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className='col-span-2'>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="exemplo@gmail.com" />
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />

            {/* Senha */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className='col-span-2'>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="************" />
                  </FormControl>
                  <FormMessage/>
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
                    <Select {...field}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o status da conta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage/>
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
                    <Select {...field}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um Nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Membro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />

            {/* Botões */}
           
              <Button type="submit" className='col-span-2 flex '>Criar Usuário <MoveRight ></MoveRight></Button>

           
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
