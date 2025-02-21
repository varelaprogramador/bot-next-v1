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
import { v4 } from "uuid";
import { Value } from "@radix-ui/react-select";
import Image from "next/image";
import Link from "next/link";

interface DialogInfoCheckout {
    onConfirmCreate: (args: {
        data: {
            nome: string,
            telefone: string
        }
    }) => void;
    produto: ProdutosProps
}

const schema = z.object({
    nome: z.string().trim().min(1, "Campo Obrigatório!"),
    telefone: z.string().trim().min(1, "Campo Obrigatório!"),
    email: z.string().optional()
});

export const InfoCheckout = ({
    onConfirmCreate,
    produto
}: DialogInfoCheckout) => {
    const [open, setOpen] = useState(false);
    const [openQR, setOpenQR] = useState(false);
    const [dataQR, setDataQR] =useState(   {charge: {
        qrCodeImage:"/placeholder.svg",
        value: 0,
        comment: "",
        identifier: "",
        status: "",
        expiresDate: "",
        pixKey: "",
        paymentLinkUrl: "#",
        expiresIn:0,
        brCode: "#",
    }});
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

        onConfirmCreate({ data: values });
        setOpen(false);
        form.reset();
    };
    const generatePix = async () => {

        const response = await fetch(
            "https://api.openpix.com.br/api/v1/charge?return_existing=true",
            {
                method: "POST",
                headers: {
                    Authorization: `${process.env.NEXT_PUBLIC_OPENPIX_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    correlationID: (`${produto.nome}+${v4()}`).replace(' ', ''),
                    value: produto.valor * 100,
                    comment: produto.nome,
                    expiresIn:420,
                    additionalInfo: [
                        { key: "Product", value: produto.nome },
                        { key: "Invoice", value: `${new Date().getTime()}` },
                        { key: "Origin", value: "site" }
                    ],
                    payer: {
                        name: form.getValues("nome") || "",
                        email: form.getValues("email") || "",
                        phone: form.getValues("telefone") || "",
                    },
                }),
            }
        );
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
                <Image
                src={dataQR.charge.qrCodeImage}
                width={300}
                height={200}
                alt="QR-CODE"
                
                >

                </Image>
                <div className="w-full grid grid-cols-2 gap-4">
                <h1>Valor</h1>
                <Input placeholder="Valor" value={"R$"+(dataQR.charge.value/100).toFixed(2)||"/"} readOnly />
                <h1>Nome do produto</h1>
                <Input placeholder="Comentário" value={dataQR.charge.comment||"/"} readOnly />
                <h1>Status</h1>
                <Input placeholder="Status" value={dataQR.charge.status||"/"} readOnly />
                <h1>Expira em:</h1>
                <Input placeholder="Expira em" value={dataQR.charge.expiresIn/60 +" Minutos"||"/"} readOnly />
                <h1>Chave Pix:</h1>
                <Input placeholder="Pix Key" value={dataQR.charge.pixKey+" M"||"/"}  readOnly />

                </div>
<Link href={dataQR.charge.paymentLinkUrl||"/"}>
                <Button className="w-full">
                    Pagar Agora
                </Button>
</Link>


            </div>
        </>
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
