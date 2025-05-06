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
import { Label } from "@/app/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { ProdutosProps } from "@/app/utils/produto";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Edit, Plus } from "lucide-react";
import { VendasProps } from "@/app/utils/vendas";
import { v4 as uuidv4 } from "uuid";

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

interface DialogCreateOrUpdateVendaProps {
  venda?: VendasProps; // Se fornecido, será um formulário de atualização
  onConfirm: (args: { data: VendasProps }) => void;
}

const schema = z.object({
  id_produto: z.string().trim().min(1, "Campo Obrigatório!"),
  id_cliente: z.string().trim().min(1, "Campo Obrigatório!"),
  valor: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number().min(0, "O preço não pode ser negativo!")
  ),
  status: z.string().trim().min(1, "Campo Obrigatório!"),
  tipo_pagamento: z.string().optional(),
  tipo_produto: z.enum(["produto", "combo"]),
  detalhes_produto: z.object({
    id: z.string(),
    nome: z.string(),
    valor: z.number(),
    tipo: z.enum(["produto", "combo"])
  })
});

export const CreateOrUpdateVenda = ({
  venda,
  onConfirm,
}: DialogCreateOrUpdateVendaProps) => {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProdutosProps[]>([]);
  const isDesktop = !useIsMobile();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      id_produto: venda?.id_produto || "",
      id_cliente: venda?.id_cliente || "",
      valor: venda?.valor || 0,
      status: venda?.status || "",
      tipo_pagamento: venda?.tipo_pagamento || "",
      tipo_produto: (venda?.tipo_produto as "produto" | "combo") || "produto",
      detalhes_produto: venda?.detalhes_produto || {
        id: "",
        nome: "",
        valor: 0,
        tipo: "produto" as const
      }
    },
  });

  useEffect(() => {
    const loadProducts = async () => {
      const fetchedProducts = await fetchProducts();
      setProducts(fetchedProducts);
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const selectedProduct = products.find(p => p.id === form.watch("id_produto"));
    if (selectedProduct) {
      form.setValue("detalhes_produto", {
        id: selectedProduct.id || "",
        nome: selectedProduct.nome || "",
        valor: selectedProduct.valor || 0,
        tipo: (selectedProduct.tipo || "produto") as "produto" | "combo"
      });
      form.setValue("tipo_produto", (selectedProduct.tipo || "produto") as "produto" | "combo");
    }
  }, [form.watch("id_produto"), products]);

  const onSubmit = (values: z.infer<typeof schema>) => {
    onConfirm({
      data: {
        ...values,
        origin: "web",
        uuid: venda?.uuid ? venda.uuid : uuidv4(),
        created_at: venda?.created_at
          ? venda.created_at
          : new Date().toISOString(),
      },
    });
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id!}>
                        {product.nome} - {product.categoria} - (ID: {product.id}
                        )
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
          name="id_cliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID do Cliente</FormLabel>
              <FormControl>
                <Input placeholder="ID do Cliente" {...field} />
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
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input placeholder="Valor" {...field} />
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
                <Input placeholder="Status" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_pagamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Pagamento</FormLabel>
              <FormControl>
                <Input placeholder="Tipo de Pagamento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_produto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Produto</FormLabel>
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

        <FormField
          control={form.control}
          name="detalhes_produto.id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID do Produto (Detalhes)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="detalhes_produto.nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="detalhes_produto.valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor do Produto</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="detalhes_produto.tipo"
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

        <Button type="submit">
          {venda ? "Atualizar Venda" : "Criar Venda"}
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
          {venda ? <Edit size={16} /> : <Plus size={16}></Plus>}
          {venda ? " Atualizar Venda" : " Criar Venda"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{venda ? "Atualizar Venda" : "Criar Venda"}</DialogTitle>
          <DialogDescription>
            Preencha as informações da venda abaixo.
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
          {venda ? <Edit size={16} /> : <Plus size={16}></Plus>}
          {venda ? " Atualizar Venda" : " Criar Venda"}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>{venda ? "Atualizar Venda" : "Criar Venda"}</DrawerTitle>
          <DrawerDescription>
            Preencha as informações da venda abaixo.
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
