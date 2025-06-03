"use client"
import { z } from "zod"
import { useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/app/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/app/components/ui/drawer"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import ImageSelector from "../popup-imagens"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form"
import { Edit } from "lucide-react"
import type { ProdutosLojaProps } from "@/app/utils/produto"

interface DialogEditProdutoProps {
  produto: ProdutosLojaProps
  onConfirmEdit: (args: { data: ProdutosLojaProps }) => void
}

const schema = z.object({
  nome: z.string().trim().min(1, "Campo Obrigatório!"),
  descricao: z.string().trim().min(1, "Campo Obrigatório!"),
  valor: z.preprocess(
    (val) => (typeof val === "string" ? Number.parseFloat(val) : val),
    z.number().min(0, "O preço não pode ser negativo!"),
  ),
  categoria: z.string().trim().min(1, "Campo Obrigatório!"),
  url_image: z.string().trim().min(1, "Campo Obrigatório!"),
})

export const EditProduto = ({ produto, onConfirmEdit }: DialogEditProdutoProps) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const isDesktop = !useIsMobile()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: produto.nome,
      descricao: produto.descricao,
      valor: produto.valor,
      categoria: produto.categoria,
      url_image: produto.url_image,
    },
  })

  function handlerUrl(url: string) {
    form.setValue("url_image", url, { shouldValidate: false, shouldDirty: true })
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setLoading(true)
    try {
      console.log(values)
      const updatedProduto = {
        id: produto.id,
        nome: values.nome,
        descricao: values.descricao,
        valor: values.valor,
        categoria: values.categoria,
        url_image: values.url_image,
      }
      await onConfirmEdit({ data: updatedProduto as ProdutosLojaProps })
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
    } finally {
      setLoading(false)
    }
  }

  const FormContent = (
    <Form {...form}>
      <form className="grid items-start gap-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                <Input type="number" placeholder="Preço" {...field} min="0" step="0.01" />
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
        <div onClick={(e) => e.preventDefault()}>
          <ImageSelector defaultValue={form.getValues("url_image")} sendData={handlerUrl} onClose={() => { }} />
        </div>
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
          {loading ? "Atualizando..." : "Atualizar Produto"}
        </Button>
      </form>
    </Form>
  )

  return isDesktop ? (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
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
          <DialogDescription>Atualize as informações do produto abaixo.</DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) form.reset()
      }}
    >
      <DrawerTrigger asChild>
        <Button>
          <Edit></Edit>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Editar Produto</DrawerTitle>
          <DrawerDescription>Atualize as informações do produto abaixo.</DrawerDescription>
        </DrawerHeader>
        {FormContent}
        <DrawerFooter className="flex justify-end mt-4">
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
