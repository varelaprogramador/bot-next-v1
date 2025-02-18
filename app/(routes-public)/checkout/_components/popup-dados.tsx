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
import { FilePlus } from "lucide-react";
import { PhoneInput } from "./phone";
import { useToast } from "@/hooks/use-toast"
interface DialogInfoCheckout {
    onConfirmCreate: (args: {
        data: {
            nome: string,
            telefone: string
        }
    }) => void;
}

const schema = z.object({
    nome: z.string().trim().min(1, "Campo Obrigatório!"),
    telefone: z.string().trim().min(1, "Campo Obrigatório!"),
});

export const InfoCheckout = ({
    onConfirmCreate,
}: DialogInfoCheckout) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const isDesktop = !useIsMobile();

    const { toast } = useToast()

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            telefone: ""
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
                                <PhoneInput {...field} placeholder="+55 00 90000-0000"></PhoneInput>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                <Button type="submit" disabled={loading}>
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
