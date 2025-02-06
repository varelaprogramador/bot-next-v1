import * as React from "react";
import { z } from "zod";
import { useState, useEffect } from "react";
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

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { CodigosProps } from "@/app/utils/codigos";
import { Edit, Plus } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select"; // Importando o componente Select
import { createClient } from "@/lib/supabase/client";
import { ProdutosProps } from "@/app/utils/produto";
import { v4 } from "uuid";

// Supondo que você tenha uma função para buscar produtos
const fetchProducts = async () => {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.from("produtos").select("*");

    if (error) {
      console.error("Erro ao carregar produto:", error);
      return []; // Retorna um array vazio em caso de erro
    }
    return data || []; // Retorna os dados ou um array vazio
  } catch (error) {
    console.error("Erro na requisição:", error);
    return []; // Retorna um array vazio em caso de erro
  }
};

interface DialogCreateOrUpdateCodigoProps {
  codigo?: CodigosProps; // Se fornecido, será um formulário de atualização
  onConfirm: (args: { data: CodigosProps }) => void;
}

const schema = z.object({
  id_produto: z.string().trim().min(1, "Campo Obrigatório!"),
  codigo: z.string().trim().min(1, "Campo Obrigatório!"),
  status: z.string().trim().min(1, "Campo Obrigatório!"),
});

export const CreateOrUpdateCodigo = ({
  codigo,
  onConfirm,
}: DialogCreateOrUpdateCodigoProps) => {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProdutosProps[]>([]);
  const isDesktop = !useIsMobile();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      id_produto: codigo?.id_produto ||"",
      codigo: codigo?.codigo || "",
      status: codigo?.status || "",
    },
  });

  useEffect(() => {
    const loadProducts = async () => {
      const fetchedProducts = await fetchProducts();
      setProducts(fetchedProducts);
    };
    loadProducts();
  }, []);

  const onSubmit = (values: z.infer<typeof schema>) => {
    onConfirm({ data: { ...values, id_codigo: codigo?.id_codigo || v4() } });
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
          name="id_produto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID do Produto</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value} // Use 'value' em vez de 'defaultValue'
                  // Definindo largura máxima
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id!}>
                        {product.nome} - {product.categoria} - (ID: {product.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input placeholder="Código" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value} // Use 'value' em vez de 'defaultValue'
                  // Definindo largura máxima
                >
                  <SelectTrigger >
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                   
                      <SelectItem value="Ativo" >
                        Ativo
                      </SelectItem>
                      <SelectItem value="Inativo" >
                        Inativo
                      </SelectItem>
                      <SelectItem value="Resgatado" >
                        Resgatado
                      </SelectItem>
                    
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          {codigo ? "Atualizar Código" : "Criar Código"}
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
        <Button variant="default">
          {codigo ? <Edit size={16} /> : <Plus size={16}></Plus>}
          {codigo ? " Atualizar Código" : " Criar Código"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {codigo ? "Atualizar Código" : "Criar Código"}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do código abaixo.
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
        <Button variant={"default"}>
          {codigo ? <Edit size={16} /> : <Plus size={16}></Plus>}
          {codigo ? " Atualizar Código" : " Criar Código"}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>
            {codigo ? "Atualizar Código" : "Criar Código"}
          </DrawerTitle>
          <DrawerDescription>
            Preencha as informações do código abaixo.
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
