"use client";
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
import { FilePlus, ShoppingBag } from "lucide-react";
import { PhoneInput } from "./phone";
import { useToast } from "@/hooks/use-toast"
import { ProdutosProps } from "@/app/utils/produto";
import { v4 } from "uuid";
import { Value } from "@radix-ui/react-select";
import Image from "next/image";
import Link from "next/link";

interface DialogInfoCheckout {
    isOpen: boolean, produto: ProdutosProps, setIsOpen: (open: boolean) => void
}

const schema = z.object({
    nome: z.string().trim().min(1, "Campo Obrigatório!"),
    telefone: z.string().trim().min(1, "Campo Obrigatório!"),
    email: z.string().optional()
});

export const InfoCheckout = ({
    isOpen, setIsOpen, produto
}: DialogInfoCheckout) => {

    const [openQR, setOpenQR] = useState(false);
    const [dataQR, setDataQR] = useState({
        charge: {
            qrCodeImage: "/placeholder.svg",
            value: 0,
            comment: "",
            identifier: "",
            status: "",
            expiresDate: "",
            pixKey: "",
            paymentLinkUrl: "#",
            expiresIn: 0,
            brCode: "#",
        }
    });
    const [loading, setLoading] = useState(false);
    const isDesktop = !useIsMobile();

    const { toast } = useToast()

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            telefone: "",
            email: ""
        },
    });

    const onSubmit = (values: z.infer<typeof schema>) => {
        setIsOpen(false);
        form.reset();
    };
    const generatePix = async () => {
        const response = await fetch("/api/payaments/open-pix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                produto: { nome: produto.nome, id: produto.id, valor: produto.valor },
                nome: form.getValues('nome'),
                email: form.getValues('email') || "",
                telefone: form.getValues('telefone'),
                origin: "site",
            }),
        });
        setDataQR(await response.json());
        console.log(dataQR)
        if (response.ok) {
            setOpenQR(true)
        }
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

                <Button type="button" disabled={loading} onClick={generatePix}>
                    {loading ? "Gerando..." : "Gerar Pix"}
                </Button>
            </form>
        </Form>
    );
    const QRContent = (
        <>
            {/* {JSON.stringify(
        dataQR
      )} */}
            <div
                className="grid items-center justify-center gap-4"

            >
                {isDesktop ? (<><Image
                    src={dataQR.charge.qrCodeImage || "/placeholder.svg"}
                    width={300}
                    height={200}
                    alt="QR-CODE"

                />
                    <div className="border rounded-md p-4 w-full overflow-x-auto">
                        {dataQR.charge.brCode}

                    </div>
                    <Button onClick={() => { navigator.clipboard.writeText(dataQR.charge.brCode) }}>Copiar codigo pix</Button></>
                ) :
                    (<><div className="border rounded-md p-4 w-full overflow-x-auto">
                        {dataQR.charge.brCode}

                    </div>
                        <Button onClick={() => { navigator.clipboard.writeText(dataQR.charge.brCode) }}>Copiar codigo pix</Button></>)
                }
                <div className="w-full grid grid-cols-2 gap-4">
                    <h1>Valor</h1>
                    <Input placeholder="Valor" value={"R$" + (dataQR.charge.value / 100).toFixed(2) || "/"} readOnly />
                    <h1>Nome do produto</h1>
                    <Input placeholder="Comentário" value={dataQR.charge.comment || "/"} readOnly />
                    <h1>Status</h1>
                    <Input placeholder="Status" value={dataQR.charge.status || "/"} readOnly />
                    <h1>Expira em:</h1>
                    <Input placeholder="Expira em" value={dataQR.charge.expiresIn / 60 + " Minutos" || "/"} readOnly />
                    <h1>Chave Pix:</h1>
                    <Input placeholder="BR CODE" value={dataQR.charge.brCode + " M" || "/"} readOnly />

                </div>
                <Link href={dataQR.charge.paymentLinkUrl || "/"}>
                    <Button className="w-full">
                        Pagar Agora
                    </Button>
                </Link>


            </div>
        </>
    );

    return isDesktop ? (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) form.reset();
            }}
        >

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{openQR ? "Dados do pix" : "Informe seus dados"}</DialogTitle>
                    <DialogDescription>
                        {openQR ? "Dados do pix para pagamento" : " Informe seus dados para gerar o pix e te enviar infos sobre o produto"}
                        .
                    </DialogDescription>
                </DialogHeader>
                {openQR ? QRContent : FormContent}
            </DialogContent>
        </Dialog>
    ) : (
        <Drawer
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) form.reset();
            }}
        >

            <DrawerContent className="p-4">
                <DrawerHeader>
                    <DrawerTitle>Criar Novo Produto</DrawerTitle>
                    <DrawerDescription>
                        Preencha as informações do novo produto abaixo.
                    </DrawerDescription>
                </DrawerHeader>
                {openQR ? QRContent : FormContent}
                <DrawerFooter className="flex justify-end mt-4">
                    <DrawerClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};
