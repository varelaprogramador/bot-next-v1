import * as React from "react";
import { z } from "zod";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FilePlus } from "lucide-react";
import { ProdutosProps } from "@/app/utils/produto";

interface DialogCreateProdutoProps {
  onConfirmCreate: (args: { data: ProdutosProps }) => void;
}

const schema = z.object({
  nome: z.string().trim().min(1, "Campo Obrigatório!"),
  descricao: z.string().trim().min(1, "Campo Obrigatório!"),
  valor: z.number().min(0, "Preço não pode ser negativo!"),
  categoria: z.string().trim().min(1, "Campo Obrigatório!"),
});

export const CreateProduto = ({
  onConfirmCreate,
}: DialogCreateProdutoProps) => {
  const [open, setOpen] = useState(false);
  const isDesktop = !useIsMobile();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      descricao: "",
      valor: 0,
      categoria: "",
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    onConfirmCreate({
      data: values,
    });
    setOpen(!open);
    form.reset();
  };

  React.useEffect(() => {
    form.reset();
  }, [form, open]);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
        <div className="border border-dashed p-8 flex justify-center items-center rounded text-gray-200 transition-all duration-300 hover:border-gray-400 hover:text-gray-500">
            <div className="flex flex-col gap-8 justify-center items-center ">
            <FilePlus size={80}></FilePlus>
            <p className=" font-medium ">Criar Produto</p></div>
        </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo produto abaixo.
            </DialogDescription>
          </DialogHeader>
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

              <Button type="submit">Criar Produto</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
      <div className="border border-dashed p-8 flex justify-center items-center rounded text-gray-200 transition-all duration-300 hover:border-gray-400 hover:text-gray-500">
            <div className="flex flex-col gap-8 justify-center items-center ">
            <FilePlus size={80}></FilePlus>
            <p className=" font-medium ">Criar Produto</p></div>
        </div>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Criar Novo Produto</DrawerTitle>
          <DrawerDescription>
            Preencha as informações do novo produto abaixo.
          </DrawerDescription>
        </DrawerHeader>
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

            <Button type="submit">Criar Produto</Button>
          </form>
        </Form>
        <DrawerFooter className="flex justify-end mt-4">
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
