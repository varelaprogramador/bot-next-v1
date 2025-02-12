"use client";
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
import ImageSelector from "../popup-imagens";
import { MediaProps } from "@/app/utils/media";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

interface DialogCreateMediaProps {
  onConfirmCreate: (args: { data: MediaProps }) => void;
}

const schema = z.object({
  nome: z.string().trim().min(1, "Campo Obrigatório!"),
  rota: z.string().trim().min(1, "Campo Obrigatório!"),
  url: z.string().trim().min(1, "Campo Obrigatório!"),
  status: z.boolean(),
});

export const CreateMedia = ({
  onConfirmCreate,
}: DialogCreateMediaProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDesktop = !useIsMobile();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      rota: "",
      url: "",
      status: true,
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    onConfirmCreate({ data: values });
    setOpen(false);
    form.reset();
  };

  const handlerUrl = (url: string) => {
    form.setValue("url", url);
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
          name="rota"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Url de redirecionamento</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="https://example.com.br"
                  {...field}
                />
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
                  onValueChange={(value) => field.onChange(value === "true")}
                  value={String(field.value)}
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Visível</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImageSelector defaultValue="" sendData={handlerUrl} onClose={() => { }} />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Url da Imagem</FormLabel>
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
        <Button>Criar Banner</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Banner</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo Banner abaixo.
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
        <Button>Criar Banner</Button>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Criar Novo Banner</DrawerTitle>
          <DrawerDescription>
            Preencha as informações do novo Banner abaixo.
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