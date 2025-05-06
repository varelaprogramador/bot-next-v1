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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { FilePlus, Plus } from "lucide-react";
import { ProdutosProps } from "@/app/utils/produto";
import ImageSelector from "../popup-imagens";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

interface DialogCreateProdutoProps {
  onConfirmCreate: (args: { data: ProdutosProps }) => void;
}

const schema = z.object({
  nome: z.string().trim().min(1, "Campo Obrigatório!"),
  descricao: z.string().trim().min(1, "Campo Obrigatório!"),
  valor: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val), // Preprocessa para número
    z.number().min(0, "O preço não pode ser negativo!")
  ),
  categoria: z.string().trim().min(1, "Campo Obrigatório!"),
  url_image: z.string().trim().min(1, "Campo Obrigatório!"),
  tipo: z.enum(["produto", "combo"])
});

export const CreateProduto = ({
  onConfirmCreate,
}: DialogCreateProdutoProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDesktop = !useIsMobile();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      descricao: "",
      valor: 0,
      categoria: "",
      url_image: "",
      tipo: "produto"
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    onConfirmCreate({ data: values });
    setOpen(false);
    form.reset();
  };
  function handlerUrl(url: string) {
    form.setValue("url_image", url);

  }
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

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo do Produto</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produto">Produto</SelectItem>
                    <SelectItem value="combo">Combo</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImageSelector defaultValue="" sendData={handlerUrl} onClose={() => { }}></ImageSelector>
        <FormField
          control={form.control}
          name="url_image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Url</FormLabel>
              <FormControl>
                <Input placeholder="url_image" readOnly value={field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar Produto"}
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
        <div className="group relative overflow-hidden bg-secondary  hover:bg-secondary/90 rounded-md border border-gray-200  transition-all duration-300 flex flex-col items-center justify-center p-8 min-h-[320px]">
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary text-white mb-6">
              <Plus size={24} />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Adicionar Produto</h3>
            <p className="text-muted-foreground mb-6">Crie um novo produto para seu catálogo</p>

          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo produto abaixo.
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
            <p className="font-medium">Criar Produto</p>
          </div>
        </div>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Criar Novo Produto</DrawerTitle>
          <DrawerDescription>
            Preencha as informações do novo produto abaixo.
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
