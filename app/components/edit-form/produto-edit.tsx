import * as React from "react";
import { z } from "zod";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/app/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/app/components/ui/drawer";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Edit, FilePlus } from "lucide-react";
import { ProdutosProps } from "@/app/utils/produto";

interface DialogEditProdutoProps {
  produto: ProdutosProps;
  onConfirmEdit: (args: { data: ProdutosProps }) => void;
}

const schema = z.object({
  nome: z.string().trim().min(1, "Campo Obrigatório!"),
  descricao: z.string().trim().min(1, "Campo Obrigatório!"),
  valor: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number().min(0, "O preço não pode ser negativo!")
  ),
  categoria: z.string().trim().min(1, "Campo Obrigatório!"),
});

export const EditProduto = ({
  produto,
  onConfirmEdit,
}: DialogEditProdutoProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDesktop = !useIsMobile();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: produto.nome,
      descricao: produto.descricao,
      valor: produto.valor,
      categoria: produto.categoria,
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    onConfirmEdit({ data: { ...produto, ...values } });
    setOpen(false);
    form.reset();
  };

  const FormContent = (
    <Form {...form}>
      <form
        className="grid items-start gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Preço"
                  {...field}
                  min="0"
                  step="0.01"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Categoria" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar Produto"}
        </Button>
      </form>
    </Form>
  );

  return isDesktop ? (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Edit></Edit>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Atualize as informações do produto abaixo.
          </DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset();
      }}
    >
      <DrawerTrigger asChild>
        <div className="border border-dashed p-8 flex justify-center items-center rounded text-gray-200 transition-all duration-300 hover:border-gray-400 hover:text-gray-500">
          <div className="flex flex-col gap-8 justify-center items-center">
            <FilePlus size={80} />
            <p className="font-medium">Editar Produto</p>
          </div>
        </div>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Editar Produto</DrawerTitle>
          <DrawerDescription>
            Atualize as informações do produto abaixo.
          </DrawerDescription>
        </DrawerHeader>
        {FormContent}
        <DrawerFooter className="flex justify-end mt-4">
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
