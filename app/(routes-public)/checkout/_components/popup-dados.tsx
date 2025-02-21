import * as React from "react";
import { z } from "zod";
import { useEffect, useState } from "react";
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
import { FilePlus } from "lucide-react";
import { PhoneInput } from "./phone";
import { useToast } from "@/hooks/use-toast"
import { ProdutosProps } from "@/app/utils/produto";

interface DialogInfoCheckout {
    onConfirmCreate: (args: {
        data: {
            nome: string,
            telefone: string
        }
    }) => void;
        produto:ProdutosProps
}

const schema = z.object({
    nome: z.string().trim().min(1, "Campo Obrigatório!"),
    telefone: z.string().trim().min(1, "Campo Obrigatório!"),
    email:z.string().optional()
});

export const InfoCheckout = ({
    onConfirmCreate,
    produto
}: DialogInfoCheckout) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const isDesktop = !useIsMobile();

    const { toast } = useToast()

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            telefone: "",
            email:""
        },
    });

    const onSubmit = (values: z.infer<typeof schema>) => {
        toast({
            className: "bg-green-500 text-white",
            title: "Dados enviados  ",
            description: "Dentro de alguns segundos voce será redirecionado!",
        })
        onConfirmCreate({ data: values });
        setOpen(false);
        form.reset();
    };
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://plugin.openpix.com.br/v1/openpix.js";
        script.async = true;
        document.body.appendChild(script);
    
        return () => {
          document.body.removeChild(script);
        };
      }, []);
    
      const generatePix = () => {
        console.log(parseFloat(produto.valor.toFixed(2)));
        const gerarCorrelationIdUnico = (len:number, chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => [...Array(len)].map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
        window.$openpix = window.$openpix || [];
    
        window.$openpix.push(["config", {
          appID: "Q2xpZW50X0lkXzRjZjdjYzllLTM5ZWYtNDkwZC05NmFmLTk1MmRlMWJjMGEwODpDbGllbnRfU2VjcmV0X0tTbDdkNmtFekhRM1ROb2IvbUxCekl5akhQeHBhNnhERmJIZ09LdmlMeU09",
        }]);
    
        window.$openpix.push([
          "pix",
          {
            value:parseFloat(produto.valor.toFixed(2))*100,
            correlationID: gerarCorrelationIdUnico(30),
            description: produto.nome,
            customer: {
                name: form.getValues("nome") || "",
                email: form.getValues("email") || "",
                phone: form.getValues("telefone") || "",
              },
            
            
          },
        ]);
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
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                                <Input placeholder="Jhon Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Whatsapp</FormLabel>
                            <FormControl>
                                <PhoneInput {...field} defaultCountry="BR" placeholder="+55 00 90000-0000"></PhoneInput>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
     <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="example@gmail.com(opcional)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={loading} onClick={generatePix}>
                    {loading ? "Gerando..." : "Gerar Pix"}
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
                <Button className="w-full text-lg" size="lg">
                    Comprar via Pix
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Informe seus dados</DialogTitle>
                    <DialogDescription>
                        Informe seus dados para gerar o pix e te enviar infos sobre o produto.
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
                <Button className="w-full text-lg" size="lg">
                    Comprar via Pix

                </Button>
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
